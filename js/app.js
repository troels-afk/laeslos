// "Læs løs!" v0.1 – router og skærme: Start → Dut → stedets side → missionen → slut. Plus omklædningsrummet
// og Trænerbænken. Testkrog: window.__ll = { state, go(screen), content, cur, … }.
import * as C from './content.js?v=bab7c031e5';
import { state, reset as resetState } from './store.js?v=bab7c031e5';
import * as A from './audio.js?v=bab7c031e5';
import { ICON, icon, pic, wordPic, dots, topbar, bipButton, instruct, repeatInstruction, getInstruction, setInstruction, holdButton, ringSvg, overlay, onClick, onTap, clearBubble, koeretoej } from './ui.js?v=bab7c031e5';
import * as ACT from './activities.js?v=bab7c031e5';
import { playStory, ending } from './story.js?v=bab7c031e5';
import { gateButton, armGate, renderBench } from './parent.js?v=bab7c031e5';
import { SCENE_SVG } from './scenes.js?v=bab7c031e5';
import { TALE } from './tale.js?v=bab7c031e5';
import { $, $$, esc, sleep } from './util.js?v=bab7c031e5';

const app = document.getElementById('app');
const session = { mode: state.settings.defaultMode };
let token = 0; // ny skærm = nyt token, så en igangværende mission stopper stille

function screen(cls, html) {
  token++;
  A.interrupt(); // alt, der tales eller venter på at tale, stopper
  clearBubble();
  document.querySelectorAll('body > .overlay').forEach((o) => o.remove());
  app.innerHTML = `<section class="screen ${cls}">${html}</section>`;
  const el = app.firstElementChild;
  onClick($('#bip', el), () => repeatInstruction());
  if (window.__ll) { window.__ll.screen = cls.split(' ')[0]; window.__ll.cur = null; window.__ll.step = null; }
  // Fokus til den nye skærm (tastatur og skærmlæser), uden at noget scroller
  // (kun overskriften: en fokusring på en knap ville ligne en opgave for barnet)
  setTimeout(() => { const h = el.isConnected && el.querySelector('h1, h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }, 0);
  return el;
}

const sceneBg = (kind, src, alt, cls = '') => pic(src, alt, `scene-bg ${cls}`, SCENE_SVG[kind]());

// ================= Start: "Hvem er med i dag?" =================
// Som et bogomslag: "Læs løs!" stort, planeten Dut, og holdene fra de tre steder foran den (billederne vises, når de
// findes). De to valg er de samme som før: anførerbindet alene og anførerbindet med den store hånd.

const OMSLAG_HOLD = [['img/hold.webp', 'Musene', 'h1'], ['img/dinohold.webp', 'Dino-dalens figurer', 'h2'], ['img/rumhold.webp', 'Rumbasens figurer', 'h3']];

function showStart() {
  const el = screen('start', `
    <div class="start-wrap">
      <div class="start-sky" aria-hidden="true">${[6, 20, 74, 88, 94, 12, 62, 40, 82].map((x, i) => `<span style="left:${x}%;top:${[10, 26, 7, 24, 58, 66, 16, 4, 44][i]}%">${ICON.stjerne('#ffe27a')}</span>`).join('')}</div>
      <h1 class="logo">Læs løs!</h1>
      <div class="cover-art" aria-hidden="true">
        <div class="cover-planet">${pic(C.DUT.img, '', 'planet-pic', ICON.dut())}</div>
        ${OMSLAG_HOLD.map(([src, alt, cls]) => pic(src, alt, `cover-team ${cls}`)).join('')}
      </div>
      <p class="who-q">Hvem er med i dag?</p>
      <div class="who">
        <button class="who-btn" id="who-alone" aria-label="Kun mig – jeg læser selv">${ICON.anfoerer()}</button>
        <button class="who-btn hold" id="who-adult" aria-label="Mig og en voksen – vi læser sammen. Hold fingeren på i 2 sekunder">${ICON.anfoererVoksen()}${ringSvg(14)}</button>
      </div>
      <p class="adult-hint">Voksen: hold fingeren på knappen med den store hånd i 2 sekunder.</p>
    </div>`);
  let asked = false;
  el.addEventListener('pointerdown', () => { if (!asked) { asked = true; instruct(TALE.hvemErMed); } }, { capture: true });
  onClick($('#who-alone', el), () => { session.mode = 'selv'; showDut(); });
  // Et kort tryk på hånden må ikke være tavst: barnet får at vide, at en voksen skal holde
  const adultBtn = $('#who-adult', el);
  holdButton(adultBtn, 2000, () => { session.mode = 'sammen'; showDut(); }, () => {
    adultBtn.classList.remove('wiggle'); void adultBtn.offsetWidth; adultBtn.classList.add('wiggle');
    instruct(TALE.hentVoksen);
  });
}

// ================= Dut (forsiden) =================

// efterMission: ingen opfordring til at spille videre – bare et roligt "se, Dut har fået noget nyt"
function showDut({ efterMission = false } = {}) {
  const hs = C.DUT.hotspots;
  const details = state.dut.details.map((id) => {
    const m = Object.values(C.MISSIONER).find((x) => x.detalje?.id === id);
    if (!m) return '';
    const h = hs[m.detalje.sted];
    const fresh = efterMission && id === state.dut.details.at(-1);
    return `<span class="dut-detail ${fresh ? 'fresh' : ''}" style="left:${h.x + h.w * 0.62}%;top:${h.y + h.h * 0.52}%" title="${esc(m.detalje.alt)}">${icon(m.detalje.icon)}</span>`;
  }).join('');
  const el = screen('dut', `
    <div class="dut-scene" id="dut-scene">
      ${sceneBg('dut', C.DUT.img, C.DUT.alt)}
      ${Object.entries(hs).map(([k, h]) => `<button class="hotspot" data-place="${k}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%" aria-label="${esc(h.label)}"></button>`).join('')}
      ${details}
      ${Object.entries(C.DUT.skilte).map(([k, sk]) => `<button class="dut-skilt" data-place="${k}" style="left:${sk.x}%;top:${sk.y}%" aria-label="${esc(hs[k].label)}"><span class="skilt-board">${esc(sk.ord)}</span><span class="skilt-pind" aria-hidden="true"></span></button>`).join('')}
    </div>
    <header class="dut-top">
      <button class="round-btn album-btn" id="album" aria-label="Omklædningsrummet">${ICON.skab()}</button>
      <div class="sky-stars">${state.letters.map((l) => `<button class="sky-star" data-l="${l}" aria-label="Stjerne med bogstavet ${l}">${ICON.stjerne()}<span>${esc(l)}</span></button>`).join('')}</div>
      ${bipButton()}
      ${gateButton()}
    </header>`);
  if (efterMission) instruct(TALE.dutNyt);
  else instruct(TALE.hvorHen);
  // Tøver han, lyser stederne svagt et par gange (efter 6 sek. uden tryk)
  const my = token;
  setTimeout(() => { if (my === token) $$('.hotspot', el).forEach((h) => h.classList.add('hint')); }, 6000);
  // Et tryk på stedet eller på dets skilt går til stedet. Skiltet siges ikke op: det er læsestof.
  $$('.hotspot, .dut-skilt', el).forEach((b) => onTap(b, () => {
    const p = b.dataset.place;
    A.sfx({ rumbase: 'futfut', dinodal: 'tuba' }[p] || 'floejte');
    showPlace(p);
  }));
  $$('.sky-star', el).forEach((s) => onTap(s, () => { A.claim(); s.classList.add('shown'); A.playLetter(s.dataset.l, { anchor: s }); }));
  onClick($('#album', el), showAlbum);
  armGate($('#gate', el), showParent);
}

// ================= Stedets side (sæsonsti) =================

function showPlace(id) {
  const s = C.STEDER[id];
  if (!s) return showDut();
  const el = screen(`place sted-${id}`, `
    ${sceneBg(id, s.bg, s.alt, 'place-bg')}
    ${topbar({ back: 'to-dut', backLabel: 'Tilbage til Dut', mid: '' })}
    <div class="season-path">
      <svg class="path-line" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 150 Q250 40 500 120 T1000 80" fill="none"/></svg>
      ${s.historier.map((hid) => {
        const read = state.dut.read[hid];
        const m = C.MISSIONER[hid];
        const sammen = C.laesSammen(hid);
        return `<button class="story-card ${read ? 'read' : 'new'}${sammen ? ' laes-sammen' : ''}" data-id="${hid}" aria-label="${sammen ? 'Historie, vi læser sammen' : 'Historie'}">
          ${pic(C.billede(hid, 'cover'), 'Forsidebillede', 'cover', `<span class="cover-ph">${koeretoej(id)}</span>`)}
          ${sammen ? `<span class="sammen-badge" aria-hidden="true">${icon('sammen')}</span>` : ''}
          ${read ? `<span class="detail-badge">${icon(m.detalje.icon)}</span>` : ''}
        </button>`;
      }).join('')}
      ${pic(s.hold, '', 'team deco')}
    </div>`);
  onClick($('#to-dut', el), showDut);
  instruct(TALE.hvilkenHistorie);
  $$('.story-card', el).forEach((c) => onTap(c, () => startMission(c.dataset.id)));
}

// ================= Missionen =================

function missionSteps(m) {
  return [
    ['lydjagt', ACT.lydjagt], ['hvilken', ACT.hvilkenLyd], ['sig', ACT.sigSelv],
    ...(m.nyt ? [['nyt', ACT.soveAeg]] : []),
    ['glide', ACT.glidebane], ['laesvaelg', ACT.laesVaelg], ['byg', ACT.bygOrdet],
    ['historie', playStory], ['slut', ending],
  ];
}

async function startMission(id, { from = null } = {}) {
  const m = C.MISSIONER[id], h = C.HISTORIER[id];
  if (!m) return showDut();
  const steps = missionSteps(m);
  const el = screen(`mission sted-${m.sted}`, `${topbar({ back: 'quit', backLabel: 'Stop missionen', mid: dots(steps.length, 0) })}<div class="stage" id="stage" role="region" aria-label="Missionen"></div>`);
  const my = token;
  const ctx = {
    storyId: id, story: h, mission: m, sted: m.sted, mode: session.mode,
    stage: $('#stage', el), alive: () => my === token,
    finish: (to) => { if (my === token) (to === 'dut' ? showDut({ efterMission: true }) : showPlace(m.sted)); },
  };
  window.__ll.ctx = ctx;
  onClick($('#quit', el), () => quitAsk(ctx));
  const start = Math.max(0, from ? steps.findIndex((s) => s[0] === from) : 0);
  if (!from) await missionIntro(ctx);
  for (let i = start; i < steps.length; i++) {
    if (!ctx.alive()) return;
    $('.topbar .mid', el).innerHTML = dots(steps.length, i);
    clearBubble();
    ctx.stage.dataset.step = steps[i][0];
    window.__ll.step = steps[i][0];
    await steps[i][1](ctx);
  }
}

// Historiens dæmpede forsidebillede, så han ved, hvad han varmer op til
async function missionIntro(ctx) {
  ctx.stage.innerHTML = `<div class="intro">
    <div class="intro-cover">${pic(C.billede(ctx.storyId, 'cover'), 'Forsidebillede', 'scene dim', `<span class="cover-ph">${koeretoej(ctx.sted)}</span>`)}</div>
    <div class="act-side"><button class="big-btn go" id="go">${koeretoej(ctx.sted)}<span>Varm op</span></button></div>
  </div>`;
  window.__ll.step = 'intro';
  window.__ll.cur = { kind: 'intro' };
  instruct(TALE.varmOp);
  await ACT.waitClick($('#go', ctx.stage));
}

function quitAsk(ctx) {
  if (document.querySelector('.overlay.quit-ov')) return; // dobbelttryk åbner ikke to
  const prev = getInstruction();
  const o = overlay(`<div class="quit">
    <h2>Vil du stoppe?</h2>
    <div class="quit-btns">
      <button class="big-btn soft" id="quit-no">${ICON.play()}<span>Nej, læs videre</span></button>
      <button class="big-btn" id="quit-yes">${ICON.dut()}<span>Ja, til Dut</span></button>
    </div></div>`, 'quit-ov', { onEscape: () => no() });
  instruct(TALE.stoppe);
  // "Nej": tilbage til aktiviteten, og Bip gentager dens instruktion (ikke stop-spørgsmålet)
  const no = () => { o.close(); setInstruction(prev); if (prev) repeatInstruction(); };
  onClick($('#quit-no', o), no);
  onClick($('#quit-yes', o), () => { o.close(); showDut(); });
}

// ================= Omklædningsrummet (album) =================

// Ord, han har læst rigtigt: Læs og vælg og billedtjekket (første svar rigtigt) og opslag, den voksne har
// markeret "læst selv" uden ordhjælp. Byggede ord (stavning) og ord efter diktat tæller ikke.
function readWords(l) {
  const acts = new Set(['laes-vaelg', 'tjek']);
  const out = new Set();
  const add = (w) => { if (w.toLowerCase().includes(l)) out.add(w.toLowerCase()); };
  for (const e of state.log) {
    if (!e.s) continue;
    if (acts.has(e.act) && e.res === 'rigtigt') String(e.item).split(/\s+/).forEach(add);
    if (e.act === 'opslag' && e.res === 'selv' && e.mode === 'sammen' && !e.appHjaelp) {
      const [id, nr] = String(e.item).split('#');
      const o = C.HISTORIER[id]?.opslag.find((x) => String(x.nr) === nr);
      o?.ord.filter((w) => w.type !== 'H' && !w.efter_diktat).forEach((w) => add(w.ord));
    }
  }
  return [...out];
}

function showAlbum() {
  const el = screen('album', `${topbar({ back: 'to-dut', backLabel: 'Tilbage til Dut' })}
    <div class="lockers">${state.letters.map((l) => `<button class="locker" data-l="${l}" aria-label="Skabet med ${l}"><span class="locker-vents" aria-hidden="true"></span><span class="locker-letter">${l.toUpperCase()}${l}</span><span class="locker-handle" aria-hidden="true"></span></button>`).join('')}</div>`);
  onClick($('#to-dut', el), showDut);
  instruct(TALE.album);
  $$('.locker', el).forEach((b) => onTap(b, () => letterCard(b.dataset.l)));
}

function letterCard(l) {
  const type = C.lydtype(l);
  const words = readWords(l);
  const pics = words.map((w) => {
    const id = Object.keys(C.ORDBOG).find((k) => C.ORDBOG[k].ord.toLowerCase() === w && C.ORDBOG[k].img);
    return `<span class="lc-word">${id ? wordPic(id) : ''}<b>${esc(w)}</b></span>`;
  }).join('');
  const o = overlay(`<div class="lcard">
    <button class="round-btn lc-close" id="lc-close" aria-label="Luk">${ICON.tilbage()}</button>
    <div class="lc-big">${l.toUpperCase()}${l}</div>
    <button class="say-btn" id="lc-sound">${ICON.hoejttaler()}<span>Hør lyden</span></button>
    <div class="lc-type ${type}">${type === 'hop' ? '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M4 26 Q16 0 30 26 Q44 0 56 26" fill="none" stroke="#2b2a33" stroke-width="4" stroke-linecap="round"/></svg>hoppe-lyd' : type === 'lang' ? '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M4 15 Q12 6 20 15 T36 15 T56 15" fill="none" stroke="#2b2a33" stroke-width="4" stroke-linecap="round"/></svg>lang lyd' : ''}</div>
    ${pics ? `<div class="lc-words">${pics}</div>` : ''}
  </div>`, 'lc-ov', { label: `Bogstavet ${l}`, onEscape: () => o.close() });
  const big = $('.lc-big', o);
  A.playLetter(l, { anchor: big });
  onClick($('#lc-sound', o), () => { A.claim(); A.playLetter(l, { anchor: big }); });
  onClick($('#lc-close', o), () => o.close());
}

// ================= Trænerbænken =================

function showParent(tab) {
  token++;
  A.interrupt();
  clearBubble();
  if (window.__ll) window.__ll.screen = 'bench';
  renderBench(app, { onBack: showDut, tab });
}

// ================= Testkrog og start =================

function go(target, from = null) {
  const [k, arg] = String(target).split(':');
  switch (k) {
    case 'start': return showStart();
    case 'dut': return showDut();
    case 'place': return showPlace(arg || 'stadion');
    case 'album': return showAlbum();
    case 'parent': return showParent(arg);
    case 'mission': return startMission(arg, { from });
    case 'story': return startMission(arg, { from: 'historie' });
    case 'end': return startMission(arg, { from: 'slut' });
    default: return showStart();
  }
}

async function init() {
  A.setSound(state.settings.sound);
  document.documentElement.classList.toggle('rm', !!state.settings.reducedMotion);
  window.__ll = { state, go, content: C, session, cur: null, step: null, screen: null, audio: A, reset: resetState };
  // Optagelserne og Jeppes lydliste (manifest.json). En IndexedDB eller et netværk, der aldrig svarer, må ikke give en blank app
  await Promise.race([Promise.all([A.initRecordings(), A.initTale()]), sleep(2000)]);
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) go(hash); else showStart();
}

init();
