// Missionens aktiviteter: Lydjagt, Hvilken lyd?, Sig det selv, sove-ægget, Glidebanen, Læs og vælg og Byg ordet.
// Hver aktivitet tegner i ctx.stage og afsluttes (Promise), når barnet er færdigt.
// Der er aldrig en "forkert"-lyd; et forkert valg giver et lyd-hint. Valg i Læs og vælg giver ingen sjov effekt.
// Tryk-handlere bruger claim() (afbryd det, der tales, og stop kæden, når et nyere tryk kommer) og en
// settled-vagt, så et gammelt forkert-hint aldrig taler videre efter et rigtigt svar eller på næste skærm.
import { ORDBOG, DRILLEORD, lydtype, lydering, antalBogstaver } from './content.js?v=6f70bf5933';
import { state, log } from './store.js?v=6f70bf5933';
import { say, playLetter, playWord, hasLydering, playLydering, hasRec, hasLetterClip, hasLetterSound, letterMs, sfx, claim } from './audio.js?v=6f70bf5933';
import { ICON, icon, wordPic, instruct, bubble, onTap, onClick, koeretoej, koeretoejNavn } from './ui.js?v=6f70bf5933';
import { TALE, findBogstav, ordOgRos, skub } from './tale.js?v=6f70bf5933';
import { $, $$, esc, shuffle, shuffleNot, sleep, reducedMotion } from './util.js?v=6f70bf5933';

const cur = (o) => { if (window.__ll) window.__ll.cur = o; };
const ROS = TALE.ros;
let rosI = 0;
const ros = () => ROS[rosI++ % ROS.length];

// Vent på et klik på en knap (og ryd op bagefter)
export function waitClick(el) {
  return new Promise((res) => onClick(el, () => res()));
}

const pips = (n, k) => `<div class="act-foot side">${Array.from({ length: n }, (_, j) => `<span class="pip ${j < k ? 'done' : j === k ? 'cur' : ''}"></span>`).join('')}</div>`;
const nextBtn = (label = 'Videre') => `<button class="big-btn next" id="next" hidden><span>${label}</span><span class="ico flip" aria-hidden="true">${ICON.tilbage()}</span></button>`;
export { nextBtn };

// Bogstav som spiller (Stadion: trøje), stjerne (Rumbasen) eller æg (Dino-dalen: bogstav-æggene i Stjernereden)
function holder(b, sted) {
  const shape = sted === 'rumbase'
    ? `<svg viewBox="0 0 120 120" aria-hidden="true"><polygon points="60,6 75,42 114,44 84,70 94,110 60,88 26,110 36,70 6,44 45,42" fill="#ffd86b" stroke="#2b2a33" stroke-width="4" stroke-linejoin="round"/></svg>`
    : sted === 'dinodal'
    ? `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 6 C30 6 14 60 16 80 C18 104 38 116 60 116 C82 116 102 104 104 80 C106 60 90 6 60 6Z" fill="#fff6dc" stroke="#2b2a33" stroke-width="4"/><circle cx="34" cy="50" r="5" fill="#cfe3b0"/><circle cx="88" cy="44" r="4" fill="#e9c98a"/><circle cx="92" cy="92" r="6" fill="#cfe3b0"/><circle cx="28" cy="96" r="4" fill="#e9c98a"/></svg>`
    : `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M40 12 L20 20 L4 46 L24 58 L30 50 V112 H90 V50 L96 58 L116 46 L100 20 L80 12 Q60 30 40 12Z" fill="#ffd24a" stroke="#2b2a33" stroke-width="4" stroke-linejoin="round"/><path d="M40 12 Q60 30 80 12" fill="none" stroke="#2b2a33" stroke-width="4"/></svg>`;
  return `<span class="holder ${sted}">${shape}<span class="hl-letter">${esc(b)}</span></span>`;
}

// ================= Opvarmning =================

// Lydjagt: lyd → bogstav. Lyden er forælderens optagelse eller Jeppes bogstavlyd (public/lyd/bogstav/).
// Kun hvis ingen af dem findes, kan appen ikke sige lyden, og den må ikke vise bogstavet (så bliver opgaven
// visuel matching). Derfor i nødstilfælde: "Vi læser sammen" → den voksne siger lyden (lille kort til den voksne);
// "Jeg læser selv" → bogstavets navn, logget som navn og ikke som bevis for lyd.
export async function lydjagt(ctx) {
  const rounds = ctx.mission.opvarmning.lydjagt;
  for (const [r, runde] of rounds.entries()) {
    if (!ctx.alive()) return;
    const l = runde.lyd;
    const kilde = hasRec(`lyd:${l}`) ? 'optagelse' : hasLetterClip(l) ? 'klip' : ctx.mode === 'sammen' ? 'voksen' : 'navn';
    const valg = shuffle(runde.valg);
    ctx.stage.innerHTML = `<div class="act act-lydjagt">
      <div class="act-head">${icon('bip', 'head-bip')}<button class="sound-btn" id="hear" aria-label="Hør igen">${ICON.hoejttaler()}</button>
        ${kilde === 'voksen' ? `<div class="adult-box inline"><span class="adult-tag">Til den voksne</span><p class="adult-note">Sig lyden <b>/${esc(l.repeat(lydtype(l) === 'lang' ? 3 : 1))}/</b> (ikke bogstavets navn).</p></div>` : ''}</div>
      <div class="choices">${valg.map((b) => `<button class="choice letter-choice" data-v="${b}" aria-label="Bogstavet ${b}">${holder(b, ctx.sted)}</button>`).join('')}</div>
      <div class="act-foot">${rounds.map((_, k) => `<span class="pip ${k < r ? 'done' : k === r ? 'cur' : ''}"></span>`).join('')}</div>
    </div>`;
    cur({ kind: 'lydjagt', answer: l, kilde });
    const ask = () => {
      if (kilde === 'optagelse' || kilde === 'klip') {
        return instruct(async (ok) => {
          await say(TALE.hoer); if (!ok()) return;
          await playLetter(l, { visual: false }); if (!ok()) return;
          await say(TALE.hvilketBogstav);
        }, 'Hvilket bogstav siger lyden? Tryk på det.');
      }
      if (kilde === 'voksen') return instruct(TALE.hoerVoksne);
      return instruct(findBogstav(l));
    };
    ask();
    onClick($('#hear', ctx.stage), () => ask());
    const t0 = performance.now();
    let first = true, settled = false;
    const act = kilde === 'navn' ? 'bogstavnavn' : 'lydjagt';
    await new Promise((done) => {
      $$('.choice', ctx.stage).forEach((el) => onTap(el, async () => {
        if (settled) return;
        const ok = claim();
        const v = el.dataset.v;
        if (first) log(act, l, v === l ? 'rigtigt' : 'forkert', { s: kilde === 'navn' ? 0 : 1, kilde, ...(v !== l ? { valgt: v } : {}), ms: Math.round(performance.now() - t0) });
        first = false;
        if (v === l) {
          settled = true;
          el.classList.add('ok');
          $$('.choice', ctx.stage).forEach((c) => { c.disabled = true; });
          await say(ros());
          if (ctx.alive()) done();
        } else {
          el.classList.add('dimmed');
          await playLetter(v, { anchor: el }); // et forkert tryk siger bare sin egen lyd
          if (!ok() || settled) return;
          await sleep(250);
          if (!ok() || settled || !ctx.alive()) return;
          if (kilde === 'optagelse' || kilde === 'klip') { await say(TALE.hoerIgen); if (!ok() || settled) return; await playLetter(l, { visual: false }); } else ask();
        }
      }));
    });
    await sleep(250);
  }
}

export async function hvilkenLyd(ctx) {
  const cfg = ctx.mission.opvarmning.hvilkenLyd;
  const billeder = shuffle(cfg.billeder);
  ctx.stage.innerHTML = `<div class="act act-hvilken">
    <div class="big-letter-card" aria-label="Bogstavet ${cfg.bogstav}"><span>${esc(cfg.bogstav)}</span></div>
    <div class="choices pics">${billeder.map((id) => `<button class="choice pic-choice" data-v="${id}" aria-label="${esc(ORDBOG[id].alt)}">${wordPic(id)}</button>`).join('')}</div>
  </div>`;
  cur({ kind: 'hvilken', answer: cfg.rigtigt });
  instruct(TALE.hvilketBillede);
  const t0 = performance.now();
  let first = true, settled = false;
  await new Promise((done) => {
    $$('.choice', ctx.stage).forEach((el) => onTap(el, async () => {
      if (settled) return;
      const ok = claim();
      const v = el.dataset.v;
      if (first) log('hvilken-lyd', cfg.bogstav, v === cfg.rigtigt ? 'rigtigt' : 'forkert', { s: 1, valgt: v, ms: Math.round(performance.now() - t0) });
      first = false;
      if (v === cfg.rigtigt) {
        settled = true;
        el.classList.add('ok');
        $$('.choice', ctx.stage).forEach((c) => { c.disabled = true; });
        await say(ordOgRos(ORDBOG[v].ord, ros()));
        if (ctx.alive()) done();
      } else {
        el.classList.add('dimmed');
        await say(ORDBOG[v].ord); // billedet siger bare sit eget navn
        if (!ok() || settled) return;
        await say(TALE.proevAndet);
      }
    }));
  });
  await sleep(250);
}

export async function sigSelv(ctx) {
  const b = ctx.mission.opvarmning.sigSelv;
  const sammen = ctx.mode === 'sammen';
  ctx.stage.innerHTML = `<div class="act act-sig">
    <div class="sig-wrap">
      <span class="sig-bip" aria-hidden="true">${ICON.bip()}<span class="sig-mouth"></span></span>
      <button class="big-letter-card roll" id="say-letter" aria-label="Hør lyden"><span>${esc(b)}</span><span class="ear-badge" aria-hidden="true">${ICON.hoejttaler()}</span></button>
    </div>
    <div class="act-side">
      ${sammen ? `<div class="adult-box"><span class="adult-tag">Til den voksne</span><button class="adult-btn" id="adult-ok">${ICON.check()}<span>Sagt rigtigt</span></button></div>` : ''}
      ${nextBtn()}
    </div>
  </div>`;
  cur({ kind: 'sig', letter: b });
  instruct(TALE.sigLyden);
  const next = $('#next', ctx.stage); // referencer, ikke opslag: et sent svar må aldrig ramme næste skærms knap
  const card = $('#say-letter', ctx.stage);
  onTap(card, async () => { claim(); await playLetter(b, { anchor: card }); next.hidden = false; });
  if (sammen) {
    onClick($('#adult-ok', ctx.stage), (e) => {
      const btn = e.currentTarget;
      if (btn.classList.contains('on')) return;
      btn.classList.add('on');
      log('sig-selv', b, 'rigtigt', { s: 1, af: 'voksen' });
      next.hidden = false;
    });
  }
  await waitClick(next);
}

// ================= Nyt: sove-ægget =================

// Et ord med drillemærker: o med å-hat, g der sover
export function drilleOrd(word) {
  const marks = DRILLEORD[word.toLowerCase()] || {};
  return [...word].map((c, i) => `<span class="lt ${marks[i] || ''}">${esc(c)}${marks[i] === 'sover' ? '<span class="zzz" aria-hidden="true">z<i>z</i><b>z</b></span>' : ''}${marks[i] === 'hat' ? '<span class="hat" aria-hidden="true"></span>' : ''}</span>`).join('');
}

// Sætning med drilleordet markeret (til sove-æggets små sætninger)
function saetningHtml(s) {
  return s.split(/(\s+)/).map((tok) => {
    const m = tok.match(/^([A-Za-zÆØÅæøå]+)(.*)$/);
    if (!m) return esc(tok);
    const drille = DRILLEORD[m[1].toLowerCase()];
    return `<span class="w ${drille ? 'drille' : ''}" data-ord="${esc(m[1])}">${drille ? drilleOrd(m[1]) : esc(m[1])}</span>${esc(m[2])}`;
  }).join('');
}

export async function soveAeg(ctx) {
  const nyt = ctx.mission.nyt;
  ctx.stage.innerHTML = `<div class="act act-aeg">
    <div class="egg-scene">
      <div class="egg" id="egg"><span class="egg-half top">${ICON.aeg()}</span><span class="egg-half bot">${ICON.aeg()}</span></div>
      <button class="drille-word" id="drille" hidden aria-label="Hør ordet">${drilleOrd(nyt.ord)}</button>
    </div>
    <div class="act-side">${nextBtn()}</div>
  </div>`;
  cur({ kind: 'aeg' });
  const egg = $('#egg', ctx.stage);
  await sleep(reducedMotion() ? 50 : 900); // ægget lander
  if (!ctx.alive()) return;
  egg.classList.add('wobble');
  await sleep(reducedMotion() ? 50 : 700);
  if (!ctx.alive()) return;
  // (ingen effektlyd her: effekter hører til BEKRÆFT, efterscenen og forsiden)
  egg.classList.add('cracked');
  await sleep(reducedMotion() ? 50 : 500);
  if (!ctx.alive()) return;
  let heard = false;
  const next = $('#next', ctx.stage), drille = $('#drille', ctx.stage);
  onTap(drille, async () => {
    claim(); // Bips forklaring stopper, og ordet siges med det samme
    if (!heard) { heard = true; log('nyt', nyt.ord, 'hoert', { s: 0 }); next.hidden = false; }
    await playWord(nyt.ord);
  });
  drille.hidden = false;
  await instruct(nyt.bip);
  if (!heard && ctx.alive()) instruct(TALE.trykOrdet);
  await waitClick(next);

  // Så læser han det selv i to små sætninger fra historien
  for (const [i, s] of nyt.saetninger.entries()) {
    if (!ctx.alive()) return;
    await readSentence(ctx, s, i);
  }
}

// Én lille sætning: voksenknapper i "Vi læser sammen", vågn-knap i "Jeg læser selv".
// Vågn-knappen ser ens ud hele tiden (intet skjult ur); et tryk før minimumstiden gør ingenting.
// Sætningen læses IKKE op bagefter: han møder den igen i historien og skal afkode den dér, ikke huske den.
async function readSentence(ctx, s, i) {
  const sammen = ctx.mode === 'sammen';
  const minMs = antalBogstaver(s) * Number(state.settings.minSecPerLetter || 0.6) * 1000;
  ctx.stage.innerHTML = `<div class="act act-saetning">
    <div class="sentence-card"><p class="sentence">${saetningHtml(s)}</p></div>
    <div class="act-side">${sammen
      ? `<div class="adult-box"><span class="adult-tag">Til den voksne</span><p class="adult-note">Vent. Peg på første bogstav.</p><button class="adult-btn" id="adult-selv">${ICON.check()}<span>Læst selv</span></button><button class="adult-btn soft" id="adult-hjaelp"><span>Med hjælp</span></button></div>`
      : `<button class="wake-btn" id="wake" aria-label="Vågn">${ICON.vaagn()}<span>Vågn</span></button>`}</div>
  </div>`;
  cur({ kind: 'saetning', i, minMs });
  instruct(i === 0 ? TALE.laesSelv : TALE.ogDenHer);
  let helped = false;
  $$('.drille', ctx.stage).forEach((el) => onTap(el, () => { claim(); helped = true; playWord(el.dataset.ord); }));
  const t0 = performance.now();
  if (sammen) {
    const how = await new Promise((res) => {
      onClick($('#adult-selv', ctx.stage), () => res('selv'));
      onClick($('#adult-hjaelp', ctx.stage), () => res('hjaelp'));
    });
    const res = how === 'selv' && !helped ? 'rigtigt' : 'hjaelp';
    log('nyt-saetning', s, res, { s: 1, af: 'voksen', voksen: how, appHjaelp: helped });
  } else {
    const w = $('#wake', ctx.stage);
    let tooFast = 0;
    await new Promise((res) => onClick(w, () => {
      if (performance.now() - t0 >= minMs) { res(); return; }
      tooFast++;
      log('laesefinger', s, 'for hurtig', { s: 0 });
      if (tooFast >= 2) say(TALE.sigOrdeneHoejt);
    }));
    log('nyt-saetning', s, helped ? 'hjaelp' : 'selv', { s: 0 });
  }
  claim();
}

// ================= Dagens ord: Glidebanen =================

export async function glidebane(ctx) {
  for (const [k, g] of ctx.mission.dagensOrd.glide.entries()) {
    if (!ctx.alive()) return;
    await glideOne(ctx, g, k);
  }
}


async function glideOne(ctx, g, k) {
  const letters = [...g.ord];
  const n = ctx.mission.dagensOrd.glide.length;
  // Billedet vises ikke for et ord, hvis billede er med i dagens Læs og vælg: ellers kan billedvalget løses
  // ved at genkende "det billede, jeg lige så" i stedet for at læse (princip 8)
  const lvPics = new Set(ctx.mission.dagensOrd.laesVaelg.flatMap((o) => o.billeder));
  const visBillede = !lvPics.has(g.billede);
  ctx.stage.innerHTML = `<div class="act act-glide">
    <div class="glide-wrap" id="gwrap">
      <div class="gword ${g.navnekort ? 'namecard' : ''}">${g.navnekort ? '<span class="nc-tag" aria-hidden="true">navnekort</span>' : ''}${letters.map((b, i) => `<span class="gl ${lydtype(b)}" data-i="${i}">${esc(b)}</span>`).join('')}</div>
      <div class="track" id="track"><span class="track-line"></span><div class="veh ${ctx.sted}" id="veh" role="button" tabindex="0" aria-label="Skub ${koeretoejNavn(ctx.sted)}">${koeretoej(ctx.sted)}</div></div>
      <div class="glide-reveal ${visBillede ? '' : 'none'}" id="reveal" hidden>${visBillede ? wordPic(g.billede) : ''}</div>
    </div>
    <div class="act-side">
      <button class="say-btn" id="say-word" hidden>${ICON.hoejttaler()}<span>Hør ordet</span></button>
      ${nextBtn()}
    </div>
    ${pips(n, k)}
  </div>`;
  cur({ kind: 'glide', word: g.ord });
  instruct(skub(ctx.sted));

  const track = $('#track', ctx.stage), veh = $('#veh', ctx.stage);
  const wrap = $('#gwrap', ctx.stage);
  wrap.style.width = `${wrap.offsetWidth}px`; // sporet følger ordets bredde og krymper ikke, når bogstaverne samles
  const gls = $$('.gl', ctx.stage);
  const lit = new Set();
  let queue = Promise.resolve();
  let finished = false, auto = false;
  let resolveGlide;
  const glided = new Promise((r) => { resolveGlide = r; });

  const centers = () => {
    const tr = track.getBoundingClientRect();
    return gls.map((el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2 - tr.left; });
  };
  const vehHalf = () => veh.getBoundingClientRect().width / 2;
  const maxX = () => track.getBoundingClientRect().width - vehHalf() * 2;
  const setX = (x) => { veh.style.left = `${Math.max(0, Math.min(maxX(), x))}px`; };

  const light = (i, withSound = true) => {
    if (lit.has(i)) return;
    lit.add(i);
    const el = gls[i];
    el.classList.add('lit');
    if (lydtype(letters[i]) === 'hop') { veh.classList.remove('hopping'); void veh.offsetWidth; veh.classList.add('hopping'); }
    if (withSound) queue = queue.then(() => (ctx.alive() ? playLetter(letters[i], { anchor: el }) : null));
    if (lit.size === letters.length && !finished) {
      finished = true;
      queue.then(() => resolveGlide());
    }
  };
  const check = (x) => { const c = centers(), h = vehHalf(); c.forEach((cx, i) => { if (x + h >= cx - 4) light(i); }); };

  // Træk med fingeren
  let drag = null;
  veh.addEventListener('pointerdown', (e) => {
    if (auto || finished) return;
    e.preventDefault();
    veh.classList.add('moved');
    try { veh.setPointerCapture(e.pointerId); } catch { /* */ }
    const tr = track.getBoundingClientRect();
    drag = { x0: e.clientX, left: veh.getBoundingClientRect().left - tr.left, moved: false };
    sfx('tap');
  });
  veh.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (!drag.moved) return;
    const x = drag.left + dx;
    setX(x);
    check(Math.max(0, Math.min(maxX(), x)));
  });
  const end = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved && !finished) autoGlide();
  };
  veh.addEventListener('pointerup', end);
  veh.addEventListener('pointercancel', () => { drag = null; });
  veh.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !finished) { e.preventDefault(); autoGlide(); } });

  // Tryk-alternativ: appen glider ordet langsomt. Bolden kører hen til første bogstav; derefter lyder hvert
  // bogstav, MENS bolden glider videre til det næste, så lydene hænger sammen ("lllløøøøb") uden pauser imellem.
  // Med forælderens lydering (optagelse) spiller den, og bogstaverne lyser bare i takt.
  async function autoGlide() {
    if (auto) return;
    auto = true;
    veh.classList.add('auto', 'moved');
    const recorded = hasLydering(g.ord);
    if (recorded) queue = queue.then(() => (ctx.alive() ? playLydering(g.ord) : null));
    const c = centers(), h = vehHalf();
    const rm = reducedMotion();
    const glid = (x, ms) => { veh.style.transitionDuration = `${rm ? 0 : ms}ms`; setX(x); return sleep(rm ? 120 : ms); };
    const skridt = (i) => (lydtype(letters[i]) === 'hop' ? 380 : 700);
    const rest = letters.map((_, i) => i).filter((i) => !lit.has(i));
    if (!rest.length) return;
    await glid(c[rest[0]] - h, skridt(rest[0]));
    for (const [k, i] of rest.entries()) {
      if (!ctx.alive()) return;
      light(i, !recorded);
      const last = k === rest.length - 1;
      const videre = last ? maxX() : c[rest[k + 1]] - h;
      if (recorded) await glid(videre, last ? 600 : skridt(rest[k + 1]));
      else await Promise.all([queue, glid(videre, Math.max(lydtype(letters[i]) === 'hop' ? 380 : 300, letterMs(letters[i])))]);
    }
  }

  await glided;
  if (!ctx.alive()) return;
  await sleep(300);
  if (!ctx.alive()) return;
  // "Nu dig!" – barnet siger ordet, og så kommer helordet og billedet
  const sayBtn = $('#say-word', ctx.stage);
  sayBtn.hidden = false;
  instruct(TALE.nuDig);
  await waitClick(sayBtn);
  if (!ctx.alive()) return;
  claim();
  $('#reveal', ctx.stage).hidden = false;
  $('.gword', ctx.stage).classList.add('whole');
  await playWord(g.ord);
  if (!ctx.alive()) return;
  log('glide', g.ord, auto ? 'tryk' : 'traek', { s: 0 });
  const next = $('#next', ctx.stage);
  next.hidden = false;
  await waitClick(next);
}

// ================= Læs og vælg =================

export async function laesVaelg(ctx) {
  for (const opg of ctx.mission.dagensOrd.laesVaelg) {
    if (!ctx.alive()) return;
    await choosePicture(ctx, { word: opg.ord, billeder: opg.billeder, rigtigt: opg.rigtigt, act: 'laes-vaelg', hint: lydering(opg.ord) });
  }
}

// Fælles for Læs og vælg og billedtjekket: ordet vises uden lyd, 3 billeder på tilfældige pladser.
// Ingen effekt ved valg. Fejl → "Hør: lll-øøø-b", og ordet glider. Ordet står allerede synligt, så boblen må vise det.
export async function choosePicture(ctx, { word, billeder, rigtigt, act, hint, target = null, hintLetters = null, prompt = TALE.laesOrdet }) {
  const root = target || ctx.stage;
  const order = shuffle(billeder);
  root.innerHTML = `<div class="act act-vaelg ${target ? 'in-story' : ''}">
    ${target ? '' : `<div class="read-word" id="read-word">${[...word].map((c) => `<span class="gl" data-c="${esc(c)}">${esc(c)}</span>`).join('')}</div>`}
    <div class="choices pics">${order.map((id) => `<button class="choice pic-choice" data-v="${id}" aria-label="Billede">${wordPic(id)}</button>`).join('')}</div>
  </div>`;
  cur({ kind: act, answer: rigtigt });
  instruct(prompt);
  const t0 = performance.now();
  let first = true, settled = false;
  let hintRun = 0; // et nyt tryk afbryder et igangværende lyd-hint
  await new Promise((done) => {
    $$('.choice', root).forEach((el) => onTap(el, async () => {
      if (settled) return;
      const v = el.dataset.v;
      const my = ++hintRun;
      const ok = claim();
      const live = () => my === hintRun && !settled && ok() && ctx.alive();
      if (first) log(act, word, v === rigtigt ? 'rigtigt' : 'forkert', { s: 1, valgt: v, ms: Math.round(performance.now() - t0), story: ctx.storyId });
      first = false;
      if (v === rigtigt) {
        settled = true;
        el.classList.add('picked');
        $$('.choice', root).forEach((c) => { c.disabled = true; });
        await sleep(450);
        done();
      } else {
        el.classList.add('dimmed');
        const els = hintLetters ? hintLetters() : $$('.gl', root.querySelector('#read-word') || root);
        bubble(`Hør: ${hint}`, 2600, els[0] || null);
        await say(TALE.hoer);
        if (!live()) return;
        await glideLetters(els, word, live);
      }
    }));
  });
}

// Lad bogstaverne i et ord lyse og sige deres lyd én ad gangen (lyd-hint). els = bogstav-elementerne (kan være tom)
export async function glideLetters(els, word, alive = () => true, { visual = true } = {}) {
  const letters = [...word].filter((c) => /[a-zæøå]/i.test(c));
  els = els || [];
  for (const [i, c] of letters.entries()) {
    if (!alive()) break;
    els[i]?.classList.add('lit');
    await playLetter(c, { visual, anchor: els[i] || null });
  }
  if (alive()) await sleep(300);
  els.forEach((e) => e.classList.remove('lit'));
}

// ================= Byg ordet (og kaptajnens kommando) =================

const ordbogId = (ord) => Object.keys(ORDBOG).find((k) => !ORDBOG[k].draw && ORDBOG[k].ord.toLowerCase() === ord.toLowerCase())
  || Object.keys(ORDBOG).find((k) => ORDBOG[k].ord.toLowerCase() === ord.toLowerCase());

export async function bygOrdet(ctx) {
  const list = ctx.mission.dagensOrd.byg;
  for (const [k, b] of list.entries()) {
    if (!ctx.alive()) return;
    const id = ordbogId(b.ord) || (b.ord === 'ti' ? 'ti-stjerner' : null);
    ctx.stage.innerHTML = `<div class="act act-byg"><div class="builder-host" id="host"></div>
      <div class="act-side">${id ? `<div class="byg-pic">${wordPic(id)}</div>` : ''}<button class="say-btn" id="again">${ICON.hoejttaler()}<span>Hør ordet</span></button></div>
      ${pips(list.length, k)}</div>`;
    onClick($('#again', ctx.stage), () => { claim(); playWord(b.ord); });
    await buildWord(ctx, $('#host', ctx.stage), { ...b, act: 'byg', ask: async (ok) => { await say(TALE.bygOrdet); if (!ok()) return; await playWord(b.ord); }, askText: `Byg ordet ${b.ord}.` });
    await sleep(600);
  }
}

// Brikker efter skrivetrin (koncept §7.4): trin 1 = vælg første bogstav, trin 2 = ordets brikker blandet,
// trin 3 = + 2 lokkere. Hver brik siger sin lyd. Fejl → lyd-hint (kun lyd: bogstaverne vises aldrig i en boble),
// efter 2 fejl står ordet svagt i felterne.
export async function buildWord(ctx, host, { ord, trin1, lokkere, act, ask, askText = null, tavle = false }) {
  const step = Number(state.settings.writeStep) || 2;
  const letters = [...ord];
  const filled = letters.map((_, i) => (step === 1 && i > 0 ? letters[i] : null));
  const tiles = step === 1 ? shuffle(trin1) : step === 3 ? shuffle([...letters, ...lokkere]) : shuffleNot(letters);
  host.innerHTML = `<div class="builder ${tavle ? 'on-tavle' : ''}">
    <div class="slots ${tavle ? 'chalk' : ''}">${letters.map((c, i) => `<span class="slot ${filled[i] ? 'filled given' : ''}" data-i="${i}"><b>${filled[i] ? esc(filled[i]) : ''}</b><i class="ghost">${esc(c)}</i></span>`).join('')}</div>
    <div class="tiles">${tiles.map((c, i) => `<button class="tile" data-v="${esc(c)}" data-k="${i}" aria-label="Brikken ${esc(c)}">${esc(c)}</button>`).join('')}</div>
  </div>`;
  const nextIdx = () => filled.findIndex((f) => !f);
  const expose = () => cur({ kind: act, word: ord, next: letters[nextIdx()] ?? null });
  expose();
  instruct(ask, askText);
  let errors = 0, settled = false;
  let hintRun = 0; // et nyt tryk afbryder et igangværende lyd-hint
  const allSounds = () => letters.every((c) => hasLetterSound(c));
  const t0 = performance.now();
  await new Promise((done) => {
    $$('.tile', host).forEach((el) => onTap(el, async () => {
      if (settled || el.classList.contains('used')) return;
      const v = el.dataset.v, i = nextIdx();
      if (i < 0) return;
      const my = ++hintRun;
      const ok = claim();
      const live = () => my === hintRun && !settled && ok() && ctx.alive();
      const slots = $$('.slot', host);
      if (v.toLowerCase() === letters[i].toLowerCase()) {
        el.classList.add('used');
        el.disabled = true;
        filled[i] = letters[i];
        slots[i].classList.add('filled');
        slots[i].querySelector('b').textContent = letters[i];
        expose();
        playLetter(v, { anchor: slots[i] });
        if (nextIdx() < 0) {
          settled = true;
          log(act, ord, errors ? 'hjaelp' : 'rigtigt', { s: 1, fejl: errors, ms: Math.round(performance.now() - t0), story: ctx.storyId });
          host.querySelector('.builder').classList.add('done');
          await sleep(500);
          done();
        }
      } else {
        errors++;
        el.classList.add('soft-no');
        setTimeout(() => el.classList.remove('soft-no'), 900);
        if (errors >= 2) host.querySelector('.slots').classList.add('show-ghost'); // efter 2 fejl står ordet svagt i felterne
        await playLetter(v, { anchor: el }); // brikken siger bare sin egen lyd
        if (!live()) return;
        await say(TALE.hoer);
        if (!live()) return;
        if (allSounds()) {
          await glideLetters(slots, ord, live, { visual: false }); // bogstavlydene (forælderens eller Jeppes), felterne lyser
        } else {
          // Uden bogstavlyde: helordet, og feltet, han mangler, lyser
          slots[i].classList.add('lit');
          await playWord(ord);
          slots[i].classList.remove('lit');
        }
        if (!live()) return;
        await say(i === 0 ? TALE.hvadFoerst : TALE.hvadSaa);
      }
    }));
  });
}
