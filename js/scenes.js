// Tegnede pladsholder-scener (SVG, 3:2), som bruges, indtil billederne fra ChatGPT ligger i public/img/.
// De følger samme komposition som billedprompterne: Stadion til venstre, Dino-dalen forrest, Rumbasen til højre.

const INK = '#2b2a33';
const S = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function starsField(n, seed, { w = 1536, h = 520, col = '#ffe9a6' } = {}) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, () => `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h).toFixed(0)}" r="${(1.5 + rnd() * 3).toFixed(1)}" fill="${col}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`).join('');
}

const fern = (x, y, sc = 1, col = '#5e9f45') => `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 0 Q-10 -60 -40 -100 M0 0 Q6 -70 30 -110 M0 0 Q20 -40 60 -70 M0 0 Q-24 -30 -70 -40" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/></g>`;

export function dutScene() {
  return `<svg class="scene-svg" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151c45"/><stop offset="1" stop-color="#3b3a8c"/></linearGradient>
    <radialGradient id="dplanet" cx=".5" cy=".2" r=".7"><stop offset="0" stop-color="#9ad672"/><stop offset="1" stop-color="#5fa848"/></radialGradient>
  </defs>
  <rect width="1536" height="1024" fill="url(#dsky)"/>
  ${starsField(90, 7)}
  <circle cx="1330" cy="150" r="56" fill="#fff3c4" opacity=".9"/>
  <circle cx="768" cy="1720" r="1330" fill="url(#dplanet)" ${S(8)}/>
  <path d="M120 700 Q400 640 760 690 T1420 660" fill="none" stroke="#4f9440" stroke-width="10" opacity=".35"/>
  <!-- Stadion -->
  <g transform="translate(70 450)">
    <path d="M20 260 Q20 70 260 60 Q500 70 500 260 Z" fill="#ffd24a" ${S()}/>
    <path d="M60 250 Q70 110 260 104 Q450 110 460 250 Z" fill="#f0b93a" ${S(4)}/>
    <ellipse cx="260" cy="270" rx="240" ry="96" fill="#7fca5e" ${S()}/>
    <ellipse cx="260" cy="270" rx="190" ry="70" fill="none" stroke="#fff" stroke-width="5"/>
    <path d="M260 200 V340" stroke="#fff" stroke-width="5"/>
    <circle cx="260" cy="270" r="26" fill="none" stroke="#fff" stroke-width="5"/>
    <path d="M60 240 v-40 h28 v52 M460 240 v-40 h-28 v52" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
    <path d="M120 70 v-60 l40 14 -40 14 M400 70 v-60 l40 14 -40 14" fill="#ef6a4c" ${S(4)}/>
    <rect x="200" y="0" width="120" height="66" rx="8" fill="#2b2a33" ${S(4)}/><rect x="212" y="10" width="96" height="46" rx="5" fill="#8fd3f4"/>
  </g>
  <!-- Dino-dalen -->
  <g transform="translate(560 560)">
    <path d="M150 120 L230 -60 L310 120 Z" fill="#9c6b45" ${S()}/>
    <path d="M206 -10 L230 -60 L254 -10 Q230 6 206 -10Z" fill="#ef7a3a" ${S(4)}/>
    <circle cx="220" cy="-100" r="22" fill="#d9d4e6" opacity=".8"/><circle cx="250" cy="-136" r="30" fill="#d9d4e6" opacity=".7"/>
    <path d="M0 330 Q40 160 150 150 Q210 100 260 150 Q380 130 430 330 Z" fill="#e3b25e" ${S()}/>
    <ellipse cx="215" cy="270" rx="120" ry="44" fill="#6cc4e8" ${S(5)}/>
    <ellipse cx="240" cy="262" rx="30" ry="12" fill="#7fca5e" ${S(4)}/>
    ${fern(40, 330, 1.1)}${fern(400, 330, 1.2)}${fern(110, 230, 0.7, '#4f9440')}
    <path d="M330 250 q10 -40 40 -46 q20 -40 34 -4 q12 30 -10 50 q-20 14 -40 6z" fill="#6bbf6a" ${S(4)}/>
  </g>
  <!-- Rumbasen -->
  <g transform="translate(990 300)">
    <path d="M40 470 Q60 380 250 370 Q440 380 470 470 Z" fill="#8d86b8" ${S()}/>
    <path d="M300 380 a110 110 0 0 1 220 0 Z" transform="translate(-60 0)" fill="#7a6bd6" ${S()}/>
    <rect x="270" y="330" width="40" height="50" rx="6" fill="#ffd86b" ${S(4)}/>
    <path d="M110 380 V60 M170 380 V60 M110 120 L170 160 M170 120 L110 160 M110 200 L170 240 M170 200 L110 240 M110 280 L170 320 M170 280 L110 320" fill="none" stroke="#c9c6d8" stroke-width="10" stroke-linecap="round"/>
    <path d="M110 380 V60 M170 380 V60" fill="none" ${S(4)}/>
    <g transform="translate(200 120)">
      <path d="M50 0 C80 30 88 90 80 150 H20 C12 90 20 30 50 0Z" fill="#ef5b45" ${S()}/>
      <circle cx="50" cy="70" r="16" fill="#e8f6ff" ${S(4)}/><circle cx="52" cy="72" r="5" fill="${INK}"/>
      <path d="M20 120 L-6 168 L24 158Z M80 120 L106 168 L76 158Z" fill="#c43d2c" ${S(4)}/>
    </g>
    <path d="M420 330 v-80 m-40 -10 a40 30 0 0 0 80 0z" fill="#e7e2f3" ${S(5)}/>
  </g>
</svg>`;
}

export function stadionScene() {
  return `<svg class="scene-svg" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dcf5"/><stop offset="1" stop-color="#e3f4fb"/></linearGradient></defs>
  <rect width="1536" height="1024" fill="url(#ssky)"/>
  <circle cx="1300" cy="120" r="70" fill="#ffe27a"/>
  <path d="M0 380 Q300 340 760 360 T1536 350 V470 H0Z" fill="#f2dc9c"/>
  <path d="M1000 390 q60 -26 120 0 q60 -26 120 0" fill="none" stroke="#6fb6d9" stroke-width="10" stroke-linecap="round"/>
  <path d="M0 440 Q768 400 1536 440 V1024 H0Z" fill="#79c35a" ${S(6)}/>
  ${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${520 + i * 90} Q768 ${490 + i * 90} 1536 ${520 + i * 90} V${565 + i * 90} Q768 ${535 + i * 90} 0 ${565 + i * 90}Z" fill="#6db64f" opacity=".6"/>`).join('')}
  <path d="M120 980 Q760 560 1420 980" fill="none" stroke="#fff" stroke-width="8" opacity=".85"/>
  <ellipse cx="768" cy="760" rx="150" ry="60" fill="none" stroke="#fff" stroke-width="8" opacity=".85"/>
  <g transform="translate(1180 420)"><path d="M0 170 V0 H260 V170" fill="none" stroke="#fff" stroke-width="16" stroke-linejoin="round"/><path d="M0 170 V0 H260 V170" fill="none" ${S(4)}/>
    <path d="M10 10 L250 10 M20 40 h220 M20 80 h220 M20 120 h220 M60 10 v150 M120 10 v150 M180 10 v150" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>
  <g transform="translate(90 520)"><rect x="0" y="40" width="300" height="34" rx="8" fill="#c8915a" ${S(5)}/><path d="M30 74 v50 M270 74 v50" ${S(8)}/></g>
  <path d="M60 470 v-120 l60 22 -60 22" fill="#ffd24a" ${S(5)}/>
</svg>`;
}

export function rumbaseScene() {
  return `<svg class="scene-svg" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2560"/><stop offset="1" stop-color="#5a4bb5"/></linearGradient></defs>
  <rect width="1536" height="1024" fill="url(#rsky)"/>
  ${starsField(120, 3, { h: 650 })}
  <circle cx="230" cy="170" r="70" fill="#fff3c4"/><circle cx="205" cy="150" r="14" fill="#efe1a6"/><circle cx="252" cy="196" r="10" fill="#efe1a6"/>
  <circle cx="1250" cy="230" r="40" fill="#e8814e"/>
  <path d="M0 720 Q400 650 768 690 T1536 670 V1024 H0Z" fill="#6f66a8" ${S(6)}/>
  <path d="M0 820 Q500 770 1536 800 V1024 H0Z" fill="#5d5596"/>
  <g transform="translate(900 300)"><path d="M60 420 V0 M160 420 V0 M60 80 L160 140 M160 80 L60 140 M60 200 L160 260 M160 200 L60 260 M60 320 L160 380 M160 320 L60 380" fill="none" stroke="#c9c6d8" stroke-width="14" stroke-linecap="round"/>
    <path d="M60 420 V0 M160 420 V0" fill="none" ${S(5)}/><rect x="20" y="410" width="300" height="40" rx="8" fill="#8d86b8" ${S(5)}/></g>
  <g transform="translate(260 560)"><path d="M0 170 a170 170 0 0 1 340 0Z" fill="#7a6bd6" ${S(6)}/><rect x="140" y="100" width="60" height="70" rx="8" fill="#ffd86b" ${S(5)}/><circle cx="90" cy="90" r="20" fill="#bfe6fb" ${S(4)}/><circle cx="250" cy="90" r="20" fill="#bfe6fb" ${S(4)}/></g>
</svg>`;
}

export function dinodalScene() {
  return `<svg class="scene-svg" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="dvsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f2"/><stop offset="1" stop-color="#f6ecd0"/></linearGradient></defs>
  <rect width="1536" height="1024" fill="url(#dvsky)"/>
  <circle cx="230" cy="140" r="64" fill="#ffe27a"/>
  <path d="M520 520 L700 250 Q720 225 742 250 L920 520Z" fill="#a8775a" ${S(6)}/>
  <path d="M690 268 Q700 290 720 262 Q740 290 752 266 L742 250 Q720 225 700 250Z" fill="#e8814e" ${S(4)}/>
  <path d="M720 230 q-30 -40 0 -70 q-20 -40 20 -60 q30 -10 40 20" fill="#f3f0ea" ${S(4)}/>
  <path d="M1100 560 V170 Q1100 140 1140 140 H1330 Q1370 140 1370 180 V560Z" fill="#b98d68" ${S(6)}/>
  <path d="M1150 150 q90 -50 180 0 q-90 30 -180 0Z" fill="#9b6b3e" ${S(5)}/>
  <path d="M1250 180 V560" stroke="#bfe6fb" stroke-width="22" opacity=".9"/>
  <path d="M0 520 Q400 470 768 500 T1536 500 V1024 H0Z" fill="#8cc46a" ${S(6)}/>
  <ellipse cx="760" cy="690" rx="470" ry="130" fill="#7fc3e6" ${S(6)}/>
  <ellipse cx="820" cy="660" rx="120" ry="40" fill="#d9c08a" ${S(5)}/>
  <path d="M790 640 v-60 M850 640 v-50" ${S(8)}/><circle cx="790" cy="572" r="26" fill="#5e9f45" ${S(4)}/><circle cx="850" cy="584" r="22" fill="#5e9f45" ${S(4)}/>
  <path d="M0 860 Q500 800 1000 840 T1536 820 V1024 H0Z" fill="#ecd59c" ${S(6)}/>
  ${fern(110, 820, 1.6)}${fern(260, 760, 1.2, '#4f8f3a')}${fern(1350, 820, 1.7)}${fern(1220, 780, 1.1, '#4f8f3a')}
</svg>`;
}

export const SCENE_SVG = { dut: dutScene, stadion: stadionScene, rumbase: rumbaseScene, dinodal: dinodalScene };
