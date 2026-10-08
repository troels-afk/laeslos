// Fælles komponenter: SVG-ikoner (tegnet i kode, ingen emoji), billeder med pladsholder, Bip og hans taleboble,
// trin-prikker, hold-knapper og overlays.
import { ORDBOG, STEDER } from './content.js?v=03a6968a20';
import { esc, sleep } from './util.js?v=03a6968a20';
import { events, say, sfx, interrupt, speechGen } from './audio.js?v=03a6968a20';
import { TALE } from './tale.js?v=03a6968a20';

const INK = '#2b2a33';
const S = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

// ================= Ikoner =================

const star = (cx, cy, r, fill = '#ffd24a', extra = '') => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}" ${extra}/>`;
};

// "Hvem er med i dag?": barnets hånd (håndflade og fem fingre) med det gule anførerbind om håndleddet, og til
// "Vi læser sammen" barnets lille hånd ved siden af den voksnes store hånd. Hånden tegnes som én silhuet: alle
// former først med en tyk mørk streg, så de samme former ovenpå med kun farve (stregerne mellem fingrene bliver stående).
const HAND = `<rect x="18" y="40" width="13" height="40" rx="6.5" transform="rotate(-10 24 80)"/>
  <rect x="32" y="20" width="14" height="58" rx="7"/><rect x="47" y="14" width="14" height="64" rx="7"/>
  <rect x="62" y="22" width="13" height="56" rx="6.5" transform="rotate(7 68 78)"/>
  <rect x="72" y="62" width="13" height="38" rx="6.5" transform="rotate(42 78 98)"/>
  <rect x="17" y="62" width="62" height="52" rx="22"/><rect x="30" y="100" width="36" height="60" rx="6"/>`;
const hand = (fill) => `<g fill="${INK}" stroke="${INK}" stroke-width="7" stroke-linejoin="round">${HAND}</g><g fill="${fill}">${HAND}</g>`;
const kaptajnHaand = `${hand('#f6cfa8')}
  <rect x="24" y="116" width="48" height="26" rx="6" fill="#ffd24a" ${S}/>
  ${star(48, 129, 10, '#fff', `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`)}`;

const DINO = `<path d="M14 66 Q4 66 2 58 Q12 62 20 58" fill="#7cc35b" ${S}/>
    <path d="M26 74 v16 h9 v-14 M46 76 v14 h9 v-16" fill="#6bb04c" ${S}/>
    <path d="M60 54 Q68 40 66 24 Q65 12 76 11 Q88 10 90 19 Q91 28 81 28 Q75 28 75 34 Q77 50 70 66 Z" fill="#7cc35b" ${S}/>
    <ellipse cx="40" cy="62" rx="27" ry="19" fill="#7cc35b" ${S}/>
    <path d="M22 70 Q40 80 58 70" fill="none" stroke="#bfe39b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="80" cy="18" r="3.2" fill="${INK}"/><path d="M83 24 q4 2 6 -1" fill="none" ${S} stroke-width="2.5"/>`;
const TUBA = `<path d="M20 96 Q18 60 40 50 L44 34 Q46 14 66 14 Q90 14 92 34 Q93 48 80 52 L60 54 Q58 62 52 66 Q62 80 60 96Z" fill="#f08a3c" ${S}/>
    <path d="M60 54 Q74 62 88 52" fill="#fff6dc" ${S} stroke-width="3"/>
    <path d="M64 55 v4 M70 56 v4 M76 56 v4 M82 54 v4" ${S} stroke-width="2.5"/>
    <circle cx="70" cy="30" r="5" fill="#fff" ${S} stroke-width="2.5"/><circle cx="71" cy="31" r="2.2" fill="${INK}"/>
    <path d="M48 70 l8 4 l-2 6" fill="none" ${S} stroke-width="3"/>`;

export const ICON = {
  anfoerer: () => `<svg viewBox="6 6 90 146" aria-hidden="true">${kaptajnHaand}</svg>`,
  anfoererVoksen: () => `<svg viewBox="4 2 186 150" aria-hidden="true"><g transform="translate(6 46) scale(.68)">${kaptajnHaand}</g>
    <g transform="translate(84 0)">${hand('#ecb689')}</g></svg>`,
  bip: () => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M30 26 V10" ${S}/><circle cx="30" cy="9" r="6" fill="#ef6a4c" ${S} stroke-width="3"/>
    <rect x="14" y="24" width="72" height="62" rx="16" fill="#cfe2ec" ${S}/>
    <rect x="23" y="33" width="54" height="36" rx="9" fill="#24305e" ${S} stroke-width="3"/>
    <circle cx="39" cy="49" r="5" fill="#7ee7f2"/><circle cx="61" cy="49" r="5" fill="#7ee7f2"/>
    <path d="M42 59 q8 6 16 0" fill="none" stroke="#7ee7f2" stroke-width="3" stroke-linecap="round"/>
    <rect x="40" y="74" width="20" height="7" rx="3" fill="#9fb9c8" stroke="${INK}" stroke-width="2.5"/></svg>`,
  aeg: () => `<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M50 8 C22 8 10 58 12 78 C14 102 32 114 50 114 C68 114 86 102 88 78 C90 58 78 8 50 8Z" fill="#fff6dc" ${S}/>
    <circle cx="36" cy="48" r="5" fill="#e9c98a"/><circle cx="62" cy="38" r="4" fill="#e9c98a"/><circle cx="66" cy="74" r="6" fill="#e9c98a"/><circle cx="38" cy="86" r="4" fill="#e9c98a"/></svg>`,
  bold: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="#fff" ${S}/>
    <polygon points="50,33 66,45 60,64 40,64 34,45" fill="${INK}"/>
    <path d="M50 33 V10 M66 45 L88 38 M60 64 L74 84 M40 64 L26 84 M34 45 L12 38" ${S} stroke-width="3"/>
    <path d="M38 10 l12 0 M86 50 l-2 -12 M76 84 l-10 6 M24 84 l10 6 M14 50 l2 -12" fill="none" ${S} stroke-width="3"/></svg>`,
  fut: () => `<svg viewBox="0 0 120 100" aria-hidden="true"><g transform="rotate(90 60 50)">
    <path d="M60 6 C80 22 84 50 80 74 H40 C36 50 40 22 60 6Z" fill="#ef5b45" ${S}/>
    <path d="M40 62 L24 84 L42 78 Z M80 62 L96 84 L78 78 Z" fill="#c43d2c" ${S}/>
    <circle cx="51" cy="40" r="7" fill="#e8f6ff" ${S} stroke-width="3"/><circle cx="69" cy="40" r="7" fill="#e8f6ff" ${S} stroke-width="3"/>
    <circle cx="52" cy="41" r="2.5" fill="${INK}"/><circle cx="70" cy="41" r="2.5" fill="${INK}"/>
    <path d="M53 55 q7 5 14 0" fill="none" ${S} stroke-width="3"/>
    <path d="M46 78 q14 18 28 0" fill="#ffd24a" ${S} stroke-width="3"/></g></svg>`,
  tavle: () => `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="6" y="6" width="108" height="72" rx="6" fill="#c8915a" ${S}/>
    <rect x="15" y="14" width="90" height="56" rx="3" fill="#2f5d4a" ${S} stroke-width="3"/>
    <path d="M28 52 q12 -18 24 -4 t26 -6" fill="none" stroke="#f3f0e6" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <rect x="70" y="74" width="22" height="7" rx="3" fill="#fff" ${S} stroke-width="2.5"/></svg>`,
  dut: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="54" rx="44" ry="13" fill="none" stroke="#ffd24a" stroke-width="7"/>
    <circle cx="50" cy="50" r="28" fill="#7cc35b" ${S}/><path d="M30 40 q10 -8 18 0 q8 8 20 -2" fill="none" stroke="#4d9440" stroke-width="4" stroke-linecap="round"/>
    <path d="M6 54 a44 13 0 0 0 88 0" fill="none" stroke="#ffd24a" stroke-width="7"/><path d="M6 54 a44 13 0 0 0 88 0" fill="none" ${S} stroke-width="2"/></svg>`,
  tilbage: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M58 22 L28 50 L58 78" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  skab: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="22" y="8" width="56" height="86" rx="6" fill="#7fb7e6" ${S}/>
    <path d="M32 20 h36 M32 27 h36 M32 34 h36" ${S} stroke-width="3"/><rect x="60" y="50" width="8" height="18" rx="3" fill="#ffd24a" ${S} stroke-width="2.5"/></svg>`,
  floejte: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 44 h40 a24 24 0 1 1 -10 30 H14 z" fill="#f0c34a" ${S}/>
    <circle cx="62" cy="60" r="8" fill="#fff" ${S} stroke-width="3"/><path d="M78 40 q8 -14 0 -26" fill="none" ${S}/><circle cx="76" cy="12" r="5" fill="#ef6a4c" ${S} stroke-width="3"/></svg>`,
  hoejttaler: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 38 h16 l22 -18 v60 l-22 -18 h-16z" fill="#ffd24a" ${S}/>
    <path d="M64 36 q10 14 0 28 M74 26 q18 24 0 48" fill="none" ${S} stroke-width="5"/></svg>`,
  mik: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="36" y="10" width="28" height="50" rx="14" fill="#ef6a4c" ${S}/>
    <path d="M24 46 q0 26 26 26 q26 0 26 -26 M50 72 v16 M36 90 h28" fill="none" ${S} stroke-width="5"/></svg>`,
  stop: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="26" y="26" width="48" height="48" rx="8" fill="#ef6a4c" ${S}/></svg>`,
  play: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M32 20 L80 50 L32 80Z" fill="#7cc35b" ${S}/></svg>`,
  slet: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 30 h52 l-6 60 h-40z" fill="#e7e2f3" ${S}/><path d="M18 28 h64 M40 18 h20" ${S} stroke-width="5"/><path d="M42 44 v32 M58 44 v32" ${S}/></svg>`,
  check: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 54 L42 76 L84 26" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  vaagn: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 70 h80" ${S} stroke-width="5"/><path d="M24 70 a26 26 0 0 1 52 0z" fill="#ffd24a" ${S}/>
    <path d="M50 30 v-14 M26 40 l-9 -9 M74 40 l9 -9" ${S} stroke-width="5"/></svg>`,
  stjerne: (fill = '#ffd24a') => `<svg viewBox="0 0 100 100" aria-hidden="true">${star(50, 52, 44, fill, S)}</svg>`,
  haette: () => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 80 Q12 26 50 18 Q88 26 86 80 Q50 92 14 80Z" fill="#ffd24a" ${S}/>
    <path d="M28 76 Q30 46 50 42 Q70 46 72 76" fill="#f0b93a" ${S} stroke-width="3"/>
    ${[34, 50, 66].map((x) => `<circle cx="${x}" cy="66" r="7" fill="#bdb6c9" stroke="${INK}" stroke-width="2.5"/><circle cx="${x - 5}" cy="59" r="3.5" fill="#f4a8b8" stroke="${INK}" stroke-width="2"/><circle cx="${x + 5}" cy="59" r="3.5" fill="#f4a8b8" stroke="${INK}" stroke-width="2"/>`).join('')}</svg>`,
  dino: () => `<svg viewBox="0 0 100 100" aria-hidden="true">${DINO}</svg>`,
  tuba: () => `<svg viewBox="0 0 100 100" aria-hidden="true">${TUBA}</svg>`,
  // To figurer – en stor og en lille – med en åben bog: "Læs sammen" (ingen tekst, barnet skal ikke læse mærket)
  sammen: () => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M12 82 Q12 46 36 44 Q60 46 60 82Z" fill="#7fb7e6" ${S}/><circle cx="36" cy="27" r="14" fill="#f6cfa8" ${S}/>
    <path d="M50 84 Q50 60 70 58 Q90 60 90 84Z" fill="#ffd24a" ${S}/><circle cx="70" cy="45" r="10.5" fill="#f6cfa8" ${S}/>
    <path d="M24 74 L50 68 L76 74 L76 92 L50 86 L24 92Z" fill="#fff" ${S}/><path d="M50 68 V86" ${S} stroke-width="3"/>
    <path d="M31 78 l12 -3 M31 84 l12 -3 M57 75 l12 3 M57 81 l12 3" ${S} stroke-width="2"/></svg>`,
  // Skiltepinden i sandet med mus (detaljen efter "Tuba!")
  'mus-skilt': () => `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M60 64 v24" ${S} stroke-width="6"/>
    <rect x="12" y="8" width="96" height="58" rx="8" fill="#d9a066" ${S}/><path d="M22 24 h30 M66 50 h30" stroke="#b97f3a" stroke-width="2.5" stroke-linecap="round"/>
    <text x="60" y="51" text-anchor="middle" font-family="Andika, sans-serif" font-weight="700" font-size="36" fill="${INK}">mus</text></svg>`,
  'nu-skilt': () => `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="8" width="100" height="60" rx="5" fill="#2f5d4a" ${S}/>
    <text x="60" y="52" text-anchor="middle" font-family="Andika, sans-serif" font-size="38" fill="#f3f0e6">nu</text><path d="M60 68 v18" ${S} stroke-width="5"/></svg>`,
};

// ---------- Billedordbogens tegninger (pladsholdere, indtil billederne findes – viser aldrig ordet) ----------

const PIC = {
  sol: () => `<circle cx="50" cy="50" r="22" fill="#ffd24a" ${S}/>${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4, x1 = 50 + 30 * Math.cos(a), y1 = 50 + 30 * Math.sin(a), x2 = 50 + 42 * Math.cos(a), y2 = 50 + 42 * Math.sin(a);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" ${S} stroke-width="5"/>`;
  }).join('')}<circle cx="42" cy="46" r="2.5" fill="${INK}"/><circle cx="58" cy="46" r="2.5" fill="${INK}"/><path d="M42 56 q8 6 16 0" fill="none" ${S} stroke-width="3"/>`,
  bil: () => `<path d="M10 66 v-14 q0 -6 8 -8 l10 -2 l12 -16 h28 l12 16 l8 2 q6 2 6 8 v14z" fill="#ef5b45" ${S}/>
    <path d="M44 30 h10 v12 h-22z M60 30 h6 l9 12 h-15z" fill="#bfe6fb" ${S} stroke-width="3"/>
    <circle cx="30" cy="68" r="10" fill="#555" ${S}/><circle cx="72" cy="68" r="10" fill="#555" ${S}/><circle cx="30" cy="68" r="3.5" fill="#ddd"/><circle cx="72" cy="68" r="3.5" fill="#ddd"/>`,
  aeg: () => `<path d="M50 12 C28 12 18 52 20 68 C22 86 36 92 50 92 C64 92 78 86 80 68 C82 52 72 12 50 12Z" fill="#fff6dc" ${S}/>
    <circle cx="40" cy="44" r="4" fill="#e9c98a"/><circle cx="60" cy="36" r="3" fill="#e9c98a"/><circle cx="62" cy="66" r="5" fill="#e9c98a"/>`,
  is: () => `<path d="M30 46 L50 94 L70 46Z" fill="#e8b46a" ${S}/><path d="M38 56 l22 14 M36 50 l30 18 M62 56 l-20 16 M66 50 l-28 20" stroke="#b9823e" stroke-width="2.5"/>
    <circle cx="50" cy="36" r="22" fill="#f6a6c1" ${S}/><circle cx="44" cy="30" r="4" fill="#fff" opacity=".7"/>`,
  ufo: () => `<path d="M30 46 q20 -34 40 0z" fill="#bfe6fb" ${S}/><ellipse cx="50" cy="52" rx="40" ry="13" fill="#b7b2c8" ${S}/>
    <circle cx="28" cy="53" r="3.5" fill="#ffd24a"/><circle cx="50" cy="57" r="3.5" fill="#ffd24a"/><circle cx="72" cy="53" r="3.5" fill="#ffd24a"/>
    <path d="M36 68 l-8 18 M64 68 l8 18" ${S} stroke-width="3" opacity=".5"/>`,
  mus: () => `<path d="M16 72 Q12 44 44 40 Q68 38 84 60 Q88 70 78 72 Z" fill="#bdb6c9" ${S}/>
    <circle cx="56" cy="38" r="11" fill="#bdb6c9" ${S}/><circle cx="56" cy="38" r="5" fill="#f4a8b8"/>
    <circle cx="70" cy="56" r="3" fill="${INK}"/><circle cx="86" cy="64" r="4" fill="#f08aa0" ${S} stroke-width="2"/>
    <path d="M16 70 Q2 72 6 84 Q10 94 26 88" fill="none" ${S} stroke-width="3"/>`,
  lus: () => `<path d="M30 40 l-16 -8 M28 54 l-18 0 M30 68 l-16 10 M70 40 l16 -8 M72 54 l18 0 M70 68 l16 10" ${S} stroke-width="3"/>
    <ellipse cx="50" cy="60" rx="20" ry="26" fill="#e9d9b0" ${S}/><path d="M34 54 h32 M33 66 h34 M38 77 h24" stroke="#b9a36e" stroke-width="2.5"/>
    <circle cx="50" cy="28" r="10" fill="#e9d9b0" ${S}/><path d="M45 20 l-6 -10 M55 20 l6 -10" ${S} stroke-width="2.5"/>
    <circle cx="46" cy="27" r="2" fill="${INK}"/><circle cx="54" cy="27" r="2" fill="${INK}"/>`,
  loeg: () => `<path d="M50 14 q4 10 -2 18 q26 8 26 34 q0 24 -24 26 q-24 -2 -24 -26 q0 -26 24 -34" fill="#e7b36a" ${S}/>
    <path d="M50 34 q-12 24 0 56 M50 34 q12 24 0 56" fill="none" stroke="#b97f3a" stroke-width="2.5"/><path d="M40 92 l-4 6 M50 92 v7 M60 92 l4 6" ${S} stroke-width="2.5"/>`,
  loeve: () => `<path d="M70 70 q20 4 22 -12 q2 -8 -4 -8" fill="none" ${S} stroke-width="3"/><circle cx="87" cy="49" r="5" fill="#b8641c" ${S} stroke-width="2.5"/>
    <path d="M30 66 q0 -14 22 -14 q22 0 24 14 l2 22 h-8 l-2 -12 l-6 12 h-8 l0 -12 h-14 l-2 12 h-8z" fill="#f3c35c" ${S} stroke-width="3"/>
    ${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI * 2) / 12, x = 36 + 21 * Math.cos(a), y = 38 + 21 * Math.sin(a);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#d9822b" ${S} stroke-width="2.5"/>`;
  }).join('')}<circle cx="36" cy="38" r="17" fill="#f3c35c" ${S}/>
    <circle cx="22" cy="22" r="6" fill="#f3c35c" ${S} stroke-width="2.5"/><circle cx="50" cy="22" r="6" fill="#f3c35c" ${S} stroke-width="2.5"/>
    <circle cx="30" cy="35" r="2.6" fill="${INK}"/><circle cx="42" cy="35" r="2.6" fill="${INK}"/>
    <path d="M32 43 h8 l-4 4z" fill="${INK}"/><path d="M36 47 q-4 5 -8 2 M36 47 q4 5 8 2" fill="none" ${S} stroke-width="2"/>`,
  loeb: () => `<path d="M8 40 h14 M4 52 h16 M10 64 h12" stroke="#9aa0b5" stroke-width="4" stroke-linecap="round"/>
    <circle cx="58" cy="20" r="11" fill="#f6cfa8" ${S}/><path d="M52 14 q8 -8 16 2" fill="#7a4a2a" ${S} stroke-width="3"/>
    <path d="M46 34 l22 0 l4 26 l-26 0z" fill="#ffd24a" ${S}/>
    <path d="M48 38 l-16 14 l-6 -6 M68 38 l14 10 l8 -8" fill="none" ${S} stroke-width="5"/>
    <path d="M52 60 l-12 18 l-12 0 M64 60 l10 16 l-4 14" fill="none" ${S} stroke-width="6"/>`,
  tobi: () => `<path d="M18 96 q4 -28 32 -30 q28 2 32 30z" fill="#ffd24a" ${S}/><path d="M40 68 q10 10 20 0" fill="none" ${S} stroke-width="3"/>
    <text x="50" y="92" text-anchor="middle" font-family="Grandstander, sans-serif" font-weight="800" font-size="18" fill="${INK}">2</text>
    <circle cx="50" cy="42" r="24" fill="#f6cfa8" ${S}/><path d="M26 38 q4 -24 26 -22 q20 2 22 20 q-10 -8 -24 -6 q-14 2 -24 8z" fill="#7a4a2a" ${S} stroke-width="3"/>
    <circle cx="42" cy="44" r="3" fill="${INK}"/><circle cx="58" cy="44" r="3" fill="${INK}"/><path d="M42 54 q8 7 16 0" fill="none" ${S} stroke-width="3"/>`,
  stjerne: () => star(50, 54, 42, '#ffd24a', S),
  dino: () => DINO,
  tuba: () => TUBA,
  mur: () => `<path d="M8 84 V44 H92 V84Z" fill="#c9c2b4" ${S}/>${[[8, 44, 28], [36, 44, 30], [66, 44, 26], [8, 58, 18], [26, 58, 32], [58, 58, 34], [8, 72, 30], [38, 72, 26], [64, 72, 28]]
    .map(([x, y, w]) => `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="10" rx="4" fill="#ddd6c8" stroke="${INK}" stroke-width="2.5"/>`).join('')}`,
  mund: () => `<path d="M14 50 Q30 34 50 42 Q70 34 86 50 Q70 70 50 70 Q30 70 14 50Z" fill="#e8665a" ${S}/>
    <path d="M18 51 Q50 60 82 51" fill="none" ${S} stroke-width="3"/><path d="M34 44 q8 -3 14 1" fill="none" stroke="#f5a59c" stroke-width="3" stroke-linecap="round"/>`,
  // Et gab: en åben kæbe med runde tænder og åbne øjne (ikke et træt, gabende ansigt – det er pointen i opslag 7)
  gab: () => `<path d="M10 40 Q12 16 50 14 Q88 16 90 40 L84 46 Q50 34 16 46Z" fill="#9fb3c8" ${S}/>
    <circle cx="34" cy="24" r="6" fill="#fff" ${S} stroke-width="2.5"/><circle cx="35" cy="24" r="2.6" fill="${INK}"/>
    <circle cx="66" cy="24" r="6" fill="#fff" ${S} stroke-width="2.5"/><circle cx="67" cy="24" r="2.6" fill="${INK}"/>
    <path d="M16 46 Q50 36 84 46 L82 84 Q50 96 18 84Z" fill="#7a2a2a" ${S}/><ellipse cx="50" cy="80" rx="18" ry="7" fill="#ef7f8a"/>
    <path d="M24 46 q4 8 8 0 M68 46 q4 8 8 0 M24 84 q4 -8 8 0 M68 84 q4 -8 8 0" fill="#fff" ${S} stroke-width="2.5"/>`,
  garn: () => `<circle cx="46" cy="52" r="32" fill="#e8574a" ${S}/>
    <path d="M18 40 Q46 30 72 46 M16 56 Q46 44 76 62 M24 74 Q50 60 74 72 M36 22 Q30 52 44 84 M58 22 Q46 52 60 82" fill="none" stroke="#a8322a" stroke-width="3" stroke-linecap="round"/>
    <path d="M76 66 Q90 72 86 84 Q82 94 94 94" fill="none" ${S} stroke-width="3"/>`,
  glas: () => `<path d="M30 14 H70 L64 88 Q50 94 36 88Z" fill="#e8f4fb" ${S}/><path d="M33 42 H67 L64 86 Q50 92 36 86Z" fill="#9fd3f0"/>
    <path d="M33 42 Q50 46 67 42" fill="none" stroke="#5aa9d6" stroke-width="3"/><path d="M30 14 H70 L64 88 Q50 94 36 88Z" fill="none" ${S}/>
    <path d="M40 22 L38 60" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  gaffel: () => `<path d="M44 8 v26 M50 8 v26 M56 8 v26" ${S} stroke-width="4"/><path d="M40 8 v28 q0 10 10 12 q10 -2 10 -12 v-28" fill="none" ${S} stroke-width="4"/>
    <path d="M46 46 h8 l3 44 q-7 6 -14 0z" fill="#d6dbe4" ${S}/>`,
  fido: () => `<path d="M20 96 q4 -26 30 -28 q26 2 30 28z" fill="#ffd24a" ${S}/>
    <text x="50" y="92" text-anchor="middle" font-family="Grandstander, sans-serif" font-weight="800" font-size="16" fill="${INK}">10</text>
    <path d="M28 30 q-22 -4 -20 22 q2 14 12 10 q6 -14 10 -24z M72 30 q22 -4 20 22 q-2 14 -12 10 q-6 -14 -10 -24z" fill="#a8774f" ${S} stroke-width="3"/>
    <path d="M28 34 q0 -18 22 -18 q22 0 22 18 q0 30 -22 30 q-22 0 -22 -30z" fill="#e3c39a" ${S}/>
    <path d="M38 20 l4 -8 l4 7 l4 -9 l4 9 l4 -6 l2 8" fill="#e3c39a" ${S} stroke-width="2.5"/>
    <circle cx="41" cy="38" r="3" fill="${INK}"/><circle cx="59" cy="38" r="3" fill="${INK}"/>
    <ellipse cx="50" cy="48" rx="6" ry="4.5" fill="${INK}"/><path d="M50 52 v4 M42 56 q8 6 16 0" fill="none" ${S} stroke-width="2.5"/>`,
  startlys: () => `<path d="M50 84 v12" ${S} stroke-width="6"/><rect x="30" y="6" width="40" height="80" rx="12" fill="#3d3b47" ${S}/>
    <circle cx="50" cy="24" r="9" fill="#6b3a35" ${S} stroke-width="2.5"/><circle cx="50" cy="46" r="9" fill="#6b5a2e" ${S} stroke-width="2.5"/>
    <circle cx="50" cy="68" r="10" fill="#6fe07a" ${S} stroke-width="2.5"/><circle cx="46" cy="64" r="3" fill="#fff" opacity=".8"/>
    <path d="M70 60 l12 -6 M71 69 h14 M70 78 l12 6" ${S} stroke-width="3"/>`,
  start: () => `<path d="M24 92 q-14 -6 -6 -16 q-6 -12 10 -12 q4 -10 16 -4 q12 -6 16 6 q14 0 10 12 q8 10 -6 14z" fill="#e8e6f0" ${S} stroke-width="3"/>
    <g transform="rotate(-18 50 46)"><path d="M50 4 C64 16 68 38 64 56 H36 C32 38 36 16 50 4Z" fill="#ef5b45" ${S}/>
    <circle cx="50" cy="30" r="7" fill="#e8f6ff" ${S} stroke-width="3"/><path d="M38 58 q12 22 24 0" fill="#ffd24a" ${S} stroke-width="3"/>
    <path d="M36 46 L26 62 L38 58Z M64 46 L74 62 L62 58Z" fill="#c43d2c" ${S} stroke-width="3"/></g>`,
};

export const icon = (name, cls = '') => `<span class="ico ${cls}">${ICON[name]()}</span>`;
// Stedets køretøj (Glidebanen, læsefingeren, pladsholdere): bold, fut eller dino
export const koeretoej = (sted) => (ICON[STEDER[sted]?.koeretoej] || ICON.bold)();
export const koeretoejNavn = (sted) => ({ fut: 'Fut', dino: 'Dino' }[STEDER[sted]?.koeretoej] || 'bolden');
const picSvg = (name) => `<svg viewBox="0 0 100 100" aria-hidden="true">${PIC[name]()}</svg>`;

// Et billede med pladsholder: farvet flade med billedbeskrivelsen i lille tekst, til billedet findes
// phHtml erstatter beskrivelsen med en tegning (fx en SVG-scene)
export const DEBUG = /[?&]debug\b/.test(location.search);
export function pic(src, desc, cls = '', phHtml = null) {
  return `<div class="pic ${cls}"><div class="ph ${phHtml ? 'drawn' : ''}">${phHtml ?? `<span>${esc(desc || '')}</span>`}</div>${src ? `<img src="${esc(src)}" alt="${esc(desc || '')}" draggable="false">` : ''}</div>`;
}

// Et billede fra billedordbogen: tegning i kode, eller (hvis det findes) billedet ovenpå
export function wordPic(id) {
  const o = ORDBOG[id];
  if (!o) return '';
  if (o.draw) {
    // Samme figurstørrelse i alle kort (en 5-kolonners tierramme), så størrelsen aldrig afslører kortet
    const n = o.draw.n, cols = Math.min(n, 5), sprite = o.draw.sprite;
    const img = sprite === 'stjerne' ? null : ORDBOG[sprite]?.img;
    const one = `<span class="sprite">${picSvg(sprite)}${img ? `<img src="${img}" alt="" draggable="false">` : ''}</span>`;
    return `<div class="wpic count" role="img" aria-label="${esc(o.alt)}" style="--cols:${cols}">${one.repeat(n)}</div>`;
  }
  return `<div class="wpic" role="img" aria-label="${esc(o.alt)}">${picSvg(o.icon)}${o.img ? `<img src="${o.img}" alt="" draggable="false">` : ''}</div>`;
}

// Billeder, der findes, lægger sig over pladsholderen; manglende billeder fjernes stille
document.addEventListener('load', (e) => {
  const t = e.target;
  if (t.tagName === 'IMG') t.closest('.pic, .wpic, .sprite')?.classList.add('has-img');
}, true);
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t.tagName === 'IMG') { t.closest('.pic, .wpic, .sprite')?.classList.add('no-img'); t.remove(); }
}, true);

// ================= Bip, taleboble og "lyt igen" =================

let lastInstruction = null;

// Kør en instruktion som en kæde, der stopper, når den ikke længere er aktuel (næste instruktion, et tryk,
// et skærmskift). f er en tekst eller en async (ok) => { await say(…); if (!ok()) return; … }.
function runInstruction(f) {
  const g = interrupt();
  const ok = () => speechGen() === g;
  return typeof f === 'string' ? say(f) : f(ok);
}

// Sig en instruktion og husk den, så Bip kan gentage den. Teksten skrives også til skærmlæsere.
export function instruct(f, text = typeof f === 'string' ? f : null) {
  clearBubble();
  lastInstruction = f;
  announce(text);
  return runInstruction(f);
}
export const repeatInstruction = () => runInstruction(lastInstruction || TALE.trykDetDuVil);
export const getInstruction = () => lastInstruction;
export const setInstruction = (f) => { lastInstruction = f; };

// Skærmlæsere: én rolig live-region (ikke hele skærmen)
export function announce(text) {
  const el = document.getElementById('sr-live');
  if (el && text) { el.textContent = ''; setTimeout(() => { el.textContent = text; }, 30); }
}

export const bipButton = () => `<button class="bip-btn" id="bip" aria-label="Lyt igen">${ICON.bip()}</button>`;

// Bips taleboble (visuel lyd). Den sættes ved det, der lyser (anchor), så barnet ser lyden, hvor han kigger.
// Uden anker: ved det sidst lyste bogstav, ellers øverst ved Bip-knappen.
let bubbleTimer = null;
export function bubble(text, ms = 1400, anchor = null) {
  let b = document.getElementById('bubble');
  if (!b) { b = document.createElement('div'); b.id = 'bubble'; b.setAttribute('aria-hidden', 'true'); document.body.appendChild(b); }
  b.textContent = text;
  const lit = [...document.querySelectorAll('.lt.lit, .gl.lit, .slot.lit')];
  const a = (anchor && anchor.isConnected ? anchor : null) || lit.at(-1) || null;
  b.classList.remove('anchored', 'below');
  b.style.left = b.style.top = b.style.right = '';
  if (a) {
    const q = a.getBoundingClientRect();
    b.classList.add('anchored');
    b.style.right = 'auto';
    const w = b.offsetWidth, h = b.offsetHeight;
    b.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, q.left + q.width / 2 - w / 2))}px`;
    let top = q.top - h - 18;
    if (top < 8) { top = Math.min(innerHeight - h - 8, q.bottom + 18); b.classList.add('below'); }
    b.style.top = `${top}px`;
    b.style.setProperty('--tail', `${Math.max(16, Math.min(w - 16, q.left + q.width / 2 - parseFloat(b.style.left)))}px`);
  }
  b.classList.add('on');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('on'), ms);
}
export function clearBubble() {
  clearTimeout(bubbleTimer);
  document.getElementById('bubble')?.classList.remove('on');
}
events.addEventListener('visual', (e) => bubble(e.detail.text, 1400, e.detail.anchor));

// ================= Trin-prikker, topbjælke =================

export const dots = (n, i) =>
  `<div class="dots" role="progressbar" aria-label="Missionens trin" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${i}">${Array.from({ length: n }, (_, k) => `<span class="${k < i ? 'done' : k === i ? 'cur' : ''}"></span>`).join('')}</div>`;

export function topbar({ back = null, backLabel = 'Tilbage', mid = '', extra = '' } = {}) {
  return `<header class="topbar">
    ${back ? `<button class="round-btn back" id="${back}" aria-label="${esc(backLabel)}">${ICON.tilbage()}</button>` : '<span class="spacer"></span>'}
    <div class="mid">${mid}</div>${extra}${bipButton()}</header>`;
}

// ================= Hold fingeren på knappen =================

// Fremdriftsring (SVG) – kalder onDone efter ms. Slip før tid = onShort (fx en venlig besked), ellers intet.
// Virker også med tastaturet (hold mellemrum eller Enter nede).
export function holdButton(el, ms, onDone, onShort = null) {
  let t0 = 0, raf = 0, active = false;
  const ring = el.querySelector('.ring rect, .ring circle');
  const len = !ring ? 0 : ring.hasAttribute('pathLength') ? Number(ring.getAttribute('pathLength')) : 2 * Math.PI * Number(ring.getAttribute('r'));
  if (ring) { ring.style.strokeDasharray = `${len}`; ring.style.strokeDashoffset = `${len}`; }
  const setP = (p) => { if (ring) ring.style.strokeDashoffset = `${len * (1 - p)}`; el.style.setProperty('--p', p); };
  const stop = (released) => {
    if (!active) return;
    active = false; cancelAnimationFrame(raf); setP(0); el.classList.remove('holding');
    const held = performance.now() - t0;
    if (released && held < ms) onShort?.();
  };
  const begin = () => {
    if (active) return;
    active = true; t0 = performance.now(); el.classList.add('holding');
    const frame = (now) => {
      if (!active) return;
      const p = Math.min(1, (now - t0) / ms);
      setP(p);
      if (p >= 1) { stop(false); onDone(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch { /* */ }
    begin();
  });
  el.addEventListener('pointerup', () => stop(true));
  ['pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, () => stop(false)));
  el.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } });
  el.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(true); } });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
// Ringen følger knappens kant (afrundet rektangel); rx = 47 giver en cirkel til de runde knapper
export const ringSvg = (rx = 12) => `<svg class="ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="${rx}" pathLength="100" vector-effect="non-scaling-stroke"/></svg>`;

// ================= Overlays i siden (aldrig confirm()/alert()) =================

// overlay(html, cls, { label, onEscape }): fokus flyttes ind og tilbage igen ved close(); Escape kalder onEscape.
let ovN = 0;
export function overlay(html, cls = '', { label = null, onEscape = null } = {}) {
  const prev = document.activeElement;
  const o = document.createElement('div');
  o.className = `overlay ${cls}`;
  const id = `ov-title-${++ovN}`;
  o.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" ${label ? `aria-label="${esc(label)}"` : `aria-labelledby="${id}"`}>${html}</div>`;
  const h = o.querySelector('h1, h2, h3');
  if (h && !label) h.id = id;
  (document.querySelector('#app > .screen') || document.body).appendChild(o);
  const focusables = () => [...o.querySelectorAll('button:not([disabled]), [tabindex="0"]')];
  setTimeout(() => focusables()[0]?.focus({ preventScroll: true }), 0);
  o.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); }
    if (e.key === 'Tab') { // fokusfælde
      const f = focusables();
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  o.close = () => { o.remove(); if (prev && prev.isConnected) prev.focus?.({ preventScroll: true }); };
  return o;
}

// Tryk, der registreres ved pointerdown (valgkort og brikker), med lås mod dobbelttryk
export function onTap(el, fn) {
  let lock = 0;
  el.addEventListener('pointerdown', (e) => {
    // Chrome sender pointerdown til slåede-fra knapper: de må aldrig reagere
    if (e.button > 0 || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const now = performance.now();
    if (now - lock < 350) return;
    lock = now;
    sfx('tap');
    fn(e);
  });
  el.addEventListener('keydown', (e) => {
    if (e.repeat || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
  });
}

// Almindelige knapper: klik + lille tryk-lyd
export function onClick(el, fn) {
  if (!el) return;
  el.addEventListener('click', (e) => { sfx('tap'); fn(e); });
}

export const wait = sleep;
