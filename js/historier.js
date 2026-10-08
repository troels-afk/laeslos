// GENERERET af tools/konverter_historier.mjs fra koncept/eksempel-historier.json og koncept/laes-sammen-historier.json – ret ikke i hånden.
// Teksterne må ikke ændres her; ret i JSON-filerne og kør scriptet igen.
export const HISTORIER = {
 "F2-loeb-tobi": {
  "id": "F2-loeb-tobi",
  "mappe": "f2",
  "form": "egen",
  "tema": "fodbold",
  "titel": "Løb, Tobi!",
  "niveau": 2,
  "bogstavsaet": [
   "m",
   "a",
   "b",
   "p",
   "o",
   "v",
   "f",
   "u",
   "n",
   "æ",
   "d",
   "ø",
   "i",
   "l",
   "s",
   "t",
   "g"
  ],
  "smaaord_H": [
   "og"
  ],
  "lydregler": [],
  "noegleord": [
   "løb",
   "Tobi",
   "ufo"
  ],
  "navnekort": [
   "Tobi",
   "Fido"
  ],
  "figurer": [
   "Tobi",
   "Oda",
   "Ib",
   "Fido",
   "musen",
   "Næb",
   "Sælerne"
  ],
  "opslag": [
   {
    "nr": 1,
    "tekst": "– Tobi! Oda!\nNu! Løb!",
    "ord": [
     {
      "ord": "Tobi",
      "type": "L"
     },
     {
      "ord": "Oda",
      "type": "L"
     },
     {
      "ord": "Nu",
      "type": "L"
     },
     {
      "ord": "Løb",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Ib. Låg: ryggen til. Træningskamp mod Sælerne i eftermiddagssol. Træner Ib står med hænderne som en tragt om munden. Tobi (nr. 2), Oda (nr. 9, kæmpe målmandshandsker) og to andre Muse-børn står bøjet sammen med ryggen til os og kigger ned i noget mellem Odas handsker. Bolden ligger glemt bag dem. I den anden ende af banen ligger Sælerne og soler sig foran deres mål. Fido sover på bænken i en alt for lang trøje med nr. 10.",
    "efter_billede": "Ingen vender sig om. Ib fløjter så hårdt, at kasketten skyder op som en raket og lander på hovedet af Fido, der sover videre.",
    "lyd": "Ibs fløjte 'fi-pft', kasketten, der suser op og lander med et 'plop', og en lille snorken fra Fido.",
    "interaktion": null
   },
   {
    "nr": 2,
    "tekst": "– Tobi! Ib!\nTi mus!",
    "ord": [
     {
      "ord": "Tobi",
      "type": "L"
     },
     {
      "ord": "Ib",
      "type": "L"
     },
     {
      "ord": "Ti",
      "type": "L"
     },
     {
      "ord": "mus",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Oda (hvisker). Låg: skjult. Nærbillede af Odas store målmandshandsker, der er foldet sammen som en lukket skål. Tobis og Ibs ansigter læner sig ind over dem. Oda holder en finger op foran munden.",
    "efter_billede": "Oda åbner langsomt handskerne: Musen og ni bittesmå mus ligger i en bunke og gaber. Ib får store glædestårer i øjnene, og Tobi holder sig for munden for ikke at hvine.",
    "lyd": "Ti små 'pip' i stigende tone og et rørt snøft fra Ib.",
    "interaktion": {
     "type": "vaelg-billede",
     "ord": "ti mus",
     "appSiger": "Hvilket billede passer? Tryk på det.",
     "beskrivelse": "Efter LÆS, før BEKRÆFT. Appen siger: 'Hvilket billede passer? Tryk på det.' Ordene siges ikke. Tre billeder fra billedordbogen i neutral stil (tingene på hvid baggrund, aldrig EFTER-scenen) på tilfældige pladser: ti mus · to mus · ti lus. Opgaven kan ikke løses på første bogstav: ti og to begynder ens, og mus og lus rimer, så både tal og dyr skal læses. Valget giver ingen sjov effekt, hverken når det er rigtigt eller forkert. Ved fejl: 'Hør: t-i … m-u-s', og ordene glider på Glidebanen. Svaret logges stille med svartid og tæller som bevis for lydering."
    }
   },
   {
    "nr": 3,
    "tekst": "Tobi løb og løb.",
    "ord": [
     {
      "ord": "Tobi",
      "type": "L"
     },
     {
      "ord": "løb",
      "type": "L",
      "efter_diktat": true
     },
     {
      "ord": "og",
      "type": "H"
     },
     {
      "ord": "løb",
      "type": "L",
      "efter_diktat": true
     }
    ],
    "portraet": null,
    "foer_billede": "Fortæller. Låg: ryggen til. Tobi står med ryggen til os ved midterlinjen og kigger ned på sit snørebånd, der er gået op. Bolden ligger ved siden af ham. Taktiktavlen med kaptajnens ord er uden for billedet.",
    "efter_billede": "Tobi drøner pludselig af sted som en raket – uden bolden og uden at binde snørebåndet. Den løse støvle flyver af og snurrer højt op i luften. Tilbage står bolden og en støvsky, der har Tobis form.",
    "lyd": "Et langt 'fiuuu' og et lille 'vup', da støvlen flyver af.",
    "interaktion": {
     "type": "skriv-for-at-handle",
     "ord": "løb",
     "appSiger": "Kampen mod Sælerne står helt stille. Skriv løb på tavlen, kaptajn!",
     "beskrivelse": "Kommer mellem opslag 2 og 3, før FØR-billedet, og udløser opslag 3's handling. Appen siger: 'Kampen mod Sælerne står helt stille. Skriv løb på tavlen, kaptajn!' Brikkerne følger skrivetrinnet: trin 1 – vælg første bogstav blandt l · s · m (ø og b står der); trin 2 – sæt l, ø og b i rækkefølge; trin 3 – l, ø, b plus lokkerne a og s. Hver brik siger sin lyd ved tryk. Ved fejl kommer et lyd-hint ('Hør: lll-øøø-b. Hvad hører du først?'), aldrig en 'forkert'-lyd; efter to forsøg vises ordet, og han lægger brikkerne oven på. Når ordet står der, skriver kridtet det på taktiktavlen med et lille 'skrrt'. Mere sker der ikke før BEKRÆFT i opslag 3. Ordet bliver stående på tavlen på Stadion. De to løb i opslag 3 er markeret efter_diktat og tæller ikke som selvstændig afkodning."
    }
   },
   {
    "nr": 4,
    "tekst": "– Ufo! Ufo!\nLøb, Oda!",
    "ord": [
     {
      "ord": "Ufo",
      "type": "L"
     },
     {
      "ord": "Ufo",
      "type": "L"
     },
     {
      "ord": "Løb",
      "type": "L"
     },
     {
      "ord": "Oda",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Ib. Låg: reaktionen først. Ib, de andre Muse-børn, de ti mus i Odas handsker og Sælerne i den anden ende af banen stirrer alle op mod noget over billedets øverste kant med åben mund.",
    "efter_billede": "Kameraet vipper op: Tobis støvle snurrer rundt højt oppe som en lille flyvende tallerken, og snørebåndet blafrer som en antenne.",
    "lyd": "En vaklende 'uiii-uuu', som når Pims ufo flyver.",
    "interaktion": null
   },
   {
    "nr": 5,
    "tekst": "– Min ufo!\nMin! Min!",
    "ord": [
     {
      "ord": "Min",
      "type": "L"
     },
     {
      "ord": "ufo",
      "type": "L"
     },
     {
      "ord": "Min",
      "type": "L"
     },
     {
      "ord": "Min",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Oda. Låg: øjeblikket før. Oda står stille på sin mållinje: handskerne hænger nede, blikket mod himlen. De ti mus sidder nu i hendes hætte.",
    "efter_billede": "Oda springer – men en skygge suser ind fra siden: Næb snupper støvlen en centimeter over Odas handsker og flyver væk. Oda lander med en enkelt fjer mellem handskerne og et overrasket smil.",
    "lyd": "Vingesus, Næbs hæse 'kraa' og et blødt bump, da Oda lander.",
    "interaktion": null
   },
   {
    "nr": 6,
    "tekst": "Og Fido?",
    "ord": [
     {
      "ord": "Og",
      "type": "H"
     },
     {
      "ord": "Fido",
      "type": "L"
     }
    ],
    "portraet": null,
    "foer_billede": "Fortæller. Låg: uden for billedet. Midterlinjen, hvor Tobi stod. Bolden ligger helt alene på græsset. Langt nede ad den skæve bane står Sælernes mål, og deres målmand har vendt sig om og stirrer op mod himlen.",
    "efter_billede": "Fido trisser ind fra siden med Ibs kasket på hovedet og puffer til bolden med snuden. Banen hælder, så bolden triller langsomt, langsomt hele vejen ned og ind i Sælernes mål. Storskærmen lyser op med et kæmpe, jublende billede (uden ord – 'MÅL!' kommer først, når Å er lært), og Sælernes målmand taber kæben.",
    "lyd": "Bolden, der triller og triller, nettet, der siger 'svup', og storskærmens jubel.",
    "interaktion": null
   },
   {
    "nr": 7,
    "tekst": "– Næb! Min ufo!",
    "ord": [
     {
      "ord": "Næb",
      "type": "L"
     },
     {
      "ord": "Min",
      "type": "L"
     },
     {
      "ord": "ufo",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Tobi. Låg: reaktionen først. Tobi er kommet tilbage – han er løbet hele vejen rundt om planeten. Han står med én støvle og én sok og kigger forvirret på de andre, der alle peger op mod noget over billedets kant. Ib tørrer glædestårer væk, og Fido hviler på bolden med Ibs kasket på.",
    "efter_billede": "Kameraet vipper op: Næb kredser højt oppe med Tobis støvle i næbbet. Tobi spæner efter hende – og den anden støvle flyver også af. Næb griber den med fødderne og flyver mod klippen i Dino-dalen med begge støvler. Tobi forsvinder bag horisonten i to strømper.",
    "lyd": "Et forvirret 'hm?', 'fiuuu' og et fjernt, tilfreds 'kraa'.",
    "interaktion": null
   }
  ],
  "efterscene": "Ordløs, ca. 3 sekunder: Tobi kommer løbende ind fra den modsatte side af billedet, fordi Dut er så lille, og standser forpustet foran Ib. Musen vinker fra Odas hætte.",
  "vidste_du": "Ib siger: 'Målmanden må gerne tage bolden med hænderne, men kun inde i sit eget felt.'",
  "samtalekort": {
   "foerste_laesning": [
    "Efter opslag 2 (før kommandoen): Hvorfor glemmer de at spille?",
    "Efter opslag 7: Hvordan kunne Fido score, selv om han er den langsomste på holdet?"
   ],
   "genlaesning": [
    "Efter opslag 1: Hvad tror du, de kigger på?",
    "Efter opslag 4: Hvad er det, der flyver deroppe?",
    "Efter opslag 7: Hvor flyver Næb hen med støvlerne?"
   ],
   "storesoester": "Spørg lillebror, hvem der scorede, og lad ham finde ordet Fido på siden."
  },
  "analogt_forslag": "Kaptajnens opgave: Tegn Tobis støvle, der flyver som en ufo, og skriv løb under."
 },
 "R1-ti-ni-nu": {
  "id": "R1-ti-ni-nu",
  "mappe": "r1",
  "form": "egen",
  "tema": "rummet",
  "titel": "Ti, ni … nu!",
  "niveau": 1,
  "bogstavsaet": [
   "m",
   "a",
   "b",
   "p",
   "o",
   "v",
   "f",
   "u",
   "n",
   "æ",
   "d",
   "ø",
   "i",
   "l",
   "s",
   "t",
   "g"
  ],
  "smaaord_H": [],
  "lydregler": [],
  "noegleord": [
   "ti",
   "ni",
   "nu"
  ],
  "navnekort": [],
  "figurer": [
   "Fut",
   "Bip",
   "musen"
  ],
  "opslag": [
   {
    "nr": 1,
    "tekst": "– Ti! Ni!",
    "ord": [
     {
      "ord": "Ti",
      "type": "L"
     },
     {
      "ord": "Ni",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Bip. Låg: øjeblikket før. Affyringsrampen i aftenlys. Bip står ved siden af rampen med den ene arm løftet som en starter, og hans skærmansigt er mørkt. Fut står klar på rampen med næsen mod himlen. Musen sidder på et rør og holder sig for ørerne.",
    "efter_billede": "Bips skærm lyser op med ti prikker og så ni. Fut ryster af spænding, og der kommer små røgpuf ud bagfra.",
    "lyd": "To dybe robot-bip og Futs 'fut-fut'.",
    "interaktion": null
   },
   {
    "nr": 2,
    "tekst": "– Ni … ni …\nTi?",
    "ord": [
     {
      "ord": "Ni",
      "type": "L"
     },
     {
      "ord": "ni",
      "type": "L"
     },
     {
      "ord": "Ti",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Bip. Låg: skjult. Bip står helt stille med armen i vejret og skærmen vendt væk fra os. Fut venter på rampen.",
    "efter_billede": "Bips skærm viser et stort spørgsmålstegn, og der kommer en lille røgsky ud af hans antenne: Han kan ikke huske, hvad der kommer efter ni, så han starter forfra. Futs øjne er ved at falde i. Musen ser det, men det gør Bip ikke.",
    "lyd": "Et hakkende 'bip … bip … biiip?' og en lille gaben fra Fut.",
    "interaktion": null
   },
   {
    "nr": 3,
    "tekst": "– Nu, Fut!",
    "ord": [
     {
      "ord": "Nu",
      "type": "L",
      "efter_diktat": true
     },
     {
      "ord": "Fut",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Bip. Låg: ryggen til. Fut står på rampen, set bagfra, og rører sig ikke. Bip står ved siden af med armen i vejret. Tavlen med kaptajnens ord er uden for billedet.",
    "efter_billede": "Fut hopper én meter op – og lander igen med et lille 'bump'. Han snorker: Han faldt i søvn under nedtællingen. Bip stirrer på ham med en lille, flad streg som mund.",
    "lyd": "Et lille 'fut', et 'bump' og en høj snorken.",
    "interaktion": {
     "type": "skriv-for-at-handle",
     "ord": "nu",
     "appSiger": "Bip kan ikke huske, hvad der kommer efter ni. Skriv nu på tavlen, kaptajn!",
     "beskrivelse": "Kommer mellem opslag 2 og 3, før FØR-billedet, og udløser opslag 3's handling. Appen siger: 'Bip kan ikke huske, hvad der kommer efter ni. Skriv nu på tavlen, kaptajn!' Brikkerne følger skrivetrinnet: trin 1 – vælg første bogstav blandt n · m · s (u står der); trin 2 – sæt n og u i rækkefølge; trin 3 – n og u plus lokkerne i og s. Hver brik siger sin lyd ved tryk. Ved fejl kommer et lyd-hint ('Hør: nnn-uuu. Hvad hører du først?'); efter to forsøg vises ordet. Når ordet står der, lyser det på tavlen ved rampen med et lille 'pling'. Mere sker der ikke før BEKRÆFT i opslag 3. Nu i opslag 3 er markeret efter_diktat."
    }
   },
   {
    "nr": 4,
    "tekst": "Da lo Fut.",
    "ord": [
     {
      "ord": "Da",
      "type": "L"
     },
     {
      "ord": "lo",
      "type": "L"
     },
     {
      "ord": "Fut",
      "type": "L"
     }
    ],
    "portraet": null,
    "foer_billede": "Fortæller. Låg: øjeblikket før. Bip står på tæerne og banker på Futs koøje. Futs øjne er lukkede.",
    "efter_billede": "Fut vågner med et snøft, ser Bip og griner så meget, at han puffer røgringe. Bips skærm viser et surt ansigt.",
    "lyd": "Tre små bank, et snøft og Futs 'fut-fut-fut'-grin.",
    "interaktion": null
   },
   {
    "nr": 5,
    "tekst": "– Ti, ni …\nnu!",
    "ord": [
     {
      "ord": "Ti",
      "type": "L"
     },
     {
      "ord": "ni",
      "type": "L"
     },
     {
      "ord": "nu",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Bip. Låg: ryggen til. Fut står igen på rampen, set bagfra, nu med øjnene vidt åbne. Bip har armen i vejret.",
    "efter_billede": "Fut letter med et kæmpe brag og en lang lysstribe. Bip blæser omkuld, og musen holder fast i hans antenne.",
    "lyd": "'Fut-fut-FUT' og et brag.",
    "interaktion": {
     "type": "tryk-paa-ordet",
     "ord": "nu",
     "appSiger": "Prøv igen, kaptajn. Tryk på dit ord på tavlen.",
     "beskrivelse": "Kommer mellem opslag 4 og 5. Appen siger: 'Prøv igen, kaptajn. Tryk på dit ord på tavlen.' Han trykker på nu, som han selv skrev; ordet lyser, men appen siger det ikke. Der er ingen ny skriveopgave."
    }
   },
   {
    "nr": 6,
    "tekst": "– Ti, ni …\nFut? Nu?",
    "ord": [
     {
      "ord": "Ti",
      "type": "L"
     },
     {
      "ord": "ni",
      "type": "L"
     },
     {
      "ord": "Fut",
      "type": "L"
     },
     {
      "ord": "Nu",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Bip. Låg: uden for billedet. Bip har rejst sig og kigger op mod himlen, mens han tæller. Rampen bag ham er tom.",
    "efter_billede": "Fut lander på rampen bag Bip med et blødt 'bump' – han har fløjet hele vejen rundt om Dut på to sekunder, fordi planeten er så lille. Fut griner, så han puffer røg, og musen sidder på hans næse med vindblæst pels.",
    "lyd": "Et fjernt 'fiuuu', der kommer tættere på, et 'bump' og Futs grin.",
    "interaktion": null
   }
  ],
  "efterscene": "Ordløs, ca. 3 sekunder: Bip vender sig om, ser Fut og begynder forfra – hans skærm viser ti prikker. Fut falder i søvn igen.",
  "vidste_du": "Bip siger: 'De rigtige astronauter var cirka tre dage om at flyve til månen.'",
  "samtalekort": {
   "foerste_laesning": [
    "Efter opslag 2 (før kommandoen): Hvad skal Bip sige nu?",
    "Efter opslag 6: Hvordan kunne Fut komme tilbage så hurtigt?"
   ],
   "genlaesning": [
    "Efter opslag 3: Hvorfor hoppede Fut kun en lille smule?"
   ],
   "storesoester": "Tæl ned fra ti sammen med lillebror, og lad ham pege på ordet nu."
  },
  "analogt_forslag": "Kaptajnens opgave: Skriv nu på en seddel, og læg den på gulvet. Tæl ned fra ti sammen med en voksen, og hop op på sedlen, når I kommer til nu."
 },
 "D2-tuba": {
  "id": "D2-tuba",
  "mappe": "d2",
  "form": "laes-sammen",
  "tema": "dinosaurer",
  "titel": "Tuba!",
  "niveau": 2,
  "titel_laeses_af": "barnet",
  "voksen_vejledning": "Du læser den lille tekst højt, og dit barn (kaptajnen) læser den store linje selv. Sig aldrig hans ord før ham, heller ikke for at hjælpe. Vent. Står han fast: peg på første bogstav og spørg: Hvilken lyd siger den? Tryk Læst selv, når du hverken har sagt lyde eller ord, ellers Med hjælp. Titlen læser han også selv.",
  "bogstavsaet": [
   "m",
   "a",
   "b",
   "p",
   "o",
   "v",
   "f",
   "u",
   "n",
   "æ",
   "d",
   "ø",
   "i",
   "l",
   "s",
   "t",
   "g"
  ],
  "smaaord_H": [
   "og",
   "uh"
  ],
  "lydregler": [],
  "noegleord": [
   "æg",
   "Tuba",
   "løb",
   "mus"
  ],
  "navnekort": [
   "Dino",
   "Tuba"
  ],
  "figurer": [
   "Dino",
   "Tuba",
   "ægget",
   "musen"
  ],
  "opslag": [
   {
    "nr": 1,
    "voksen": "Det her er Dino. Han er lille og tyk og grøn, men inde i sit eget hoved er han den største i hele dalen. Nede ved søen har han fundet noget under et stort blad, og nu skal hele dalen vide, hvis det er:",
    "tekst": "– Mit æg! Mit! Mit!",
    "ord": [
     {
      "ord": "Mit",
      "type": "L"
     },
     {
      "ord": "æg",
      "type": "L"
     },
     {
      "ord": "Mit",
      "type": "L"
     },
     {
      "ord": "Mit",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: skjult. Dino-dalen ved søen en solrig morgen med den lille ø og den rygende vulkan i baggrunden. Dino står med brystet skudt frem og halsen strakt stolt i vejret foran et stort bregneblad, der ligger hen over en rund bule i sandet. Vi kan ikke se, hvad der ligger under bladet.",
    "efter_billede": "Dino har trukket bladet væk med munden: Under det ligger et stort, plettet æg. Det vipper lidt, og Dino stråler som en sol. Musen kigger frem bag en sten.",
    "lyd": "Et bitte lille 'pip' inde fra skallen og Dinos stolte 'hmf!'.",
    "interaktion": null
   },
   {
    "nr": 2,
    "voksen": "Dino lagde sig tæt ind til sit fund og sang en lille morgensang for det. Midt i sangen blev der pludselig helt stille i dalen. Dino åbnede det ene øje og kiggede forvirret rundt:",
    "tekst": "– Uh! Nat? Nu?",
    "ord": [
     {
      "ord": "Uh",
      "type": "H"
     },
     {
      "ord": "Nat",
      "type": "L"
     },
     {
      "ord": "Nu",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: øjeblikket før. Dino ligger ved ægget med lukkede øjne og synger med åben mund. En kæmpe skygge kryber ind over græsset fra billedets kant og har lige nået hans halespids. Solen skinner stadig på søen bag dem.",
    "efter_billede": "Skyggen dækker nu både Dino og ægget, så der er mørkt som om natten lige omkring dem, mens solen skinner på søen og vulkanen bag dem. Dino er sprunget op og kigger forvirret rundt med store øjne. Musen peger forskrækket op over billedets kant.",
    "lyd": "Dinos sang, der stopper midt i en tone, og en dyb, langsom vejrtrækning oppe fra himlen.",
    "interaktion": null
   },
   {
    "nr": 3,
    "voksen": "Men det var ikke nat. Noget kæmpestort stod lige bag dem og skyggede for solen. Dino vendte sig langsomt om, kiggede op … og op … og op … og råbte:",
    "tekst": "– Tuba! Dit gab!",
    "ord": [
     {
      "ord": "Tuba",
      "type": "L"
     },
     {
      "ord": "Dit",
      "type": "L"
     },
     {
      "ord": "gab",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: uden for billedet. Tæt beskåret: Dino og ægget i den store skygge. Lige bag dem står to kæmpe, orange ben og en tyk hale – resten er over billedets øverste kant. Dino har vendt sig om og kigger op med åben mund.",
    "efter_billede": "Kameraet vipper op: Tuba, en kæmpe orange T-rex med bitte små arme, bøjer sig ned over ægget og har åbnet sit enorme gab helt op, så man kan se alle de runde, venlige tænder. Hans øjne er halvt lukkede og lidt våde (han er træt – det opdager man måske først ved genlæsning). Dino står som frosset, og musen gemmer sig bag ægget.",
    "lyd": "En dyb, langtrukken tubatone, 'buuuu-aaah', der fylder hele dalen.",
    "interaktion": {
     "type": "vaelg-billede",
     "ord": "gab",
     "appSiger": "Hvilket billede passer? Tryk på det.",
     "beskrivelse": "Efter LÆS, før BEKRÆFT. Appen siger: 'Hvilket billede passer? Tryk på det.' Ordet siges ikke, og voksenteksten nævner hverken munden eller gabet, så billedet kan ikke vælges ud fra det, der lige er læst højt. Tre billeder fra billedordbogen i neutral stil (tingene på hvid baggrund, aldrig EFTER-scenen) på tilfældige pladser: gab · garn · glas. Alle tre begynder med g, og gab og garn begynder begge med ga-, så resten af ordet skal læses. Garn og glas er intetkøn ligesom gab, så 'Dit' afslører ikke svaret, og de har næsten samme længde (3–4 bogstaver). Mens han vælger, er ordet gab fremhævet i linjen, og de andre ord er dæmpede, så opgaven gælder ordet og ikke sætningen. Gab-billedet er en åben kæbe med åbne øjne (en flodhest), ikke et gabende, træt ansigt, så pointen fra opslag 7 ikke afsløres. Valget giver ingen sjov effekt, hverken når det er rigtigt eller forkert. Ved fejl: 'Hør: g-aaa-b', og ordet glider på Glidebanen. Svaret logges stille med svartid og tæller som bevis for lydering."
    }
   },
   {
    "nr": 4,
    "voksen": "Det store gab kom tættere og tættere på Dinos plettede skat. Dinos knæ rystede, men han stillede sig foran med benene spredt og råbte, så højt han kunne:",
    "tekst": "– Løb, æg! Løb!",
    "ord": [
     {
      "ord": "Løb",
      "type": "L"
     },
     {
      "ord": "æg",
      "type": "L"
     },
     {
      "ord": "Løb",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: øjeblikket før. Dino står foran ægget med benene spredt og halsen strakt op mod Tubas åbne gab. Kinderne er pustet op af luft, og knæene ryster. Ægget ligger helt stille bag ham.",
    "efter_billede": "Ægget vipper frem og tilbage, triller én centimeter og stopper – æg kan jo ikke løbe. Dino kigger måbende ned på det, og Tuba blinker forvirret med gabet stadig åbent. Musen holder sig for øjnene bag en sten.",
    "lyd": "Et lille 'tril', et forsigtigt 'pip' fra skallen og Tubas forvirrede 'buum?'.",
    "interaktion": null
   },
   {
    "nr": 5,
    "voksen": "Dit skilt stod i sandet, og det raslede i bregnerne. Kæmpen stoppede midt i sit gab og stirrede ned ved siden af Dino. Så hvinede han med en stemme som en bitte, bitte lille tuba:",
    "tekst": "– Uh! Uh! Mus!",
    "ord": [
     {
      "ord": "Uh",
      "type": "H"
     },
     {
      "ord": "Uh",
      "type": "H"
     },
     {
      "ord": "Mus",
      "type": "L",
      "efter_diktat": true
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Tuba. Låg: uden for billedet. Tubas åbne gab hænger lige over Dino og ægget. Dino står med lukkede øjne og brystet skudt frem. Ved siden af ham er en tom plet i sandet, og bregnerne bag dem bøjer sig, som om noget går igennem dem. Kaptajnens skilt er uden for billedet.",
    "efter_billede": "Musen står ved siden af Dino med poterne i siden og kigger op på Tuba. Tuba hopper hvinende et stort skridt baglæns og prøver at holde de bitte små arme for øjnene – de er alt for korte. Dino åbner forsigtigt det ene øje. Kaptajnens skilt står i sandet ved siden af dem.",
    "lyd": "Et tyndt, hvinende tubahyl, 'piiiuu!', et tungt 'BUM' og bregner, der rasler.",
    "interaktion": {
     "type": "skriv-for-at-handle",
     "ord": "mus",
     "appSiger": "Tubas store gab er lige over ægget! Dino har brug for hjælp. Skriv mus i sandet, kaptajn!",
     "beskrivelse": "Kommer mellem opslag 4 og 5, før FØR-billedet, og udløser opslag 5's handling. Appen siger: 'Tubas store gab er lige over ægget! Dino har brug for hjælp. Skriv mus i sandet, kaptajn!' Brikkerne følger skrivetrinnet: trin 1 – vælg første bogstav blandt m · l · f (u og s står der); trin 2 – sæt m, u og s i rækkefølge; trin 3 – m, u, s plus lokkerne a og i. Hver brik siger sin lyd ved tryk. Ved fejl kommer et lyd-hint ('Hør: mmm-uuu-sss. Hvad hører du først?'), aldrig en 'forkert'-lyd; efter to forsøg vises ordet, og han lægger brikkerne oven på. Når ordet står der, rejser skiltepinden sig i sandet med et lille 'tok', og det rasler i bregnerne. Musen ses først i BEKRÆFT i opslag 5. Skiltet bliver stående i Dino-dalen. Mus i opslag 5 er markeret efter_diktat og tæller ikke som selvstændig afkodning."
    }
   },
   {
    "nr": 6,
    "voksen": "Dino rystede ikke længere. Han stillede sig ved siden af sin nye, lille ven og stampede i jorden, så det sagde BUM – i hvert fald inde i hans eget hoved. Så pegede han på kæmpen og råbte:",
    "tekst": "– Tuba! Løb! Nu!",
    "ord": [
     {
      "ord": "Tuba",
      "type": "L"
     },
     {
      "ord": "Løb",
      "type": "L"
     },
     {
      "ord": "Nu",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: øjeblikket før. Dino og musen står side om side foran ægget. Dino har strakt halsen helt op og løftet det ene forben for at stampe. Tuba står lidt længere væk og ryster, så bregnerne omkring ham dirrer.",
    "efter_billede": "Tuba løber ikke. Han dumper ned på halen, så hele dalen ryster og ægget hopper en lille smule. Hans øjne bliver små og tunge. Dino står stadig med forbenet i luften, og musen ser forbavset op på ham.",
    "lyd": "Et blødt, tungt 'BUMF', da Tuba sætter sig, og et lille 'pip' fra ægget.",
    "interaktion": null
   },
   {
    "nr": 7,
    "voksen": "Kæmpen kiggede ned på dem med små, tunge øjne. Han strakte de bitte små arme, så langt de kunne nå – og det var ikke ret langt. Så mumlede han med sin allerdybeste stemme:",
    "tekst": "– Løb? Nu?\nNat-nat, Dino …",
    "ord": [
     {
      "ord": "Løb",
      "type": "L"
     },
     {
      "ord": "Nu",
      "type": "L"
     },
     {
      "ord": "Nat",
      "type": "L"
     },
     {
      "ord": "nat",
      "type": "L"
     },
     {
      "ord": "Dino",
      "type": "L"
     }
    ],
    "portraet": "halepil",
    "foer_billede": "Taler: Tuba. Låg: reaktionen først. Dino og musen står ved ægget og kigger op mod Tubas ansigt, som er over billedets øverste kant. Vi ser kun Tubas store krop, der sidder i græsset, og de bitte små arme.",
    "efter_billede": "Kameraet vipper op: Tuba gaber det største gab i hele dalen med lukkede øjne og en lille træthedståre i øjenkrogen, mens de bitte små arme strækker sig. Det var bare et gab hele tiden. Dino og musen ser på hinanden.",
    "lyd": "Et kæmpe, dybt tubagab, 'buaaaah-uuum', og en lille, træt brummen.",
    "interaktion": null
   },
   {
    "nr": 8,
    "voksen": "Kæmpen lukkede øjnene, og hans store hoved sank langsomt ned … og ned … og ned. Dino blev helt stiv i halsen og råbte:",
    "tekst": "– Tuba! Mit æg!\nMus, mus!",
    "ord": [
     {
      "ord": "Tuba",
      "type": "L"
     },
     {
      "ord": "Mit",
      "type": "L"
     },
     {
      "ord": "æg",
      "type": "L"
     },
     {
      "ord": "Mus",
      "type": "L"
     },
     {
      "ord": "mus",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: uden for billedet. Tæt beskåret: Tubas store hoved er på vej ned med lukkede øjne, og hagen er lige ved billedets nederste kant. Dino står ved siden af og stirrer ned på noget, vi ikke kan se.",
    "efter_billede": "Kameraet kører ned: Tuba sover med hagen på ægget, som om det var en pude, og snorker blødt. Ægget er helt uskadt. Musen er kravlet op på Tubas næse – men i stedet for at skræmme ham har den lagt sig til at sove der. Dino står med halsen slået i en knude af forargelse.",
    "lyd": "Et blødt 'bonk', en dyb, snorkende tubatone og et lille, tilfreds 'pip' fra ægget.",
    "interaktion": null
   },
   {
    "nr": 9,
    "voksen": "Dino skubbede og skubbede til det store hoved, men det rørte sig ikke en millimeter. Inde fra skallen kom en lille, glad lyd. Så bøjede Dino halsen helt ned til kæmpens øre og hviskede:",
    "tekst": "– Nat-nat, Tuba og mus.",
    "ord": [
     {
      "ord": "Nat",
      "type": "L"
     },
     {
      "ord": "nat",
      "type": "L"
     },
     {
      "ord": "Tuba",
      "type": "L"
     },
     {
      "ord": "og",
      "type": "H"
     },
     {
      "ord": "mus",
      "type": "L"
     }
    ],
    "portraet": "vises",
    "foer_billede": "Taler: Dino. Låg: ryggen til. Dino sidder med ryggen til os helt tæt ved Tubas sovende hoved og har bøjet halsen ned mod hans kind. Ægget ligger under Tubas hage. Det er stadig lys dag.",
    "efter_billede": "Dino ligger krøllet sammen ved Tubas kind med halsen om ægget og sover. Musen sover på Tubas næse og løftes op og ned, hver gang Tuba trækker vejret. Hele dalen sover midt på den lyse dag, og en sommerfugl lander på en af Tubas runde tænder.",
    "lyd": "Tre slags snorken – en dyb tuba, en lille fløjtende Dino og et bitte musepip – og et lille 'pip' fra ægget.",
    "interaktion": null
   }
  ],
  "efterscene": "Ordløs, ca. 3 sekunder: Højt over dalen kredser Næb og kigger ned på det plettede æg under Tubas hage med et glimt i øjet. Så flyver hun mod sin rede på den høje klippe. Musen åbner det ene øje på Tubas næse og ser hende.",
  "vidste_du": "Tuba siger: 'Selv de allerstørste langhalse kom ud af et æg, der var mindre end en fodbold.'",
  "samtalekort": {
   "foerste_laesning": [
    "Efter opslag 4 (før kommandoen): Hvorfor løb ægget ikke? Hvem i billedet kunne hjælpe Dino?",
    "Efter opslag 9: Hvorfor åbnede Tuba sin store mund?"
   ],
   "genlaesning": [
    "Efter opslag 2: Hvorfor tror Dino, at det er blevet nat?",
    "Efter opslag 3: Kig på Tubas øjne. Hvordan har han det?",
    "Efter opslag 6: Hvorfor løber Tuba ikke?",
    "Efter opslag 8: Hvorfor er Tuba ikke bange for musen nu?"
   ],
   "storesoester": "Spørg lillebror, hvem der var mest bange – Dino, ægget eller Tuba – og lad ham finde ordet mus på siden."
  },
  "analogt_forslag": "Kaptajnens opgave: Tegn Tuba, der sover med ægget som pude, og tegn musen på hans næse. Skriv mus under."
 }
};

// Missionerne til læs sammen-historierne (sted, opvarmning, Dagens ord, kommando, billedtjek, effekter, billedordbog)
export const MISSIONER_JSON = {
 "D2-tuba": {
  "sted": "dinodal",
  "mappe": "d2",
  "sted_konfig": {
   "id": "dinodal",
   "navn": "Dino-dalen",
   "bg": "img/dinodal.webp",
   "alt": "Dino-dalen: en sø med en lille ø, bregneskov, en lille rygende vulkan og en høj klippe med en stor rede",
   "koeretoej": "dino",
   "historier": [
    "D2-tuba"
   ],
   "hold": "img/dinohold.webp"
  },
  "opvarmning": {
   "lydjagt": [
    {
     "lyd": "æ",
     "valg": [
      "æ",
      "ø",
      "a"
     ]
    },
    {
     "lyd": "g",
     "valg": [
      "g",
      "i",
      "s"
     ]
    },
    {
     "lyd": "m",
     "valg": [
      "m",
      "u",
      "l"
     ]
    },
    {
     "lyd": "d",
     "valg": [
      "d",
      "o",
      "f"
     ]
    }
   ],
   "hvilkenLyd": {
    "bogstav": "æ",
    "billeder": [
     "aeg",
     "bil",
     "sol"
    ],
    "rigtigt": "aeg"
   },
   "sigSelv": "m"
  },
  "nyt": {
   "type": "sove-aeg",
   "ord": "uh",
   "bip": "Det her ord driller. h sover. Det siger: uh.",
   "saetninger": [
    "– Uh! Nat? Nu?",
    "– Uh! Uh! Mus!"
   ]
  },
  "dagensOrd": {
   "glide": [
    {
     "ord": "Dino",
     "billede": "dino",
     "navnekort": true
    },
    {
     "ord": "Tuba",
     "billede": "tuba",
     "navnekort": true
    },
    {
     "ord": "æg",
     "billede": "aeg"
    },
    {
     "ord": "mus",
     "billede": "mus"
    }
   ],
   "laesVaelg": [
    {
     "ord": "mus",
     "billeder": [
      "mus",
      "mur",
      "mund"
     ],
     "rigtigt": "mus"
    }
   ],
   "byg": [
    {
     "ord": "mus",
     "trin1": [
      "m",
      "l",
      "f"
     ],
     "lokkere": [
      "a",
      "i"
     ]
    },
    {
     "ord": "æg",
     "trin1": [
      "æ",
      "ø",
      "a"
     ],
     "lokkere": [
      "u",
      "s"
     ]
    }
   ]
  },
  "kommando": {
   "5": {
    "trin1": [
     "m",
     "l",
     "f"
    ],
    "lokkere": [
     "a",
     "i"
    ],
    "reaktion": "tok"
   }
  },
  "tjek": {
   "3": {
    "billeder": [
     "gab",
     "garn",
     "glas"
    ],
    "rigtigt": "gab",
    "hint": "g-a-b"
   }
  },
  "skilt_i_billedet": {
   "5-efter": {
    "x": 52.5,
    "y": 55.8,
    "w": 10.7,
    "h": 10.9
   },
   "6-foer": {
    "x": 36.8,
    "y": 69.4,
    "w": 8,
    "h": 7.7
   },
   "6-efter": {
    "x": 36.8,
    "y": 69.4,
    "w": 8,
    "h": 7.7
   }
  },
  "effekter": {
   "0": {
    "sfx": [
     "pling"
    ],
    "anim": "zoom"
   },
   "1": {
    "sfx": [
     "pip"
    ],
    "anim": "zoom"
   },
   "2": {
    "sfx": [
     "hm"
    ],
    "anim": "zoom"
   },
   "3": {
    "sfx": [
     "tuba"
    ],
    "anim": "pan-up"
   },
   "4": {
    "sfx": [
     "pip"
    ],
    "anim": "squash"
   },
   "5": {
    "sfx": [
     "tubahvin",
     "bump"
    ],
    "anim": "shake"
   },
   "6": {
    "sfx": [
     "bump",
     "pip"
    ],
    "anim": "shake"
   },
   "7": {
    "sfx": [
     "gaab"
    ],
    "anim": "pan-up"
   },
   "8": {
    "sfx": [
     "plop",
     "snork",
     "pip"
    ],
    "anim": "zoom"
   },
   "9": {
    "sfx": [
     "snork",
     "zzz",
     "pip"
    ],
    "anim": "zoom"
   }
  },
  "detalje": {
   "id": "d2-skilt",
   "sted": "dinodal",
   "icon": "mus-skilt",
   "alt": "Skiltepinden med mus i sandet ved søen"
  },
  "lydstudie_ord": [
   "Dino",
   "Tuba",
   "æg",
   "mus"
  ],
  "ordbog": {
   "dino": {
    "ord": "Dino",
    "img": "img/ord/dino.webp",
    "alt": "Dino, en lille, tyk, grøn langhals-unge"
   },
   "tuba": {
    "ord": "Tuba",
    "img": "img/ord/tuba.webp",
    "alt": "Tuba, en kæmpe orange T-rex med bitte små arme"
   },
   "aeg": {
    "ord": "æg",
    "img": "img/ord/aeg.webp",
    "alt": "Et æg"
   },
   "mus": {
    "ord": "mus",
    "img": "img/ord/mus.webp",
    "alt": "En mus"
   },
   "bil": {
    "ord": "bil",
    "img": "img/ord/bil.webp",
    "alt": "En bil"
   },
   "sol": {
    "ord": "sol",
    "img": "img/ord/sol.webp",
    "alt": "En sol"
   },
   "mur": {
    "ord": "mur",
    "img": "img/ord/mur.webp",
    "alt": "En lille mur af sten"
   },
   "mund": {
    "ord": "mund",
    "img": "img/ord/mund.webp",
    "alt": "En smilende mund"
   },
   "gab": {
    "ord": "gab",
    "img": "img/ord/gab.webp",
    "alt": "Et kæmpe gab med tænder"
   },
   "garn": {
    "ord": "garn",
    "img": "img/ord/garn.webp",
    "alt": "Et nøgle garn"
   },
   "glas": {
    "ord": "glas",
    "img": "img/ord/glas.webp",
    "alt": "Et glas vand"
   }
  }
 }
};
