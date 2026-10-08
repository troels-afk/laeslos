// Lyd: Jeppes forudlavede klip (public/lyd/manifest.json), forælderens optagelser (IndexedDB ll_audio),
// effekter med Web Audio og browserens stemme (speechSynthesis) kun som nødløsning.
// Intet her må få appen til at hænge: alt venter med en timeout og fortsætter, også uden lyd (headless test).
import { strakt, lydtype } from './content.js?v=03a6968a20';
import { taleNoegle, ordStart, ORD_RE } from './tale.js?v=03a6968a20';
import { sleep } from './util.js?v=03a6968a20';

export const events = new EventTarget(); // 'visual' { text } når en lyd vises i stedet for at blive afspillet
let ctx = null;
let soundOn = true;

export function setSound(on) { soundOn = !!on; if (!soundOn) stopSpeech(); }
export const soundIsOn = () => soundOn;
export const audioState = () => ctx?.state || 'ingen'; // til browsertesten

// Tidsgrænser: intet må vente for evigt på et netværk, en afkodning eller en oplåsning
const LOAD_MS = 4000; // hent + afkod ét klip (eller én optagelse), før <audio> prøves
const FETCH_MS = 10000; // en hentning, der aldrig svarer, afbrydes (så den kan prøves igen senere)
const UNLOCK_MS = 1500; // et afvist klip venter så længe på, at lyden låses op (touchend/klik lige efter)

// iPad Safari: lyd og tale skal låses op i et brugertryk. iOS regner ikke altid pointerdown fra en finger for et
// tryk (touchend, pointerup og klik gør), så der låses op ved dem alle. unlock() gør intet, når lyden kører.
let unlockWaiters = [];
function notifyRunning() {
  if (ctx?.state !== 'running' || !unlockWaiters.length) return;
  const w = unlockWaiters;
  unlockWaiters = [];
  w.forEach((f) => f());
}
function whenRunning(ms) {
  if (ctx?.state === 'running') return Promise.resolve(true);
  return new Promise((res) => {
    const f = () => { clearTimeout(t); res(true); };
    const t = setTimeout(() => { unlockWaiters = unlockWaiters.filter((x) => x !== f); res(false); }, ms);
    unlockWaiters.push(f);
  });
}
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { ctx = new AC(); ctx.onstatechange = notifyRunning; }
    }
    // iOS sætter ctx i 'interrupted' efter mikrofon, opkald, Siri og app-skift – genoptag alt, der ikke kører
    if (ctx && ctx.state !== 'running') {
      ctx.resume()?.then?.(notifyRunning, () => {});
      // Ældre iOS: en tom lyd startet i selve trykket låser Web Audio op
      try {
        const s = ctx.createBufferSource();
        s.buffer = ctx.createBuffer(1, 1, 22050);
        s.connect(ctx.destination);
        s.start(0);
      } catch { /* */ }
    }
    notifyRunning();
    // Safari 17+: tonerne og effekterne skal ikke forsvinde, når iPad'en står på lydløs
    if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
  } catch { /* ingen lyd */ }
}
['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true, capture: true }));

// ================= Web Audio-effekter =================

const ready = () => soundOn && ctx && ctx.state === 'running';

function tone(start, freq, dur, { type = 'sine', gain = 0.08, to = null, vib = 0 } = {}) {
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (vib) {
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = 7; lg.gain.value = vib;
    l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

let noiseBuf = null;
function noise(start, dur, { gain = 0.08, freq = 1200, to = null, q = 1, type = 'bandpass' } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + start;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true;
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t0);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(ctx.destination);
  s.start(t0); s.stop(t0 + dur + 0.05);
}

const N = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G4: 392, C4: 261.63 };

// Varighed i sekunder pr. effekt (så flere kan spilles efter hinanden)
const SFX = {
  tap: [0.06, () => tone(0, 880, 0.05, { gain: 0.025 })],
  pling: [0.4, () => { tone(0, N.E6, 0.35, { type: 'triangle', gain: 0.05 }); tone(0.05, N.C6 * 2, 0.25, { gain: 0.02 }); }],
  kridt: [0.45, () => { noise(0, 0.16, { freq: 3500, q: 2, gain: 0.07 }); noise(0.2, 0.22, { freq: 4200, to: 2600, q: 2, gain: 0.06 }); }],
  floejte: [0.6, () => { tone(0, 2300, 0.28, { gain: 0.05, vib: 80 }); tone(0.32, 2100, 0.12, { gain: 0.05 }); noise(0.3, 0.1, { freq: 3000, gain: 0.04 }); }],
  plop: [0.25, () => tone(0, 500, 0.15, { to: 180, gain: 0.12 })],
  vup: [0.2, () => tone(0, 300, 0.12, { to: 900, type: 'triangle', gain: 0.06 })],
  vov: [0.4, () => { tone(0, 220, 0.15, { type: 'sawtooth', to: 150, gain: 0.05 }); tone(0.2, 240, 0.15, { type: 'sawtooth', to: 160, gain: 0.05 }); }],
  swoosh: [0.6, () => noise(0, 0.55, { freq: 400, to: 3000, q: 0.8, gain: 0.07 })],
  pip10: [1.3, () => { for (let i = 0; i < 10; i++) tone(i * 0.11, 1200 + i * 90, 0.07, { type: 'triangle', gain: 0.035 }); }],
  ufo: [1.2, () => tone(0, 600, 1.1, { gain: 0.05, vib: 120, to: 420 })],
  vinge: [0.5, () => { noise(0, 0.18, { freq: 700, q: 0.7, gain: 0.06 }); noise(0.22, 0.18, { freq: 700, q: 0.7, gain: 0.06 }); }],
  kraa: [0.45, () => { tone(0, 520, 0.35, { type: 'sawtooth', to: 380, gain: 0.04, vib: 40 }); noise(0, 0.3, { freq: 1500, q: 3, gain: 0.03 }); }],
  rul: [1.0, () => noise(0, 0.95, { freq: 220, q: 1.5, gain: 0.06, type: 'lowpass' })],
  jubel: [1.3, () => { [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(i * 0.1, f, 0.3, { type: 'triangle', gain: 0.06 })); noise(0.1, 1.1, { freq: 1800, q: 0.5, gain: 0.03 }); }],
  fanfare: [1.6, () => { [N.G4, N.C5, N.E5, N.G5].forEach((f, i) => tone(i * 0.13, f, 0.2, { type: 'triangle', gain: 0.07 })); [N.C6, N.E6].forEach((f) => tone(0.58, f, 0.9, { type: 'triangle', gain: 0.045 })); }],
  hm: [0.5, () => tone(0, 180, 0.4, { to: 230, type: 'triangle', gain: 0.06 })],
  bip: [0.25, () => tone(0, 980, 0.12, { type: 'square', gain: 0.025 })],
  bipspoerg: [1.0, () => { tone(0, 900, 0.1, { type: 'square', gain: 0.025 }); tone(0.3, 900, 0.1, { type: 'square', gain: 0.025 }); tone(0.6, 800, 0.3, { type: 'square', to: 1300, gain: 0.025 }); }],
  fut: [0.35, () => { noise(0, 0.2, { freq: 400, q: 1, gain: 0.08 }); tone(0, 160, 0.15, { gain: 0.05 }); }],
  futfut: [0.8, () => { [0, 0.22, 0.44].forEach((s, i) => noise(s, 0.18, { freq: 400 + i * 80, q: 1, gain: 0.06 + i * 0.03 })); }],
  futgrin: [0.8, () => { [0, 0.18, 0.36].forEach((s) => noise(s, 0.12, { freq: 600, q: 1.5, gain: 0.05 })); }],
  bump: [0.3, () => tone(0, 140, 0.22, { to: 60, gain: 0.14 })],
  snork: [0.9, () => noise(0, 0.8, { freq: 160, to: 260, q: 4, gain: 0.07 })],
  bank: [0.6, () => { [0, 0.18, 0.36].forEach((s) => tone(s, 330, 0.06, { type: 'square', gain: 0.03 })); }],
  brag: [1.0, () => { noise(0, 0.9, { freq: 120, q: 0.6, gain: 0.25, type: 'lowpass' }); tone(0, 90, 0.6, { to: 40, gain: 0.15 }); }],
  revne: [0.5, () => { noise(0, 0.05, { freq: 3000, q: 3, gain: 0.08 }); noise(0.12, 0.05, { freq: 2600, q: 3, gain: 0.08 }); noise(0.26, 0.08, { freq: 2200, q: 3, gain: 0.09 }); }],
  zzz: [0.8, () => tone(0, 300, 0.7, { to: 220, gain: 0.03, vib: 10 })],
  // Dino-dalen ("Tuba!"): ægget, Tubas tubatoner og skiltepinden
  pip: [0.2, () => tone(0, 1500, 0.08, { type: 'triangle', gain: 0.05 })],
  tuba: [1.1, () => { tone(0, 70, 1.0, { type: 'sawtooth', gain: 0.07, vib: 3 }); tone(0, 140, 1.0, { type: 'triangle', gain: 0.03, vib: 3 }); }],
  tubahvin: [0.6, () => tone(0, 300, 0.5, { type: 'triangle', to: 900, gain: 0.05, vib: 20 })],
  gaab: [1.3, () => { tone(0, 140, 1.2, { type: 'sawtooth', to: 70, gain: 0.06 }); noise(0, 1.2, { freq: 500, q: 0.7, gain: 0.05, type: 'lowpass' }); }],
  tok: [0.25, () => { tone(0, 900, 0.06, { type: 'triangle', to: 600, gain: 0.08 }); noise(0, 0.04, { freq: 2200, q: 2, gain: 0.05 }); }],
};

export function sfx(name) {
  if (!ready() || !SFX[name]) return 0;
  try { SFX[name][1](); } catch { /* ignorer */ }
  return SFX[name][0];
}

// Spil en række effekter efter hinanden (BEKRÆFT, efterscene). alive() stopper rækken, fx når opslaget skiftes.
export async function sfxSeq(names = [], alive = () => true) {
  for (const n of names) {
    if (!alive()) return;
    const d = sfx(n);
    await sleep((d || 0.1) * 1000 * 0.8);
  }
}

// Blød tone, når en bogstavlyd ikke er indtalt: lang lyd = blød, lang tone; hoppe-lyd = kort blip
export function letterTone(b) {
  if (!ready()) return;
  const vok = 'aeiouyæøå'.includes(b);
  const base = vok ? 520 : 330;
  const off = (b.charCodeAt(0) % 7) * 18;
  if (lydtype(b) === 'hop') tone(0, base + off + 120, 0.13, { type: 'triangle', gain: 0.06 });
  else tone(0, base + off, 0.6, { gain: 0.05, vib: 4 });
}

// ================= Forælderens optagelser (IndexedDB) =================
// Robust over for Safari: en lukket forbindelse (dvale, baggrund) eller en åbning, der aldrig svarer,
// nulstiller forbindelsen, så næste forsøg åbner en ny. Intet her må få appen til at hænge.

const DB_NAME = 'll_audio', STORE = 'klip';
let dbp = null;
const keys = new Set();
const bufs = new Map(); // afkodede klip (Web Audio)
const urls = new Map(); // objekt-URL'er (reserve: <audio>)

function openDb() {
  if (dbp) return dbp;
  const p = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => {
        const db = r.result;
        db.onclose = () => { if (dbp === p) dbp = null; };
        db.onversionchange = () => { db.close(); if (dbp === p) dbp = null; };
        res(db);
      };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    } catch (e) { rej(e); }
  });
  dbp = Promise.race([p, sleep(3000).then(() => { throw new Error('idb-timeout'); })]);
  const mine = dbp;
  mine.catch(() => { if (dbp === mine) dbp = null; });
  return dbp;
}

function tx(mode, fn, retry = true) {
  return openDb().then((db) => new Promise((res, rej) => {
    let t;
    try { t = db.transaction(STORE, mode); } catch (e) { rej(e); return; }
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req ? req.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  })).catch((e) => {
    // Forbindelsen er lukket under os (InvalidStateError): åbn en ny og prøv én gang til
    if (retry && (e?.name === 'InvalidStateError' || /closing|closed|lost/i.test(String(e?.message)))) { dbp = null; return tx(mode, fn, false); }
    throw e;
  });
}

export async function initRecordings() {
  try { (await tx('readonly', (s) => s.getAllKeys())).forEach((k) => keys.add(k)); } catch { /* ingen IndexedDB */ }
}
export const hasRec = (k) => keys.has(k);
export const recKeys = () => [...keys];

function forget(k) {
  bufs.delete(k);
  if (urls.has(k)) { URL.revokeObjectURL(urls.get(k)); urls.delete(k); }
}
export async function saveRec(k, blob) {
  await tx('readwrite', (s) => s.put(blob, k));
  keys.add(k);
  forget(k);
}
export async function delRec(k) {
  await tx('readwrite', (s) => s.delete(k));
  keys.delete(k);
  forget(k);
}
export async function clearRecs() {
  try { await tx('readwrite', (s) => s.clear()); } catch { /* ignorer */ }
  [...keys].forEach(forget);
  keys.clear();
}

const recBlob = (k) => tx('readonly', (s) => s.get(k));

async function recBuffer(k) {
  if (bufs.has(k)) return bufs.get(k);
  const blob = await recBlob(k);
  if (!blob) return null;
  const ab = await blob.arrayBuffer();
  const buf = await new Promise((res, rej) => { try { const p = ctx.decodeAudioData(ab, res, rej); p?.catch?.(rej); } catch (e) { rej(e); } });
  bufs.set(k, buf);
  return buf;
}
async function recUrl(k) {
  if (urls.has(k)) return urls.get(k);
  const blob = await recBlob(k);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urls.set(k, u);
  return u;
}

// ================= Afspilning (optagelser og Jeppe-klip) =================
// Én afspilning ad gangen. stopAudio() stopper lyden OG afslutter dens promise med det samme,
// så kæder, der venter på et klip, ikke hænger efter et afbrudt klip.
let curAudio = null, curSrc = null, curDone = null, playTok = 0;
const wakers = new Set(); // ventende indlæsninger (bounded), som stopAudio() afbryder
function stopAudio() {
  playTok++;
  try { curAudio?.pause(); } catch { /* */ }
  try { curSrc?.stop(); } catch { /* */ }
  curAudio = null; curSrc = null;
  const d = curDone; curDone = null; d?.();
  if (wakers.size) { const w = [...wakers]; wakers.clear(); w.forEach((f) => f()); }
}
// Vent på p, men højst ms – og slet ikke længere, når afspilningen stoppes (stopAudio, et tryk, et skærmskift).
// Et netværk eller en afkodning, der aldrig svarer, må ikke holde en kæde fast.
function bounded(p, ms) {
  return new Promise((res, rej) => {
    let t = null;
    const end = (fn, v) => { clearTimeout(t); wakers.delete(wake); fn(v); };
    const wake = () => end(rej, new Error('afbrudt'));
    t = setTimeout(() => end(rej, new Error('timeout')), ms);
    wakers.add(wake);
    Promise.resolve(p).then((v) => end(res, v), (e) => end(rej, e));
  });
}
// start(done) starter lyden og returnerer en sikkerheds-timer; promisen afsluttes ved done() eller stopAudio()
const run = (start) => new Promise((res) => {
  let t = null;
  const done = () => { clearTimeout(t); if (curDone === done) curDone = null; res(); };
  curDone = done;
  t = start(done);
});

// Testkroge (sættes kun af browsertesten): window.__llTaleRate afspiller klippene hurtigere, og
// window.__llTaleSpy(ev, tekst, ekstra) får besked om al tale ('speak', 'end', 'cancel', 'bogstav').
const testRate = () => Number(window.__llTaleRate) || 1;
const spy = (ev, text, extra = {}) => { try { window.__llTaleSpy?.(ev, text, extra); } catch { /* */ } };

// Afspil en optagelse. Web Audio (låst op i et tryk) bruges først, fordi iPad'en ellers kan afvise
// <audio>.play() langt fra et brugertryk. Returnerer true, når klippet er afspillet eller afbrudt.
export async function playRec(k, maxMs = 4000) {
  if (!soundOn || !keys.has(k)) return false;
  stopAudio();
  const my = playTok;
  if (ctx && ctx.state === 'running') {
    try {
      const buf = await bounded(recBuffer(k), LOAD_MS);
      if (my !== playTok) return true; // afbrudt, mens klippet blev hentet
      if (buf) {
        await run((done) => {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.onended = done;
          curSrc = src;
          src.start();
          return setTimeout(() => { try { src.stop(); } catch { /* */ } done(); }, Math.min(maxMs, buf.duration * 1000 + 400));
        });
        return true;
      }
    } catch { if (my !== playTok) return true; /* kunne ikke hentes/afkodes i tide: prøv <audio> */ }
  }
  let u;
  try { u = await bounded(recUrl(k), LOAD_MS); } catch { return my !== playTok; }
  if (my !== playTok) return true;
  if (!u) return false;
  let ok = true;
  await run((done) => {
    const a = new Audio(u);
    curAudio = a;
    a.onended = done;
    a.onerror = () => { ok = false; done(); };
    a.play().catch(() => { ok = false; done(); });
    return setTimeout(() => { try { a.pause(); } catch { /* */ } done(); }, maxMs);
  });
  return ok;
}

// ---- Jeppe-klippene (public/lyd/manifest.json, lavet af tools/lyd/tts.py app) ----
let manifest = null;
// manifest.json hentes altid frisk (no-cache = spørg serveren hver gang). Klippene caches gerne, men hver adresse
// har ?v=<indholds-hash> fra tts.py, så en ny udgave af et klip (fx bogstav/a.mp3) aldrig spilles fra en gammel cache.
export async function initTale() {
  try {
    const r = await fetch('lyd/manifest.json', { cache: 'no-cache' });
    if (r.ok) manifest = await r.json();
  } catch { /* intet manifest: Sara er nødløsningen */ }
  if (manifest?.bogstaver) setTimeout(() => Object.values(manifest.bogstaver).forEach((c) => fetchBytes(clipUrl(c)).catch(() => {})), 1500);
  return !!manifest;
}
export const hasLetterClip = (b) => !!manifest?.bogstaver?.[String(b).toLowerCase()];
export const hasClip = (text) => !!clipsFor(text);
// Kan appen sige bogstavlyden? (forælderens optagelse eller Jeppes klip)
export const hasLetterSound = (b) => hasRec(`lyd:${String(b).toLowerCase()}`) || hasLetterClip(b);

const clipUrl = (c) => `lyd/${c.f}${c.v ? `?v=${encodeURIComponent(c.v)}` : ''}`;
const clipFor = (t) => manifest?.clips?.[taleNoegle(t)] || null;
// Hele teksten, ellers sætning for sætning, hvis alle dele findes (fx "sol." + "Ja!")
function clipsFor(text) {
  const c = clipFor(text);
  if (c) return [c];
  const parts = String(text).split(/(?<=[.!?:])\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const cs = parts.map(clipFor);
  return cs.every(Boolean) ? cs : null;
}

const bytes = new Map(); // url → Promise<ArrayBuffer> (mp3-filerne er små)
const decoded = new Map(); // url → AudioBuffer (de senest brugte)
function fetchBytes(url) {
  if (!bytes.has(url)) {
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => ac?.abort(), FETCH_MS);
    const p = fetch(url, ac ? { signal: ac.signal } : undefined)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .finally(() => clearTimeout(t));
    p.catch(() => bytes.delete(url)); // en fejl eller en afbrudt hentning prøves igen næste gang
    bytes.set(url, p);
  }
  return bytes.get(url);
}
async function clipBuffer(url) {
  if (decoded.has(url)) { const b = decoded.get(url); decoded.delete(url); decoded.set(url, b); return b; }
  const ab = await fetchBytes(url);
  const buf = await new Promise((res, rej) => { try { const p = ctx.decodeAudioData(ab.slice(0), res, rej); p?.catch?.(rej); } catch (e) { rej(e); } });
  decoded.set(url, buf);
  if (decoded.size > 48) decoded.delete(decoded.keys().next().value);
  return buf;
}

// Afspil ét klip: Web Audio, når den er låst op, ellers <audio>. onStart kaldes, når lyden begynder.
// Returnerer 'ok', 'afbrudt' (stopAudio eller en anden lyd tog over) eller 'fejl' (kunne ikke afspilles).
// Alle ventetider er begrænsede: hentning + afkodning (LOAD_MS), <audio> (klippets længde + 2,5 s) og oplåsning.
async function playClip(c, { onStart = null, retry = true } = {}) {
  stopAudio();
  const my = playTok;
  const rate = testRate();
  const url = clipUrl(c);
  const ms = (c.d * 1000) / rate;
  if (ctx && ctx.state === 'running') {
    try {
      const buf = await bounded(clipBuffer(url), LOAD_MS);
      if (my !== playTok) return 'afbrudt';
      await run((done) => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        src.connect(ctx.destination);
        src.onended = done;
        curSrc = src;
        src.start();
        onStart?.();
        return setTimeout(() => { try { src.stop(); } catch { /* */ } done(); }, ms + 400);
      });
      return my === playTok ? 'ok' : 'afbrudt';
    } catch { if (my !== playTok) return 'afbrudt'; /* ellers: prøv <audio> */ }
  }
  let ok = true, blocked = false;
  await run((done) => {
    const a = new Audio(url);
    curAudio = a;
    try { a.playbackRate = rate; } catch { /* */ }
    a.onplaying = () => { a.onplaying = null; onStart?.(); };
    a.onended = done;
    a.onerror = () => { ok = false; done(); };
    a.play().catch((e) => { ok = false; blocked = e?.name === 'NotAllowedError'; done(); });
    return setTimeout(() => { try { a.pause(); } catch { /* */ } done(); }, ms + 2500);
  });
  if (my !== playTok) return 'afbrudt';
  // iPad: afvist, fordi lyden ikke er låst op endnu (fx tale startet i pointerdown, som iOS ikke regner for et
  // tryk). Vent kort på oplåsningen (touchend/klik kommer lige efter), og afspil så klippet med Web Audio.
  if (!ok && blocked && retry) {
    let up = false;
    try { up = await bounded(whenRunning(UNLOCK_MS), UNLOCK_MS + 200); } catch { return 'afbrudt'; }
    if (my !== playTok) return 'afbrudt';
    if (up) return playClip(c, { onStart, retry: false });
  }
  return ok ? 'ok' : 'fejl';
}

// Optag med MediaRecorder (maks 3 sek.). Returnerer { stop(), done: Promise<Blob> }.
// Mikrofonen lukkes altid igen: også når tilladelsen kommer for sent, eller MediaRecorder fejler.
export async function startRecording(maxMs = 3000) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('nosupport');
  const gum = navigator.mediaDevices.getUserMedia({ audio: true });
  const stream = await Promise.race([
    gum,
    sleep(15000).then(() => {
      gum.then((s) => s.getTracks().forEach((t) => t.stop()), () => {}); // kommer tilladelsen senere, lukkes den straks
      throw new Error('timeout');
    }),
  ]);
  const closeStream = () => stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* */ } });
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
  let rec;
  const chunks = [];
  let done;
  try {
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onerror = () => { if (rec.state !== 'inactive') rec.stop(); else closeStream(); };
    done = new Promise((res) => {
      rec.onstop = () => {
        closeStream();
        res(new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }));
      };
    });
    rec.start();
  } catch (e) {
    closeStream();
    throw e;
  }
  const timer = setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, maxMs);
  return { stop: () => { clearTimeout(timer); if (rec.state !== 'inactive') rec.stop(); }, done };
}

// ================= Tale: Jeppe-klip, Sara kun som nødløsning =================

let voices = [];
let voice = null;
const hasTTS = () => 'speechSynthesis' in window;

function loadVoices() {
  try {
    voices = speechSynthesis.getVoices() || [];
    const da = voices.filter((v) => /^da/i.test(v.lang));
    // Den forbedrede/premium-udgave lyder markant bedre end standardstemmen (navnet er oversat på dansk iOS/macOS)
    const better = /forbedret|enhanced|premium|forbättrad/i;
    voice = da.find((v) => /sara/i.test(v.name) && better.test(v.name)) || da.find((v) => better.test(v.name))
      || da.find((v) => /sara/i.test(v.name)) || da.find((v) => v.localService === true) || da[0] || null;
  } catch { voices = []; voice = null; }
}
if (hasTTS()) {
  loadVoices();
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch { /* ældre Safari */ }
}

let pending = null; // afbryder den igangværende say()
export function stopSpeech() {
  try { if (hasTTS()) speechSynthesis.cancel(); } catch { /* */ }
  stopAudio();
  if (pending) { const p = pending; pending = null; p(); }
}

// Afbrydelses-generation: hver ny instruktion, hvert tryk og hvert skærmskift tæller op.
// En kæde (instruktion eller tryk-handler) gemmer generationen og stopper, når den ikke længere er aktuel,
// så den aldrig taler videre oven i den næste skærm eller det næste svar.
let sgen = 0;
export const speechGen = () => sgen;
export function interrupt() { sgen++; stopSpeech(); return sgen; }
// Til tryk-handlere: afbryd det, der tales, og få en "er jeg stadig aktuel?"-funktion
export function claim() { const g = interrupt(); return () => sgen === g; }
document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); }); // iOS: ingen hængende kø

const WORD_RE = ORD_RE; // ordene i en tekst (samme som ord-for-ord-fremhævningen i tale.js)

// Sig en tekst. onWord(i) kaldes, når ord nr. i siges (og -1 til sidst).
// Teksten slås op i manifest.json (Jeppes klip). Mangler den, bruges browserens stemme (Sara) som nødløsning,
// og det skrives i konsollen: [tale] mangler: <tekst>. Promisen afsluttes altid: ved slut, ved næste
// say()/stopSpeech(), når en anden lyd tager over, og ved tidsgrænser.
export function say(text, { onWord = null } = {}) {
  stopSpeech();
  text = String(text);
  spy('speak', text);
  return new Promise((resolve) => {
    const timers = [];
    let done = false;
    const finish = (ev = 'end') => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      if (pending === cancel) pending = null;
      if (onWord) onWord(-1);
      spy(ev, text);
      resolve();
    };
    const cancel = () => finish('cancel');
    pending = cancel;
    const words = [...text.matchAll(WORD_RE)];
    if (!soundOn) { // lyd fra: fremhævningen går stille igennem
      if (onWord) words.forEach((_, i) => timers.push(setTimeout(() => { if (!done) onWord(i); }, i * 450)));
      timers.push(setTimeout(finish, onWord ? words.length * 450 + 250 : 150));
      return;
    }
    const clips = clipsFor(text);
    if (!clips) { sara(text, { onWord, timers, finish, isDone: () => done }); return; }
    (async () => {
      const starts = onWord ? ordStart(text, clips) : []; // fra klippenes målte tale-stykker (tale.js)
      const rate = testRate();
      let off = 0;
      for (const [k, c] of clips.entries()) {
        if (done) return;
        const t0 = off;
        const res = await playClip(c, {
          onStart: () => starts.forEach((s, i) => {
            if (s >= t0 && (k === clips.length - 1 || s < t0 + c.d)) timers.push(setTimeout(() => { if (!done) onWord(i); }, ((s - t0) * 1000) / rate));
          }),
        });
        if (done) return;
        if (res === 'afbrudt') { finish('cancel'); return; } // en anden lyd tog over
        if (res === 'fejl') { sara(text, { onWord, timers, finish, isDone: () => done }); return; }
        off += c.d;
      }
      finish('end');
    })();
  });
}

// Nødløsningen: browserens danske stemme (speechSynthesis). Bruges kun, når et klip mangler eller ikke kan
// afspilles. Begynder talen aldrig, afsluttes den efter 2,5 sek.; ellers efter 1 s + 110 ms pr. tegn.
function sara(text, { onWord, timers, finish, isDone }) {
  console.warn('[tale] mangler:', text);
  if (hasTTS() && !voices.length) loadVoices();
  const words = [...text.matchAll(WORD_RE)].map((m) => ({ s: m.index, e: m.index + m[0].length }));
  let boundary = false, started = false;
  const wordTimers = () => { if (onWord) words.forEach((_, i) => timers.push(setTimeout(() => { if (!boundary && !isDone()) onWord(i); }, i * 450))); };
  if (!(hasTTS() && voices.length > 0)) {
    wordTimers();
    timers.push(setTimeout(finish, onWord ? words.length * 450 + 250 : 150));
    return;
  }
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'da-DK';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.onstart = () => {
      if (started || isDone()) return;
      started = true;
      wordTimers();
      timers.push(setTimeout(finish, Math.max(1000 + 110 * text.length, onWord ? words.length * 450 + 600 : 0)));
    };
    u.onend = () => { if (!onWord || boundary) finish(); else timers.push(setTimeout(finish, 300)); };
    u.onerror = () => finish();
    u.onboundary = (e) => {
      if (!onWord || isDone() || (e.name && e.name !== 'word')) return;
      boundary = true;
      const i = words.findIndex((w) => e.charIndex < w.e);
      if (i >= 0) onWord(i);
    };
    timers.push(setTimeout(() => { if (!started) finish(); }, 2500)); // talen begyndte aldrig
    speechSynthesis.speak(u);
  } catch { finish(); }
}

// ================= Bogstavlyde og ord =================

// Bogstavlyd: forælderens optagelse → Jeppes bogstavlyd (public/lyd/bogstav/) → visuel lyd (/lll/) i Bips
// taleboble + blød tone (kun hvis ingen af lydene findes).
// visual: false = vis ikke bogstavet (når opgaven netop er at finde bogstavet ud fra lyden).
// anchor = elementet, der lyser (boblen sættes ved det, så barnet ser lyden der, hvor han kigger).
export async function playLetter(b, { visual = true, anchor = null } = {}) {
  b = b.toLowerCase();
  if (soundOn && keys.has(`lyd:${b}`)) {
    spy('bogstav', b, { src: 'optagelse' });
    if (await playRec(`lyd:${b}`, 3500)) return;
  }
  const c = manifest?.bogstaver?.[b];
  if (soundOn && c) {
    spy('bogstav', b, { src: 'klip' });
    if (await playClip(c) !== 'fejl') return;
  }
  spy('bogstav', b, { src: 'visuel' });
  if (visual) events.dispatchEvent(new CustomEvent('visual', { detail: { text: `/${strakt(b)}/`, anchor } }));
  letterTone(b);
  await sleep(lydtype(b) === 'lang' ? 650 : 320);
}

// Omtrent hvor længe playLetter(b) varer (ms), så Glidebanen kan glide videre, mens lyden lyder.
// En optagelses længde kendes ikke på forhånd: så bruges et skøn (Glidebanen venter alligevel på lyden).
export function letterMs(b) {
  b = String(b).toLowerCase();
  const c = manifest?.bogstaver?.[b];
  if (!soundOn || keys.has(`lyd:${b}`) || !c) return lydtype(b) === 'hop' ? 300 : 700;
  return (c.d * 1000) / testRate();
}

// Helordet: forælderens optagelse (ord:løb), ellers Jeppe
export async function playWord(w) {
  if (await playRec(`ord:${w.toLowerCase()}`)) return;
  await say(w);
}

// Har forælderen indtalt lyderingen (ord:løb:lyd)?
export const hasLydering = (w) => hasRec(`ord:${w.toLowerCase()}:lyd`);
export const playLydering = (w) => playRec(`ord:${w.toLowerCase()}:lyd`);
