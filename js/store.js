// Gem fremskridt i localStorage (ll_state). Mønstret er fra Matematik-Zoos store.js, men uden server og profiler:
// prototypen har én spiller. Alt er pakket ind i try/catch (privat vindue, fuld disk, blokerede data).
import { ALFABET, KLASSENS_17 } from './content.js?v=6f70bf5933';

const KEY = 'll_state';
const LOG_MAX = 400;

export function defaults() {
  return {
    v: 1,
    letters: ALFABET.slice(), // alle bogstaver som standard; forælderen slår fra på Trænerbænken (okt. 2026)
    lettersStd: 2, // 2 = standarden er hele alfabetet (1 var klassens 17)
    settings: { defaultMode: 'sammen', writeStep: 2, minSecPerLetter: 0.6, sound: true, reducedMotion: false, skrivStreng: false },
    dut: { details: [], read: {} }, // read[id] = { n, last }
    log: [], // { t, act, item, res, s (scoret), ms, story }
    opslag: {}, // opslag[storyId][nr] = { how: 'selv' | 'hjaelp', mode: 'sammen' | 'selv', diktat: bool }
    // Skriv bogstavet: skriv[l] = { trin: 1-3, ok (gode forsøg på trinnet), n (forsøg i alt), vist (har set animationen),
    //   miss (omgange i træk på trinnet uden held: 2 → et trin ned),
    //   tegn: de seneste 3 tegninger [{ t, trin, ok, grund, s: [[x,y,x,y,…] pr. streg] i hundrededele} ] }
    skriv: {},
    skrivLogbog: '', // dato (ÅÅÅÅ-MM-DD), hvor Bip sidst sagde "Skriv det også i logbogen!"
  };
}

const arr = (x, d) => (Array.isArray(x) ? x : d);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

// En gammel eller ødelagt ll_state må aldrig få appen til at kaste midt i en mission: typerne tjekkes
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const d = defaults(), s = JSON.parse(raw);
    if (!s || s.v !== 1) return d;
    let letters = arr(s.letters, d.letters).filter((l) => typeof l === 'string');
    // Engangs-opgradering: den gamle standard (præcis klassens 17) bliver til hele alfabetet.
    // Har forælderen selv valgt bogstaver, røres de ikke.
    if (s.lettersStd !== 2 && letters.length === KLASSENS_17.length && KLASSENS_17.every((l) => letters.includes(l))) letters = ALFABET.slice();
    return {
      ...d,
      letters,
      lettersStd: 2,
      settings: { ...d.settings, ...obj(s.settings) },
      dut: { details: arr(s.dut?.details, []).filter((x) => typeof x === 'string'), read: obj(s.dut?.read) },
      log: arr(s.log, []).filter((e) => e && typeof e === 'object'),
      opslag: obj(s.opslag),
      skriv: obj(s.skriv),
      skrivLogbog: typeof s.skrivLogbog === 'string' ? s.skrivLogbog : '',
    };
  } catch {
    return defaults();
  }
}

// Et opslags resultat: nyt format { how, mode, diktat } eller gammelt 'selv'/'hjaelp'
export const opslagInfo = (v) => (typeof v === 'string' ? { how: v, mode: 'sammen', diktat: false } : v && typeof v === 'object' ? v : null);

export const state = load();

let timer = null;
export function save({ now = false } = {}) {
  clearTimeout(timer);
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignorer */ } };
  if (now) write(); else timer = setTimeout(write, 300);
}

export function reset() {
  const d = defaults();
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, d);
  try { localStorage.removeItem(KEY); } catch { /* ignorer */ }
  save({ now: true });
}

// Log et svar. s = scoret (tæller som bevis senere); uscorede øvelser logges også, men vises ikke i "seneste svar"
export function log(act, item, res, extra = {}) {
  state.log.push({ t: new Date().toISOString(), act, item, res, ...extra });
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
  save();
}

export function markOpslag(storyId, nr, info) {
  const o = (state.opslag[storyId] = obj(state.opslag[storyId]));
  o[nr] = info;
  save();
}

window.addEventListener('pagehide', () => save({ now: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save({ now: true }); });
