// "Skriv bogstavet": barnet skriver et lille bogstav med fingeren i skrivefeltet, og genkend.js ser, om det er det
// rigtige. Tre trin pr. bogstav (koncept §7.4, analyse §4.8 og §9.4: hurtigt fra sporing til at skrive fra hukommelsen):
//   1 Spor          bogstavet står stiplet og lyst i feltet, med grøn startprik og små pile
//   2 Startprik     kun den grønne prik (bogstavet står på et lille kort ved siden af)
//   3 Hukommelsen   intet bogstav: Bip siger lyden, "Skriv det bogstav, der siger … /mmm/"
// 2 gode forsøg på et trin → næste trin næste gang. Trin 3 er målet. Lykkes en omgang ikke på trinnet 2 gange i
// træk, går han et trin ned igen. Første gang han møder et bogstav, viser animationen, hvordan det skrives.
// På trin 3 er et forsøg kun "fra hukommelsen", hvis han ikke lige har set bogstavet blive vist i omgangen (efter et
// forsøg, der ikke lykkedes, eller på 👁): så får han ros, men det flytter ham ikke og tæller ikke som en god omgang.
// Bogstaver, der lyder som et andet (c og z som s, q som k, w som v: samme klip), når højst trin 2 – på trin 3 hører
// han kun lyden, og den siger ikke, hvilket af dem det er.
// Ingen point, ingen rød og ingen "forkert"-lyd: lykkes det, forvandles hans streg blødt til det rene bogstav, og
// lyden siges ("Flot! … mmm"). Ellers en venlig, konkret besked og animationen igen. Det lykkes altid til sidst:
// 3. forsøg på trin 2 og 3 er et sporingsforsøg (bogstavet står stiplet i feltet).
// Skrivevejen (start og retning) tæller kun med "streng skrivevej" på Trænerbænken; ellers godkendes formen, og Bip
// giver bagefter et lille tip ("Næste gang starter du ved den grønne prik", på trin 3 uden prik: "Se, hvor den starter").
// Et tryk på Bip, "Stop missionen" eller en låst iPad afbryder kun det, der tales – aldrig selve forløbet: forsøgene,
// animationerne og "Skriv igen" kommer stadig.
// Papiret bevares: trin 3 på skærmen er en øvelse, ikke en erstatning for logbogen (koncept §7.4), så Bip minder om
// logbogen efter et bogstav fra hukommelsen (højst én gang om dagen).
import { SKRIFT } from './skrift-data.js?v=6f70bf5933';
import { genkend, kandidaterFor, SPEJLPAR, forvarm } from './genkend.js?v=6f70bf5933';
import { skrivefelt } from './skrivefelt.js?v=6f70bf5933';
import { KLASSENS_17 } from './content.js?v=6f70bf5933';
import { state, log, save } from './store.js?v=6f70bf5933';
import { say, playLetter, claim } from './audio.js?v=6f70bf5933';
import { ICON, instruct, onClick } from './ui.js?v=6f70bf5933';
import { TALE } from './tale.js?v=6f70bf5933';
import { $, esc, sleep } from './util.js?v=6f70bf5933';

export const TRIN_NAVN = { 1: 'Spor', 2: 'Startprik', 3: 'Fra hukommelsen' };
export const GODE_FOR_NAESTE = 2; // gode forsøg på et trin, før han rykker videre
export const MISS_FOR_NED = 2; // omgange i træk uden held på et trin, før han går et trin ned
const MAX_FORSOEG = 3; // korte forløb: højst 3 forsøg ad gangen
const MAX_RUNDER = 6; // … og højst 6 afleveringer (et tryk, der er for lille, tæller ikke som et forsøg)
const OK_VENT = 1600; // ms efter sidste løft, før et godkendt bogstav afleveres af sig selv
const VENT = 3500; // … et bogstav, der ikke er godkendt endnu (han tænker måske over næste streg)
const VENT_STREG = 5000; // … når han mangler streger, som modellen har (fx prikken eller tværstregen)
const VINK_MS = 6000; // venter feltet på ✓, får ✓ et stille vink efter så lang tid
const VENT_GLEMT = 8000; // mangler en del (glemt prik eller tværstreg), afleveres der efter så lang tid uden aktivitet
// Bogstaver med samme lyd (Jeppes klip i public/lyd/bogstav/ er ens): de kan ikke skrives ud fra lyden alene
export const SAMME_LYD = { c: 's', z: 's', q: 'k', w: 'v' };
export const maksTrin = (l) => (SAMME_LYD[l] ? 2 : 3);
const cur = (o) => { if (window.__ll) window.__ll.cur = o; };
let rosI = 0;

export function skrivInfo(l) {
  const s = state.skriv?.[l];
  return { trin: Math.min(maksTrin(l), Math.max(1, s?.trin || 1)), maks: maksTrin(l), ok: s?.ok || 0, n: s?.n || 0, miss: s?.miss || 0, vist: !!s?.vist, tegn: Array.isArray(s?.tegn) ? s.tegn : [] };
}
function post(l) {
  if (!state.skriv || typeof state.skriv !== 'object') state.skriv = {};
  const s = state.skriv[l] && typeof state.skriv[l] === 'object' ? state.skriv[l] : {};
  state.skriv[l] = { trin: 1, ok: 0, n: 0, miss: 0, vist: false, ...s, tegn: Array.isArray(s.tegn) ? s.tegn : [] };
  state.skriv[l].trin = Math.min(maksTrin(l), Math.max(1, state.skriv[l].trin || 1));
  return state.skriv[l];
}

// "Vil du stoppe?" (app.js): skrivefeltet, der er i gang, afleverer ikke bag dialogen, og ventetiden begynder forfra,
// når han trykker "Nej"
let iGang = null; // { stop, fortsaet } for skriveforløbet på skærmen
export function skrivPause(paa) { if (paa) iGang?.stop(); else iGang?.fortsaet(); }

// Det bogstav, missionen øver: det første på listen, der er slået til (og findes i skrivevejen)
export function vaelgSkriveBogstav(liste = []) {
  return liste.find((l) => SKRIFT[l] && state.letters.includes(l)) || null;
}

// Bogstaverne, tegningen sammenlignes med: dem, han faktisk har lært (klassens 17, der er slået til, og dem, han har
// øvet at skrive) + maal og spejlparret. Hele alfabetet er slået til som standard, men et h eller q, han aldrig har
// set, må ikke "vinde" over hans b eller g.
export function skriveKandidater(l) {
  const laert = state.letters.filter((b) => KLASSENS_17.includes(b) || state.skriv?.[b]);
  return kandidaterFor(l, laert);
}

const FEEDBACK = {
  spejl: TALE.skrivSpejl, 'for-lille': TALE.skrivStoerre, ufuldstaendig: TALE.skrivMangler, 'ufuldstændig': TALE.skrivMangler,
  stort: TALE.skrivStort, buer: TALE.skrivBuer, utydelig: TALE.skrivUtydelig, retning: TALE.skrivRetning,
};
const idag = () => new Date().toISOString().slice(0, 10);

// Skriv bogstavet l i stage. Afsluttes (Promise → { ok }), når det er lykkedes, eller efter 3 forsøg.
// fra = 'mission' (opvarmningen) eller 'album' (Omklædningsrummet: "Skriv igen"-knap bagefter).
export async function skrivBogstav(stage, { bogstav: l, alive = () => true, fra = 'mission' } = {}) {
  const info = skrivInfo(l);
  const trin = info.trin;
  let visning = trin === 1 ? 'spor' : trin === 2 ? 'prik' : 'tom';
  setTimeout(() => { try { forvarm(); } catch { /* */ } }, 0); // skabelonerne bygges, mens Bip taler
  stage.innerHTML = `<div class="act act-skriv trin-${trin}" data-l="${esc(l)}">
    <div class="skriv-venstre">
      <button class="sound-btn" id="skriv-hoer" aria-label="Hør lyden">${ICON.hoejttaler()}</button>
      ${trin < 3 ? `<div class="skriv-model" aria-label="Bogstavet ${esc(l)}"><span>${esc(l)}</span></div>` : ''}
      <button class="round-btn skriv-vis" id="skriv-vis" aria-label="Se hvordan">${ICON.oeje()}</button>
    </div>
    <div class="skriv-midt" id="skriv-midt"></div>
    <div class="act-side">
      <button class="big-btn skriv-faerdig" id="skriv-faerdig" aria-label="Færdig" disabled>${ICON.check()}</button>
      <button class="round-btn skriv-visk" id="skriv-visk" aria-label="Prøv igen – visk ud" disabled>${ICON.slet()}</button>
      ${fra === 'album' ? `<button class="big-btn skriv-igen" id="skriv-igen" aria-label="Skriv igen" hidden>${ICON.blyant()}</button>` : ''}
    </div>
  </div>`;
  const root = stage.firstElementChild;
  const faerdigBtn = $('#skriv-faerdig', root), viskBtn = $('#skriv-visk', root), visBtn = $('#skriv-vis', root), hoerBtn = $('#skriv-hoer', root);
  const kandidater = skriveKandidater(l);
  const streng = !!state.settings.skrivStreng;
  const vurder = () => genkend(felt.streger(), { maal: l, kandidater, streng, linjer: felt.linjer() });
  // flest streger i en af bogstavets former (a som o + pind = 2): har han tegnet færre, er han måske ikke færdig
  const flestStreger = Math.max(SKRIFT[l].streger.length, ...(SKRIFT[l].alt || []).map((f) => f.length));
  let aflever = null; // sættes, mens han skriver: kaldes af ✓ eller af sig selv (felt.onIdle)
  let vinkT = null;
  const vinkVaek = () => { clearTimeout(vinkT); faerdigBtn.classList.remove('vink'); };
  // Hvor længe der ventes efter et løft, før der afleveres af sig selv: kort, når bogstavet allerede er godkendt;
  // længere, hvis det ikke er; og slet ikke efter et enkelt tryk (så venter feltet på ✓, der får et stille vink efter
  // lidt tid). Mangler en del (prikken over i, tværstregen i t), får ✓ også vinket – men glemmer han den (på trin 3
  // viser ingen prik, at der mangler noget), afleveres der efter 8 sek. uden aktivitet, så Bip siger "Næsten! Der
  // mangler lidt. Se her." og viser bogstavet, i stedet for at intet sker.
  const idleFor = () => {
    vinkVaek();
    const r = vurder();
    if (r.ok) return OK_VENT;
    const vink = () => { vinkT = setTimeout(() => faerdigBtn.classList.add('vink'), VINK_MS); };
    if (r.grund === 'for-lille') { vink(); return null; }
    if (r.grund === 'ufuldstændig') { vink(); return VENT_GLEMT; }
    return felt.antal() < flestStreger ? VENT_STREG : VENT;
  };
  const felt = skrivefelt($('#skriv-midt', root), {
    bogstav: l, visning,
    onStreg: (n) => { faerdigBtn.disabled = !n; viskBtn.disabled = !n; },
    onNed: vinkVaek,
    onIdle: () => aflever?.('auto'),
    idleFor,
  });
  if (window.__ll) window.__ll.skrivfelt = felt;
  const levende = () => alive() && root.isConnected;
  const pause = { stop: () => felt.stopIdle(), fortsaet: () => { if (aflever && levende()) felt.planlaeg(); } };
  iGang = pause;
  // vist: 👁 "Se hvordan" er trykket i omgangen. demo: bogstavet er vist (animationen) i omgangen.
  let forsoeg = 0, runder = 0, vist = false, demo = false;
  const status = (phase) => cur({ kind: 'skriv', bogstav: l, trin, phase, forsoeg, fra, visning });

  // Instruktionen (Bip kan gentage den)
  const instruktion = async (ok) => {
    if (visning === 'spor') {
      await playLetter(l, { anchor: hoerBtn }); if (!ok()) return;
      await say(TALE.skrivOveni); if (!ok()) return;
      await say(TALE.startPrik);
    } else {
      await say(TALE.skrivSiger); if (!ok()) return;
      await playLetter(l, { visual: trin < 3, anchor: hoerBtn }); if (!ok()) return;
      if (visning === 'prik') await say(TALE.startPrik);
    }
  };
  const ask = () => instruct(instruktion, visning === 'spor' ? `${TALE.skrivOveni} ${TALE.startPrik}` : TALE.skrivSiger);

  const knapper = (on) => {
    for (const b of [visBtn, hoerBtn]) b.disabled = !on;
    faerdigBtn.disabled = !on || !felt.antal();
    viskBtn.disabled = !on || !felt.antal();
  };

  // Vis hvordan (første møde, efter et forsøg, der ikke lykkedes, og på "Se hvordan"): hans streg dæmpes imens
  async function vis() {
    felt.laas(true); knapper(false); vinkVaek();
    felt.el.classList.add('dim');
    status('vis');
    demo = true;
    await felt.visHvordan({ alive: levende });
    felt.el.classList.remove('dim');
  }
  // Står "Vil du stoppe?" åben, venter skrivningen med at tale og gå videre, til dialogen er lukket
  const ventDialog = async () => { while (levende() && document.querySelector('.overlay')) await sleep(200); };

  onClick(faerdigBtn, () => { if (felt.antal()) { vinkVaek(); aflever?.('knap'); } });
  // Lyden: afleveringen venter, mens den spiller
  onClick(hoerBtn, async () => { claim(); felt.stopIdle(); await playLetter(l, { visual: trin < 3, anchor: hoerBtn }); if (aflever && levende()) felt.planlaeg(); });
  onClick(viskBtn, () => { claim(); vinkVaek(); felt.ryd(); knapper(true); say(TALE.viskUd); });
  // "Se hvordan" midt i et forsøg: animationen, så et rent felt ("Nu dig!") – den halve tegning afleveres ikke
  onClick(visBtn, async () => {
    if (!aflever) return;
    claim(); vist = true;
    await vis();
    if (!levende() || !aflever) return;
    felt.ryd();
    felt.laas(false); knapper(true); status('tegn');
    say(TALE.nuDigSkriv);
  });

  felt.laas(true); knapper(false);
  await ventDialog(); // ingen tale bag "Vil du stoppe?"
  if (!levende()) return { ok: false };
  // Første møde med bogstavet: se, hvordan det skrives. Animationen vises også, hvis "Se her." blev afbrudt (Bip, en
  // låst iPad), og først når den er vist, huskes det.
  if (!info.vist) {
    status('vis');
    await instruct(TALE.seHer); // Bip gentager "Se her.", mens animationen kører
    if (!levende()) return { ok: false };
    await vis();
    if (!levende()) return { ok: false };
    const p = post(l); p.vist = true; save();
    await ventDialog();
    if (!levende()) return { ok: false };
  }
  ask();

  let lykkedes = false, paaTrin = false; // lykkedes i omgangen / på trinnets egen visning (ikke kun sporet)
  while (forsoeg < MAX_FORSOEG && runder < MAX_RUNDER && levende()) {
    runder++;
    // Det lykkes altid: sidste forsøg på trin 2 og 3 er et sporingsforsøg
    if (forsoeg === MAX_FORSOEG - 1 && visning !== 'spor') { visning = 'spor'; felt.saetVisning('spor'); root.classList.add('spor-nu'); }
    felt.laas(false); knapper(true); status('tegn');
    const t0 = performance.now();
    const hvordan = await new Promise((res) => { aflever = res; });
    aflever = null;
    vinkVaek();
    if (!levende()) return { ok: lykkedes };
    felt.laas(true); knapper(false); status('svar');
    const r = vurder();
    const ok = !!r.ok;
    // b↔d og p↔q er spejlpar: skriver han d, hvor målet er b, er det en spejlvending, ikke "et andet bogstav"
    const spejl = r.spejl || r.grund === 'spejl' || (r.grund === 'andet-bogstav' && r.bedst && r.bedst === SPEJLPAR[l]);
    const grund = ok ? 'ok' : r.grund === 'ok' ? (r.start_ok === false ? 'start' : 'retning') : spejl ? 'spejl' : r.grund;
    const sporForsoeg = visning === 'spor' && trin > 1;
    // På trin 3 lige efter en animation (efter et forsøg, der ikke lykkedes, eller 👁): lykkes det, får han ros, men
    // det er ikke skrevet fra hukommelsen – det flytter ham ikke, og omgangen tæller ikke som en god omgang
    const efterVis = trin === 3 && demo;
    // Et tryk, der er for lille (fx ved siden af bogstavet), tæller ikke som et forsøg
    const taeller = !(grund === 'for-lille' && !ok);
    if (taeller) forsoeg++;
    // Gem og log
    const p = post(l);
    p.n++;
    if (ok && !sporForsoeg && !efterVis) { paaTrin = true; p.ok++; p.miss = 0; if (p.ok >= GODE_FOR_NAESTE && p.trin < maksTrin(l)) { p.trin++; p.ok = 0; } }
    p.tegn.push({ t: new Date().toISOString(), trin, ok, grund, s: felt.komprimer() });
    if (p.tegn.length > 3) p.tegn.splice(0, p.tegn.length - 3);
    log('skriv', l, ok ? 'rigtigt' : 'igen', {
      s: 1, trin, ok, grund, ms: Math.round(performance.now() - t0), score: Math.round((r.score || 0) * 100) / 100, bedst: r.bedst,
      ...(sporForsoeg ? { spor: true } : {}), ...(vist ? { vist: true } : {}), ...(efterVis && !sporForsoeg ? { efterVis: true } : {}),
      ...(hvordan === 'auto' ? { auto: true } : {}),
      ...(r.hoejde_ok === false ? { hoejde: r.stoerrelse ?? false } : {}), fra,
    });

    // g() = talen her er stadig aktuel. Et tryk på Bip (der gentager instruktionen), "Stop missionen" eller en låst
    // iPad springer resten af talen over – men forløbet fortsætter: animationen, næste forsøg og "Skriv igen".
    if (ok) {
      lykkedes = true;
      const g = claim();
      await felt.forvandl();
      if (!levende()) return { ok: true };
      if (g()) await say(TALE.skrivRos[rosI++ % TALE.skrivRos.length]);
      if (g() && levende()) await playLetter(l, { visual: false });
      if (!levende()) return { ok: true };
      // Et lille tip bagefter (godkendt alligevel): skrivevejen eller størrelsen. På trin 3 er der ingen grøn prik.
      const tip = r.start_ok === false ? (trin === 3 ? TALE.tipStartTom : TALE.tipStart) : r.retning_ok === false ? TALE.tipRetning : r.stoerrelse > 1.9 ? TALE.tipMindre : null;
      if (tip) {
        cur({ kind: 'skriv', bogstav: l, trin, phase: 'tip', tip, forsoeg, fra });
        await sleep(350); if (!levende()) return { ok: true };
        if (g()) await say(tip);
        if (!levende()) return { ok: true };
        if (tip !== TALE.tipMindre) {
          felt.ryd(); // det grønne bogstav væk, så animationen står tydeligt
          await vis(); if (!levende()) return { ok: true };
        }
      }
      // Papiret: efter et bogstav fra hukommelsen minder Bip om logbogen (højst én gang om dagen)
      if (trin === 3 && !sporForsoeg && !efterVis && state.skrivLogbog !== idag() && g()) {
        state.skrivLogbog = idag(); save();
        await say(TALE.logbog); if (!levende()) return { ok: true };
      }
      break;
    }
    // Ikke endnu: en venlig, konkret besked og animationen igen
    const g = claim();
    const tekst = grund === 'start' ? (visning === 'tom' ? TALE.skrivStartTom : TALE.skrivStart) : FEEDBACK[grund] || TALE.skrivIgen;
    cur({ kind: 'skriv', bogstav: l, trin, phase: 'feedback', grund, forsoeg, fra });
    felt.el.classList.add('dim');
    await say(tekst);
    if (!levende()) return { ok: false };
    if (forsoeg >= MAX_FORSOEG || runder >= MAX_RUNDER) {
      await vis();
      if (!levende()) return { ok: false };
      if (g()) await say(TALE.godtOevet);
      break;
    }
    await vis();
    if (!levende()) return { ok: false };
    felt.ryd();
    if (g()) say(forsoeg === MAX_FORSOEG - 1 && visning !== 'spor' ? TALE.skrivOveni : TALE.nuDigSkriv); // næste gang: spor
  }
  if (!levende()) return { ok: lykkedes };
  // Omgangen er slut. Lykkedes den ikke på trinnet 2 gange i træk, går han et trin ned (det skal være til at klare)
  if (!paaTrin) {
    const p = post(l);
    p.miss = (p.miss || 0) + 1;
    if (p.miss >= MISS_FOR_NED && p.trin > 1) { p.trin--; p.ok = 0; p.miss = 0; }
  }
  save();
  status('faerdig');
  if (iGang === pause) iGang = null;
  if (fra === 'album') {
    const igen = $('#skriv-igen', root);
    faerdigBtn.hidden = true; viskBtn.hidden = true;
    igen.hidden = false;
    await new Promise((res) => onClick(igen, res));
    if (!levende()) return { ok: lykkedes };
    return { ok: lykkedes, igen: true };
  }
  await sleep(500);
  await ventDialog();
  return { ok: lykkedes };
}

// Missionens opvarmning: "Skriv lyden" med et af historiens bogstaver (MISSIONER[id].skriv), trin efter hans fremgang
export async function skrivLyden(ctx) {
  const l = vaelgSkriveBogstav(ctx.mission.skriv);
  if (!l) return; // ingen af bogstaverne er slået til: springes over
  await skrivBogstav(ctx.stage, { bogstav: l, alive: ctx.alive, fra: 'mission' });
}
