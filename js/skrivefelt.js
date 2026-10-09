// Skrivefeltet: et lærred med skrivelinjer som i et dansk skolehæfte (toplinje, stiplet x-linje, grundlinje og
// nedstregslinje), hvor barnet skriver et lille bogstav med fingeren på iPad'en.
//
//   const felt = skrivefelt(host, { bogstav: 'm', visning: 'spor' | 'prik' | 'tom', onIdle, onStreg, onNed, idleFor })
//   felt.streger()   → [[{x, y, t}, …], …] i skærmpixels i forhold til lærredets øverste venstre hjørne (til genkend.js)
//   felt.linjer()    → { top, x, grund, ned } i samme pixels
//   felt.ryd(), felt.laas(true|false), felt.visHvordan(), felt.forvandl(), felt.planlaeg(), felt.stopIdle(),
//   felt.destroy()
//
// Kun én finger tæller. En finger mere, mens han skriver, ignoreres – men står den første berøring stille (en
// håndflade, en kno, den anden hånd – eller skrivefingeren, der venter på den grønne prik, mens Bip taler), når en ny
// kommer til, er begge kandidater: den, der først flytter sig, skriver, og den anden smides væk. Et kort tryk fra den
// nye berøring tæller som et tryk (prikken over i), men begynder den hvilende berøring bagefter at skrive, var
// trykket en løs berøring og smides væk. Brede berøringer (en håndflade, hvor Safari oplyser bredden) ignoreres helt.
// Et tryk på eller ved den grønne startprik er ikke en streg (han trykker på den, som om den var en knap): det
// smides væk, så prikken bliver stående – medmindre den næste streg selv er en prik (i, j) eller ringen i å.
// Stregerne glattes (getCoalescedEvents og bløde kurver gennem midtpunkterne), og lærredet er skarpt på Retina
// (devicePixelRatio). Ingen scroll, zoom, markering eller forstørrelsesglas på iPad'en: touch-action: none og
// preventDefault på touch-hændelserne.
// Aflevering: når han har løftet fingeren, spørges idleFor(), hvor længe der skal ventes (ms), før onIdle kaldes
// (null = vent på ✓). Uden idleFor: ca. 2 sek. (længere, hvis han kun har tegnet nogle af bogstavets streger).
// Står en dialog åben (fx "Vil du stoppe?"), afleveres der ikke: der ventes, til den er lukket.
// En afbrudt berøring (pointercancel: systemgestus, opkald) smides væk og afleveres ikke (stregerne før den gør).
import { SKRIFT, LINJER } from './skrift-data.js?v=6f70bf5933';
import { reducedMotion, sleep } from './util.js?v=6f70bf5933';

const FARVE = {
  tusch: '#3d5bd9', // hans streg: blå tusch
  vis: '#f08a3c', // vis-hvordan: orange
  rent: '#2f9e44', // det rene bogstav efter forvandlingen: grøn
  prik: '#37b24d',
  linje: '#b9c3df',
  grund: '#6f86c6',
  hus: 'rgba(255, 228, 140, .5)', // x-huset (mellem x-linjen og grundlinjen): "det gule hus"
  spor: '#ebe6f6',
  sporMidt: '#a79dc8',
};

const PAD = 0.075; // luft over toplinjen og under nedstregslinjen (andel af højden)
export const IDLE_MS = 2000;
const HVILE_PX = 8; // en berøring, der har flyttet sig mindre end så meget, står stille (hviler eller er lige landet)
const BRED_PX = 45; // en berøring, der er bredere end det (hvis Safari oplyser det), er en håndflade
const MAX_PKT = 3000; // punkter pr. streg (en krusedulle i et halvt minut)
const TRYK = 0.04; // en streg, der er kortere end det (andel af S), er et tryk
const VED_PRIK = 0.09; // … og et tryk så tæt på startprikken (andel af S) er et tryk på prikken
const OVERLAY_TJEK_MS = 400; // står en dialog åben, når afleveringen skulle ske, prøves der igen så tit

// Midten af et bogstavs bredde (enheder): modellen centreres i feltet efter den, ikke efter x = 0
const midtX = (m) => { const xs = m.streger.flat().map((p) => p[0]); return (Math.min(...xs) + Math.max(...xs)) / 2; };
const hyp = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const laengde = (P) => P.reduce((s, p, i) => (i ? s + hyp(P[i - 1], p) : 0), 0);
// En streg i modellen, der selv er en prik eller en lille ring over x-linjen (prikken i i og j, ringen i å): et
// tryk dér ER stregen
const prikStreg = (P) => P.every(([, v]) => v < LINJER.x - 0.03) && laengde(P) < 0.4;

// Punkter med lige afstand langs en polylinje (n ≥ 2)
export function resample(P, n) {
  if (P.length < 2) return Array.from({ length: n }, () => P[0].slice());
  const L = laengde(P) || 1, out = [P[0].slice()];
  let d = 0, i = 1, prev = P[0];
  for (let k = 1; k < n - 1; k++) {
    const maal = (L * k) / (n - 1);
    while (i < P.length && d + hyp(prev, P[i]) < maal) { d += hyp(prev, P[i]); prev = P[i]; i++; }
    if (i >= P.length) { out.push(P.at(-1).slice()); continue; }
    const s = hyp(prev, P[i]) || 1, f = (maal - d) / s;
    out.push([prev[0] + (P[i][0] - prev[0]) * f, prev[1] + (P[i][1] - prev[1]) * f]);
  }
  out.push(P.at(-1).slice());
  return out;
}

// Blød streg gennem punkterne (kvadratiske kurver gennem midtpunkterne). Ét punkt = en prik.
function tegnStreg(g, P, bredde, farve) {
  if (!P.length) return;
  g.strokeStyle = farve; g.fillStyle = farve; g.lineWidth = bredde; g.lineCap = 'round'; g.lineJoin = 'round';
  if (P.length === 1 || laengde(P) < 1) { g.beginPath(); g.arc(P[0][0], P[0][1], bredde / 2, 0, Math.PI * 2); g.fill(); return; }
  g.beginPath();
  g.moveTo(P[0][0], P[0][1]);
  if (P.length === 2) g.lineTo(P[1][0], P[1][1]);
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
    g.quadraticCurveTo(P[i][0], P[i][1], mx, my);
  }
  if (P.length > 2) g.lineTo(P.at(-1)[0], P.at(-1)[1]);
  g.stroke();
}

// Stregen delt ved vendepunkterne (hvor den går tilbage ad sig selv, fx ned og op igen i n og b)
function vendeDele(P) {
  const dele = [];
  let start = 0;
  for (let i = 1; i < P.length - 1; i++) {
    const a = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]], b = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]];
    const la = Math.hypot(...a), lb = Math.hypot(...b);
    if (la && lb && (a[0] * b[0] + a[1] * b[1]) / (la * lb) < -0.8) { dele.push(P.slice(start, i + 1)); start = i; }
  }
  dele.push(P.slice(start));
  return dele;
}
// Pile i skriveretningen: én pr. del af stregen (den første tidligt, ca. en femtedel inde). En del, der går tilbage
// ad en tidligere del (op igen i n, b og m), får ingen pil – ellers ville pilen pege op ad en streg, der skrives
// oppefra og ned. tidligere: de dele, der allerede har fået pile (fra stregerne før).
function tegnPile(g, P, S, farve, tidligere = []) {
  const naer = S * 0.035;
  vendeDele(P).forEach((D, i) => {
    const ovenpaa = D.filter((p) => tidligere.some((Q) => Q.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < naer))).length;
    if (!(D.length > 2 && ovenpaa > 0.7 * D.length)) tegnPil(g, D, S, farve, !tidligere.length && i === 0 ? 0.22 : 0.4);
    tidligere.push(D);
  });
  return tidligere;
}
// Lille pil (vinkel) på stregen i skriveretningen
function tegnPil(g, P, S, farve, ved = 0.45) {
  if (P.length < 3 || laengde(P) < S * 0.08) return;
  const L = laengde(P);
  let d = 0, i = 1;
  while (i < P.length - 1 && d + hyp(P[i - 1], P[i]) < L * ved) { d += hyp(P[i - 1], P[i]); i++; }
  const a = P[Math.max(0, i - 2)], b = P[Math.min(P.length - 1, i + 1)];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const [cx, cy] = P[i], r = S * 0.05;
  g.save();
  g.translate(cx, cy); g.rotate(ang);
  g.strokeStyle = farve; g.lineWidth = Math.max(3, S * 0.014); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-r * 0.7, -r * 0.75); g.lineTo(r * 0.35, 0); g.lineTo(-r * 0.7, r * 0.75); g.stroke();
  g.restore();
}

function tegnPrik(g, [x, y], S, stor = true) {
  const r = S * (stor ? 0.042 : 0.032);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r + Math.max(3, S * 0.01), 0, Math.PI * 2); g.fill();
  g.fillStyle = FARVE.prik; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

export function skrivefelt(host, { bogstav, visning = 'tom', onIdle = null, onStreg = null, onNed = null, idleFor = null, idleMs = IDLE_MS } = {}) {
  const model = SKRIFT[bogstav];
  const el = document.createElement('div');
  el.className = 'skrivefelt';
  el.innerHTML = '<canvas class="sf-bg" aria-hidden="true"></canvas><canvas class="sf-ink" aria-hidden="true"></canvas><canvas class="sf-anim" aria-hidden="true"></canvas>';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Skrivefelt: skriv bogstavet med fingeren');
  host.appendChild(el);
  const [cBg, cInk, cAnim] = el.querySelectorAll('canvas');
  const gBg = cBg.getContext('2d'), gInk = cInk.getContext('2d'), gAnim = cAnim.getContext('2d');

  // Stregerne gemmes i enheder (S = afstanden fra toplinjen til nedstregslinjen), så de overlever en ny størrelse
  let streger = []; // [[{u, v, t}]]
  let geo = { W: 0, H: 0, S: 1, pad: 0, ox: 0 };
  let aktiv = null; // pointerId for fingeren, der skriver
  let aktivInfo = null; // { x, y, vej } – hvor den kom ned, og hvor langt den har flyttet sig
  let rect = null; // lærredets placering, målt når fingeren sættes ned
  let laast = false, doed = false, idleT = null, raf = 0, t0 = 0;
  let rentDx = null; // efter forvandlingen: det grønne bogstavs forskydning (enheder), så det tegnes igen ved rotation

  const px = (u, v) => [geo.ox + u * geo.S, geo.pad + v * geo.S];
  const unit = (x, y) => [(x - geo.ox) / geo.S, (y - geo.pad) / geo.S];
  const modelPx = (dx = 0) => model.streger.map((s) => s.map(([u, v]) => { const [x, y] = px(u, v); return [x + dx, y]; }));
  const hansPx = () => streger.map((s) => s.map((p) => px(p.u, p.v)));

  function maal() {
    const r = el.getBoundingClientRect();
    const W = Math.max(10, Math.round(r.width)), H = Math.max(10, Math.round(r.height));
    const pad = H * PAD, S = H - 2 * pad;
    rect = null; // feltet har flyttet sig (fx drejet iPad midt i en streg)
    geo = { W, H, S, pad, ox: W / 2 - (model ? midtX(model) : 0.15) * S };
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    for (const [c, g] of [[cBg, gBg], [cInk, gInk], [cAnim, gAnim]]) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = `${W}px`; c.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    tegnBg(); tegnInk();
    if (rentDx !== null) tegnRent(); // iPad'en blev drejet efter forvandlingen: det grønne bogstav bliver stående
  }

  function tegnBg() {
    const { W, S } = geo, g = gBg;
    g.clearRect(0, 0, W, geo.H);
    const y = (v) => px(0, v)[1];
    g.fillStyle = FARVE.hus; g.fillRect(0, y(LINJER.x), W, y(LINJER.grund) - y(LINJER.x));
    const linje = (v, farve, w, dash = []) => { g.strokeStyle = farve; g.lineWidth = w; g.setLineDash(dash); g.beginPath(); g.moveTo(0, y(v)); g.lineTo(W, y(v)); g.stroke(); };
    linje(LINJER.top, FARVE.linje, 2);
    linje(LINJER.x, FARVE.linje, 2, [12, 9]);
    linje(LINJER.grund, FARVE.grund, 3.5);
    linje(LINJER.ned, FARVE.linje, 2);
    g.setLineDash([]);
    if (!model) return;
    const M = modelPx();
    if (visning === 'spor') {
      M.forEach((P) => tegnStreg(g, P, S * 0.12, FARVE.spor)); // bred bane: synlig rundt om en 6-årigs finger
      g.setLineDash([S * 0.028, S * 0.03]);
      M.forEach((P) => tegnStreg(g, P, Math.max(2.5, S * 0.012), FARVE.sporMidt));
      g.setLineDash([]);
      const tidl = [];
      M.forEach((P) => tegnPile(g, P, S, FARVE.sporMidt, tidl));
    }
    // Startprikken til den næste streg, han mangler (alle streger tegnet: ingen prik)
    if (visning === 'spor' || visning === 'prik') {
      const i = streger.length;
      if (i < M.length) tegnPrik(g, M[i][0], S, i === 0);
    }
  }

  function tegnInk() {
    raf = 0;
    gInk.clearRect(0, 0, geo.W, geo.H);
    hansPx().forEach((P) => tegnStreg(gInk, P, geo.S * 0.06, FARVE.tusch));
  }
  const omtegn = () => { if (!raf) raf = requestAnimationFrame(tegnInk); };
  // Mens han skriver: kun stykket fra punkt fra og frem (rette linjer, runde ender)
  function tegnSegment(si, fra) {
    const P = streger[si];
    if (!P) return;
    const g = gInk, B = geo.S * 0.06;
    g.strokeStyle = FARVE.tusch; g.fillStyle = FARVE.tusch; g.lineWidth = B; g.lineCap = 'round'; g.lineJoin = 'round';
    if (P.length === 1) { const [x, y] = px(P[0].u, P[0].v); g.beginPath(); g.arc(x, y, B / 2, 0, Math.PI * 2); g.fill(); return; }
    g.beginPath();
    g.moveTo(...px(P[Math.max(0, fra)].u, P[Math.max(0, fra)].v));
    for (let i = Math.max(1, fra + 1); i < P.length; i++) g.lineTo(...px(P[i].u, P[i].v));
    g.stroke();
  }

  // ---------- Fingeren ----------
  const pos = (e) => {
    const r = rect || (rect = cInk.getBoundingClientRect()); // målt én gang pr. streg (og igen efter en ny størrelse)
    return [e.clientX - r.left, e.clientY - r.top]; // også uden for feltet (fingeren glider ud over kanten)
  };
  const tid = (e) => Math.round((e.timeStamp || performance.now()) - t0);
  const bred = (e) => e.pointerType === 'touch' && (e.width > BRED_PX || e.height > BRED_PX);
  const slip = (id) => { try { cInk.releasePointerCapture(id); } catch { /* */ } };
  // Den hvilende berøring, en ny berøring kom til imens: { id, info, streg, tryk } – kandidat, indtil en af dem
  // flytter sig. tryk = de korte tryk, den nye berøring (og andre) har lavet imens (smides væk, hvis den skriver).
  let hvil = null;
  const slipHvil = () => { if (!hvil) return; const id = hvil.id; hvil = null; slip(id); };
  // Den hvilende berøring flytter sig først: det var den, der skulle skrive (fingeren på prikken)
  function hvilSkriver() {
    const h = hvil, gammel = aktiv;
    hvil = null;
    if (gammel !== null) streger.pop(); // den nye berøring står stille: den var ikke en streg
    if (h.tryk.length) streger = streger.filter((s) => !h.tryk.includes(s)); // løse tryk imens
    aktiv = h.id; aktivInfo = h.info;
    streger.push(h.streg);
    if (gammel !== null) slip(gammel);
    clearTimeout(idleT);
    onNed?.();
    tegnBg(); tegnInk();
  }
  // Punkterne fra en pointermove lægges på stregen s (info.vej: hvor langt berøringen er kommet fra sit startpunkt)
  function tilfoej(s, info, e) {
    const evs = e.getCoalescedEvents?.() || [];
    for (const ev of evs.length ? evs : [e]) {
      if (s.length >= MAX_PKT) break;
      const [x, y] = pos(ev), [u, v] = unit(x, y);
      const last = s.at(-1);
      if (Math.hypot(u - last.u, v - last.v) * geo.S < 1.5) continue; // samme punkt
      s.push({ u, v, t: tid(ev) });
      info.vej = Math.max(info.vej, Math.hypot(x - info.x, y - info.y));
    }
  }
  function down(e) {
    if (laast || doed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    if (bred(e)) return; // en håndflade
    if (aktiv !== null) {
      // kun én finger ad gangen – men en berøring, der står stille (håndfladen, en kno – eller fingeren, der venter på
      // prikken), bliver kandidat sammen med den nye: den, der først flytter sig, skriver
      if (!(aktivInfo && aktivInfo.vej < HVILE_PX)) return;
      slipHvil(); // højst én hvilende kandidat ad gangen
      hvil = { id: aktiv, info: aktivInfo, streg: streger.pop(), tryk: [] };
      tegnBg(); tegnInk();
    }
    aktiv = e.pointerId;
    rect = cInk.getBoundingClientRect();
    try { cInk.setPointerCapture(e.pointerId); } catch { /* */ }
    clearTimeout(idleT);
    onNed?.();
    if (!t0) t0 = e.timeStamp || performance.now();
    const [x, y] = pos(e), [u, v] = unit(x, y);
    aktivInfo = { x, y, vej: 0 };
    streger.push([{ u, v, t: tid(e) }]);
    tegnSegment(streger.length - 1, 0);
  }
  function move(e) {
    if (hvil && e.pointerId === hvil.id) {
      e.preventDefault();
      tilfoej(hvil.streg, hvil.info, e);
      if (hvil.info.vej >= HVILE_PX) hvilSkriver();
      return;
    }
    if (e.pointerId !== aktiv) return;
    e.preventDefault();
    const s = streger.at(-1), fra = s.length - 1;
    tilfoej(s, aktivInfo, e);
    if (hvil && aktivInfo.vej >= HVILE_PX) slipHvil(); // den nye berøring skriver: den hvilende var ikke en streg
    tegnSegment(streger.length - 1, fra); // kun det nye stykke (hele stregen tegnes blødt, når fingeren løftes)
  }
  // Et tryk på (eller ved) den grønne startprik: ikke en streg – medmindre den næste streg selv er en prik (i, j, å)
  function trykPaaPrik(s) {
    if (!model || (visning !== 'spor' && visning !== 'prik')) return false;
    const i = streger.length - 1; // prikken stod ved streg nr. i (dem før trykket)
    const M = model.streger[i];
    if (!M || prikStreg(M) || laengde(s.map((p) => [p.u, p.v])) >= TRYK) return false;
    return Math.hypot(s[0].u - M[0][0], s[0].v - M[0][1]) < VED_PRIK;
  }
  function up(e) {
    if (hvil && e.pointerId === hvil.id) { // den hvilende berøring løftes uden at have skrevet (en hvilende hånd)
      hvil = null;
      planlaegIdle();
      return;
    }
    if (e.pointerId !== aktiv) return;
    aktiv = null; aktivInfo = null; rect = null;
    const s = streger.at(-1);
    if (trykPaaPrik(s)) streger.pop(); // prikken bliver stående, og ✓ og 🗑 slås ikke til
    else if (hvil && laengde(s.map((p) => [p.u, p.v])) < TRYK) hvil.tryk.push(s); // et tryk, mens en anden berøring hviler
    tegnBg(); // startprikken flytter til næste streg
    omtegn();
    onStreg?.(streger.length);
    planlaegIdle();
  }
  // Afbrudt (systemgestus, opkald, alarm): den halve streg smides væk, og der afleveres ikke. Stregerne før den
  // afleveres stadig (afleveringen planlægges igen).
  function afbrudt(e) {
    if (hvil && e.pointerId === hvil.id) { hvil = null; planlaegIdle(); return; }
    if (e.pointerId !== aktiv) return;
    aktiv = null; aktivInfo = null; rect = null;
    streger.pop();
    tegnBg(); omtegn();
    onStreg?.(streger.length);
    planlaegIdle();
  }
  function planlaegIdle() {
    clearTimeout(idleT);
    if (!onIdle || !streger.length || laast || doed || aktiv !== null) return;
    let ms;
    if (idleFor) ms = idleFor();
    else ms = model && streger.length < model.streger.length ? idleMs * 2.5 : idleMs;
    if (ms == null) return; // vent på ✓ eller flere streger
    const aflever = () => {
      if (doed || laast || aktiv !== null || !streger.length) return;
      // Ingen aflevering bag en dialog ("Vil du stoppe?"): der ventes, til den er lukket
      if (document.querySelector('.overlay')) { idleT = setTimeout(aflever, OVERLAY_TJEK_MS); return; }
      onIdle();
    };
    idleT = setTimeout(aflever, ms);
  }
  cInk.addEventListener('pointerdown', down);
  cInk.addEventListener('pointermove', move);
  cInk.addEventListener('pointerup', up);
  cInk.addEventListener('pointercancel', afbrudt);
  cInk.addEventListener('lostpointercapture', (e) => { if (e.pointerId === aktiv || e.pointerId === hvil?.id) up(e); }); // sikkerhedsnet
  // iPad: ingen scroll, zoom, markering, forstørrelsesglas eller kontekstmenu, mens han skriver
  const stop = (e) => { if (e.cancelable) e.preventDefault(); };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'contextmenu', 'selectstart', 'dblclick']) el.addEventListener(ev, stop, { passive: false });

  const ro = new ResizeObserver(() => { if (!doed) maal(); });
  ro.observe(el);
  maal();
  // Fjernes feltet fra siden (et andet skærmbillede), ryddes det op: lærrederne frigives (iOS har et loft over
  // lærredshukommelse), og observeren stoppes
  const vagt = setInterval(() => { if (!el.isConnected) api.destroy(); }, 1000);

  // ---------- Animationer ----------
  const rate = () => Math.max(0.25, Number(window.__llSkrivRate) || 1);
  const naeste = () => new Promise((r) => requestAnimationFrame(r));

  // Tegn modellens streger langsomt (orange), med startprik før hver streg og små pile bagefter
  async function visHvordan({ alive = () => true } = {}) {
    if (!model) return;
    const ok = () => !doed && el.isConnected && alive();
    cAnim.classList.remove('fade');
    gAnim.clearRect(0, 0, geo.W, geo.H);
    rentDx = null;
    const faerdige = []; // indeks på de streger, der er tegnet færdige
    // modellen regnes ud i hvert billede, så animationen følger med, hvis iPad'en drejes undervejs
    const faerdigePile = (M, S) => { const tidl = []; faerdige.forEach((k) => { tegnStreg(gAnim, M[k], S * 0.06, FARVE.vis); tegnPile(gAnim, M[k], S, '#fff', tidl); }); };
    for (let i = 0; i < model.streger.length; i++) {
      if (!ok()) return;
      const L0 = laengde(model.streger[i]); // i enheder
      const dur = reducedMotion() ? 1 : Math.max(450, (L0 / 0.8) * 1000) / rate();
      const start = performance.now();
      for (;;) {
        const M = modelPx(), P = M[i], S = geo.S, B = S * 0.06, L = laengde(P);
        const f = Math.min(1, (performance.now() - start) / dur);
        // del af stregen op til f
        const del = [];
        let d = 0;
        del.push(P[0]);
        for (let k = 1; k < P.length; k++) {
          const s = hyp(P[k - 1], P[k]);
          if (d + s <= f * L) { del.push(P[k]); d += s; continue; }
          const r = s ? (f * L - d) / s : 0;
          del.push([P[k - 1][0] + (P[k][0] - P[k - 1][0]) * r, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * r]);
          break;
        }
        gAnim.clearRect(0, 0, geo.W, geo.H);
        faerdigePile(M, S);
        tegnStreg(gAnim, del, B, FARVE.vis);
        tegnPrik(gAnim, P[0], S, i === 0);
        const spids = del.at(-1);
        gAnim.fillStyle = '#fff'; gAnim.strokeStyle = FARVE.vis; gAnim.lineWidth = 4;
        gAnim.beginPath(); gAnim.arc(spids[0], spids[1], B * 0.42, 0, Math.PI * 2); gAnim.fill(); gAnim.stroke();
        if (f >= 1) break;
        await naeste();
        if (!ok()) return;
      }
      faerdige.push(i);
      await sleep(reducedMotion() ? 0 : 280 / rate());
    }
    gAnim.clearRect(0, 0, geo.W, geo.H);
    const M = modelPx();
    faerdigePile(M, geo.S);
    M.forEach((P, i) => tegnPrik(gAnim, P[0], geo.S, i === 0));
    await sleep(900 / rate());
    if (!ok()) return;
    cAnim.classList.add('fade'); // blødt væk
    await sleep(reducedMotion() ? 0 : 450);
    if (!doed) { gAnim.clearRect(0, 0, geo.W, geo.H); cAnim.classList.remove('fade'); }
  }

  // Hans streg glider over i det rene bogstav (samme sted på linjerne), og farven skifter fra blå til grøn
  async function forvandl() {
    const H = hansPx();
    if (!model || !H.length) return;
    const xs = H.flat().map((p) => p[0]);
    const midt = (Math.min(...xs) + Math.max(...xs)) / 2;
    const M = modelPx(midt - (geo.ox + midtX(model) * geo.S));
    const N = 160;
    const Ls = M.map(laengde), Lsum = Ls.reduce((a, b) => a + b, 0) || 1;
    const antal = Ls.map((l) => Math.max(2, Math.round((N * l) / Lsum)));
    const maalPkt = M.flatMap((P, i) => resample(P, antal[i]));
    const fraPkt = resample(H.flat(), maalPkt.length);
    const S = geo.S, B = S * 0.06;
    const lerp = (a, b, f) => a + (b - a) * f;
    const farve = (f) => `rgb(${Math.round(lerp(0x3d, 0x2f, f))},${Math.round(lerp(0x5b, 0x9e, f))},${Math.round(lerp(0xd9, 0x44, f))})`;
    gInk.clearRect(0, 0, geo.W, geo.H);
    const dur = reducedMotion() ? 1 : 750 / rate(), start = performance.now();
    for (;;) {
      const f0 = Math.min(1, (performance.now() - start) / dur), f = 1 - (1 - f0) ** 3;
      gAnim.clearRect(0, 0, geo.W, geo.H);
      let k = 0;
      for (const n of antal) {
        const P = [];
        for (let j = 0; j < n; j++, k++) P.push([lerp(fraPkt[k][0], maalPkt[k][0], f), lerp(fraPkt[k][1], maalPkt[k][1], f)]);
        tegnStreg(gAnim, P, B, farve(f));
      }
      if (f0 >= 1 || doed || !el.isConnected) break;
      await naeste();
    }
    if (doed) return;
    rentDx = (midt - (geo.ox + midtX(model) * geo.S)) / geo.S;
    tegnRent();
    el.classList.add('rent');
  }
  // Det rene, grønne bogstav (med et gult skær), samme sted som hans streg
  function tegnRent() {
    const M = modelPx(rentDx * geo.S), S = geo.S, B = S * 0.06;
    gAnim.clearRect(0, 0, geo.W, geo.H);
    gAnim.save(); gAnim.shadowColor = 'rgba(255, 210, 74, .95)'; gAnim.shadowBlur = S * 0.06;
    M.forEach((P) => tegnStreg(gAnim, P, B, FARVE.rent));
    gAnim.restore();
    M.forEach((P) => tegnStreg(gAnim, P, B, FARVE.rent));
  }

  const api = {
    el,
    bogstav,
    streger: () => hansPx().map((P, i) => P.map(([x, y], j) => ({ x, y, t: streger[i][j].t }))),
    antal: () => streger.length,
    linjer: () => ({ top: px(0, LINJER.top)[1], x: px(0, LINJER.x)[1], grund: px(0, LINJER.grund)[1], ned: px(0, LINJER.ned)[1] }),
    // Til testen: modellens punkter i skærmkoordinater (clientX/clientY)
    // (et andet bogstav b: samme størrelse, midt i feltet – fx d, når b er målet, til spejl-testen)
    modelSkaerm: (b = bogstav) => {
      const r = cInk.getBoundingClientRect(), m = SKRIFT[b];
      const dx = geo.W / 2 - midtX(m) * geo.S;
      return m.streger.map((P) => P.map(([u, v]) => [r.left + dx + u * geo.S, r.top + geo.pad + v * geo.S]));
    },
    geo: () => ({ ...geo }),
    // Tegningen komprimeret til forældrenes "Hans bogstaver": hele hundrededele af S (0 = toplinjen), punkter ≥ 0,02 fra hinanden
    komprimer: () => streger.map((s) => {
      const out = [];
      let last = null;
      for (const p of s) {
        if (last && Math.hypot(p.u - last.u, p.v - last.v) < 0.02 && p !== s.at(-1)) continue;
        out.push(Math.round(p.u * 100), Math.round(p.v * 100));
        last = p;
      }
      return out;
    }),
    ryd() {
      clearTimeout(idleT);
      streger = []; aktiv = null; aktivInfo = null; hvil = null; t0 = 0; rentDx = null;
      el.classList.remove('rent');
      gAnim.clearRect(0, 0, geo.W, geo.H);
      tegnBg(); tegnInk();
    },
    // laas(false) starter ikke afleveringen: den planlægges først, når han løfter fingeren igen (eller med planlaeg())
    laas(b) { laast = !!b; el.classList.toggle('laast', laast); if (laast) { clearTimeout(idleT); aktiv = null; aktivInfo = null; hvil = null; } },
    planlaeg: () => planlaegIdle(),
    stopIdle: () => clearTimeout(idleT),
    saetVisning(v) { visning = v; tegnBg(); },
    visHvordan,
    forvandl,
    destroy() {
      if (doed) return;
      doed = true; clearTimeout(idleT); clearInterval(vagt); cancelAnimationFrame(raf); ro.disconnect();
      for (const c of [cBg, cInk, cAnim]) { c.width = 0; c.height = 0; } // frigiv lærredshukommelsen (iOS)
      el.remove();
      if (window.__ll?.skrivfelt === api) window.__ll.skrivfelt = null;
    },
  };
  return api;
}
