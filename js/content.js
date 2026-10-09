// Indhold som data: bogstaver, billedordbogen, stederne på Dut, historierne og missionerne.
// Historieteksterne kommer uændret fra koncept/eksempel-historier.json via tools/konverter_historier.mjs.
import { HISTORIER, MISSIONER_JSON } from './historier.js?v=6f70bf5933';

export { HISTORIER };

// ---------- Bogstaver ----------

export const ALFABET = 'abcdefghijklmnopqrstuvwxyzæøå'.split('');
// De 17 bogstaver, klassen har haft (koncept §3.4) – slået til som standard
export const KLASSENS_17 = ['m', 'a', 'b', 'p', 'o', 'v', 'f', 'u', 'n', 'æ', 'd', 'ø', 'i', 'l', 's', 't', 'g'];

const LANGE = new Set('aeiouyæøåmnlsfvrj'.split(''));
const HOP = new Set('bdgptk'.split(''));

// 'lang' (kan holdes), 'hop' (lukkelyd), 'pust' (h) eller 'gaest' (c, q, w, x, z)
export function lydtype(b) {
  b = b.toLowerCase();
  if (LANGE.has(b)) return 'lang';
  if (HOP.has(b)) return 'hop';
  if (b === 'h') return 'pust';
  return 'gaest';
}

// Bogstavernes navne ("Find bogstavet, der hedder el" – Lydjagt, hvis en bogstavlyd hverken findes som klip eller optagelse)
export const BOGSTAVNAVN = {
  a: 'a', b: 'be', c: 'se', d: 'de', e: 'e', f: 'ef', g: 'ge', h: 'hå', i: 'i', j: 'jod', k: 'kå', l: 'el', m: 'em', n: 'en', o: 'o',
  p: 'pe', q: 'ku', r: 'er', s: 'es', t: 'te', u: 'u', v: 've', w: 'dobbelt-ve', x: 'eks', y: 'y', z: 'set', æ: 'æ', ø: 'ø', å: 'å',
};

// Visuel lyd: lange lyde strækkes (/lll/), hoppe-lyde står korte (/b/)
export const strakt = (b) => (lydtype(b) === 'lang' ? b.repeat(3) : b.toLowerCase());
// "lll-øøø-b" til lyd-hints
export const lydering = (ord) => [...ord.toLowerCase()].map(strakt).join('-');

// Drilleord (H): o har en å-hat på (klædt ud), og g sover (koncept §7.2, §9.4)
export const DRILLEORD = { og: { 0: 'hat', 1: 'sover' }, uh: { 1: 'sover' } }; // uh: h sover (kræver ikke H-lyden)

// ---------- Billedordbogen (neutral stil, kvadratiske 512×512) ----------
// icon = SVG-tegningen i ui.js, der bruges, indtil billedet findes. Pladsholderen viser aldrig ordet.

export const ORDBOG = {
  loeb: { ord: 'løb', img: 'img/ord/loeb.webp', alt: 'En dreng, der løber', icon: 'loeb' },
  loeg: { ord: 'løg', img: 'img/ord/loeg.webp', alt: 'Et løg', icon: 'loeg' },
  loeve: { ord: 'løve', img: 'img/ord/loeve.webp', alt: 'En løve', icon: 'loeve' },
  ufo: { ord: 'ufo', img: 'img/ord/ufo.webp', alt: 'En ufo', icon: 'ufo' },
  sol: { ord: 'sol', img: 'img/ord/sol.webp', alt: 'En sol', icon: 'sol' },
  is: { ord: 'is', img: 'img/ord/is.webp', alt: 'En is', icon: 'is' },
  bil: { ord: 'bil', img: 'img/ord/bil.webp', alt: 'En bil', icon: 'bil' },
  aeg: { ord: 'æg', img: 'img/ord/aeg.webp', alt: 'Et æg', icon: 'aeg' },
  tobi: { ord: 'Tobi', img: 'img/ord/tobi.webp', alt: 'Tobi i gul trøje med nummer 2', icon: 'tobi' },
  fido: { ord: 'Fido', img: 'img/ord/fido.webp', alt: 'Fido, en lille pjusket hund med store ører og nummer 10', icon: 'fido' },
  mus: { ord: 'mus', img: 'img/ord/mus.webp', alt: 'En mus', icon: 'mus' },
  lus: { ord: 'lus', img: 'img/ord/lus.webp', alt: 'En lus', icon: 'lus' },
  // Tegnes i kode, så antallet er præcist
  'ti-stjerner': { ord: 'ti', draw: { n: 10, sprite: 'stjerne' }, alt: 'Ti stjerner' },
  'to-stjerner': { ord: 'to', draw: { n: 2, sprite: 'stjerne' }, alt: 'To stjerner' },
  'ni-stjerner': { ord: 'ni', draw: { n: 9, sprite: 'stjerne' }, alt: 'Ni stjerner' },
  // "nu" er abstrakt: et startlys, der bliver grønt (aldrig EFTER-scenen, hvor Fut letter)
  nu: { ord: 'nu', alt: 'Et startlys, der bliver grønt', icon: 'startlys' },
  'ti-mus': { ord: 'ti mus', draw: { n: 10, sprite: 'mus' }, alt: 'Ti mus' },
  'to-mus': { ord: 'to mus', draw: { n: 2, sprite: 'mus' }, alt: 'To mus' },
  'ti-lus': { ord: 'ti lus', draw: { n: 10, sprite: 'lus' }, alt: 'Ti lus' },
};

// Billedordbogen fra læs sammen-historiernes JSON (fx gab · garn · glas, mus · mur · mund, Dino og Tuba). Ord, der
// allerede står ovenfor, beholder deres tegning; nye ord får en tegning i ui.js med samme navn.
for (const m of Object.values(MISSIONER_JSON)) {
  for (const [k, o] of Object.entries(m.ordbog || {})) if (!ORDBOG[k]) ORDBOG[k] = { ...o, icon: k };
}

// ---------- Dut og stederne ----------

export const DUT = {
  img: 'img/dut.webp',
  alt: 'Planeten Dut med Stadion til venstre, Dino-dalen forrest og Rumbasen til højre',
  // Tryk-områder i procent af billedet (3:2). Justér her, hvis billedet er komponeret anderledes.
  hotspots: {
    // Målt på img/dut.webp (planeten i midten): stadion øverst til venstre, rumbasen øverst til højre, dino-dalen forrest
    stadion: { x: 31, y: 17, w: 22, h: 25, label: 'Stadion' },
    dinodal: { x: 32, y: 53, w: 27, h: 28, label: 'Dino-dalen' },
    rumbase: { x: 56, y: 17, w: 19, h: 36, label: 'Rumbasen' },
  },
  // Små træskilte med ord, han kan læse (de siges ikke op – de er læsestof). x/y = hvor skiltepinden står i sandet,
  // i procent af billedet. Et tryk på skiltet går til stedet, ligesom et tryk på stedet.
  // Skiltene skaleres med scenen (font-size 2.1cqw), så de står samme sted i forhold til billedet på alle skærme.
  skilte: {
    stadion: { ord: 'Mus', x: 33, y: 33 }, // sandet til venstre for banen, over sælerne
    dinodal: { ord: 'Dino', x: 41.5, y: 79 }, // i bregnerne under Dino
    rumbase: { ord: 'Fut', x: 56.5, y: 33 }, // stien mellem vulkanen og raketten, over reden
  },
  // Figurerne på dut.webp (procent), som et skilt aldrig må dække (indholdstesten tjekker det)
  figurer: {
    raket: { x: 59.6, y: 21, w: 5, h: 16 },
    dino: { x: 35.4, y: 57.8, w: 12.1, h: 11.8 },
    saeler: { x: 29, y: 38.4, w: 9, h: 9 },
  },
};

export const STEDER = {
  stadion: {
    id: 'stadion', navn: 'Stadion', bg: 'img/stadion.webp', alt: 'Stadion: en lille skæv græsbane med mål og bænk',
    koeretoej: 'bold', historier: ['F2-loeb-tobi'], hold: 'img/hold.webp',
  },
  rumbase: {
    id: 'rumbase', navn: 'Rumbasen', bg: 'img/rumbase.webp', alt: 'Rumbasen: affyringsrampen under en natblå himmel',
    koeretoej: 'fut', historier: ['R1-ti-ni-nu'], hold: 'img/rumhold.webp',
  },
};
// Dino-dalen (og senere steder) kommer fra læs sammen-historiernes JSON: { id, navn, bg, alt, koeretoej, historier, hold }
for (const m of Object.values(MISSIONER_JSON)) if (m.sted_konfig && !STEDER[m.sted]) STEDER[m.sted] = { ...m.sted_konfig };

// ---------- Missionerne (koncept §5.1, prototype-spec "Missionen") ----------

export const MISSIONER = {
  'F2-loeb-tobi': {
    sted: 'stadion',
    opvarmning: {
      // Lydjagt × 4: l, ø, b, t (lokkere bl.a. o og u fra historien – aldrig b/p, d/t eller g/k sammen)
      lydjagt: [
        { lyd: 'l', valg: ['l', 's', 'm'] },
        { lyd: 'ø', valg: ['ø', 'o', 'i'] },
        { lyd: 'b', valg: ['b', 'u', 's'] },
        { lyd: 't', valg: ['t', 'o', 'l'] },
      ],
      hvilkenLyd: { bogstav: 's', billeder: ['sol', 'bil', 'aeg'], rigtigt: 'sol' },
      sigSelv: 'l',
    },
    // "Skriv lyden" efter Lydjagt: bogstaver fra historien, det første, der er slået til (skriv.js)
    skriv: ['l'],
    nyt: {
      type: 'sove-aeg', ord: 'og',
      bip: 'Det her ord driller. o siger å, og g sover. Det siger: og.',
      saetninger: ['Tobi løb og løb.', 'Og Fido?'],
    },
    dagensOrd: {
      glide: [
        { ord: 'Tobi', billede: 'tobi', navnekort: true },
        { ord: 'Fido', billede: 'fido', navnekort: true }, // navne øves her, før de står i historien (koncept §6.5)
        { ord: 'løb', billede: 'loeb' },
        { ord: 'ufo', billede: 'ufo' },
      ],
      laesVaelg: [{ ord: 'løb', billeder: ['loeb', 'loeg', 'loeve'], rigtigt: 'loeb' }],
      byg: [
        { ord: 'løb', trin1: ['l', 's', 'm'], lokkere: ['a', 's'] },
        { ord: 'ufo', trin1: ['u', 'i', 'a'], lokkere: ['s', 'm'] },
      ],
    },
    // Kaptajnens kommando før opslag 3 (brikker pr. skrivetrin fra historiens beskrivelse)
    kommando: { 3: { trin1: ['l', 's', 'm'], lokkere: ['a', 's'], reaktion: 'kridt' } },
    tavlePos: { 3: 'tl' }, // tavlen øverst til venstre, hvor himlen er tom (storskærmen i billedet står øverst til højre)
    tjek: { 2: { billeder: ['ti-mus', 'to-mus', 'ti-lus'], rigtigt: 'ti-mus', hint: 't-i … m-u-s' } },
    effekter: {
      0: { sfx: ['pling'], anim: 'zoom' },
      1: { sfx: ['floejte', 'plop'], anim: 'shake' },
      2: { sfx: ['pip10'], anim: 'zoom' },
      3: { sfx: ['swoosh', 'vup'], anim: 'speed' },
      4: { sfx: ['ufo'], anim: 'pan-up' },
      5: { sfx: ['vinge', 'kraa'], anim: 'speed' },
      6: { sfx: ['rul', 'jubel'], anim: 'zoom' },
      7: { sfx: ['hm', 'swoosh', 'kraa'], anim: 'pan-up' },
    },
    detalje: { id: 'f2-haette', sted: 'stadion', icon: 'haette', alt: 'Odas hætte med ti mus på bænken' },
  },
  'R1-ti-ni-nu': {
    sted: 'rumbase',
    opvarmning: {
      lydjagt: [
        { lyd: 'n', valg: ['n', 'l', 'o'] },
        { lyd: 't', valg: ['t', 'm', 'i'] },
        { lyd: 'i', valg: ['i', 'a', 's'] },
        { lyd: 'u', valg: ['u', 'n', 'æ'] },
      ],
      hvilkenLyd: { bogstav: 'i', billeder: ['is', 'sol', 'aeg'], rigtigt: 'is' },
      sigSelv: 'n',
    },
    skriv: ['n'],
    nyt: null,
    dagensOrd: {
      glide: [
        { ord: 'ti', billede: 'ti-stjerner' },
        { ord: 'ni', billede: 'ni-stjerner' },
        { ord: 'nu', billede: 'nu' },
      ],
      // "ti" med tre billeder tegnet i kode: 10 · 2 · 9 stjerner (distraktorerne er "to" og "ni")
      laesVaelg: [{ ord: 'ti', billeder: ['ti-stjerner', 'to-stjerner', 'ni-stjerner'], rigtigt: 'ti-stjerner', blandet: true }],
      byg: [
        { ord: 'nu', trin1: ['n', 'm', 's'], lokkere: ['i', 's'] },
        { ord: 'ti', trin1: ['t', 'm', 'n'], lokkere: ['u', 's'] },
      ],
    },
    kommando: { 3: { trin1: ['n', 'm', 's'], lokkere: ['i', 's'], reaktion: 'pling' } },
    tjek: {},
    effekter: {
      0: { sfx: ['pling'], anim: 'zoom' },
      1: { sfx: ['bip', 'bip', 'fut'], anim: 'puff' },
      2: { sfx: ['bipspoerg'], anim: 'shake' },
      3: { sfx: ['fut', 'bump', 'snork'], anim: 'squash' },
      4: { sfx: ['bank', 'futgrin'], anim: 'puff' },
      5: { sfx: ['futfut', 'brag'], anim: 'shake' },
      6: { sfx: ['swoosh', 'bump'], anim: 'speed' },
    },
    detalje: { id: 'r1-skilt', sted: 'rumbase', icon: 'nu-skilt', alt: 'Tavlen med nu ved rampen' },
  },
};
// "Skriv lyden" i læs sammen-historiernes opvarmning (bogstaver fra historien; det første, der er slået til)
const SKRIV_JSON = { 'D2-tuba': ['m', 'æ'] };
// Læs sammen-historiernes missioner står i JSON-filen (koncept/laes-sammen-historier.json → historier.js)
for (const [id, m] of Object.entries(MISSIONER_JSON)) {
  MISSIONER[id] = {
    sted: m.sted, opvarmning: m.opvarmning, nyt: m.nyt, dagensOrd: m.dagensOrd,
    kommando: m.kommando || {}, tjek: m.tjek || {}, effekter: m.effekter || {}, detalje: m.detalje, lydstudieOrd: m.lydstudie_ord || [],
    skiltIBilledet: m.skilt_i_billedet || {}, // hvor skiltet står i billedet (procent), så kommandoordet kan stå PÅ det
    skriv: m.skriv || SKRIV_JSON[id] || [],
  };
}

// ---------- Hjælpere til historierne ----------

export const historie = (id) => HISTORIER[id];
export const mappe = (id) => `img/${HISTORIER[id].mappe}/`;
export const billede = (id, navn) => `${mappe(id)}${navn}.webp`;

const ORD_RE = /[A-Za-zÆØÅæøåÉéÜü]+/g;
export const ordITekst = (tekst) => tekst.match(ORD_RE) || [];

// Del en tekst i linjer af tokens: { w: 'Tobi' } eller { t: '! ' } (tegnsætning/mellemrum)
export function tokens(tekst) {
  return tekst.split('\n').map((linje) => {
    const out = [];
    let last = 0;
    for (const m of linje.matchAll(ORD_RE)) {
      if (m.index > last) out.push({ t: linje.slice(last, m.index) });
      out.push({ w: m[0] });
      last = m.index + m[0].length;
    }
    if (last < linje.length) out.push({ t: linje.slice(last) });
    return out;
  });
}

// Antal bogstaver i en tekst (til læsefingerens minimumstid)
export const antalBogstaver = (tekst) => ordITekst(tekst).join('').length;

// Samtalekort til første læsning: { 2: 'Hvorfor glemmer de at spille?', 7: '…' }
export function samtalekort(id) {
  const out = {};
  for (const s of HISTORIER[id].samtalekort.foerste_laesning) {
    const m = s.match(/^Efter opslag (\d+)[^:]*:\s*(.+)$/);
    if (m) out[Number(m[1])] = m[2];
  }
  return out;
}

// Alle billedstier, som appen kan bede om (til indholdstesten og forvarmning)
export function alleBilleder() {
  const set = new Set([DUT.img, ...Object.values(STEDER).flatMap((s) => [s.bg, s.hold])]);
  for (const o of Object.values(ORDBOG)) if (o.img) set.add(o.img);
  for (const id of Object.keys(HISTORIER)) {
    set.add(billede(id, 'cover'));
    set.add(billede(id, 'efterscene'));
    for (const o of HISTORIER[id].opslag) { set.add(billede(id, `${o.nr}-foer`)); set.add(billede(id, `${o.nr}-efter`)); }
  }
  return [...set];
}

// Ordene i lydstudiet: Dagens ord fra historierne + drilleordet (læs sammen-historiernes ord fra JSON-filen)
export const DAGENS_ORD_LYD = [...new Set(['løb', 'Tobi', 'Fido', 'ufo', 'og', 'ti', 'ni', 'nu',
  ...Object.values(MISSIONER).flatMap((m) => m.lydstudieOrd || [])])];

// Læs sammen: den voksne læser den lille tekst, barnet den store linje (koncept §6.2, laes-sammen-historier.json)
export const laesSammen = (id) => HISTORIER[id]?.form === 'laes-sammen';

// Bogstaver, en historie kræver (til advarslen, når et bogstav er slået fra)
export function kraevedeBogstaver(id) {
  const h = HISTORIER[id];
  const set = new Set();
  for (const o of h.opslag) for (const w of o.ord) {
    if (h.smaaord_H.includes(w.ord.toLowerCase())) continue;
    for (const c of w.ord.toLowerCase()) set.add(c);
  }
  for (const c of h.titel.toLowerCase().replace(/[^a-zæøå]/g, '')) set.add(c);
  return [...set];
}
