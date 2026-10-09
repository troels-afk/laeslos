// Forældredelen: forældrespærren (hold 3 sek. + lille regnestykke), Trænerbænken, lydstudiet "Jeres egen stemme" (valgfrit),
// loggen og nulstilling (bekræftes i siden, aldrig med confirm()).
import { ALFABET, KLASSENS_17, HISTORIER, DAGENS_ORD_LYD, lydtype, kraevedeBogstaver } from './content.js?v=6f70bf5933';
import { state, save, reset, opslagInfo } from './store.js?v=6f70bf5933';
import { hasRec, playRec, delRec, saveRec, startRecording, clearRecs, setSound, hasLetterSound, hasLetterClip, hasClip, playLetter, say, claim } from './audio.js?v=6f70bf5933';
import { ICON, overlay, onClick, holdButton, ringSvg, bubble } from './ui.js?v=6f70bf5933';
import { $, $$, esc, shuffle, ri, clock } from './util.js?v=6f70bf5933';
import { TRIN_NAVN, GODE_FOR_NAESTE, MISS_FOR_NED, SAMME_LYD, skrivInfo } from './skriv.js?v=6f70bf5933';

// ================= Forældrespærren =================

export function gateButton() {
  return `<button class="gate-btn" id="gate" aria-label="Forældre: hold fingeren på i 3 sekunder">${ICON.floejte()}${ringSvg(47)}</button>`;
}

export function armGate(el, onOk) {
  holdButton(el, 3000, () => openGate(onOk), () => bubble('Voksne: hold 3 sek.', 1800, el));
}

export function openGate(onOk) {
  const a = ri(3, 9), b = ri(2, 8), sum = a + b;
  const opts = shuffle([sum, sum + 1, sum - 1, sum + 2].filter((v, i, arr) => arr.indexOf(v) === i));
  const o = overlay(`<div class="gate">
    <span class="adult-tag">Kun for voksne</span>
    <h2>Hvad er ${a} + ${b}?</h2>
    <div class="gate-opts">${opts.map((v) => `<button class="gate-opt" data-v="${v}">${v}</button>`).join('')}</div>
    <button class="link-btn" id="gate-cancel">Annuller</button></div>`, 'gate-ov', { onEscape: () => o.close() });
  window.__ll && (window.__ll.gateAnswer = sum);
  $$('.gate-opt', o).forEach((btn) => onClick(btn, () => {
    if (Number(btn.dataset.v) === sum) { o.close(); onOk(); } else { o.close(); openGate(onOk); }
  }));
  onClick($('#gate-cancel', o), () => o.close());
}

// ================= Trænerbænken =================

const ACT = {
  lydjagt: 'Lydjagt', 'hvilken-lyd': 'Hvilken lyd?', 'sig-selv': 'Sig det selv', 'nyt-saetning': 'Sove-ægget',
  'laes-vaelg': 'Læs og vælg', byg: 'Byg ordet', kommando: 'Kommando', tjek: 'Billedtjek', opslag: 'Opslag',
};
const RES = { rigtigt: 'rigtigt', forkert: 'forkert', hjaelp: 'med hjælp', selv: 'læst selv', igen: 'prøver igen' };
ACT['bogstavnavn'] = 'Bogstavnavn';
ACT.skriv = 'Skriv bogstavet';
// Hvorfor et skriveforsøg ikke blev godkendt (genkend.js), sagt til den voksne
const GRUND = { spejl: 'spejlvendt', 'for-lille': 'for lille', kruseduller: 'kruseduller', 'andet-bogstav': 'ligner et andet bogstav', 'ufuldstændig': 'ikke færdigt', ufuldstaendig: 'ikke færdigt', start: 'startede et andet sted', retning: 'anden retning', stort: 'stort bogstav', buer: 'forkert antal buer', utydelig: 'utydeligt' };

// "R1-ti-ni-nu#6" → "Ti, ni … nu! · opslag 6"
function itemLabel(item) {
  const m = /^(.+)#(\d+)$/.exec(String(item));
  if (m && HISTORIER[m[1]]) return `${HISTORIER[m[1]].titel} · ${m[2] === '0' ? 'titel' : `opslag ${m[2]}`}`;
  return String(item);
}

const TABS = [
  ['bogstaver', 'Ugens bogstaver'], ['skriv', 'Hans bogstaver'], ['lyd', 'Jeres egen stemme'], ['indst', 'Indstillinger'], ['log', 'Log'], ['nulstil', 'Nulstil'],
];

// Bip siger bogstavlydene med Jeppes stemme (public/lyd/bogstav/). Kortet vises kun, hvis en lyd hverken findes
// som Jeppe-klip eller som jeres optagelse (fx hvis tools/lyd/tts.py app ikke er kørt).
const missingLetters = () => state.letters.filter((l) => !hasLetterSound(l)).length;

const noticeText = (missing) => `${ICON.mik()}<span><b>${missing} ${missing === 1 ? 'bogstavlyd mangler' : 'bogstavlyde mangler'}.</b> Kør <code>python3 tools/lyd/tts.py app</code> på Mac'en, eller indtal ${missing === 1 ? 'den' : 'dem'} under Jeres egen stemme. Indtil da viser Bip lyden som tekst og spiller en blød tone.</span>`;
function updateNotice(screen) {
  const n = screen?.querySelector('#go-lyd');
  if (!n) return;
  const missing = missingLetters();
  if (missing) n.innerHTML = noticeText(missing); else n.remove();
}

export function renderBench(root, { onBack, tab = 'bogstaver' }) {
  const draw = (t) => {
    tab = t;
    const missing = missingLetters();
    root.innerHTML = `<section class="screen bench">
      <header class="bench-top">
        <button class="pill-btn" id="bench-back">${ICON.tilbage()}<span>Tilbage til Dut</span></button>
        <h1>Trænerbænken</h1>
      </header>
      ${missing ? `<button class="notice" id="go-lyd">${noticeText(missing)}</button>` : ''}
      <nav class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" class="tab ${k === tab ? 'on' : ''}" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join('')}</nav>
      <div class="bench-body" id="bench-body"></div>
    </section>`;
    onClick($('#bench-back', root), () => { stopRecording(); onBack(); });
    onClick($('#go-lyd', root), () => { stopRecording(); draw('lyd'); });
    $$('.tab', root).forEach((b) => onClick(b, () => { stopRecording(); draw(b.dataset.tab); }));
    const body = $('#bench-body', root);
    ({ bogstaver: letters, skriv: hansBogstaver, lyd: studio, indst: settings, log: logView, nulstil: resetView })[tab](body, draw);
  };
  draw(tab);
}

// ---- Ugens bogstaver ----
function letters(body) {
  const draw = () => {
    const off = (id) => kraevedeBogstaver(id).filter((l) => !state.letters.includes(l));
    const warn = Object.keys(HISTORIER).map((id) => [id, off(id)]).filter(([, o]) => o.length);
    body.innerHTML = `<div class="card">
      <h2>Ugens bogstaver</h2>
      <p class="muted">Som standard er alle bogstaver slået til. Slå de bogstaver fra, klassen ikke har haft endnu – de står så dæmpet i omklædningsrummet og forsvinder fra stjernerne på Dut.</p>
      <div class="letter-grid">${ALFABET.map((l) => `<button class="lt-toggle ${state.letters.includes(l) ? 'on' : ''}" data-l="${l}" aria-pressed="${state.letters.includes(l)}">${l.toUpperCase()}${l}</button>`).join('')}</div>
      ${warn.length ? `<div class="warn">${warn.map(([id, o]) => `"${esc(HISTORIER[id].titel)}" bruger ${o.map((x) => `<b>${x}</b>`).join(', ')}, som er slået fra.`).join('<br>')}</div>` : ''}
      <div class="row-btns"><button class="link-btn" id="alle">Slå alle til</button> <button class="link-btn" id="std17">Kun klassens 17 bogstaver</button></div>
    </div>`;
    $$('.lt-toggle', body).forEach((b) => onClick(b, () => {
      const l = b.dataset.l;
      state.letters = state.letters.includes(l) ? state.letters.filter((x) => x !== l) : ALFABET.filter((x) => x === l || state.letters.includes(x));
      save();
      draw();
    }));
    onClick($('#alle', body), () => { state.letters = ALFABET.slice(); save(); draw(); });
    onClick($('#std17', body), () => { state.letters = KLASSENS_17.slice(); save(); draw(); });
  };
  draw();
}

// ---- Hans bogstaver: skrivning med fingeren (skriv.js) ----
// De seneste 3 tegninger pr. bogstav som små SVG'er på skrivelinjerne, trinnet og indstillingen for streng skrivevej.
// Punkterne er gemt i hundrededele af skrivehusets højde (y: 0 = toplinjen, 33 = x-linjen, 67 = grundlinjen, 100 = nedstregslinjen).
export function tegningSvg(tegning) {
  const pts = (tegning?.s || []).map((a) => { const P = []; for (let i = 0; i + 1 < a.length; i += 2) P.push([a[i], a[i + 1]]); return P; }).filter((P) => P.length);
  const xs = pts.flat().map((p) => p[0]);
  const x0 = xs.length ? Math.min(...xs) : 0, x1 = xs.length ? Math.max(...xs) : 30;
  const pad = 12, w = Math.max(50, x1 - x0 + 2 * pad), vx = (x0 + x1) / 2 - w / 2;
  const linje = (y, extra = '') => `<line x1="${vx}" x2="${vx + w}" y1="${y}" y2="${y}" ${extra}/>`;
  const streg = (P) => (P.length === 1 ? `<circle cx="${P[0][0]}" cy="${P[0][1]}" r="3.5" fill="#3d5bd9"/>` : `<polyline points="${P.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#3d5bd9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  return `<svg class="tegning" viewBox="${vx} -6 ${w} 112" aria-hidden="true"><rect x="${vx}" y="33" width="${w}" height="34" fill="rgba(255,236,170,.35)"/>
    <g stroke="#b9c3df" stroke-width="1.5">${linje(0)}${linje(33, 'stroke-dasharray="5 4"')}${linje(100)}</g>${linje(67, 'stroke="#6f86c6" stroke-width="2.5"')}
    ${pts.map(streg).join('')}</svg>`;
}

const opremsning = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} og ${xs.at(-1)}`); // "c, z, q og w"

function hansBogstaver(body) {
  const draw = () => {
    const s = state.settings;
    const ls = ALFABET.filter((l) => { const i = skrivInfo(l); return i.n || i.vist; });
    body.innerHTML = `<div class="card settings">
      <h2>Hans bogstaver</h2>
      <p class="muted">Han skriver små bogstaver med fingeren: i opvarmningen ("Skriv lyden") og fra bogstavkortet i omklædningsrummet. Trinene er <b>1 Spor</b> (stiplet bogstav) → <b>2 Startprik</b> → <b>3 Fra hukommelsen</b> (han hører kun lyden). ${GODE_FOR_NAESTE} gode forsøg på et trin flytter ham til næste trin, og lykkes det ikke ${MISS_FOR_NED} gange i træk, går han et trin ned. Tredje forsøg på trin 2 og 3 er altid et sporingsforsøg, så det lykkes til sidst. På trin 3 tæller et forsøg kun som godt fra hukommelsen, hvis han ikke lige har set bogstavet blive vist i omgangen (efter et forsøg, der ikke lykkedes, eller på "Se hvordan"): så får han ros, men omgangen tæller som en omgang uden held på trinnet (ligesom sporingsforsøget) og kan dermed føre til et trin ned. Bogstaverne ${opremsning(Object.keys(SAMME_LYD))} når højst trin 2, fordi de lyder som ${opremsning([...new Set(Object.values(SAMME_LYD))])}: lyden alene siger ikke, hvilket af bogstaverne han skal skrive. Skærmen erstatter ikke papiret: skriv også bogstaverne med blyant i logbogen.</p>
      <div class="set-row"><div><b>Streng skrivevej (start og retning)</b><small>Fra: kun formen tæller, og Bip giver et lille tip om skrivevejen bagefter. Til: bogstavet skal også startes det rigtige sted og skrives den rigtige vej (oppefra og ned, runde bogstaver mod uret, prikker og tværstreger til sidst).</small></div>
        <div class="seg" role="radiogroup" data-name="skrivStreng">${[[false, 'Fra'], [true, 'Til']].map(([v, l]) => `<button role="radio" class="seg-btn ${!!s.skrivStreng === v ? 'on' : ''}" data-v="${v}" aria-checked="${!!s.skrivStreng === v}">${l}</button>`).join('')}</div></div>
    </div>
    <div class="card">
      ${ls.length ? `<div class="skriv-liste">${ls.map((l) => {
        const i = skrivInfo(l);
        return `<div class="skriv-raekke" data-l="${l}">
          <span class="skriv-bogstav">${l}</span>
          <span class="skriv-trin"><b>Trin ${i.trin}: ${TRIN_NAVN[i.trin]}</b><small>${i.trin >= i.maks && i.maks < 3 ? `${i.ok} ${i.ok === 1 ? 'godt forsøg' : 'gode forsøg'} · højeste trin (${l} lyder som ${SAMME_LYD[l]})` : i.trin < 3 ? `${i.ok} af ${GODE_FOR_NAESTE} gode forsøg` : i.ok ? `${i.ok} ${i.ok === 1 ? 'godt forsøg' : 'gode forsøg'} fra hukommelsen` : 'øver fra hukommelsen'} · ${i.n} forsøg i alt</small></span>
          <span class="skriv-tegninger">${i.tegn.slice().reverse().map((t) => `<span class="skriv-tegning ${t.ok ? 'ok' : ''}" title="${esc(clock(t.t))} · trin ${t.trin}">${tegningSvg(t)}${t.ok ? `<span class="tg-ok" aria-label="godkendt">${ICON.check()}</span>` : `<small>${esc(GRUND[t.grund] || 'øvet')}</small>`}</span>`).join('')}</span>
        </div>`;
      }).join('')}</div>` : '<p class="muted">Ingen tegninger endnu. De kommer her, når han har skrevet et bogstav.</p>'}
    </div>`;
    $$('.seg-btn', body).forEach((b) => onClick(b, () => { s.skrivStreng = b.dataset.v === 'true'; save(); draw(); }));
  };
  draw();
}

// ---- Jeres egen stemme (lydstudie, valgfrit: overskriver Jeppes bogstavlyd eller ord) ----
let recCtl = null, starting = false;
// Skift af faneblad eller "Tilbage til Dut" stopper en igangværende optagelse (mikrofonen lukkes)
export const stopRecording = () => { try { recCtl?.stop(); } catch { /* */ } };

function studio(body, redraw) {
  // jeppe = det, Bip siger, når der ikke er en optagelse (null = intet)
  const rows = [
    ...state.letters.map((l) => ({ key: `lyd:${l}`, label: `${l.toUpperCase()}${l}`, sub: lydtype(l) === 'hop' ? 'hoppe-lyd' : lydtype(l) === 'lang' ? 'lang lyd' : '', jeppe: hasLetterClip(l) ? () => playLetter(l) : null })),
  ];
  const wordRows = DAGENS_ORD_LYD.flatMap((w) => [
    { key: `ord:${w.toLowerCase()}:lyd`, label: w, sub: 'lydering', jeppe: null },
    { key: `ord:${w.toLowerCase()}`, label: w, sub: 'helord', jeppe: hasClip(w) ? () => say(w) : null },
  ]);
  const byKey = Object.fromEntries([...rows, ...wordRows].map((r) => [r.key, r]));
  const row = (r) => `<div class="rec-row ${hasRec(r.key) ? 'has' : ''}" data-key="${esc(r.key)}">
      <span class="rec-label"><b>${esc(r.label)}</b>${r.sub ? `<small>${r.sub}</small>` : ''}</span>
      <span class="rec-state">${hasRec(r.key) ? 'jeres stemme' : r.jeppe ? 'Jeppe' : 'ikke indtalt'}</span>
      <button class="icon-btn rec" data-act="rec" aria-label="Optag ${esc(r.label)} ${r.sub}">${ICON.mik()}</button>
      <button class="icon-btn" data-act="play" aria-label="Afspil ${esc(r.label)} ${r.sub}" ${hasRec(r.key) || r.jeppe ? '' : 'disabled'}>${ICON.play()}</button>
      <button class="icon-btn" data-act="del" aria-label="Slet ${esc(r.label)} ${r.sub}" ${hasRec(r.key) ? '' : 'disabled'}>${ICON.slet()}</button>
    </div>`;
  body.innerHTML = `<div class="card">
    <h2>Brug jeres egen stemme</h2>
    <p class="muted">Det her er valgfrit. Bip siger allerede alle bogstavlyde og ord med Jeppes stemme. Vil I hellere, at Bip bruger far eller mors stemme, kan I indtale en bogstavlyd eller et ord her. Så bruger Bip jeres optagelse i stedet for Jeppes, og sletter I den, er det Jeppe igen. Optagelserne bliver på iPad'en.</p>
    <p class="muted"><b>Lange lyde</b> (m, n, l, s, f, v og vokalerne) holdes 1–1½ sekund. <b>Hoppe-lyde</b> (b, d, g, p, t) er korte og uden "ø" bagefter. Tryk på mikrofonen, sig lyden, og tryk igen for at stoppe (højst 3 sekunder). ▶ afspiller det, Bip siger nu.</p>
    <p class="rec-error" id="rec-error" role="status"></p>
    <h3>Bogstavlyde</h3>
    <div class="rec-list">${rows.map(row).join('')}</div>
    <h3>Dagens ord</h3>
    <p class="muted">Et ord kan indtales to gange: som <b>lydering</b> (forbundet: "lll-øøø-b"), som Glidebanen bruger, og som <b>helord</b> ("løb").</p>
    <div class="rec-list">${wordRows.map(row).join('')}</div>
  </div>`;
  const err = $('#rec-error', body);
  // Studiet tegnes igen (scroll bevares), og kortet med antal manglende lyde opdateres på stedet
  const refresh = () => {
    const sc = body.closest('.screen'), y = sc?.scrollTop || 0;
    studio(body, redraw);
    updateNotice(body.closest('.screen'));
    if (sc) sc.scrollTop = y;
  };
  $$('.rec-row', body).forEach((rowEl) => {
    const key = rowEl.dataset.key;
    onClick(rowEl.querySelector('[data-act="rec"]'), async (e) => {
      const btn = e.currentTarget;
      if (recCtl) { recCtl.stop(); return; }
      if (starting) return; // to tryk under tilladelsesdialogen starter ikke to optagelser
      starting = true;
      err.textContent = '';
      let blob = null;
      try {
        recCtl = await startRecording(3000);
        btn.classList.add('recording');
        btn.innerHTML = ICON.stop();
        btn.setAttribute('aria-label', 'Stop optagelsen');
        rowEl.querySelector('.rec-state').textContent = 'optager …';
        blob = await recCtl.done;
      } catch (ex) {
        err.textContent = ex?.message === 'nosupport'
          ? 'Denne browser kan ikke optage lyd. Prøv Safari på iPad\'en eller Chrome på Mac\'en.'
          : 'Mikrofonen kunne ikke bruges. Giv browseren lov til at bruge mikrofonen, og prøv igen.';
      } finally {
        recCtl = null;
        starting = false;
      }
      if (blob && blob.size > 0) {
        try { await saveRec(key, blob); } catch { err.textContent = 'Optagelsen kunne ikke gemmes på iPad\'en. Prøv igen.'; }
      } else if (blob) err.textContent = 'Optagelsen blev tom. Prøv igen, og tal lidt tættere på.';
      if (!body.isConnected) return;
      const msg = err.textContent;
      refresh();
      $('#rec-error', body).textContent = msg;
    });
    onClick(rowEl.querySelector('[data-act="play"]'), () => { claim(); if (hasRec(key)) playRec(key); else byKey[key]?.jeppe?.(); });
    onClick(rowEl.querySelector('[data-act="del"]'), async () => { try { await delRec(key); } catch { /* */ } refresh(); });
  });
}

// ---- Indstillinger ----
function settings(body) {
  const s = state.settings;
  const seg = (name, val, opts) => `<div class="seg" role="radiogroup" data-name="${name}">${opts.map(([v, l]) => `<button role="radio" class="seg-btn ${String(val) === String(v) ? 'on' : ''}" data-v="${v}" aria-checked="${String(val) === String(v)}">${l}</button>`).join('')}</div>`;
  const draw = () => {
    body.innerHTML = `<div class="card settings">
      <h2>Indstillinger</h2>
      <div class="set-row"><div><b>Standard læsetilstand</b><small>Bruges, når appen ikke spørger "Hvem er med i dag?".</small></div>${seg('defaultMode', s.defaultMode, [['sammen', 'Vi læser sammen'], ['selv', 'Jeg læser selv']])}</div>
      <div class="set-row"><div><b>Skrivetrin</b><small>1: vælg første bogstav · 2: ordets brikker · 3: + 2 lokkere</small></div>${seg('writeStep', s.writeStep, [[1, 'Trin 1'], [2, 'Trin 2'], [3, 'Trin 3']])}</div>
      <div class="set-row"><div><b>Læsefingerens minimumstid</b><small>Sekunder pr. bogstav, før billedet kan vågne i "Jeg læser selv".</small></div>
        <div class="range"><input type="range" id="minsec" min="0.2" max="1.5" step="0.1" value="${s.minSecPerLetter}" aria-label="Sekunder pr. bogstav"><output id="minsec-out">${String(s.minSecPerLetter).replace('.', ',')} sek.</output></div></div>
      <div class="set-row"><div><b>Lyd</b><small>Tale, bogstavlyde og effekter.</small></div>${seg('sound', s.sound, [[true, 'Til'], [false, 'Fra']])}</div>
      <div class="set-row"><div><b>Reduceret bevægelse</b><small>Ingen animationer (følger også iPad'ens indstilling).</small></div>${seg('reducedMotion', s.reducedMotion, [[false, 'Fra'], [true, 'Til']])}</div>
    </div>`;
    $$('.seg', body).forEach((g) => $$('.seg-btn', g).forEach((b) => onClick(b, () => {
      const name = g.dataset.name;
      let v = b.dataset.v;
      if (v === 'true' || v === 'false') v = v === 'true';
      else if (/^\d+$/.test(v)) v = Number(v);
      s[name] = v;
      if (name === 'sound') setSound(v);
      if (name === 'reducedMotion') document.documentElement.classList.toggle('rm', v);
      save();
      draw();
    })));
    const r = $('#minsec', body);
    r.addEventListener('input', () => {
      s.minSecPerLetter = Math.round(Number(r.value) * 10) / 10;
      $('#minsec-out', body).textContent = `${String(s.minSecPerLetter).replace('.', ',')} sek.`;
      save();
    });
  };
  draw();
}

// ---- Log ----
function logView(body) {
  const scored = state.log.filter((e) => e.s).slice(-50).reverse();
  const stories = Object.keys(HISTORIER);
  body.innerHTML = `<div class="card">
    <h2>Pr. historie</h2>
    ${stories.map((id) => {
      const h = HISTORIER[id], o = state.opslag[id] || {};
      const read = state.dut.read[id];
      return `<div class="story-log"><b>${esc(h.titel)}</b> <small>${read ? `læst ${read.n} ${read.n === 1 ? 'gang' : 'gange'}` : 'ikke læst endnu'}</small>
        <div class="opslag-row">${[0, ...h.opslag.map((x) => x.nr)].map((nr) => {
          // Kun den voksnes "læst selv" (uden ordhjælp) er grøn. Alene/læsefinger er øvelse, og ord efter diktat
          // tæller ikke som selvstændig afkodning.
          const inf = opslagInfo(o[nr]);
          const cls = !inf ? '' : inf.mode === 'selv' ? 'alene' : inf.how;
          const txt = !inf ? '–' : inf.mode === 'selv' ? (inf.how === 'hjaelp' ? 'alene, hjælp' : 'alene') : inf.how === 'selv' ? 'læst selv' : 'med hjælp';
          return `<span class="op ${cls}" title="Opslag ${nr}">${nr === 0 ? 'titel' : nr}<small>${txt}</small>${inf?.diktat ? '<small class="diktat">efter diktat</small>' : ''}</span>`;
        }).join('')}</div></div>`;
    }).join('')}
  </div>
  <div class="card">
    <h2>Seneste ${scored.length || ''} scorede svar</h2>
    ${scored.length ? `<table class="log-table"><thead><tr><th>Tid</th><th>Aktivitet</th><th>Ord/bogstav</th><th>Svar</th></tr></thead><tbody>
      ${scored.map((e) => `<tr><td>${esc(clock(e.t))}</td><td>${esc(ACT[e.act] || e.act)}</td><td>${esc(itemLabel(e.item))}${e.valgt ? ` <small>(valgte ${esc(e.valgt)})</small>` : ''}${e.efter_diktat ? ' <small>(efter diktat)</small>' : ''}${e.kilde === 'voksen' ? ' <small>(den voksne sagde lyden)</small>' : ''}${e.act === 'skriv' ? ` <small>(trin ${e.trin}${!e.ok && GRUND[e.grund] ? `, ${GRUND[e.grund]}` : ''}${e.spor ? ', sporet' : e.efterVis ? ', lige efter at have set det' : ''})</small>` : ''}</td><td class="res-${esc(e.res)}">${esc(RES[e.res] || e.res)}</td></tr>`).join('')}
    </tbody></table>` : '<p class="muted">Ingen svar endnu. Spil en mission, så kommer de her.</p>'}
  </div>`;
}

// ---- Nulstil ----
function resetView(body, redraw) {
  body.innerHTML = `<div class="card">
    <h2>Nulstil prototypen</h2>
    <p class="muted">Sletter læste historier, detaljer på Dut, loggen og indstillingerne. Optagelserne i lydstudiet bevares, medmindre du også vælger dem.</p>
    <label class="check"><input type="checkbox" id="also-rec"> Slet også optagelserne</label>
    <div class="confirm-zone" id="zone"><button class="danger-btn" id="reset">Nulstil prototype</button></div>
  </div>`;
  onClick($('#reset', body), () => {
    $('#zone', body).innerHTML = `<p><b>Er du sikker?</b> Det kan ikke fortrydes.</p>
      <button class="danger-btn" id="reset-yes">Ja, nulstil</button> <button class="pill-btn" id="reset-no"><span>Fortryd</span></button>`;
    onClick($('#reset-no', body), () => resetView(body, redraw));
    onClick($('#reset-yes', body), async () => {
      if ($('#also-rec', body).checked) await clearRecs();
      reset();
      setSound(true);
      document.documentElement.classList.remove('rm');
      $('#zone', body).innerHTML = '<p class="ok-msg" id="reset-done">Prototypen er nulstillet.</p>';
    });
  });
}
