// Historie-afspilleren: titel (opslag 0), FØR/LÆS → (TJEK) → BEKRÆFT → NÆSTE, ordhjælp, voksenknapper,
// læsefinger + vågn-knap, kaptajnens kommando, tryk-på-ordet, samtalekort, efterscene og slut.
// Læs sammen-historier (fx "Tuba!"): hvert opslag har en voksentekst øverst (lille, systemskrift, "Den voksne læser"
// og ▶ "Læs min del" med Jeppe) og barnets linje stort i Andika. "Vi læser sammen": den voksne læser sin del, barnet
// sin linje, og den voksne trykker "Læst selv"/"Med hjælp". "Jeg læser selv": Jeppe læser voksenteksten op, og først
// derefter kommer læsefingeren på barnets linje (voksenblokken har så kun en lille højttaler og klappes sammen til
// 2 linjer, når Jeppe har læst). Ordhjælp gives kun på barnets ord.
// Regler: teksten står aldrig oven på billedet, billedet står stille og dæmpet, til sætningen er læst,
// intet automatisk hint før 15 sek. uden aktivitet, og ingen auto-bladring.
import { HISTORIER, MISSIONER, STEDER, DRILLEORD, tokens, antalBogstaver, billede, samtalekort, lydering, laesSammen } from './content.js?v=bab7c031e5';
import { state, log, markOpslag, save } from './store.js?v=bab7c031e5';
import { say, playLetter, playWord, sfx, sfxSeq, stopSpeech, claim } from './audio.js?v=bab7c031e5';
import { ICON, icon, pic, instruct, setInstruction, onTap, onClick, DEBUG, koeretoej } from './ui.js?v=bab7c031e5';
import { buildWord, choosePicture, waitClick, nextBtn } from './activities.js?v=bab7c031e5';
import { $, $$, esc, sleep, reducedMotion } from './util.js?v=bab7c031e5';
import { TALE, laesTraek, traek, vidsteDu, godtLaest, bekraeftTekst, vidsteDel } from './tale.js?v=bab7c031e5';

const cur = (o) => { if (window.__ll) window.__ll.cur = o; };
const hintMs = () => Number(window.__ll?.hintMs) || 15000; // testkrog: browsertesten kan forkorte hintets ventetid

export async function playStory(ctx) {
  const h = HISTORIER[ctx.storyId];
  const m = MISSIONER[ctx.storyId];
  const firstRead = !state.dut.read[ctx.storyId];
  const cards = ctx.mode === 'sammen' && firstRead ? samtalekort(ctx.storyId) : {};
  const pages = [
    { nr: 0, title: true, tekst: h.titel, ord: (h.titel.match(/[A-Za-zÆØÅæøå]+/g) || []).map((w) => ({ ord: w, type: 'L' })), foer_billede: 'Forsidebilledet', efter_billede: 'Forsidebilledet' },
    ...h.opslag,
  ];
  let tavleWord = null;
  for (const p of pages) {
    if (!ctx.alive()) return;
    const ia = p.interaktion;
    if (ia?.type === 'skriv-for-at-handle') { await kommando(ctx, ia, m.kommando[p.nr] || {}); tavleWord = ia.ord; }
    if (ia?.type === 'tryk-paa-ordet') await trykPaaOrdet(ctx, ia, tavleWord || ia.ord);
    if (!ctx.alive()) return;
    await spreadPage(ctx, p, { tavleWord, m, tjek: ia?.type === 'vaelg-billede' ? { ...m.tjek[p.nr], ia } : null, fx: m.effekter[p.nr] || {}, card: cards[p.nr] || null });
  }
}

// ================= Ét opslag =================

const zzz = '<span class="zzz" aria-hidden="true">z<i>z</i><b>z</b></span>';
const hat = '<span class="hat" aria-hidden="true"></span>';

function textHtml(tekst, ordList) {
  let wi = 0;
  return tokens(tekst).map((line) => `<div class="line">${line.map((t) => {
    if (t.t) return `<span class="punct">${esc(t.t)}</span>`;
    const i = wi++;
    const meta = ordList[i] || { type: 'L' };
    const marks = meta.type === 'H' ? DRILLEORD[t.w.toLowerCase()] || {} : {};
    const letters = [...t.w].map((c, k) => `<span class="lt ${marks[k] || ''}">${esc(c)}${marks[k] === 'sover' ? zzz : ''}${marks[k] === 'hat' ? hat : ''}</span>`).join('');
    return `<span class="w" data-i="${i}" data-type="${meta.type}"${meta.efter_diktat ? ' data-diktat="1"' : ''} role="button" tabindex="0" aria-label="${esc(t.w)}">${letters}</span>`;
  }).join('')}</div>`).join('');
}

// Pladsholder på FØR-laget: en neutral flade med stedets ikon. Billedbeskrivelsen indeholder ofte sætningens
// ord, så den vises kun med ?debug i adressen.
const neutralPh = (sted) => `<span class="cover-ph">${koeretoej(sted)}</span>`;

async function spreadPage(ctx, p, { tavleWord, m, tjek, fx, card }) {
  const id = ctx.storyId;
  const sammen = ctx.mode === 'sammen';
  const replik = /^–/.test(p.tekst);
  const foer = p.title ? billede(id, 'cover') : billede(id, `${p.nr}-foer`);
  const efter = p.title ? billede(id, 'cover') : billede(id, `${p.nr}-efter`);
  const minMs = antalBogstaver(p.tekst) * Number(state.settings.minSecPerLetter || 0.6) * 1000;
  const diktat = [...new Set(p.ord.filter((o) => o.efter_diktat).map((o) => o.ord.toLowerCase()))];
  // Tavlen står kun på opslaget lige efter kommandoen (hvor ordet er efter diktat) – ellers kunne han
  // sammenligne senere forekomster med tavlen i stedet for at afkode dem
  const showTavle = tavleWord && !p.title && diktat.length > 0;
  // Læs sammen: voksenteksten (og på titlen, kun i "Vi læser sammen", vejledningen til den voksne)
  const ls = laesSammen(id);
  const voksenTekst = ls && !p.title ? p.voksen : null;
  const vejledning = ls && p.title && sammen ? HISTORIER[id].voksen_vejledning : null;
  const venter = !!voksenTekst && !sammen; // "Jeg læser selv": Jeppe læser voksenteksten, før læsefingeren kommer
  // Skiltet i billedet: når kommandoordet er skrevet, står det PÅ billedets eget skilt (i FØR og/eller EFTER), så der
  // aldrig står et tomt skilt i scenen og et svævende skilt i hjørnet. Hjørneskiltet (med pind) står kun i LÆS, når
  // skiltet ikke er med i FØR-billedet, og det fader ud i BEKRÆFT, mens ordet dukker op på skiltet i billedet.
  const sib = (tavleWord && !p.title && m?.skiltIBilledet) || {};
  const iBilledet = (lag) => {
    const b = sib[`${p.nr}-${lag}`];
    return b ? `<span class="skilt-ord" aria-hidden="true" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%;font-size:${(b.h * 0.6).toFixed(2)}cqh">${esc(tavleWord)}</span>` : '';
  };
  const tavleCls = [ctx.sted === 'dinodal' ? 'skilt' : '', m?.tavlePos?.[p.nr] || '', sib[`${p.nr}-efter`] ? 'til-billedet' : ''].filter(Boolean).join(' ');
  // Tekst til den voksne ("Vi læser sammen"): samme ordlyd overalt
  const voksenNote = voksenTekst ? 'Læs din tekst. Vent. Står han fast: peg på første bogstav.' : 'Vent. Står han fast: peg på første bogstav.';

  ctx.stage.innerHTML = `<div class="story ${p.title ? 'is-title' : ''}" data-nr="${p.nr}">
    <div class="st-text ${replik ? 'replik' : ''}">
      <div class="st-body">
        ${voksenTekst && sammen ? `<div class="st-voksen" id="voksen">
          <div class="sv-head"><span class="adult-tag">Den voksne læser</span><button class="sv-play" id="voksen-play" aria-label="Læs min del">${ICON.play()}<span>Læs min del</span></button></div>
          <p class="sv-text">${esc(voksenTekst)}</p></div>` : ''}
        ${voksenTekst && !sammen ? `<div class="st-voksen solo" id="voksen">
          <button class="sv-play rund" id="voksen-play" aria-label="Hør igen">${ICON.hoejttaler()}</button>
          <p class="sv-text">${esc(voksenTekst)}</p></div>` : ''}
        ${vejledning ? `<div class="st-voksen vejl"><span class="adult-tag">Sådan læser I sammen</span><p class="sv-text">${esc(vejledning)}</p></div>` : ''}
        <div class="st-lines" id="lines">${textHtml(p.tekst, p.ord)}</div>
        ${sammen ? '' : `<div class="finger ${ctx.sted}${venter ? ' wait' : ''}" id="finger" role="button" tabindex="-1" aria-label="Læsefinger">${koeretoej(ctx.sted)}</div>`}
      </div>
      <div class="st-ctrl">${sammen
        ? `${vejledning ? '' : `<span class="adult-tag">Til den voksne</span><p class="adult-note">${voksenNote}</p>`}<button class="adult-btn" id="adult-selv">${ICON.check()}<span>Læst selv</span></button><button class="adult-btn soft" id="adult-hjaelp"><span>Med hjælp</span></button>`
        : `<button class="wake-btn" id="wake" aria-label="Vågn">${ICON.vaagn()}<span>Vågn</span></button>`}</div>
    </div>
    <div class="st-picwrap" id="picwrap">
      <div class="st-frame" id="frame">
        <div class="layer foer">${pic(foer, p.title ? 'Forsidebilledet' : `Billedet til opslag ${p.nr}`, 'scene', DEBUG ? null : neutralPh(ctx.sted))}${iBilledet('foer')}</div>
        <div class="layer efter">${pic(efter, p.title ? 'Forsidebilledet' : `Billedet til opslag ${p.nr}, vågent`, 'scene', DEBUG ? null : neutralPh(ctx.sted))}${iBilledet('efter')}</div>
        ${DEBUG && !p.title ? `<div class="debug-desc">FØR: ${esc(p.foer_billede)}<br>EFTER: ${esc(p.efter_billede)}</div>` : ''}
        <div class="veil"></div>
        <div class="fxlayer" aria-hidden="true"></div>
        ${showTavle && !sib[`${p.nr}-foer`] ? `<div class="tavle-mini${tavleCls ? ` ${tavleCls}` : ''}" aria-label="${ctx.sted === 'dinodal' ? 'Skiltet' : 'Tavlen'}: ${esc(tavleWord)}">${esc(tavleWord)}</div>` : ''}
      </div>
    </div>
    <div class="st-side">${nextBtn('Næste')}</div>
  </div>`;
  const root = ctx.stage;
  const lines = $('#lines', root);
  const frame = $('#frame', root);
  const words = $$('.w', lines);
  cur({ kind: 'opslag', nr: p.nr, phase: 'laes', mode: ctx.mode, minMs, ...(voksenTekst ? { voksen: true, ready: !venter } : {}) });
  let phase = 'laes';
  let helped = false;
  let t0 = performance.now();

  // ---- Voksenteksten: ▶ "Læs min del" (Jeppe), og i "Jeg læser selv" automatisk først ----
  const vEl = $('#voksen', root);
  const laesVoksen = async () => {
    vEl.classList.remove('kort');
    vEl.classList.add('reading');
    await say(voksenTekst);
    vEl.classList.remove('reading');
    if (!sammen && root.contains(vEl)) vEl.classList.add('kort'); // "Jeg læser selv": klappes sammen til 2 linjer
  };
  let voksenKlar = () => {};
  const klar = venter ? new Promise((r) => { voksenKlar = r; }) : Promise.resolve();
  // ▶ / højttaleren: hintet starter forfra, når Jeppe er færdig (og venter, mens han læser)
  if (voksenTekst) onClick($('#voksen-play', root), () => { claim(); laesVoksen().then(() => { voksenKlar(); if (!venter) armHint(); }); });
  if (venter) {
    instruct(async (ok) => { await laesVoksen(); voksenKlar(); if (!ok()) return; await say(laesTraek(ctx.sted)); }, voksenTekst);
  } else if (voksenTekst) {
    setInstruction(() => laesVoksen()); // "Vi læser sammen": den voksne læser selv; Bip "lyt igen" læser voksenteksten
  } else instruct(sammen ? TALE.laesKaptajn : laesTraek(ctx.sted));

  // ---- Hint efter 15 sek. uden aktivitet (afslører aldrig ordet) ----
  // Peger på første bogstav i det første ord, han ikke er nået til. Taler kun i "Jeg læser selv":
  // i "Vi læser sammen" er markeringen nok, og den voksne bliver ikke afbrudt.
  let hintTimer = null, hintEl = null;
  const hintClear = () => { hintEl?.classList.remove('hint'); hintEl = null; };
  const fireHint = () => {
    if (phase !== 'laes' || !ctx.alive()) return;
    if (words.some((w) => w.dataset.busy) || document.querySelector('.overlay') || vEl?.classList.contains('reading')) { armHint(); return; }
    const target = words.find((w) => !w.classList.contains('passed') && !w.classList.contains('asked')) || words[0];
    hintClear();
    hintEl = target?.querySelector('.lt') || null;
    hintEl?.classList.add('hint');
    if (window.__ll) window.__ll.hinted = (window.__ll.hinted || 0) + 1;
    if (!sammen) say(TALE.hvilkenLyd);
  };
  const armHint = (extra = 0) => { clearTimeout(hintTimer); if (phase === 'laes') hintTimer = setTimeout(fireHint, hintMs() + extra); };
  // Læs sammen: den voksne læser først sin del, så hintet venter så meget længere (ca. 55 ms pr. tegn, skaleret med testkrogen)
  if (!venter) armHint(voksenTekst ? Math.round((voksenTekst.length * 55 * hintMs()) / 15000) : 0);

  // ---- Tryk på et ord = hjælp ----
  // L-ord: bogstaverne lyser og siger deres lyd én ad gangen; tidligst 3 sek. efter giver et nyt tryk helordet.
  // Et nyt tryk (også på et andet ord) stopper den igangværende ordhjælp, og intet fortsætter ind i BEKRÆFT.
  const lydAt = new Map();
  let helpRun = 0;
  words.forEach((el) => onTap(el, async () => {
    if (phase !== 'laes') return;
    armHint();
    hintClear();
    const my = ++helpRun;
    const ok = claim();
    const live = () => phase === 'laes' && my === helpRun && ok() && ctx.alive();
    $$('.lt.lit', lines).forEach((lt) => lt.classList.remove('lit'));
    words.forEach((w) => delete w.dataset.busy);
    const i = Number(el.dataset.i);
    const meta = p.ord[i] || {};
    const word = meta.ord || $$('.lt', el).map((lt) => lt.firstChild.textContent).join('');
    const extra = { story: ctx.storyId, nr: p.nr, s: 0, ...(meta.efter_diktat ? { efter_diktat: true } : {}) };
    helped = true;
    if (el.dataset.type === 'H') { // drilleord: helordet med hat/zzz-markeringen
      el.classList.add('asked');
      log('ord-hjaelp', word, 'fik ordet', extra);
      await playWord(word);
      return;
    }
    const last = lydAt.get(i);
    if (last && performance.now() - last >= 3000) { // tidligst 3 sek. efter lydene: helordet
      el.classList.add('asked');
      log('ord-hjaelp', word, 'fik ordet', extra);
      await playWord(word);
      return;
    }
    if (last) return; // for tidligt til helordet: intet sker
    el.dataset.busy = '1';
    const lts = $$('.lt', el);
    for (const [k, lt] of lts.entries()) {
      if (!live()) break;
      lt.classList.add('lit');
      await playLetter(word[k], { anchor: lt });
    }
    if (live()) await sleep(200);
    lts.forEach((lt) => lt.classList.remove('lit'));
    if (my === helpRun) delete el.dataset.busy;
    lydAt.set(i, performance.now());
    log('ord-hjaelp', word, 'lyde', extra);
  }));

  // ---- Hvad vækker billedet? ----
  let stopFinger = () => {};
  const how = await new Promise((resolve) => {
    if (sammen) {
      // Den voksnes "Læst selv" tæller kun som selv, når appen ikke har givet ordhjælp
      onClick($('#adult-selv', root), () => resolve({ how: helped ? 'hjaelp' : 'selv', voksen: 'selv' }));
      onClick($('#adult-hjaelp', root), () => resolve({ how: 'hjaelp', voksen: 'hjaelp' }));
    } else {
      const fast = { n: 0 };
      const tooFast = () => {
        fast.n++;
        log('laesefinger', `${ctx.storyId}#${p.nr}`, 'for hurtig', { s: 0 });
        if (fast.n >= 2) say(TALE.sigOrdeneHoejt);
      };
      // Vågn-knappen ser ens ud hele tiden. Et tryk før minimumstiden gør ingenting (og tæller som for hurtigt).
      // Mens Jeppe læser voksenteksten, gør den slet ingenting.
      let laesKlar = !venter;
      onClick($('#wake', root), () => {
        if (!laesKlar) return;
        if (performance.now() - t0 >= minMs) resolve({ how: helped ? 'hjaelp' : 'selv' });
        else tooFast();
      });
      klar.then(() => {
        if (phase !== 'laes' || !ctx.alive() || !root.contains(lines)) return;
        if (venter) {
          laesKlar = true;
          t0 = performance.now(); // LÆS-tiden og minimumstiden måles fra nu
          $('#finger', root).classList.remove('wait');
          cur({ kind: 'opslag', nr: p.nr, phase: 'laes', mode: ctx.mode, minMs, voksen: true, ready: true });
          armHint();
        }
        stopFinger = readingFinger({ root, lines, words, minMs, tooFast, onActivity: armHint, ctx, done: () => resolve({ how: helped ? 'hjaelp' : 'selv' }) });
      });
    }
  });
  stopFinger();
  clearTimeout(hintTimer);
  hintClear();
  phase = 'tjek';
  claim(); // ordhjælp og hint stopper her
  if (!ctx.alive()) return;
  const lasMs = Math.round(performance.now() - t0);
  markOpslag(ctx.storyId, p.nr, { how: how.how, mode: ctx.mode, diktat: diktat.length > 0, ...(how.voksen ? { voksen: how.voksen } : {}) });
  log('opslag', `${ctx.storyId}#${p.nr}`, how.how, {
    s: sammen ? 1 : 0, ms: lasMs, story: ctx.storyId, mode: ctx.mode,
    ...(how.voksen ? { voksen: how.voksen, appHjaelp: helped } : {}),
    ...(diktat.length ? { efter_diktat: diktat } : {}),
  });
  $('#finger', root)?.classList.add('gone');
  root.querySelector('.st-ctrl').classList.add('used');

  // ---- (TJEK) billedtjek ----
  if (tjek) {
    const layer = document.createElement('div');
    layer.className = 'tjek-layer';
    frame.appendChild(layer);
    const targetWords = tjek.ia.ord.toLowerCase().split(/\s+/);
    // Opgaven gælder ordet, ikke hele sætningen: målordet fremhæves i linjen, og resten dæmpes
    { let k = 0; for (const el of words) if (k < targetWords.length && el.textContent.toLowerCase() === targetWords[k]) { el.classList.add('tjek-ord'); k++; } }
    root.querySelector('.story').classList.add('tjekker');
    const ctrl = root.querySelector('.st-ctrl');
    if (sammen) { ctrl.innerHTML = '<span class="adult-tag">Til den voksne</span><p class="adult-note">Lad ham vælge selv. Sig ikke ordet.</p>'; ctrl.classList.remove('used'); }
    const hintLetters = () => {
      const out = [];
      let k = 0;
      for (const el of words) {
        if (k < targetWords.length && el.textContent.toLowerCase() === targetWords[k]) { out.push(...$$('.lt', el)); k++; }
      }
      return out;
    };
    await choosePicture(ctx, { word: tjek.ia.ord, billeder: tjek.billeder, rigtigt: tjek.rigtigt, act: 'tjek', hint: tjek.hint || lydering(tjek.ia.ord), target: layer, hintLetters, prompt: tjek.ia.appSiger || TALE.billedePasser });
    claim();
    layer.remove();
    root.querySelector('.story').classList.remove('tjekker');
    ctrl.classList.add('used');
    if (!ctx.alive()) return;
  }

  // ---- BEKRÆFT: låget løftes, sætningen læses op med ord-for-ord-fremhævning ----
  phase = 'bekraeft';
  cur({ kind: 'opslag', nr: p.nr, phase: 'bekraeft', mode: ctx.mode });
  root.querySelector('.story').classList.add('awake');
  frame.classList.add('awake');
  if (!reducedMotion() && fx.anim) frame.classList.add(`fx-${fx.anim}`);
  sfxSeq(p.title ? ['pling'] : fx.sfx || [], () => ctx.alive() && phase === 'bekraeft');
  let readP = null;
  if (!p.title) {
    const spoken = bekraeftTekst(p.tekst);
    const readAloud = () => say(spoken, { onWord: (i) => words.forEach((w, k) => w.classList.toggle('hl', k === i)) });
    readP = instruct(readAloud, spoken); // Bip "lyt igen" læser sætningen igen
  } else setInstruction(() => say(TALE.trykNaeste));
  if (card) cur({ kind: 'samtale' });
  await Promise.all([sleep(reducedMotion() ? 300 : 900), card ? readP : null]);
  if (!ctx.alive()) return;
  const next = $('#next', root);
  if (card) {
    await samtale(ctx, card); // efter oplæsningen: kortet til den voksne, så Næste
    if (!ctx.alive()) return;
    cur({ kind: 'opslag', nr: p.nr, phase: 'bekraeft', mode: ctx.mode });
  }
  next.hidden = false;
  await waitClick(next);
  phase = 'done';
  stopSpeech();
}

// ================= Læsefingeren ("Jeg læser selv") =================
// Bolden står under første linje. Barnet trækker den under linjen(e) i rækkefølge; ord får en svag streg, når
// den passerer. Billedet vågner, når alle ord er passeret OG minimumstiden er gået, målt fra fingeren begyndte at
// trække. Bolden kan ikke springe (højst ca. 1,5 ordbredde pr. bevægelse), og ord tæller kun i rækkefølge.
// For hurtig = intet sker (og forfra). Returnerer en oprydningsfunktion.
function readingFinger({ root, lines, words, minMs, tooFast, onActivity, ctx, done }) {
  const finger = $('#finger', root);
  const body = finger.parentElement;
  const lineEls = $$('.line', lines);
  let dragging = false, finished = false, dragT0 = null, lastX = null, touched = false;
  const passed = new Set();

  const geo = () => {
    const b = body.getBoundingClientRect();
    return lineEls.map((ln) => {
      const r = ln.getBoundingClientRect();
      const ws = $$('.w', ln).map((w) => { const q = w.getBoundingClientRect(); return { i: Number(w.dataset.i), cx: q.left + q.width / 2 - b.left, w: q.width }; });
      return { top: r.top - b.top, bottom: r.bottom - b.top, left: r.left - b.left, right: r.right - b.left, ws };
    });
  };
  const place = (x, y) => { finger.style.left = `${x}px`; finger.style.top = `${y}px`; };
  const home = () => {
    const g = geo()[0];
    if (g) place(g.left + 22, g.bottom - 4);
    lastX = null;
  };
  home();
  // Bolden følger layoutet (fx når skriften indlæses eller skærmen drejes)
  const ro = new ResizeObserver(() => { if (!dragging && !finished && finger.isConnected) home(); });
  ro.observe(lines);
  document.fonts?.ready.then(() => { if (!dragging && !finished && finger.isConnected) home(); });
  // Rører han ikke bolden, minder Bip ham om den efter 8 sek.
  const remind = setTimeout(() => { if (!touched && !finished && ctx.alive() && finger.isConnected) say(traek(ctx.sted)); }, 8000);

  const reset = () => {
    passed.clear();
    dragT0 = null;
    words.forEach((w) => w.classList.remove('passed'));
    home();
  };
  const tryWake = (released) => {
    if (finished) return;
    if (passed.size < words.length) return;
    if (dragT0 !== null && performance.now() - dragT0 >= minMs) {
      finished = true;
      cleanup();
      done();
    } else if (released) {
      tooFast();
      reset();
    }
  };

  finger.addEventListener('pointerdown', (e) => {
    if (finished) return;
    e.preventDefault();
    touched = true;
    try { finger.setPointerCapture(e.pointerId); } catch { /* */ }
    dragging = true;
    if (dragT0 === null) dragT0 = performance.now();
    finger.classList.add('drag');
    onActivity();
  });
  finger.addEventListener('pointermove', (e) => {
    if (!dragging || finished) return;
    onActivity();
    const b = body.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    const g = geo();
    // Linjen: kun den næste linje, der har ord tilbage (eller en tidligere), kan bruges
    const nextI = passed.size;
    const allowed = g.findIndex((ln) => ln.ws.some((w) => w.i >= nextI));
    let li = 0, best = Infinity;
    g.forEach((ln, k) => { const d = Math.abs(y - (ln.bottom - 4)); if (d < best && (allowed < 0 || k <= allowed)) { best = d; li = k; } });
    const ln = g[li];
    let cx = Math.max(ln.left + 10, Math.min(ln.right + 10, x));
    // Intet spring: højst ca. 1,5 ordbredde (dog mindst 60 px, højst 120 px) pr. bevægelse
    const avgW = ln.ws.reduce((s, w) => s + w.w, 0) / Math.max(1, ln.ws.length);
    const maxStep = Math.max(60, Math.min(120, avgW * 1.5));
    if (lastX !== null && lastX.li === li && cx - lastX.x > maxStep) cx = lastX.x + maxStep;
    lastX = { x: cx, li };
    place(cx, ln.bottom - 4);
    // Ord tæller kun i rækkefølge
    for (const w of ln.ws) {
      if (w.i === passed.size && cx >= w.cx) { passed.add(w.i); words[w.i].classList.add('passed'); }
    }
    tryWake(false);
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    finger.classList.remove('drag');
    tryWake(true);
  };
  finger.addEventListener('pointerup', up);
  // Et systemgreb (pointercancel) er ikke "for hurtigt": bolden går bare hjem
  finger.addEventListener('pointercancel', () => { if (!dragging) return; dragging = false; finger.classList.remove('drag'); reset(); });
  function cleanup() { ro.disconnect(); clearTimeout(remind); }
  return () => { finished = true; cleanup(); };
}

// ================= Kaptajnens kommando =================

async function kommando(ctx, ia, cfg) {
  const tavle = ctx.sted === 'rumbase' ? 'Tavlen ved rampen' : ctx.sted === 'dinodal' ? 'Skiltepinden' : 'Taktiktavlen';
  ctx.stage.innerHTML = `<div class="act act-kommando">
    <div class="kmd">
      <div class="kmd-board${ctx.sted === 'dinodal' ? ' skilt' : ''}" aria-label="${tavle}"><div class="builder-host" id="host"></div></div>
    </div>
    <div class="act-side"><button class="say-btn" id="again">${ICON.hoejttaler()}<span>Hør igen</span></button>
      ${ctx.mode === 'sammen' ? '<p class="adult-note kmd-voksen"><span class="adult-tag">Til den voksne</span><br>Lad ham finde bogstaverne selv.</p>' : ''}
      ${nextBtn()}</div>
  </div>`;
  onClick($('#again', ctx.stage), () => { claim(); say(ia.appSiger); });
  await buildWord(ctx, $('#host', ctx.stage), { ord: ia.ord, trin1: cfg.trin1 || [ia.ord[0]], lokkere: cfg.lokkere || [], act: 'kommando', tavle: true, ask: () => say(ia.appSiger), askText: ia.appSiger });
  if (!ctx.alive()) return;
  // Lille reaktion med det samme – konsekvensen kommer først i BEKRÆFT
  sfx(cfg.reaktion || 'pling'); // kridtet "skrrt", lugen "pling", skiltepinden "tok"
  $('.kmd-board', ctx.stage).classList.add('written');
  cur({ kind: 'kommando-faerdig' });
  const next = $('#next', ctx.stage);
  next.hidden = false;
  await waitClick(next);
}

// ================= Tryk på ordet (R1 opslag 5) =================

async function trykPaaOrdet(ctx, ia, word) {
  ctx.stage.innerHTML = `<div class="act act-tryk">
    <div class="kmd"><div class="kmd-board written${ctx.sted === 'dinodal' ? ' skilt' : ''}"><button class="tavle-word" id="tavle-word" aria-label="Ordet på tavlen">${esc(word)}</button></div></div>
  </div>`;
  cur({ kind: 'tryk-ordet' });
  instruct(ia.appSiger);
  const el = $('#tavle-word', ctx.stage);
  await new Promise((res) => onTap(el, () => res()));
  claim(); // ordet lyser, men appen siger det ikke
  el.classList.add('glow');
  log('tryk-ordet', word, 'trykket', { s: 0, story: ctx.storyId });
  await sleep(1100);
}

// ================= Samtalekort (kun "Vi læser sammen", første læsning) =================
// Kortet ligger i tekstfeltet, så EFTER-billedet står frit i fuld farve, mens I taler om det.
// Ingen lyd, mens I taler: Bip "lyt igen" er tavs, og Næste er skjult, til den voksne trykker Videre.

async function samtale(ctx, q) {
  stopSpeech();
  setInstruction(() => Promise.resolve());
  const host = ctx.stage.querySelector('.st-text') || ctx.stage;
  const o = document.createElement('div');
  o.className = 'talk';
  o.innerHTML = `<div class="talk-card" role="dialog" aria-label="Samtalekort til den voksne">
    <div class="talk-txt"><span class="adult-tag">Til den voksne · samtalekort</span>
    <p class="talk-q">${esc(q)}</p>
    <p class="talk-note">Ingen lyd, mens I taler. Tryk videre, når I er klar.</p></div>
    <button class="big-btn" id="talk-next">Videre</button></div>`;
  host.appendChild(o);
  cur({ kind: 'samtale' });
  await waitClick($('#talk-next', o));
  o.remove();
  setInstruction(() => say(TALE.trykNaeste));
}

// ================= Slut: efterscene, "Vidste du det?", "Godt læst, kaptajn!" =================

export async function ending(ctx) {
  const h = HISTORIER[ctx.storyId];
  const m = MISSIONER[ctx.storyId];
  // 1. Efterscene uden ord (ca. 3 sek.)
  ctx.stage.innerHTML = `<div class="ending efter"><div class="efterscene">${pic(billede(ctx.storyId, 'efterscene'), 'Efterscenen', 'scene', DEBUG ? null : neutralPh(ctx.sted))}</div></div>`;
  cur({ kind: 'efterscene' });
  claim();
  sfxSeq({ rumbase: ['bump', 'snork'], dinodal: ['vinge', 'pip'] }[ctx.sted] || ['swoosh', 'hm'], () => ctx.alive());
  await sleep(reducedMotion() ? 1500 : 3200);
  if (!ctx.alive()) return;

  // 2. "Vidste du det?" – én fakta-sætning som lyd
  const { who, fact } = vidsteDel(h.vidste_du);
  ctx.stage.innerHTML = `<div class="ending vidste">
    <div class="vd-card">${icon({ Bip: 'bip', Tuba: 'tuba' }[who] || 'floejte', 'vd-host')}
      <div><h2>Vidste du det?</h2><p class="vd-text">${esc(fact)}</p><p class="vd-who">${esc(who ? `${who} siger det.` : '')}</p></div></div>
    <div class="act-side"><button class="say-btn" id="again">${ICON.hoejttaler()}<span>Hør igen</span></button>${nextBtn().replace(' hidden', '')}</div>
  </div>`;
  cur({ kind: 'vidste' });
  instruct(vidsteDu(fact));
  onClick($('#again', ctx.stage), () => instruct(vidsteDu(fact)));
  await waitClick($('#next', ctx.stage));
  if (!ctx.alive()) return;

  // 3. Godt læst + det analoge forslag. Detaljen gemmes, og historien er læst. Ingen "spil videre", ingen fanfare.
  const read = state.dut.read[ctx.storyId] || { n: 0 };
  state.dut.read[ctx.storyId] = { n: read.n + 1, last: new Date().toISOString() };
  if (m.detalje && !state.dut.details.includes(m.detalje.id)) state.dut.details.push(m.detalje.id);
  save({ now: true });
  const hold = STEDER[ctx.sted]?.hold;
  ctx.stage.innerHTML = `<div class="ending godt">
    <div class="godt-card">
      <div class="godt-top">
        ${hold ? pic(hold, 'Holdet jubler', 'godt-team') : ''}
        ${icon(m.detalje?.icon || 'stjerne', 'godt-detail')}
      </div>
      <h1>Godt læst, kaptajn!</h1>
      <p class="forslag">${esc(h.analogt_forslag)}</p>
      <button class="big-btn home" id="home">${ICON.dut()}<span>Tilbage til Dut</span></button>
    </div>
  </div>`;
  cur({ kind: 'slut' });
  instruct(godtLaest(h.analogt_forslag));
  await waitClick($('#home', ctx.stage));
  stopSpeech();
  ctx.finish('dut');
}
