// Genkender for bogstaver, som barnet tegner med fingeren (små bogstaver, skrivevejen i skrift-data.js).
//
//   genkend(streger, { maal, kandidater, streng = false, linjer }, { linjer })
//     streger    [[{x,y,t}, …], …] i skærmpixels, én liste pr. gang fingeren sættes ned, i den rækkefølge de blev
//                tegnet ([x, y] virker også). y vokser nedad som på skærmen.
//     maal       bogstavet, barnet skulle skrive ('a' … 'å').
//     kandidater bogstaver, tegningen sammenlignes med. Standard: alle 29. maal og maalets spejlpar (b↔d, p↔q)
//                kommer altid med. Appen giver de slåede-til bogstaver: kandidaterFor(maal, slaaetTil).
//     streng     false: kun formen tæller. true: startpunkt og retning skal også passe til skrivevejen.
//     linjer     valgfri { top, x, grund, ned } i px (skrivehusets linjer på skærmen). Så bruges højden også:
//                l og b går over x-linjen, p og g under grundlinjen. Kan også gives som 3. argument { linjer }.
//   → { ok, bedst, score, spejl, start_ok, retning_ok, grund } (+ hoejde_ok og stoerrelse, når formen er maal)
//     ok         true = godkendt (formen er maal; ved streng=true også start og retning).
//     bedst      det kandidat-bogstav, tegningen ligner mest ('' hvis intet).
//     score      0–1, hvor meget tegningen ligner maal (0,5 ≈ grænsen for godkendt). Uden maal: ligheden med bedst.
//     spejl      tegningen ligner maal spejlvendt (fx d i stedet for b, eller et omvendt s).
//     start_ok   startede han det rigtige sted? retning_ok: blev stregerne trukket den rigtige vej?
//                Begge måles, når formen er maal (også ved streng=false, så appen kan vise skrivevejen bagefter);
//                ellers null. De påvirker kun ok, når streng=true.
//     grund      'ok' (formen er maal) | 'spejl' | 'andet-bogstav' | 'for-lille' | 'kruseduller' | 'ufuldstændig'
//                (en del mangler: prikken over i, tværstregen i t, stregen i a, maven i p, …) | 'stort' (maals
//                store bogstav, fx M for m; bedst = 'M') | 'buer' (m med en bue for meget) | 'utydelig' (ligner mest
//                maal, men er over grænsen). grund beskriver formen: ved streng=true kan ok være false med grund 'ok',
//                når start_ok eller retning_ok er false.
//     hoejde_ok  (med linjer) false = formen er maal, men højden passer ikke til linjerne (for stor, for lille,
//                ved siden af). Den afviser ikke: højden skiller kun bogstaver med samme form (l/i, n/h, a/d …).
//     stoerrelse (med linjer) tegningens højde i forhold til modellens på linjerne (1 = som modellen).
//   Også: kandidaterFor(maal, slaaetTil), forvarm() (bygger skabelonerne, ca. 20 ms – kald den, når skrivetavlen
//   åbnes), afstandTil(streger) (til fejlfinding), BOGSTAVER, SPEJLPAR, GRAENSE.
//
// METODE: $P-punktsky-genkenderen (Vatavu, Anthony & Wobbrock 2012, "Gestures as point clouds") med vinkel-
// tilføjelsen fra $P+ (Vatavu 2017): tegningen samples til 32 punkter, flyttes og skaleres, og hvert punkt parres
// grådigt med det nærmeste punkt i skabelonen. Afstanden tæller både placering og stregens hældning i punktet.
// Metoden er ligeglad med stregrækkefølge og retning – det er netop dét, en 6-årig varierer mest på.
// Ovenpå: prikker (i, j) behandles for sig (løse tryk ved siden af bogstavet fjernes), højdeprofil mod
// skrivelinjerne (kun til at skille bogstaver med samme form), spejl-tjek, store bogstaver som kendte fejl (de står på
// grundlinjen, og et andet end maals skal have alle sine streger i tegningen),
// kruseduller (blæk og drejning målt på en glattet streg, så langsom rysten ikke tæller)/for-lille/ufuldstændig,
// m's buer og (streng) startpunkt og retning. Omvendte bogstaver uden spejlpar fanges med maals spejlbillede
// ('e~') som ekstra kandidat. Skabelonerne laves fra SKRIFT (modellen og alt-formerne) og STORE med variationer
// (bredde, hældning, rotation, stregerne sat sammen uden løft). Tærsklerne er kalibreret i tests/genkend.test.js (rapport:
// tests/genkend-rapport.md).
import { SKRIFT, LINJER, STORE } from './skrift-data.js?v=6f70bf5933';

export const BOGSTAVER = Object.keys(SKRIFT);
export const SPEJLPAR = { b: 'd', d: 'b', p: 'q', q: 'p' };

// Kandidaterne, appen bør give: de slåede-til bogstaver + maal + spejlparret.
export function kandidaterFor(maal, slaaetTil = BOGSTAVER) {
  const s = new Set(slaaetTil.filter((b) => SKRIFT[b]));
  if (maal) { s.add(maal); if (SPEJLPAR[maal]) s.add(SPEJLPAR[maal]); }
  return [...s];
}

// ---------- indstillinger (kalibreret, se testen) ----------
const N = 32; // punkter i skyen
const NG = 12; // punkter i den grove sky, der udvælger de bogstaver og skabeloner, som regnes helt ud:
const GROV_ANTAL = 6; //   højst så mange bogstaver
const GROV_BOGSTAV = 0.07; //   bogstaver, der groft set højst er så meget længere væk end det nærmeste
const GROV_SKABELON = 0.05; //   skabeloner, der groft set højst er så meget længere væk end bogstavets nærmeste
const VINKEL = 0.14; // vægt på stregens hældning i forhold til placering
const PRIK_STOERRELSE = 0.1; // en streg, der er mindre end 10 % af tegningen, er en prik
const PRIK_STRAF = 0.12; // for hver prik for meget eller for lidt
const PRIK_STED = 0.15; // pr. enhed afstand mellem prikkernes placering
const HOEJDE_STRAF = 0.22; // pr. linjeafstand forkert højde (ud over tolerancen)
const HOEJDE_TOL = 0.38; // tolerance i linjeafstande
export const GRAENSE = 0.17; // afstand til maal, der stadig godkendes (score 0,5)
const KRUSEDULLE_AFSTAND = 0.24; // ligner intet bogstav
const KRUSEDULLE_BLAEK = 9; // stregernes samlede længde i forhold til tegningens størrelse
const KRUSEDULLE_DREJ = 4.0; // antal hele omdrejninger
const DAEK_AFSTAND = 0.16; // dækning: et punkt i tegningen inden for denne afstand (i forhold til størrelsen) …
const DAEK_MIN = 0.3; // … for mindst så stor en del af hver streg i maal
const GROV_PORT = 0.28; // grov afstand, over hvilken spejl/ufuldstændig ikke regnes efter
const DEL_FORHOLD = 0.8; // ligner tegningen maal uden en af stregerne så meget mere end hele maal, er den ufuldstændig
const SYMMETRISKE = ['i', 'l', 'o', 'v', 'w', 'x']; // spejlvendt er de sig selv
const START_TOL = 0.24; // startpunkt: afstand i forhold til bogstavets størrelse …
const START_LAENGDE = 0.1; // … eller nærmest de første 0,1 enhed af den første streg (absolut, så en lang streg ikke giver lang snor)
const LOES_TRYK = 0.08; // et tryk så tæt på bogstavets streger (i forhold til størrelsen) hører til stregen
const TVILLING = 1.35; // højden afgør kun, når det andet bogstav har næsten samme form (afstand uden linjer ≤ 1,35 × maals)
const STORT_MARGIN = 0.8; // et stort bogstav vinder kun, når det ligner klart mere end alle små
const STORT_MARGIN_ANDET = 0.7; // … og et andet stort bogstav end maals (en sjælden fejl) endnu klarere (et smalt o ligner et D)
const STORT_EKSTRA = 3; // et o med G's tværstreg er ikke et o: så mange punkter, som maal ikke kan forklare, men et andet stort bogstav kan …
const STORT_FREMMED_AFSTAND = 0.75 * GRAENSE; // … når det store bogstav ligner tegningen mindst så meget
const STORT_NED = 0.3; // går tegningen så mange linjeafstande ned under grundlinjen (og mere end op over x-linjen), er det ikke et stort bogstav
const VENDING = -0.94; // en streg vender (cos til vinklen mellem retningen før og efter, ca. 160°): fx bunden af p's stamme i én streg
const BEN_AFSTAND = 0.18; // vendepunkter nede, der ligger tættere end 18 % af bredden på x, er samme ben (m)
const BEN_PAA = 0.18; // en streg, der starter så tæt (i forhold til størrelsen) på en tidligere streg, fortsætter et ben
const SPEJL_MARGIN = 0.7; // den spejlede tegning skal ligne maal klart bedre end den uspejlede
const SYMMETRI = 0.075; // en tegning, der ligner sit eget spejlbillede så meget, kan ikke være spejlvendt
const MIN_PX = 22; // mindste størrelse uden linjer (CSS-pixels)
const MIN_LINJE = 0.3; // mindste størrelse med linjer (andel af afstanden mellem x-linjen og grundlinjen)

// ---------- geometri ----------
const laengde = (s) => { let L = 0; for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return L; };

function bbox(punkter) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of punkter) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// n punkter med lige stor afstand langs stregen (første og sidste punkt kommer med)
function resample(s, n) {
  if (s.length === 1 || n === 1) {
    if (n === 1) { const b = bbox(s); return [[(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]]; }
    return Array.from({ length: n }, () => [s[0][0], s[0][1]]);
  }
  const L = laengde(s);
  if (L === 0) return Array.from({ length: n }, () => [s[0][0], s[0][1]]);
  const I = L / (n - 1), ud = [[s[0][0], s[0][1]]];
  let D = 0, prev = s[0];
  for (let i = 1; i < s.length && ud.length < n; i++) {
    let cur = s[i], d = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    while (D + d >= I && ud.length < n) {
      const t = (I - D) / d, q = [prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])];
      ud.push(q); prev = q; d = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]); D = 0;
    }
    D += d; prev = cur;
  }
  while (ud.length < n) ud.push([s[s.length - 1][0], s[s.length - 1][1]]);
  return ud;
}

// Fordel n punkter på stregerne efter længde (mindst ét pr. streg)
function fordel(streger, n) {
  const L = streger.map(laengde), sum = L.reduce((a, b) => a + b, 0) || 1;
  const k = streger.map(() => 1);
  let rest = n - streger.length;
  if (rest < 0) return k.map((_, i) => (i < n ? 1 : 0));
  const onske = L.map((l) => (l / sum) * n);
  while (rest > 0) {
    let bi = 0, bv = -Infinity;
    for (let i = 0; i < k.length; i++) { const v = onske[i] - k[i]; if (v > bv) { bv = v; bi = i; } }
    k[bi]++; rest--;
  }
  return k;
}

function rens(streger) {
  const ud = [];
  for (const s of streger || []) {
    const p = [];
    for (const q of s || []) {
      const x = Array.isArray(q) ? q[0] : q?.x, y = Array.isArray(q) ? q[1] : q?.y;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const l = p[p.length - 1];
      if (!l || l[0] !== x || l[1] !== y) p.push([x, y]);
    }
    if (p.length) ud.push(p);
  }
  return ud;
}

// Glattet udgave af en streg (til blæk og drejning): samples tæt efter afstand, glattes med et glidende gennemsnit
// og forenkles (Douglas–Peucker, 3,5 % af bogstavets størrelse). En langsom, rystende finger giver en lang, takket
// streg; glattet er den ikke længere end den streg, han mente.
function glat(s, S) {
  return forenkl(udjaevn(s, S), Math.max(2.5, 0.035 * S));
}
function forenkl(P, eps) {
  if (P.length < 3) return P;
  const behold = new Uint8Array(P.length); behold[0] = behold[P.length - 1] = 1;
  const stak = [[0, P.length - 1]];
  while (stak.length) {
    const [a, b] = stak.pop();
    const [ax, ay] = P[a], dx = P[b][0] - ax, dy = P[b][1] - ay, L = Math.hypot(dx, dy);
    let maks = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = L ? Math.abs(dy * (P[i][0] - ax) - dx * (P[i][1] - ay)) / L : Math.hypot(P[i][0] - ax, P[i][1] - ay);
      if (d > maks) { maks = d; mi = i; }
    }
    if (maks > eps) { behold[mi] = 1; stak.push([a, mi], [mi, b]); }
  }
  return P.filter((_, i) => behold[i]);
}
function udjaevn(s, S) {
  const L = laengde(s);
  if (s.length < 3 || L === 0) return s;
  const h = Math.max(0.5, S / 120), n = Math.max(2, Math.round(L / h) + 1);
  const r = resample(s, n), w = Math.max(1, Math.round((0.035 * S) / h));
  if (n <= 2 * w + 1) return [r[0], r[n - 1]];
  const ud = [r[0]];
  let sx = 0, sy = 0;
  for (let i = 0; i < 2 * w + 1; i++) { sx += r[i][0]; sy += r[i][1]; }
  for (let i = w; i < n - w; i++) {
    if (i > w) { sx += r[i + w][0] - r[i - w - 1][0]; sy += r[i + w][1] - r[i - w - 1][1]; }
    ud.push([sx / (2 * w + 1), sy / (2 * w + 1)]);
  }
  ud.push(r[n - 1]);
  return ud;
}

// Samlet drejning (i hele omgange) målt på en grov udgave af stregerne, så rystelser ikke tæller
function drejning(krop, S) {
  let sum = 0;
  for (const s of krop) {
    const L = laengde(s);
    const n = Math.max(2, Math.round(L / (S / 10)) + 1);
    const r = resample(s, n);
    let fv = null;
    for (let i = 1; i < r.length; i++) {
      const dx = r[i][0] - r[i - 1][0], dy = r[i][1] - r[i - 1][1];
      if (dx === 0 && dy === 0) continue;
      const v = Math.atan2(dy, dx);
      if (fv !== null) { let d = v - fv; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; sum += Math.abs(d); }
      fv = v;
    }
  }
  return sum / (2 * Math.PI);
}

// Punktsky: n punkter fordelt på stregerne, flyttet til tyngdepunktet og skaleret. Hvert punkt: x, y og stregens
// hældning som (cos 2v, sin 2v), så en streg trukket den ene eller den anden vej giver det samme.
function lavSky(krop, n, S) {
  const antal = fordel(krop, n), pts = [], vinkler = [], id = [];
  krop.forEach((s, i) => {
    if (!antal[i]) return;
    const r = resample(s, antal[i]);
    for (let j = 0; j < r.length; j++) {
      pts.push(r[j]); id.push(i);
      if (r.length < 2) { vinkler.push(null); continue; }
      const a = r[Math.max(0, j - 1)], b = r[Math.min(r.length - 1, j + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      vinkler.push(dx === 0 && dy === 0 ? null : Math.atan2(dy, dx));
    }
  });
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; }
  cx /= pts.length; cy /= pts.length;
  const sky = new Float64Array(pts.length * 4);
  pts.forEach((p, i) => {
    const v = vinkler[i];
    sky[i * 4] = (p[0] - cx) / S; sky[i * 4 + 1] = (p[1] - cy) / S;
    sky[i * 4 + 2] = v === null ? 0 : Math.cos(2 * v); sky[i * 4 + 3] = v === null ? 0 : Math.sin(2 * v);
  });
  return { sky, cx, cy, id };
}

// Tegning → beskrivelse: punktsky (krop), prikker, mål
function beskriv(streger) {
  const alle = bbox(streger.flat());
  const Sa = Math.max(alle.w, alle.h) || 1;
  let krop = [], prikker = [];
  for (const s of streger) {
    const b = bbox(s);
    if (streger.length > 1 && Math.max(b.w, b.h) <= PRIK_STOERRELSE * Sa) prikker.push(s); else krop.push(s);
  }
  if (!krop.length) { krop = prikker; prikker = []; }
  const kb = bbox(krop.flat());
  const S = Math.max(kb.w, kb.h) || 1;
  const { sky, cx, cy, id } = lavSky(krop, N, S);
  const grov = lavSky(krop, NG, S).sky;
  const prikSted = prikker.map((s) => { const b = bbox(s); return [((b.x0 + b.x1) / 2 - cx) / S, ((b.y0 + b.y1) / 2 - cy) / S]; });
  const glatte = krop.map((s) => glat(s, S));
  const blaek = glatte.reduce((a, s) => a + laengde(s), 0) / S;
  return { sky, id, grov, prikker: prikSted, krop, kb, S, blaek, drej: drejning(glatte, S), alle };
}

// $P: grådig parring, begge veje, flere startpunkter. Pris = afstand med stregens hældning som 3. akse.
function skyAfstand(A, B, loft) {
  const n = Math.min(A.length, B.length) / 4;
  const trin = Math.max(1, Math.floor(Math.sqrt(n)));
  let min = loft;
  for (let i = 0; i < n; i += trin) {
    const d1 = parring(A, B, n, i, min); if (d1 < min) min = d1;
    const d2 = parring(B, A, n, i, min); if (d2 < min) min = d2;
  }
  return min;
}
const brugt = new Uint8Array(256);
function parring(A, B, n, start, loft) {
  brugt.fill(0, 0, n);
  const vaegtSum = (n + 1) / 2, graense = loft * vaegtSum, L2 = VINKEL * VINKEL / 2;
  let sum = 0, i = start;
  for (let k = 0; k < n; k++) {
    const ax = A[i * 4], ay = A[i * 4 + 1], ac = A[i * 4 + 2], as = A[i * 4 + 3];
    let bedst = Infinity, bj = 0;
    for (let j = 0; j < n; j++) {
      if (brugt[j]) continue;
      const dx = ax - B[j * 4], dy = ay - B[j * 4 + 1];
      const d = dx * dx + dy * dy + L2 * (1 - (ac * B[j * 4 + 2] + as * B[j * 4 + 3]));
      if (d < bedst) { bedst = d; bj = j; }
    }
    brugt[bj] = 1;
    sum += (1 - k / n) * Math.sqrt(Math.max(0, bedst)); // prikproduktet kan blive 1 + ε → lille negativ afstand
    if (sum >= graense) return sum / vaegtSum;
    i = (i + 1) % n;
  }
  return sum / vaegtSum;
}

function prikStraf(a, b) {
  if (!a.length && !b.length) return 0;
  let straf = PRIK_STRAF * Math.abs(a.length - b.length);
  const brugte = new Set();
  for (const p of a.slice(0, Math.min(a.length, b.length))) {
    let bd = Infinity, bi = -1;
    b.forEach((q, i) => { if (!brugte.has(i)) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; bi = i; } } });
    brugte.add(bi);
    straf += PRIK_STED * Math.min(bd, 0.8);
  }
  return straf;
}

// ---------- skabeloner ----------
function affin(streger, { sx = 1, rot = 0, skaev = 0 }) {
  const b = bbox(streger.flat()), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const c = Math.cos(rot), s = Math.sin(rot);
  return streger.map((st) => st.map(([x, y]) => {
    let u = (x - cx) * sx, v = y - cy;
    u -= skaev * v; // skæv: toppen mod højre for skaev > 0
    return [cx + u * c - v * s, cy + u * s + v * c];
  }));
}
const erPrik = (s, Sa) => { const b = bbox(s); return Math.max(b.w, b.h) <= PRIK_STOERRELSE * Sa; };

// Sæt kroppens streger sammen i skriverækkefølgen (fingeren løftes ikke); prikker forbliver prikker
function sammen(streger) {
  const Sa = Math.max(bbox(streger.flat()).w, bbox(streger.flat()).h);
  const krop = streger.filter((s) => !erPrik(s, Sa)), prik = streger.filter((s) => erPrik(s, Sa));
  if (krop.length < 2) return null;
  return [krop.flat(), ...prik];
}

const VARIANTER = [
  {}, { sx: 0.78 }, { sx: 1.28 }, { skaev: 0.2 }, { skaev: -0.2 }, { rot: 0.17 }, { rot: -0.17 },
  { sx: 1.15, skaev: 0.12 }, { sx: 0.85, skaev: -0.12 },
];

function hoejdeProfil(streger) {
  const Sa = Math.max(bbox(streger.flat()).w, bbox(streger.flat()).h);
  const krop = streger.length > 1 ? streger.filter((s) => !erPrik(s, Sa)) : streger;
  const b = bbox(krop.flat()), h = LINJER.grund - LINJER.x;
  return { op: Math.max(0, (LINJER.x - b.y0) / h), ned: Math.max(0, (b.y1 - LINJER.grund) / h) };
}

// Vendepunkter i en streg (indekser): hvor stregen vender og går tilbage ad sig selv (mere end ca. 160°), fx bunden af
// p's stamme, når p skrives i én streg (ned, op igen og maven). Retningen måles 0,03 enhed før og efter punktet.
function vendepunkter(s) {
  const cum = [0]; for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const ud = [];
  let a = 0, b = 0, gruppe = null; // gruppe: [indeks, cos] for det skarpeste punkt i en række vendende punkter
  for (let i = 1; i < s.length - 1; i++) {
    while (a < i && cum[i] - cum[a + 1] >= 0.03) a++;
    while (b < s.length - 1 && cum[b] - cum[i] < 0.03) b++;
    let c = 1;
    if (cum[i] - cum[a] >= 0.02 && cum[b] - cum[i] >= 0.02) {
      const ux = s[i][0] - s[a][0], uy = s[i][1] - s[a][1], vx = s[b][0] - s[i][0], vy = s[b][1] - s[i][1];
      c = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
    }
    if (c < VENDING) { if (!gruppe || c < gruppe[1]) gruppe = [i, c]; } else if (gruppe) { ud.push(gruppe[0]); gruppe = null; }
  }
  if (gruppe) ud.push(gruppe[0]);
  return ud;
}
// Hvor stregen deler sig til dækningen (indekser): der, hvor den forlader vejen tilbage efter et vendepunkt. Vejen
// tilbage op ad stammen hører til stammen, så p i én streg giver delene "stammen (ned og op igen)" og "maven".
function delSkel(s) {
  const ud = [];
  for (const v of vendepunkter(s)) {
    let k = v + 1;
    while (k < s.length && s.slice(0, v).some((p) => Math.hypot(p[0] - s[k][0], p[1] - s[k][1]) < 0.025)) k++;
    if (k < s.length - 1) ud.push(k);
  }
  return ud;
}
// Delene til dækningen: hver streg i skabelonen delt der, hvor den forlader vejen tilbage efter et vendepunkt. Giver
// del-nummeret for hvert punkt i skyen (samme fordeling som lavSky). Så skal p i én streg have både stammen og maven:
// stammen alene dækker ellers stammen og vejen op igen, over 30 % af den ene streg.
function delNumre(krop, n) {
  const antal = fordel(krop, n), ud = [];
  krop.forEach((s, i) => {
    if (!antal[i]) return;
    const cum = [0]; for (let k = 1; k < s.length; k++) cum.push(cum[k - 1] + Math.hypot(s[k][0] - s[k - 1][0], s[k][1] - s[k - 1][1]));
    const L = cum[cum.length - 1], skel = delSkel(s).map((k) => cum[k]);
    for (let j = 0; j < antal[i]; j++) {
      const pos = antal[i] > 1 ? (L * j) / (antal[i] - 1) : L / 2; // punktets plads langs stregen (som resample)
      ud.push(i * 100 + skel.filter((c) => c < pos).length);
    }
  });
  return ud;
}

// Skabelonerne for ét bogstav: modellen og dens alt-former (skrift-data.js) med variationer, hver også sat sammen
// uden løft. grund = én gruppe pr. form (model og alt-former, uden "sammen"), til dækningen.
function lavSkabeloner(bogstav, streger, alt = [], faa = false) {
  const ud = [], grund = [];
  for (const [ai, form] of [streger, ...alt].entries()) {
    const former = [form];
    const s = bogstav !== 'å' && sammen(form); if (s) former.push(s); // ringen i å tegnes altid for sig
    if (bogstav === 'å' && ai === 0) { // ringen tegnet lille som en prik
      const ring = form[1], b = bbox(ring), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      former.push([form[0], ring.map(([x, y]) => [cx + (x - cx) * 0.3, cy + (y - cy) * 0.3])]);
    }
    const gruppe = [];
    former.forEach((f, fi) => {
      // modellen med alle variationer; alt-former, store bogstaver og "sammen" med færre (hurtigere)
      const varianter = fi > 0 ? VARIANTER.slice(0, faa ? 2 : 3) : ai === 0 && !faa ? VARIANTER : VARIANTER.slice(0, 5);
      for (const v of varianter) {
        const T = beskriv(affin(f, v)); ud.push(T);
        if (fi === 0) { T.del = delNumre(T.krop, N); gruppe.push(T); }
      }
    });
    grund.push(gruppe);
  }
  return { former: ud, grund };
}

let _skabeloner = null;
// Skabelonerne laves første gang, de bruges (ca. 20 ms på Mac'en). forvarm() kan kaldes, når skrivetavlen åbnes.
export function forvarm() { skabeloner(); return true; }
function skabeloner() {
  if (_skabeloner) return _skabeloner;
  _skabeloner = {};
  for (const [b, m] of Object.entries(SKRIFT)) {
    _skabeloner[b] = { ...lavSkabeloner(b, m.streger, m.alt), profil: hoejdeProfil(m.streger) };
  }
  // de store bogstaver (nøgle 'A', 'B' …): kun til at kende dem igen
  for (const [B, m] of Object.entries(STORE)) _skabeloner[B] = { ...lavSkabeloner(B, m.streger, [], true), profil: hoejdeProfil(m.streger) };
  return _skabeloner;
}
// Det spejlvendte bogstav som en ekstra "kandidat" (fx 'e~'), så et omvendt e, s, z, j … ikke godkendes som e.
// Laves kun for bogstaver uden spejlpar, som ikke er symmetriske.
const _spejlTjekket = {};
function spejlKandidat(b) {
  const sk = skabeloner(), navn = `${b}~`;
  if (!_spejlTjekket[b]) {
    _spejlTjekket[b] = true;
    if (!SPEJLPAR[b] && !SYMMETRISKE.includes(b)) {
      const sp = SKRIFT[b].streger.map((s) => s.map(([x, y]) => [-x, y]));
      sk[navn] = { ...lavSkabeloner(b, sp), profil: hoejdeProfil(sp) };
    }
  }
  return sk[navn] ? navn : null;
}

// Dele af et bogstav (til 'ufuldstændig'): en streg mangler, eller kun begyndelsen af stregen er tegnet
const _mangler = {}, _dele = {};
function manglerStreg(bogstav) {
  if (_mangler[bogstav]) return _mangler[bogstav];
  const ud = [];
  for (const st of [SKRIFT[bogstav].streger, ...SKRIFT[bogstav].alt]) { // også alt-formerne (a = o + pind: pinden mangler)
    if (st.length > 1) st.forEach((_, i) => ud.push(st.filter((__, j) => j !== i)));
  }
  _mangler[bogstav] = ud.flatMap((d) => VARIANTER.slice(0, 3).map((v) => beskriv(affin(d, v))));
  return _mangler[bogstav];
}
function dele(bogstav) {
  if (_dele[bogstav]) return _dele[bogstav];
  const st = SKRIFT[bogstav].streger, ud = [];
  for (const brok of [0.55, 0.75]) {
    const L = st.reduce((a, s) => a + laengde(s), 0);
    let rest = L * brok; const del = [];
    for (const s of st) {
      if (rest <= 0) break;
      const ls = laengde(s);
      if (ls <= rest) { del.push(s); rest -= ls; continue; }
      const p = [s[0]]; let acc = 0;
      for (let i = 1; i < s.length && acc < rest; i++) { acc += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); p.push(s[i]); }
      if (p.length > 1) del.push(p);
      rest = 0;
    }
    if (del.length) ud.push(del);
  }
  _dele[bogstav] = [...manglerStreg(bogstav), ...ud.flatMap((d) => VARIANTER.slice(0, 3).map((v) => beskriv(affin(d, v))))];
  return _dele[bogstav];
}

// ---------- højde mod skrivelinjerne ----------
function tegnetProfil(D, linjer) {
  if (!linjer) return null;
  const h = linjer.grund - linjer.x;
  if (!(h > 0)) return null;
  const hoej = D.kb.h / h;
  if (hoej < 0.45 || hoej > 4.5) return null; // han har ikke brugt linjerne – så siger de intet
  return { op: Math.max(0, (linjer.x - D.kb.y0) / h), ned: Math.max(0, (D.kb.y1 - linjer.grund) / h) };
}
function hoejdeStraf(p, m) {
  if (!p) return 0;
  return HOEJDE_STRAF * (Math.max(0, Math.abs(Math.min(p.op, 1.5) - m.op) - HOEJDE_TOL) + Math.max(0, Math.abs(Math.min(p.ned, 1.5) - m.ned) - HOEJDE_TOL));
}

// Afstanden til ét bogstav = den mindste til bogstavets skabeloner. Den grove sky udvælger de skabeloner, der er
// værd at regne helt ud.
function afstand(D, former, loft = Infinity, grov = former.map((T) => skyAfstand(D.grov, T.grov, Infinity))) {
  const gmin = Math.min(...grov);
  let min = loft;
  former.forEach((T, i) => {
    if (grov[i] > gmin + GROV_SKABELON) return;
    const ps = prikStraf(D.prikker, T.prikker);
    if (ps >= min) return;
    const d = skyAfstand(D.sky, T.sky, min - ps) + ps;
    if (d < min) min = d;
  });
  return min;
}
function grovAfstand(D, former) {
  let min = Infinity;
  for (const T of former) { const d = skyAfstand(D.grov, T.grov, min) + prikStraf(D.prikker, T.prikker); if (d < min) min = d; }
  return min;
}

// Det samme for bogstavet b, husket pr. tegning (formen alene; højden lægges til bagefter). Et resultat under loftet
// er eksakt; ellers ved vi kun, at afstanden er mindst loftet.
function grovListe(D, b) {
  const memo = D.grovMemo || (D.grovMemo = {});
  if (!memo[b]) {
    const former = skabeloner()[b].former, liste = [];
    let gmin = Infinity; // skabeloner, der er længere væk end gmin + GROV_SKABELON, regnes ikke helt ud (afstand)
    for (const T of former) { const g = skyAfstand(D.grov, T.grov, gmin + GROV_SKABELON); liste.push(g); if (g < gmin) gmin = g; }
    memo[b] = { liste, min: Math.min(...liste.map((g, i) => g + prikStraf(D.prikker, former[i].prikker))) };
  }
  return memo[b];
}
function formAfstand(D, b, loft = Infinity) {
  const memo = D.memo || (D.memo = {}), v = memo[b];
  if (v && (v.eksakt || v.d >= loft)) return Math.min(v.d, loft);
  const d = afstand(D, skabeloner()[b].former, loft, grovListe(D, b).liste);
  memo[b] = d < loft ? { d, eksakt: true } : { d: loft, eksakt: false };
  return d;
}

// Afstand til hvert bogstav. Kun de bogstaver, der groft set ligger tæt på det bedste, regnes helt ud, i rækkefølge;
// et bogstav opgives (Infinity), så snart det er længere væk end det bedste indtil nu.
function afstande(D, bogstaver, profil) {
  const sk = skabeloner(), ud = {};
  const raekke = bogstaver.map((b) => [b, grovListe(D, b).min + hoejdeStraf(profil, sk[b].profil)]).sort((x, y) => x[1] - y[1]);
  let bedst = Infinity;
  raekke.forEach(([b, g], i) => {
    if (i >= GROV_ANTAL || g > raekke[0][1] + GROV_BOGSTAV) { ud[b] = Infinity; return; }
    const hs = hoejdeStraf(profil, sk[b].profil);
    const d = hs >= bedst ? Infinity : formAfstand(D, b, bedst - hs) + hs;
    if (d < bedst) { bedst = d; ud[b] = d; } else ud[b] = Infinity; // opgivet
  });
  return ud;
}

// Dækning: findes hver del af maal i tegningen (et punkt i nærheden med samme hældning)? Fanger fx t uden
// tværstreg, som punktskyen ellers næsten ikke mærker. Delene er stregerne, delt hvor de forlader vejen tilbage efter
// et vendepunkt (p i én streg: stammen og maven, se delNumre). Giver den mindste dækning over delene (0–1). Dele med
// færre end minPunkter punkter i skyen (prikker) tæller ikke med; de store bogstaver bruger 2, så G's korte tværstreg
// tæller.
function daekning(D, bogstav, minPunkter = 4) {
  let ialtBedst = 0;
  for (const gruppe of skabeloner()[bogstav].grund) { // den form (model eller alt), der er dækket bedst
    ialtBedst = Math.max(ialtBedst, daekningForm(D, gruppe, minPunkter));
    if (ialtBedst >= 1) break;
  }
  return ialtBedst;
}
function daekningForm(D, former, minPunkter) {
  const bedst = {};
  for (const T of former) {
    const n = T.sky.length / 4, ialt = {}, fundet = {};
    for (let i = 0; i < n; i++) {
      const k = T.del[i]; ialt[k] = (ialt[k] || 0) + 1;
      const tx = T.sky[i * 4], ty = T.sky[i * 4 + 1], tc = T.sky[i * 4 + 2], ts = T.sky[i * 4 + 3];
      for (let j = 0; j < D.sky.length / 4; j++) {
        const dx = tx - D.sky[j * 4], dy = ty - D.sky[j * 4 + 1];
        if (dx * dx + dy * dy > DAEK_AFSTAND * DAEK_AFSTAND) continue;
        if (tc * D.sky[j * 4 + 2] + ts * D.sky[j * 4 + 3] < 0.5) continue; // hældningen er mere end 30° fra
        fundet[k] = (fundet[k] || 0) + 1; break;
      }
    }
    for (const k of Object.keys(ialt)) if (ialt[k] >= minPunkter) bedst[k] = Math.max(bedst[k] ?? 0, (fundet[k] || 0) / ialt[k]);
  }
  const v = Object.values(bedst);
  return v.length ? Math.min(...v) : 1;
}

const argmin = (d) => { let b = '', v = Infinity; for (const [k, x] of Object.entries(d)) if (x < v) { v = x; b = k; } return [b, v]; };
const lighed = (d) => Math.max(0, Math.min(1, 1 / (1 + (d / GRAENSE) ** 2)));

// ---------- startpunkt og retning (skrivevejen) ----------
function skrivevej(raa, maal) {
  const model = SKRIFT[maal].streger;
  const Sm = Math.max(bbox(model.flat()).w, bbox(model.flat()).h);
  const mKrop = model.filter((s) => !(model.length > 1 && erPrik(s, Sm)));
  const mb = bbox(mKrop.flat());
  const Sa = Math.max(bbox(raa.flat()).w, bbox(raa.flat()).h) || 1;
  const dKrop = raa.filter((s) => !(raa.length > 1 && erPrik(s, Sa)));
  if (!dKrop.length) return { start_ok: null, retning_ok: null };
  const db = bbox(dKrop.flat());
  // tegningens krop lægges oven på modellens (hver akse for sig, medmindre bogstavet er en smal streg)
  const S = Math.max(mb.w, mb.h);
  let sx = mb.w / (db.w || 1), sy = mb.h / (db.h || 1);
  if (mb.w < 0.25 * mb.h || db.w < 0.25 * db.h) sx = sy = S / (Math.max(db.w, db.h) || 1);
  const map = ([x, y]) => [mb.x0 + (mb.w - db.w * sx) / 2 + (x - db.x0) * sx, mb.y0 + (y - db.y0) * sy];
  // start: det første, han tegnede, skal ligge ved modellens start – enten tæt på, eller nærmest den første lille
  // del af den første streg (det tåler en skæv tegning, hvor toppen er skubbet til siden)
  const st = map(raa[0][0]), ms = model[0][0];
  let start_ok = Math.hypot(st[0] - ms[0], st[1] - ms[1]) <= START_TOL * S;
  if (!start_ok) {
    let bd = Infinity, bs = -1, bi = 0;
    model.forEach((m, k) => m.forEach((q, i) => { const d = (q[0] - st[0]) ** 2 + (q[1] - st[1]) ** 2; if (d < bd) { bd = d; bs = k; bi = i; } }));
    if (bs === 0) {
      const m0 = model[0], L0 = laengde(m0), inde = laengde(m0.slice(0, bi + 1));
      start_ok = inde <= START_LAENGDE || (lukketStreg(m0) && L0 - inde <= START_LAENGDE);
    }
  }
  // retning: hver modelstreg lægges langs tegningen (i den rækkefølge, den blev tegnet) med DTW – forlæns og baglæns.
  // Stregen er trukket rigtigt, når den forlæns passer bedst.
  const kroppen = dKrop.map((s) => s.map(map));
  let forkert = 0;
  for (const s of mKrop) {
    const L = laengde(s);
    if (L < 0.08) continue;
    if (lukketStreg(s)) { // en ring (o, ringen i å): drejer den tegnede ring samme vej rundt? (hvis ringen er tegnet for sig)
      const naermest = kroppen.map((d) => s.reduce((a, q) => a + Math.min(...d.map((p) => Math.hypot(p[0] - q[0], p[1] - q[1]))), 0)).reduce((bi, v, i, arr) => (v < arr[bi] ? i : bi), 0);
      if (laengde(kroppen[naermest]) < 1.25 * L) {
        if (Math.sign(areal(kroppen[naermest])) !== Math.sign(areal(s))) forkert++;
        continue;
      }
    }
    const M = resample(s, 12), h = L / 11; // tegningen samples lige så tæt som modelstregen
    const kurs = kroppen.flatMap((d) => resample(d, Math.max(2, Math.round(laengde(d) / h) + 1)));
    if (dtwDel(M, kurs) > dtwDel([...M].reverse(), kurs)) forkert++;
  }
  return { start_ok, retning_ok: forkert === 0 };
}

const lukketStreg = (s) => Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < 0.1 * laengde(s);
const areal = (s) => { let A = 0; for (let k = 1; k < s.length; k++) A += s[k - 1][0] * s[k][1] - s[k][0] * s[k - 1][1]; return A; };

// DTW, hvor modelstregen M må passe på et vilkårligt stykke af tegningen P (fri start og slutning i P)
function dtwDel(M, P) {
  const n = P.length;
  let prev = new Float64Array(n), cur = new Float64Array(n);
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (let j = 0; j < n; j++) prev[j] = d(M[0], P[j]);
  for (let i = 1; i < M.length; i++) {
    cur[0] = prev[0] + d(M[i], P[0]);
    for (let j = 1; j < n; j++) cur[j] = d(M[i], P[j]) + Math.min(prev[j], prev[j - 1], cur[j - 1]);
    [prev, cur] = [cur, prev];
  }
  let min = Infinity;
  for (let j = 0; j < n; j++) if (prev[j] < min) min = prev[j];
  return min;
}

// ---------- løse tryk ----------
// Et tryk (en prik-lille streg) er kun en prik, hvis det ligger over bogstavet (prikken i i og j, ringen i å). Et tryk
// oven på stregerne (fx på den grønne startprik) eller ved siden af bogstavet (en kno, den anden hånd) fjernes.
function fjernLoeseTryk(raa) {
  if (raa.length < 2) return raa;
  const alle = bbox(raa.flat()), Sa = Math.max(alle.w, alle.h) || 1;
  const erTryk = (s) => { const b = bbox(s); return Math.max(b.w, b.h) <= PRIK_STOERRELSE * Sa; };
  let krop = raa.filter((s) => !erTryk(s));
  if (!krop.length) return raa;
  const kb = bbox(krop.flat()), Sk = Math.max(kb.w, kb.h) || 1;
  // målt mod kroppen: små streger, der er store i forhold til kroppen, er ikke tryk (et lille bogstav + en fjern prik)
  const tryk = (s) => { const b = bbox(s); return Math.max(b.w, b.h) <= PRIK_STOERRELSE * Sk; };
  krop = raa.filter((s) => !tryk(s));
  const kp = krop.flat();
  return raa.filter((s) => {
    if (!tryk(s)) return true;
    const b = bbox(s), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    let paa = Infinity;
    for (const p of kp) { const d = Math.hypot(p[0] - cx, p[1] - cy); if (d < paa) paa = d; }
    if (paa <= LOES_TRYK * Sk) return false; // oven på stregen
    return cx >= kb.x0 - 0.3 * Sk && cx <= kb.x1 + 0.3 * Sk && cy <= kb.y0 + 0.15 * Sk && cy >= kb.y0 - 0.8 * Sk; // over bogstavet
  });
}

// Antal ben (m har 3, n har 2): de steder, hvor en streg vender nede (går ned og op igen, slutter nede, eller starter
// nede og går op), talt med en tærskel på 30 % af højden, så rysten og små kroge ikke tæller. Et ben tælles én gang:
// løfter han fingeren nede ved benet og fortsætter op ad det, slutter én streg og starter den næste ved samme ben.
// Derfor tæller en streg, der starter oven på en tidligere streg, ikke som et nyt ben, og vendepunkter tættere end
// BEN_AFSTAND × bredden på x er samme ben. Tåler skæve og drejede bogstaver.
function benTal(raa) {
  const Sa = Math.max(bbox(raa.flat()).w, bbox(raa.flat()).h) || 1;
  const krop = raa.filter((s) => !(raa.length > 1 && erPrik(s, Sa))).map((s) => udjaevn(s, Sa));
  const kb = bbox(krop.flat()), thr = 0.3 * (kb.h || 1), Sk = Math.max(kb.w, kb.h) || 1;
  const nede = (y) => y >= kb.y0 + 0.5 * kb.h; // kun vendinger i den nederste halvdel er ben
  // starter stregen oven på en af de tidligere streger (han fortsætter op ad et ben, der allerede er tegnet)?
  const paaTidligere = (i) => { const [x, y] = krop[i][0]; return krop.slice(0, i).some((t) => t.some((p) => Math.hypot(p[0] - x, p[1] - y) <= BEN_PAA * Sk)); };
  const steder = []; // x for hvert vendepunkt nede
  for (const [i, s] of krop.entries()) {
    let retning = 0, ekstrem = s[0][1], ex = s[0][0];
    const y0 = s[0][1];
    for (const [x, y] of s) {
      if (retning === 0) {
        if (y - y0 >= thr) { retning = 1; ekstrem = y; ex = x; } else if (y0 - y >= thr) { retning = -1; ekstrem = y; if (nede(y0) && !paaTidligere(i)) steder.push(s[0][0]); } // starter nede
      } else if (retning === 1) { // på vej ned
        if (y > ekstrem) { ekstrem = y; ex = x; } else if (ekstrem - y >= thr) { if (nede(ekstrem)) steder.push(ex); retning = -1; ekstrem = y; }
      } else if (y < ekstrem) ekstrem = y; else if (y - ekstrem >= thr) { retning = 1; ekstrem = y; ex = x; }
    }
    if (retning === 1 && nede(ekstrem)) steder.push(ex); // slutter nede
  }
  steder.sort((a, b) => a - b);
  let ben = 0, forrige = -Infinity; // forrige = det første sted i det ben, der tælles lige nu
  for (const x of steder) if (x - forrige > BEN_AFSTAND * kb.w) { ben++; forrige = x; }
  return ben;
}

// Er bogstavets top lukket (a: maven er rund foroven) eller åben (u)? I den øverste tredjedel skal der være streg
// hen over midten (4 af 5 felter mellem 25 % og 75 % af bredden), ikke kun en skrå stamme.
function topLukket(raa) {
  const Sa = Math.max(bbox(raa.flat()).w, bbox(raa.flat()).h) || 1;
  const krop = raa.filter((s) => !(raa.length > 1 && erPrik(s, Sa))).map((s) => udjaevn(s, Sa));
  const kb = bbox(krop.flat());
  const felter = new Set();
  for (const s of krop) for (const p of resample(s, Math.max(2, Math.round(laengde(s) / (Sa / 80)) + 1))) {
    const f = Math.floor(((p[0] - kb.x0) / (kb.w || 1) - 0.25) / 0.1);
    if (p[1] <= kb.y0 + 0.3 * kb.h && f >= 0 && f < 5) felter.add(f);
  }
  return felter.size >= 4;
}

// ---------- hovedfunktionen ----------
// Den seneste tegnings mellemregninger gemmes, så samme tegning kan prøves mod flere maal uden at regne forfra.
let _sidst = null;
function forbered(raa, linjer, navne) {
  const noegle = `${raa.map((s) => s.map((p) => `${p[0]},${p[1]}`).join(' ')).join('|')}#${linjer ? [linjer.top, linjer.x, linjer.grund, linjer.ned].join(',') : ''}#${navne.join('')}`;
  if (_sidst?.noegle === noegle) return _sidst;
  const D = beskriv(raa), profil = tegnetProfil(D, linjer);
  _sidst = { noegle, D, profil, dist: null, stor: null, storDaek: {}, uden: null, praecis: {}, praecisUden: {}, spejlet: null };
  return _sidst;
}
// afstanden til ét bestemt bogstav, også hvis det blev opgivet i søgningen (medH = false: uden højden)
function praecis(m, D, b, medH = true) {
  const dist = medH ? m.dist : m.uden, tab = medH ? m.praecis : m.praecisUden;
  if (dist && dist[b] !== undefined && dist[b] !== Infinity) return dist[b];
  if (!medH && m.stor && m.stor[b] !== undefined && m.stor[b] !== Infinity) return m.stor[b];
  if (tab[b] === undefined) tab[b] = formAfstand(D, b) + (medH ? hoejdeStraf(m.profil, skabeloner()[b].profil) : 0);
  return tab[b];
}
// Kan det store bogstav B vinde? Maals eget store bogstav altid; et andet kun, når alle dets streger findes i tegningen
// (et smalt o er ikke et G uden tværstreg). Dækningen huskes pr. tegning.
const kanVinde = (m, D, B, maal) => B.toLowerCase() === maal || (m.storDaek[B] ??= daekning(D, B, 2)) >= DAEK_MIN;
// Store bogstaver står på grundlinjen: går tegningen tydeligt ned under grundlinjen (mindst STORT_NED linjeafstand og
// mere, end den går op over x-linjen), er den et lille bogstav med nedstreg (et lille p er et sænket P), ikke et stort.
const underGrundlinjen = (p) => !!p && p.ned >= STORT_NED && p.ned > p.op;
// Det store bogstav, der kan vinde over de små (uden højden), som [bogstav, afstand] (['', Infinity]: intet). Kan det
// nærmeste store bogstav ikke vinde (kanVinde), prøves det næste.
function stortBogstav(m, D, maal) {
  if (!m.stor || underGrundlinjen(m.profil)) return ['', Infinity];
  const kan = (B) => kanVinde(m, D, B, maal);
  const [B, d] = argmin(m.stor);
  if (!B || kan(B)) return [B, d];
  const andre = Object.keys(STORE).filter((A) => A !== B && kan(A));
  return andre.length ? argmin(afstande(D, andre, null)) : ['', Infinity];
}
// Forklarer bogstavets skabeloner punkt j i tegningens sky: et skabelonpunkt højst afst væk, hvis hældning højst er
// 30° fra punktets (hael = 0,5; 0 tillader 45°)?
function forklarer(D, bogstav, j, afst, hael = 0.5) {
  const x = D.sky[j * 4], y = D.sky[j * 4 + 1], c = D.sky[j * 4 + 2], s = D.sky[j * 4 + 3];
  for (const T of skabeloner()[bogstav].former) {
    for (let i = 0; i < T.sky.length / 4; i++) {
      const dx = T.sky[i * 4] - x, dy = T.sky[i * 4 + 1] - y;
      if (dx * dx + dy * dy <= afst * afst && T.sky[i * 4 + 2] * c + T.sky[i * 4 + 3] * s >= hael) return true;
    }
  }
  return false;
}
// Har tegningen en streg, som maal ikke har, men et andet stort bogstav har (G's tværstreg i et o)? Giver det store
// bogstav ('' hvis ingen): mindst STORT_EKSTRA punkter i tegningen, som maal ikke kan forklare, heller ikke skrevet lidt
// smallere, bredere eller mere skævt end skabelonerne (derfor 1,5 × afstanden og 45°), og de punkter er en hel del af
// det store bogstav (mindst halvdelen af en af dets dele ligger ved dem, fx G's tværstreg). Det store bogstav skal kunne
// vinde (alle dets streger findes i tegningen) og ligne tegningen tydeligt (højst STORT_FREMMED_AFSTAND).
function fremmedStort(m, D, maal) {
  if (underGrundlinjen(m.profil)) return '';
  const fremmed = [];
  for (let j = 0; j < D.sky.length / 4; j++) if (!forklarer(D, maal, j, 1.5 * DAEK_AFSTAND, 0)) fremmed.push(j);
  if (fremmed.length < STORT_EKSTRA) return '';
  let bedst = '', bd = STORT_FREMMED_AFSTAND; // (formAfstand giver loftet, når intet er tættere end loftet)
  for (const B of Object.keys(STORE)) {
    if (B.toLowerCase() === maal || !kanVinde(m, D, B, maal) || !helDel(D, B, fremmed)) continue;
    const d = formAfstand(D, B, bd);
    if (d < bd) { bedst = B; bd = d; }
  }
  return bedst;
}
// Ligger mindst halvdelen af en af bogstavets dele (i en af skabelonerne) ved tegningens punkter nr. punkter?
function helDel(D, bogstav, punkter) {
  for (const gruppe of skabeloner()[bogstav].grund) for (const T of gruppe) {
    const ialt = {}, fundet = {};
    for (let i = 0; i < T.sky.length / 4; i++) {
      const k = T.del[i]; ialt[k] = (ialt[k] || 0) + 1;
      if (punkter.some((j) => { const dx = T.sky[i * 4] - D.sky[j * 4], dy = T.sky[i * 4 + 1] - D.sky[j * 4 + 1]; return dx * dx + dy * dy <= DAEK_AFSTAND * DAEK_AFSTAND && T.sky[i * 4 + 2] * D.sky[j * 4 + 2] + T.sky[i * 4 + 3] * D.sky[j * 4 + 3] >= 0.5; })) fundet[k] = (fundet[k] || 0) + 1;
    }
    if (Object.keys(ialt).some((k) => ialt[k] >= 2 && (fundet[k] || 0) >= 0.5 * ialt[k])) return true;
  }
  return false;
}
// tegningen spejlvendt (vandret), regnet én gang
function spejlet(m, raa) {
  if (!m.spejlet) m.spejlet = { noegle: m.noegle, D: beskriv(raa.map((s) => s.map(([x, y]) => [-x, y]))), profil: m.profil, dist: null, stor: null, storDaek: {}, uden: null, praecis: {}, praecisUden: {} };
  return m.spejlet;
}

export function genkend(streger, opts = {}, ekstra = {}) {
  const { streng = false } = opts || {};
  const maal = typeof opts?.maal === 'string' ? opts.maal.toLowerCase() : null;
  const kandidater = Array.isArray(opts?.kandidater) ? opts.kandidater.map((b) => String(b).toLowerCase()) : null;
  const linjer = opts?.linjer ?? ekstra?.linjer ?? null;
  const svar = (o) => ({ ok: false, score: 0, spejl: false, start_ok: null, retning_ok: null, hoejde_ok: null, grund: 'for-lille', ...o, bedst: (o.bedst || '').replace('~', '') });
  const raa0 = rens(streger);
  if (!raa0.length) return svar({});
  const lh = linjer && linjer.grund - linjer.x > 0 ? linjer.grund - linjer.x : null;
  const forLille = (r) => { const b = bbox(r.flat()); return Math.max(b.w, b.h) < (lh ? MIN_LINJE * lh : MIN_PX); };
  if (forLille(raa0)) return svar({ grund: 'for-lille' });
  const raa = fjernLoeseTryk(raa0); // et tryk ved siden af bogstavet (en kno, den anden hånd) tæller ikke
  if (raa !== raa0 && forLille(raa)) return svar({ grund: 'for-lille' });
  const harMaal = !!(maal && SKRIFT[maal]);

  const navne = [...new Set([...(kandidater || BOGSTAVER).filter((b) => SKRIFT[b]), ...(harMaal ? [maal, SPEJLPAR[maal]].filter(Boolean) : [])])];
  const m = forbered(raa, linjer, navne), D = m.D, profil = m.profil;
  if (!m.dist) m.dist = afstande(D, navne, profil);
  // de store bogstaver er altid med som "kendte fejl" (bogstavkortet viser "Bb"). De sammenlignes uden højden:
  // det er formen, der gør et bogstav stort (et stort O er kun et for stort o).
  // (Kun når et stort bogstav groft set ligger lige så tæt som de små – ellers kan det ikke vinde.)
  if (harMaal && !m.stor) {
    const STOR = Object.keys(STORE), grov = (bs) => Math.min(...bs.map((b) => grovListe(D, b).min));
    m.stor = grov(STOR) <= 0.9 * grov(navne) + 0.02 ? afstande(D, STOR, null) : {};
  }
  const uden = () => { if (!m.uden) m.uden = afstande(D, navne, null); return m.uden; };
  // maals spejlbillede ('e~') er også med
  const spejlNavn = harMaal ? spejlKandidat(maal) : null;
  const [bedst, dBedst] = argmin(spejlNavn ? { ...m.dist, [spejlNavn]: praecis(m, D, spejlNavn) } : m.dist);
  const [bStor0, dStor0] = argmin(m.stor || {}); // det nærmeste store bogstav (formen alene)
  let dMaal = harMaal ? praecis(m, D, maal) : dBedst;
  let score = Math.round(lighed(dMaal) * 1000) / 1000;
  // uden højden (regnes kun, når det skal bruges)
  const bedst0 = () => argmin(spejlNavn ? { ...uden(), [spejlNavn]: praecis(m, D, spejlNavn, false) } : uden())[1];
  const dMaal0 = () => praecis(m, D, maal, false);

  // ligner intet bogstav (uden højden: et kæmpestort bogstav er ikke en krusedulle)
  const naermest = Math.min(dBedst, dStor0, dBedst > KRUSEDULLE_AFSTAND && harMaal && profil ? bedst0() : Infinity);
  if (D.blaek > KRUSEDULLE_BLAEK || D.drej > KRUSEDULLE_DREJ || naermest > KRUSEDULLE_AFSTAND) {
    return svar({ bedst: naermest > KRUSEDULLE_AFSTAND ? '' : dStor0 < dBedst ? bStor0 : bedst, score, grund: 'kruseduller' });
  }
  if (!harMaal) return svar({ bedst, score, grund: 'andet-bogstav' });

  // Et stort bogstav vinder kun, når det ligner klart mere end alle de små (og kan vinde, se stortBogstav)
  const [bStor, dStor] = stortBogstav(m, D, maal);
  const stortVinder = dStor <= GRAENSE && dStor < (bStor.toLowerCase() === maal ? STORT_MARGIN : STORT_MARGIN_ANDET) * Math.min(dMaal0(), bedst0());
  let formOk = !stortVinder && dMaal <= GRAENSE && dMaal <= dBedst; // maal er det nærmeste bogstav
  let hoejde_ok = null;
  // a og u ligner hinanden som punktsky (a skrevet som et o og en pind); toppen afgør: a er lukket, u er åben
  if (!formOk && !stortVinder && maal === 'a' && bedst === 'u' && dMaal <= GRAENSE * 1.2 && topLukket(raa)) { formOk = true; dMaal = Math.min(dMaal, GRAENSE); }
  // Højden mod linjerne skiller kun bogstaver med (næsten) samme form (l/i, n/h, a/d, a/q, …). Er formen maal, når
  // linjerne ikke tælles med, og har det bogstav, linjerne peger på, en anden form, godkendes han (for stort, for
  // lille eller lidt ved siden af linjerne er ikke et andet bogstav). hoejde_ok = false fortæller det til appen.
  if (!formOk && !stortVinder && profil) {
    const d0 = dMaal0();
    // (bedst er ikke en tvilling, hvis en af dens streger mangler i tegningen, fx skråstregen i ø for et stort o)
    const tvilling = bedst !== maal && praecis(m, D, bedst, false) <= TVILLING * d0 && !(SKRIFT[bedst]?.streger.length > 1 && daekning(D, bedst) < DAEK_MIN);
    if (d0 <= GRAENSE && d0 <= bedst0() && !tvilling) {
      formOk = true; dMaal = d0; hoejde_ok = false; score = Math.round(lighed(dMaal) * 1000) / 1000;
    }
  }
  if (stortVinder) return svar({ bedst: bStor, score, grund: bStor.toLowerCase() === maal ? 'stort' : 'andet-bogstav' });
  // maal med en streg, maal ikke har, men et andet stort bogstav har (et o med G's tværstreg): et andet bogstav
  const fremmed = formOk ? fremmedStort(m, D, maal) : '';
  if (fremmed) return svar({ bedst: fremmed, score, grund: 'andet-bogstav' });
  // en streg mangler (prikken, tværstregen i t, ringen i å …), men resten ligner: ufuldstændig, ikke godkendt
  if (formOk && SKRIFT[maal].streger.length > 1 && daekning(D, maal) < DAEK_MIN) return svar({ bedst: maal, score, grund: 'ufuldstændig' });
  // kun en del af maal, fx p's stamme uden maven (p's form i én streg dækkes ellers af stammen og vejen op igen):
  // tegningen ligner maal uden en af stregerne klart mere end hele maal
  if (formOk && manglerStreg(maal).length && afstand(D, manglerStreg(maal)) < DEL_FORHOLD * dMaal0()) return svar({ bedst: maal, score, grund: 'ufuldstændig' });
  // m med en bue for meget (4 ben): ikke godkendt, men en konkret besked
  if (formOk && maal === 'm' && benTal(raa) > 3) return svar({ bedst: maal, score, grund: 'buer' });
  if (formOk) {
    const { start_ok, retning_ok } = skrivevej(raa, maal);
    if (hoejde_ok === null && profil) hoejde_ok = hoejdeStraf(profil, skabeloner()[maal].profil) === 0;
    // størrelse: tegningens højde i forhold til modellens (1 = som modellen på linjerne)
    const mb = bbox(SKRIFT[maal].streger.filter((st) => !(SKRIFT[maal].streger.length > 1 && erPrik(st, 1))).flat());
    const stoerrelse = lh ? Math.round((D.kb.h / lh / (mb.h / (LINJER.grund - LINJER.x))) * 100) / 100 : null;
    return svar({ ok: streng ? !!(start_ok && retning_ok) : true, bedst: maal, score, start_ok, retning_ok, hoejde_ok, stoerrelse, grund: 'ok' });
  }
  // spejlvendt? Han skrev spejlparret (d for b), eller den spejlede tegning er maal, og den uspejlede er ikke.
  // Symmetriske bogstaver (o, v, …) og tegninger, der ligner deres eget spejlbillede (et åbent o, en skål), kan ikke
  // være spejlvendte – så ville "Den vender den anden vej" være forkert. (Den grove afstand siger først, om det er
  // værd at regne efter.)
  const sk = skabeloner();
  if (bedst === SPEJLPAR[maal] && dBedst <= GRAENSE * 1.25) return svar({ bedst, score, spejl: true, grund: 'spejl' });
  if (!SYMMETRISKE.includes(maal)) {
    const ms = spejlet(m, raa);
    const selvSymmetrisk = () => skyAfstand(D.sky, ms.D.sky, Infinity) < SYMMETRI;
    if (bedst === `${maal}~` && dBedst <= GRAENSE && dBedst < SPEJL_MARGIN * dMaal && !selvSymmetrisk()) return svar({ bedst: maal, score, spejl: true, grund: 'spejl' });
    if (grovListe(ms.D, maal).min <= GROV_PORT) {
      if (!ms.dist) ms.dist = afstande(ms.D, navne, profil);
      const [bS, vB] = argmin(ms.dist), vS = praecis(ms, ms.D, maal);
      if ((bS === maal || vS <= vB) && vS <= GRAENSE && vS < SPEJL_MARGIN * dMaal && vS < dBedst * 1.1 && !selvSymmetrisk()) return svar({ bedst, score, spejl: true, grund: 'spejl' });
    }
  }
  // ufuldstændig: tegningen passer på en del af maal
  if (grovAfstand(D, dele(maal)) <= GROV_PORT) {
    const dDel = afstand(D, dele(maal)) + hoejdeStraf(profil, sk[maal].profil) * 0.5;
    if (dDel <= GRAENSE && dDel <= dBedst * 1.15) return svar({ bedst, score, grund: 'ufuldstændig' });
  }
  // maal er det nærmeste bogstav, men utydeligt (over grænsen): ikke "et andet bogstav"
  if (bedst === maal) return svar({ bedst, score, grund: 'utydelig' });
  return svar({ bedst, score, grund: 'andet-bogstav' });
}

// Til test og fejlfinding: afstanden til hvert bogstav
export function afstandTil(streger, bogstaver = BOGSTAVER, linjer = null) {
  const raa = rens(streger); if (!raa.length) return {};
  const D = beskriv(raa), p = tegnetProfil(D, linjer), sk = skabeloner();
  return Object.fromEntries(bogstaver.map((b) => [b, afstand(D, sk[b].former) + hoejdeStraf(p, sk[b].profil)]));
}
