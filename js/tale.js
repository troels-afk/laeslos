// Alt, appen siger: de faste replikker og skabelonerne samlet ét sted.
// Appen bruger dem, og tools/lyd/katalog.mjs læser dem (sammen med content.js og historier.js) og skriver
// tools/lyd/katalog.json – listen over alle tekster, som tools/lyd/tts.py laver Jeppe-lydfiler til.
// Ret en replik her, og kør derefter:  node tools/lyd/katalog.mjs && python3 tools/lyd/tts.py app
// (kun nye eller ændrede tekster sendes til Azure).
import { BOGSTAVNAVN } from './content.js?v=6f70bf5933';

export const TALE = {
  // Start, Dut, stederne
  hvemErMed: 'Hvem er med i dag?',
  hentVoksen: 'Hent en voksen. Den voksne holder fingeren på hånden.',
  dutNyt: 'Se, Dut har fået noget nyt.',
  hvorHen: 'Hvor vil du hen i dag, kaptajn?',
  hvilkenHistorie: 'Hvilken historie vil du læse? Tryk på den.',
  varmOp: 'Først varmer vi op, kaptajn. Tryk på knappen.',
  stoppe: 'Vil du stoppe? Tryk på Dut for at stoppe.',
  album: 'Det her er omklædningsrummet. Tryk på et skab.',
  trykDetDuVil: 'Tryk på det, du vil.',

  // Lydjagt: "Hør:" + bogstavlyden + spørgsmålet (tre klip efter hinanden)
  hoer: 'Hør:',
  hoerIgen: 'Hør igen:',
  hvilketBogstav: 'Hvilket bogstav siger den? Tryk på det.',
  hoerVoksne: 'Hør på den voksne. Hvilket bogstav siger lyden? Tryk på det.',
  // Bips ros, i fast rækkefølge
  ros: ['Ja!', 'Godt, kaptajn!', 'Sådan!', 'Fint!'],

  // Hvilken lyd?
  hvilketBillede: 'Hvilket billede starter med den lyd? Tryk på det.',
  proevAndet: 'Prøv et andet.',

  // Sig det selv
  sigLyden: 'Sig lyden højt. Tryk så for at høre den.',

  // Sove-ægget
  trykOrdet: 'Tryk på ordet.',
  laesSelv: 'Læs selv.',
  ogDenHer: 'Og den her.',
  sigOrdeneHoejt: 'Sig ordene højt, kaptajn – så vågner billedet.',

  // Glidebanen
  skubFut: 'Skub Fut hen over ordet. Eller tryk på ham.',
  skubBold: 'Skub bolden hen over ordet. Eller tryk på den.',
  skubDino: 'Skub Dino hen over ordet. Eller tryk på ham.',
  nuDig: 'Nu dig! Sig ordet. Tryk så for at høre det.',

  // Læs og vælg, billedtjek
  laesOrdet: 'Læs ordet. Tryk på det billede, der passer.',
  billedePasser: 'Hvilket billede passer? Tryk på det.',

  // Byg ordet: "Byg ordet" + ordet (to klip, så forælderens optagelse af ordet kan bruges)
  bygOrdet: 'Byg ordet',
  hvadFoerst: 'Hvad hører du først?',
  hvadSaa: 'Hvad hører du så?',

  // Historien
  laesKaptajn: 'Læs, kaptajn.',
  laesTraekFut: 'Læs, og træk Fut under ordene.',
  laesTraekBold: 'Læs, og træk bolden under ordene.',
  laesTraekDino: 'Læs, og træk Dino under ordene.',
  traekFut: 'Træk Fut under ordene, kaptajn.',
  traekBold: 'Træk bolden under ordene, kaptajn.',
  traekDino: 'Træk Dino under ordene, kaptajn.',
  hvilkenLyd: 'Hvilken lyd siger den?',
  trykNaeste: 'Tryk på Næste.',

  // Skriv bogstavet (skrivefeltet med fingeren). Trin 1: "Skriv oven i …" + "Start ved …".
  // Trin 2: "Skriv det bogstav, der siger:" + bogstavlyden + "Start ved …". Trin 3: "Skriv det bogstav, der siger:" + lyden.
  seHer: 'Se her.',
  skrivOveni: 'Skriv oven i bogstavet med din finger.',
  startPrik: 'Start ved den grønne prik.',
  skrivSiger: 'Skriv det bogstav, der siger:',
  nuDigSkriv: 'Nu dig!',
  // Ros: "Flot!" + bogstavlyden ("Flot … mmm")
  skrivRos: ['Flot!', 'Sådan!', 'Fint!'],
  skrivSpejl: 'Næsten! Den vender den anden vej.',
  skrivIgen: 'Prøv igen – se her.',
  skrivStoerre: 'Skriv den lidt større. Se her.',
  skrivMangler: 'Næsten! Der mangler lidt. Se her.',
  skrivStart: 'Næsten! Start ved den grønne prik. Se her.',
  skrivRetning: 'Næsten! Se, hvilken vej den går.',
  skrivStartTom: 'Næsten! Se, hvor den starter.', // trin 3 (ingen grøn prik i feltet)
  skrivStort: 'Det er det store bogstav. Skriv det lille. Se her.',
  skrivBuer: 'Næsten! Se, hvor mange buer den har.',
  skrivUtydelig: 'Næsten! Se her.',
  // Efter "Flot!": et lille tip om skrivevejen eller størrelsen (godkendt, tæller ikke som et forsøg)
  tipStart: 'Næste gang starter du ved den grønne prik. Se her.',
  tipStartTom: 'Se, hvor den starter.', // trin 3 (ingen grøn prik i feltet)
  tipRetning: 'Se lige, hvilken vej den går.',
  tipMindre: 'Næste gang må den gerne være lidt mindre.',
  logbog: 'Skriv det også i logbogen!', // papiret bevares: efter et bogstav fra hukommelsen (højst én gang om dagen)
  viskUd: 'Visk ud.',
  godtOevet: 'Godt øvet, kaptajn!',
};

// Skabeloner (katalog.mjs laver alle kombinationer)
export const findBogstav = (l) => `Find bogstavet, der hedder ${BOGSTAVNAVN[l] || l}. Tryk på det.`;
export const ordOgRos = (ord, ros) => `${ord}. ${ros}`;
export const vidsteDu = (fact) => `Vidste du det? ${fact}`;
export const godtLaest = (forslag) => `Godt læst, kaptajn! ${forslag}`;
// Stedets køretøj på Glidebanen og under læsefingeren: bolden (Stadion), Fut (Rumbasen) og Dino (Dino-dalen)
const efterSted = (sted, fut, dino, bold) => (sted === 'rumbase' ? fut : sted === 'dinodal' ? dino : bold);
export const skub = (sted) => efterSted(sted, TALE.skubFut, TALE.skubDino, TALE.skubBold);
export const laesTraek = (sted) => efterSted(sted, TALE.laesTraekFut, TALE.laesTraekDino, TALE.laesTraekBold);
export const traek = (sted) => efterSted(sted, TALE.traekFut, TALE.traekDino, TALE.traekBold);

// Sætningen, der læses op i BEKRÆFT: replik-stregen og linjeskift væk ("– Tobi! Oda!\nNu! Løb!" → "Tobi! Oda! Nu! Løb!")
export const bekraeftTekst = (tekst) => tekst.replace(/–/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

// "Vidste du det?": "Ib siger: '…'" → { who: 'Ib', fact: '…' }
export function vidsteDel(vidste) {
  const m = vidste.match(/^(\S+) siger: '(.+)'$/);
  return m ? { who: m[1], fact: m[2] } : { who: '', fact: vidste };
}

// ---- Ord-for-ord-fremhævningen i BEKRÆFT: hvornår (sek. inde i lyden) begynder hvert ord? ----
// clips = de klip, der afspilles efter hinanden (manifest.json: d = varighed, s = tale-stykkerne mellem pauserne,
// målt af tts.py). Sætningen deles i led ved . , ! ? … : ; og hvert led lægges i sit tale-stykke. Passer antallet
// ikke (Jeppe holdt ingen pause ved "…", eller en ekstra pause midt i et led), samles nabo-led eller nabo-stykker,
// så længderne passer bedst. Inden for et stykke vægtes ordene efter antal bogstaver, og pauserne springes over.
export const ORD_RE = /[A-Za-zÆØÅæøåÉéÜü]+/g;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// Del vægtene i lige så mange sammenhængende grupper, som der er mål, så gruppernes andele ligner målenes mest.
// Returnerer grænserne: gruppe g er vægtene b[g] til b[g+1] (ikke medregnet).
function grupper(vaegte, maal) {
  const k = vaegte.length, n = maal.length;
  const sw = sum(vaegte) || 1, sm = sum(maal) || 1;
  const pre = [0];
  vaegte.forEach((w, i) => pre.push(pre[i] + w / sw));
  const dp = Array.from({ length: n + 1 }, () => Array(k + 1).fill(Infinity));
  const fra = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  dp[0][0] = 0;
  for (let g = 1; g <= n; g++) {
    for (let i = g; i <= k - (n - g); i++) {
      for (let j = g - 1; j < i; j++) {
        const e = dp[g - 1][j] + (pre[i] - pre[j] - maal[g - 1] / sm) ** 2;
        if (e < dp[g][i]) { dp[g][i] = e; fra[g][i] = j; }
      }
    }
  }
  const b = [k];
  for (let g = n, i = k; g > 0; g--) { i = fra[g][i]; b.unshift(i); }
  return b;
}

export function ordStart(text, clips) {
  text = String(text);
  const ws = [...text.matchAll(ORD_RE)].map((m) => ({ s: m.index, e: m.index + m[0].length, n: m[0].length }));
  if (!ws.length) return [];
  ws.forEach((w, i) => { w.brk = i < ws.length - 1 && /[.,!?…:;]/.test(text.slice(w.e, ws[i + 1].s)); });
  const segs = [];
  let off = 0;
  for (const c of clips) {
    (c.s?.length ? c.s : [[0, c.d]]).forEach(([a, b]) => segs.push([off + a, off + b]));
    off += c.d;
  }
  const led = [[]];
  ws.forEach((w, i) => { led.at(-1).push(i); if (w.brk) led.push([]); });
  const vaegt = (i) => ws[i].n + 1;
  // Ordene idx fordeles over tale-stykkerne stk (pauserne imellem springes over). pause = ekstra vægt efter et
  // led-tegn inde i gruppen (Jeppe holder en lille pause, der er for kort til at blive målt som pause).
  const fordel = (idx, stk, pause = 0) => {
    const w = idx.map((i, j) => vaegt(i) + (pause && j < idx.length - 1 && ws[i].brk ? pause : 0));
    const tot = sum(w) || 1, tale = sum(stk.map(([a, b]) => b - a));
    const tid = (x) => {
      for (const [a, b] of stk) { if (x < b - a - 1e-6) return a + x; x -= b - a; }
      return stk.at(-1)[1];
    };
    let x = 0;
    return idx.map((_, j) => { const t = tid(x); x += (tale * w[j]) / tot; return t; });
  };
  if (segs.length === led.length) return led.flatMap((l, k) => fordel(l, [segs[k]]));
  if (segs.length < led.length) {
    const b = grupper(led.map((l) => sum(l.map(vaegt))), segs.map(([a, z]) => z - a));
    return segs.flatMap((sg, g) => fordel(led.slice(b[g], b[g + 1]).flat(), [sg], 2));
  }
  const b = grupper(segs.map(([a, z]) => z - a), led.map((l) => sum(l.map(vaegt))));
  return led.flatMap((l, g) => fordel(l, segs.slice(b[g], b[g + 1])));
}

// Nøglen, en tekst slås op med i public/lyd/manifest.json. Store/små bogstaver, ens bindestreger, anførselstegn
// og ellipser og mellemrum betyder ikke noget.
export function taleNoegle(t) {
  return String(t ?? '').normalize('NFC')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟«»″]/g, '"')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
