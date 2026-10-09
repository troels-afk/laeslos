// Skrivevejen for de 29 små bogstaver: form, startpunkt, retning og stregrækkefølge.
//
// ÉN DATAFIL: Ret skrivevejen her (fx efter samtalen med klassens lærer), og kør derefter
//   node tools/skrift_ark.mjs     (kontrolarket docs/skrivevej-ark.png – se efter, at det ser rigtigt ud)
//   node tools/stempel.mjs        (cache-stemplet)
// Valgene og kilderne står i docs/skrivevej.md.
//
// KOORDINATER (fælles API, se genkend.js):
//   y: 0 = toplinjen (opstreger), 0.33 = x-linjen, 0.67 = grundlinjen, 1 = nedstregslinjen.
//   x: samme enhed som y (1 = afstanden fra toplinjen til nedstregslinjen), så formen ikke bliver strakt.
//      Venstre kant af bogstavet er x = 0, og bredden er under 0.5 (m, w og æ er de bredeste), altså x ∈ [0, 1].
//   Punkterne ligger i skriveretningen, ca. 0,015 fra hinanden.
//   Linjerne er skolens skrivehus (tre lige høje etager): opstregerne går til toplinjen og nedstregerne næsten til
//   nedstregslinjen. Delen mellem x-linjen og grundlinjen følger Andika (enetages a og g, ø med skrå streg).
//
// SÅDAN SKRIVES ET BOGSTAV: streger er en liste af streger (én pr. gang blyanten/fingeren sættes ned).
// Hver streg bygges af dele, der følger efter hinanden uden løft:
//   fra(x, y)                       start her
//   til(x, y)                       lige streg hertil (også tilbage op ad en streg, man lige har lavet)
//   bue(cx, cy, rx, ry, fra, til, hael)
//                                   bue på en ellipse med centrum (cx, cy). Vinkler i grader som på et kompas
//                                   lagt ned: 0 = kl. 3, 90 = kl. 12, 180 = kl. 9, 270 = kl. 6.
//                                   Stigende vinkel (fx 40 → 357) = MOD URET. Faldende (fx 165 → 0) = MED URET.
//                                   hael (valgfri, grader): ellipsen hælder, så toppen ligger til højre for bunden –
//                                   som Andikas skrå "maver" i a, d, g, q, b og p.
//                                   Starter strengen med en bue, er buens første punkt startpunktet.
//   kurve(x1, y1, x2, y2, x, y)     blød kurve (Bézier) hertil, med to styrepunkter
//   prik(x, y)                      en prik (et kort tryk), fx prikken over i
// hoejde: 'x' (kun mellem x-linjen og grundlinjen), 'op' (noget over x-linjen), 'ned' (noget under grundlinjen),
//   'op+ned' (begge dele, j: prikken og halen).
// alt (valgfri): andre former, der også godkendes (genkend.js), fx a skrevet som et o og en pind for sig, b med løft
//   mellem stregen og maven, t uden hale og l med hale. Skrivevejen (startprik, pile, animationen) følger kun streger.
//   Fjern en alt-form, hvis klassens lærer ikke vil godkende den.

export const LINJER = { top: 0, x: 0.33, grund: 0.67, ned: 1 };

const X = LINJER.x, G = LINJER.grund;
const OP = 0.02; // toppen af opstregerne (b d f h k l)
const NED = 0.965; // bunden af nedstregerne (g j p q y)
const T_TOP = 0.13; // t er lavere end de andre opstreger (som i Andika)
const PRIK = 0.19; // prikken over i og j

// ---------- byggeklodserne ----------
const fra = (x, y) => ({ k: 'fra', x, y });
const til = (x, y) => ({ k: 'til', x, y });
const bue = (cx, cy, rx, ry, a0, a1, hael = 0) => ({ k: 'bue', cx, cy, rx, ry, a0, a1, hael });
const kurve = (x1, y1, x2, y2, x, y) => ({ k: 'kurve', x1, y1, x2, y2, x, y });
const prik = (x, y) => [fra(x, y - 0.006), til(x, y + 0.006)];

// Fælles former, der går igen
const aBue = () => bue(0.145, 0.5, 0.115, 0.172, 50, 352, 13); // a, d, g, q, å: start ved kl. 2, rundt mod uret (skrå mave som Andika)
const bMave = (a0) => bue(0.158, 0.5, 0.118, 0.172, a0, -165, 10); // b og p: med uret ud fra stregen og ind igen
const oRing = () => bue(0.15, 0.5, 0.15, 0.17, 60, 420); // o, ø: start ved kl. 1, hele vejen rundt mod uret
const ring = (cx) => bue(cx, 0.5, 0.125, 0.17, 90, 450); // alt-former: mave tegnet som et lukket o (a, d, g, q)

export const SKRIVEVEJ = {
  a: { hoejde: 'x', streger: [[aBue(), til(0.268, X), til(0.268, G)]],
    alt: [[[ring(0.145)], [fra(0.268, X), til(0.268, G)]]],
    note: 'Start ved kl. 2, rundt mod uret, op til x-linjen og ned (én streg).' },
  b: { hoejde: 'op', streger: [[fra(0.035, OP), til(0.035, G), til(0.035, 0.44), bMave(160)]],
    alt: [[[fra(0.035, OP), til(0.035, G)], [bMave(160)]]],
    note: 'Fra toplinjen lige ned, tilbage op og en bue med uret ud til højre (én streg). Stregen først, maven bagefter.' },
  c: { hoejde: 'x', streger: [[bue(0.148, 0.5, 0.145, 0.17, 42, 318)]],
    note: 'Start ved kl. 2, rundt mod uret.' },
  d: { hoejde: 'op', streger: [[aBue(), til(0.275, OP), til(0.275, G)]],
    alt: [[[ring(0.145)], [fra(0.275, OP), til(0.275, G)]]],
    note: 'Som a: start ved kl. 2, rundt mod uret, helt op til toplinjen og ned (én streg). Maven først, stregen bagefter.' },
  e: { hoejde: 'x', streger: [[fra(0.008, 0.49), til(0.288, 0.49), bue(0.148, 0.5, 0.142, 0.17, 4, 325)]],
    note: 'Vandret streg fra venstre mod højre midt i huset, så op og rundt mod uret (én streg).' },
  f: { hoejde: 'op', streger: [[bue(0.17, 0.125, 0.075, 0.105, 15, 180), til(0.095, G)], [fra(0, X), til(0.22, X)]],
    note: '1: start i krogen oppe til højre, bue mod uret over toppen og lige ned. 2: tværstreg på x-linjen fra venstre mod højre.' },
  g: { hoejde: 'ned', streger: [[aBue(), til(0.268, X), til(0.268, 0.8), bue(0.143, 0.8, 0.125, 0.165, 0, -155)]],
    alt: [[[ring(0.145)], [fra(0.268, X), til(0.268, 0.8), bue(0.143, 0.8, 0.125, 0.165, 0, -155)]]],
    note: 'Som a (start ved kl. 2, rundt mod uret, op), men ned under grundlinjen og en krog til venstre (én streg).' },
  h: { hoejde: 'op', streger: [[fra(0.035, OP), til(0.035, G), til(0.035, 0.44), bue(0.155, 0.47, 0.12, 0.14, 165, 0), til(0.275, G)]],
    alt: [[[fra(0.035, OP), til(0.035, G)], [bue(0.155, 0.47, 0.12, 0.14, 165, 0), til(0.275, G)]]],
    note: 'Fra toplinjen lige ned, tilbage op, bue med uret og ned (én streg).' },
  i: { hoejde: 'op', streger: [[fra(0.035, X), til(0.035, G)], prik(0.035, PRIK)],
    note: '1: fra x-linjen lige ned. 2: prikken.' },
  j: { hoejde: 'op+ned', streger: [[fra(0.165, X), til(0.165, 0.82), bue(0.09, 0.82, 0.075, 0.145, 0, -165)], prik(0.165, PRIK)],
    note: '1: fra x-linjen lige ned under grundlinjen og en krog til venstre. 2: prikken.' },
  k: { hoejde: 'op', streger: [[fra(0.035, OP), til(0.035, G)], [fra(0.25, X), til(0.045, 0.5), til(0.275, G)]],
    note: '1: fra toplinjen lige ned. 2: fra x-linjen til højre skråt ind til stregen og ud igen (k er undtagelsen: skråstregen går fra højre mod venstre).' },
  l: { hoejde: 'op', streger: [[fra(0.035, OP), til(0.035, G)]],
    alt: [[[fra(0.035, OP), til(0.035, 0.58), bue(0.11, 0.58, 0.075, 0.09, 180, 330)]]],
    note: 'Fra toplinjen lige ned (Andikas l har ingen hale).' },
  m: { hoejde: 'x', streger: [[fra(0.035, X), til(0.035, G), til(0.035, 0.44), bue(0.138, 0.47, 0.1, 0.14, 163, 0), til(0.238, G),
    til(0.238, 0.44), bue(0.338, 0.47, 0.1, 0.14, 163, 0), til(0.438, G)]],
    alt: [[[fra(0.035, X), til(0.035, G)], [bue(0.138, 0.47, 0.1, 0.14, 163, 0), til(0.238, G), til(0.238, 0.44), bue(0.338, 0.47, 0.1, 0.14, 163, 0), til(0.438, G)]],
      [[fra(0.035, X), til(0.035, G)], [bue(0.138, 0.47, 0.1, 0.14, 163, 0), til(0.238, G)], [bue(0.338, 0.47, 0.1, 0.14, 163, 0), til(0.438, G)]]],
    note: 'Fra x-linjen ned, tilbage op, bue med uret og ned, op igen, bue og ned (én streg).' },
  n: { hoejde: 'x', streger: [[fra(0.035, X), til(0.035, G), til(0.035, 0.44), bue(0.16, 0.47, 0.125, 0.14, 165, 0), til(0.285, G)]],
    alt: [[[fra(0.035, X), til(0.035, G)], [bue(0.16, 0.47, 0.125, 0.14, 165, 0), til(0.285, G)]]],
    note: 'Fra x-linjen ned, tilbage op, bue med uret og ned (én streg).' },
  o: { hoejde: 'x', streger: [[oRing()]],
    note: 'Start ved kl. 1, hele vejen rundt mod uret.' },
  p: { hoejde: 'ned', streger: [[fra(0.035, X), til(0.035, NED)], [bMave(150)]],
    alt: [[[fra(0.035, X), til(0.035, NED), til(0.035, 0.44), bMave(150)]]],
    note: '1: fra x-linjen lige ned under grundlinjen. 2: oppe ved stregen, bue med uret rundt og ind til stregen. (Nogle skriver p i én streg: ned, op igen og rundt.)' },
  q: { hoejde: 'ned', streger: [[aBue(), til(0.268, X), til(0.268, NED)]],
    alt: [[[ring(0.145)], [fra(0.268, X), til(0.268, NED)]]],
    note: 'Som a (start ved kl. 2, rundt mod uret, op), men lige ned under grundlinjen (én streg).' },
  r: { hoejde: 'x', streger: [[fra(0.035, X), til(0.035, G), til(0.035, 0.44), bue(0.14, 0.47, 0.105, 0.14, 163, 30)]],
    alt: [[[fra(0.035, X), til(0.035, G)], [bue(0.14, 0.47, 0.105, 0.14, 163, 30)]]],
    note: 'Fra x-linjen ned, tilbage op og en lille bue med uret (én streg).' },
  s: { hoejde: 'x', streger: [[bue(0.125, 0.415, 0.1, 0.085, 25, 250), til(0.163, 0.505), bue(0.125, 0.585, 0.11, 0.085, 70, -160)]],
    note: 'Start oppe til højre, først mod uret, så skråt over og med uret (én streg).' },
  t: { hoejde: 'op', streger: [[fra(0.095, T_TOP), til(0.095, 0.58), bue(0.17, 0.58, 0.075, 0.09, 180, 330)], [fra(0, X), til(0.23, X)]],
    alt: [[[fra(0.095, T_TOP), til(0.095, G)], [fra(0, X), til(0.19, X)]]],
    note: '1: lige ned og en lille hale til højre. 2: tværstreg på x-linjen fra venstre mod højre.' },
  u: { hoejde: 'x', streger: [[fra(0.035, X), til(0.035, 0.53), bue(0.15, 0.53, 0.115, 0.14, 180, 360), til(0.265, X), til(0.265, G)]],
    note: 'Fra x-linjen ned, rundt i bunden mod uret, op til x-linjen og lige ned (én streg).' },
  v: { hoejde: 'x', streger: [[fra(0.02, X), til(0.171, G), til(0.32, X)]],
    note: 'Fra venstre skråt ned og op igen (én streg).' },
  w: { hoejde: 'x', streger: [[fra(0.02, X), til(0.128, G), til(0.242, 0.34), til(0.357, G), til(0.465, X)]],
    note: 'Ned, op, ned, op fra venstre mod højre (én streg).' },
  x: { hoejde: 'x', streger: [[fra(0.02, X), til(0.31, G)], [fra(0.31, X), til(0.02, G)]],
    note: '1: fra venstre skråt ned til højre. 2: fra højre skråt ned til venstre.' },
  y: { hoejde: 'ned', streger: [[fra(0.02, X), til(0.19, G)],
    [fra(0.35, X), til(0.19, G), kurve(0.155, 0.745, 0.15, 0.96, 0.08, 0.965), kurve(0.045, 0.967, 0.025, 0.94, 0.015, 0.905)]],
  note: '1: fra venstre skråt ned til grundlinjen. 2: fra højre skråt helt ned under grundlinjen med en krog til venstre.' },
  z: { hoejde: 'x', streger: [[fra(0.01, X), til(0.265, X), til(0.01, G), til(0.28, G)]],
    note: 'Hen ad x-linjen, skråt ned til venstre og hen ad grundlinjen (én streg).' },
  æ: { hoejde: 'x', streger: [[bue(0.13, 0.5, 0.125, 0.17, 40, 357), til(0.495, 0.49), bue(0.375, 0.5, 0.122, 0.17, 5, 325)]],
    note: 'a og e i ét: start ved kl. 2, a-buen mod uret, så e-stregen mod højre og e-buen mod uret (én streg).' },
  ø: { hoejde: 'x', streger: [[oRing()], [fra(0.275, 0.31), til(0.03, 0.69)]],
    alt: [[[oRing()], [fra(0.255, 0.38), til(0.045, 0.62)]], [[oRing()], [fra(0.23, 0.41), til(0.07, 0.59)]]],
    note: '1: o (start ved kl. 1, rundt mod uret). 2: skråstreg fra oppe til højre ned til venstre.' },
  å: { hoejde: 'op', streger: [[aBue(), til(0.268, X), til(0.268, G)], [bue(0.15, 0.185, 0.055, 0.06, 90, 450)]],
    note: '1: a. 2: ringen over, fra toppen rundt mod uret.' },
};

// Store bogstaver: kun til at kende dem igen, når barnet skriver det store bogstav (bogstavkortet viser "Bb").
// genkend.js giver så grunden 'stort' ("Det er det store bogstav"). Kun store bogstaver, der har en anden form end
// det lille: C, O, S, V, W, X, Z og I ligner det lille bogstav (eller l) og kan kun skilles fra det på højden.
// Hver del, der skiller bogstavet fra et lille, er sin egen streg (G: ringen og tværstregen), for et andet stort
// bogstav end maals kan kun vinde, når alle dets streger findes i tegningen (et smalt o er ikke et G uden tværstreg).
// Skrevet uden løft kender genkend.js dem også (stregerne sættes sammen).
const S_TOP = OP;
export const STORE_SKRIVEVEJ = {
  A: [[fra(0, G), til(0.17, S_TOP), til(0.34, G)], [fra(0.075, 0.45), til(0.265, 0.45)]],
  B: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.035, S_TOP), bue(0.035, 0.18, 0.16, 0.16, 90, -90), bue(0.035, 0.505, 0.19, 0.165, 90, -90)]],
  D: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.035, S_TOP), bue(0.035, 0.345, 0.26, 0.325, 90, -90)]],
  E: [[fra(0.27, S_TOP), til(0.035, S_TOP), til(0.035, G), til(0.27, G)], [fra(0.035, 0.345), til(0.22, 0.345)]],
  F: [[fra(0.27, S_TOP), til(0.035, S_TOP), til(0.035, G)], [fra(0.035, 0.345), til(0.22, 0.345)]],
  G: [[bue(0.2, 0.345, 0.19, 0.325, 40, 360)], [fra(0.39, 0.345), til(0.25, 0.345)]],
  H: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.3, S_TOP), til(0.3, G)], [fra(0.035, 0.345), til(0.3, 0.345)]],
  K: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.29, S_TOP), til(0.04, 0.4), til(0.3, G)]],
  L: [[fra(0.035, S_TOP), til(0.035, G), til(0.26, G)]],
  M: [[fra(0.02, G), til(0.04, S_TOP), til(0.2, 0.45), til(0.36, S_TOP), til(0.38, G)]],
  N: [[fra(0.035, G), til(0.035, S_TOP), til(0.3, G), til(0.3, S_TOP)]],
  P: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.035, S_TOP), bue(0.035, 0.2, 0.18, 0.18, 90, -90)]],
  R: [[fra(0.035, S_TOP), til(0.035, G)], [fra(0.035, S_TOP), bue(0.035, 0.19, 0.17, 0.17, 90, -90), til(0.29, G)]],
  T: [[fra(0, S_TOP), til(0.3, S_TOP)], [fra(0.15, S_TOP), til(0.15, G)]],
  Æ: [[fra(0, G), til(0.2, S_TOP), til(0.46, S_TOP)], [fra(0.2, S_TOP), til(0.2, G), til(0.46, G)], [fra(0.1, 0.38), til(0.42, 0.38)]],
};

// ---------- fra dele til punkter ----------
const TRIN = 0.015;
const r3 = (v) => Math.round(v * 1000) / 1000;

function punkter(dele) {
  const P = [];
  const tilfoej = (x, y) => {
    const s = P[P.length - 1];
    if (!s || Math.hypot(s[0] - x, s[1] - y) > 1e-4) P.push([x, y]);
  };
  const linjeTil = (x, y) => {
    const s = P[P.length - 1];
    if (!s) return tilfoej(x, y);
    const n = Math.max(1, Math.ceil(Math.hypot(x - s[0], y - s[1]) / TRIN));
    for (let i = 1; i <= n; i++) tilfoej(s[0] + ((x - s[0]) * i) / n, s[1] + ((y - s[1]) * i) / n);
  };
  for (const d of dele) {
    if (d.k === 'fra') tilfoej(d.x, d.y);
    else if (d.k === 'til') linjeTil(d.x, d.y);
    else if (d.k === 'bue') {
      const h = (d.hael * Math.PI) / 180;
      const pkt = (a) => {
        const u = d.rx * Math.cos((a * Math.PI) / 180), v = -d.ry * Math.sin((a * Math.PI) / 180);
        return [d.cx + u * Math.cos(h) - v * Math.sin(h), d.cy + u * Math.sin(h) + v * Math.cos(h)];
      };
      const [sx, sy] = pkt(d.a0);
      if (P.length) linjeTil(sx, sy); else tilfoej(sx, sy);
      let laengde = 0;
      for (let i = 1; i <= 100; i++) { const [ax, ay] = pkt(d.a0 + ((d.a1 - d.a0) * (i - 1)) / 100), [bx, by] = pkt(d.a0 + ((d.a1 - d.a0) * i) / 100); laengde += Math.hypot(bx - ax, by - ay); }
      const n = Math.max(2, Math.ceil(laengde / TRIN));
      for (let i = 1; i <= n; i++) tilfoej(...pkt(d.a0 + ((d.a1 - d.a0) * i) / n));
    } else if (d.k === 'kurve') {
      const [x0, y0] = P[P.length - 1];
      const b = (t, a, c1, c2, e) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * e;
      const groft = Math.hypot(d.x1 - x0, d.y1 - y0) + Math.hypot(d.x2 - d.x1, d.y2 - d.y1) + Math.hypot(d.x - d.x2, d.y - d.y2);
      const n = Math.max(2, Math.ceil(groft / TRIN));
      for (let i = 1; i <= n; i++) { const t = i / n; tilfoej(b(t, x0, d.x1, d.x2, d.x), b(t, y0, d.y1, d.y2, d.y)); }
    }
  }
  return P.map(([x, y]) => [r3(x), r3(y)]);
}

export const SKRIFT = Object.fromEntries(Object.entries(SKRIVEVEJ).map(([bogstav, def]) => {
  const streger = def.streger.map(punkter);
  const bredde = r3(Math.max(...streger.flat().map((p) => p[0])));
  const alt = (def.alt || []).map((form) => form.map(punkter));
  return [bogstav, { streger, start: streger.map((s) => s[0]), hoejde: def.hoejde, bredde, alt, note: def.note }];
}));
export const STORE = Object.fromEntries(Object.entries(STORE_SKRIVEVEJ).map(([bogstav, def]) => [bogstav, { streger: def.map(punkter) }]));
