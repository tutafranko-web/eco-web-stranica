# PIER bistro — web stranica

Statična stranica za PIER bistro, Velo Varoš, Split.
Uživo: **https://pier-bistro.vercel.app**

## Sadržaj

| Putanja | Što je |
|---|---|
| `site/index.html` | **aktivna verzija** — vođena šetnja s poglavljima |
| `site/v1.html` | prethodna verzija, `noindex` (živa na `/v1`) |
| `site/404.html` | stranica za nepostojeće adrese |
| `site/frames/hi/` | 400 okvira 1440×2560 (q72) za scroll animaciju |
| `site/frames/lo/` | 50 okvira 720×1280 (q66), učitavaju se prvi |
| `site/img/` | poster, fotografije prostora i OG kartica za dijeljenje |
| `site/robots.txt` | tražilice i AI pauci — sve dopušteno osim `/v1` |
| `site/sitemap.xml` | jedna adresa, s hreflang parovima hr/en |
| `site/site.webmanifest` | ime, boje i ikone za „dodaj na početni zaslon" |
| `middleware.js` | mjerenje AI pauka na rubu mreže (vidi dolje) |
| `mobil.html` | pregled u okviru mobitela, s prebacivanjem verzija |
| `vercel.json` | statični deploy iz `site/`, keširanje i sigurnosna zaglavlja |

## Scroll animacija

Nije video nego niz slika na canvasu — scrubbanje `<video>` elementa
trza na iOS Safariju.

Učitavanje ide u tri koraka. Mala serija (50 okvira, 1,7 MB) omogući
skrolanje odmah. Oštra serija ima 400 okvira i dolazi u **dva prolaza**:
prvo svaki drugi okvir (16 MB) — što je već upotrebljiva šetnja — pa
ostatak (još 16 MB), koji je dopuni do glatkog. Na `saveData` ili 2G
oštra se uopće ne pokreće; na 3G stane nakon prvog prolaza.

Kretanje je glačano na tri načina:

1. Skrol ne gura sliku izravno nego vuče metu koju prikaz stiže u
   koracima — fling tako ne preskoči okvire.
2. Dvije susjedne slike se pretapaju po razlomku položaja, pa sitni
   skok između okvira nestane bez ijednog novog bajta.
3. **Zamah prsta se ne baca.** Kad skrol stane, šetnja se ponese još
   do devet okvira, razmjerno tome koliko je zamah bio jak. Gura se
   *pravi skrol* (`scrollBy`), ne samo slika — prvi pokušaj je sliku
   puštao ispred skrola, ali se onda nakon naglog stopa vraćala 2,6
   okvira natrag, što se na kadru kamere koja hoda vidi kao trzaj.

   Ugođeno tako da sporo čitanje ne pomiče ništa, srednji zamah nosi
   ~4 okvira, a jak ~8. Nikad izvan granica šetnje.

Adresa okvira nosi biljeg izdanja (`?v=3`). Okviri se keširaju kao
nepromjenjivi na godinu dana, pa se pri svakoj novoj seriji biljeg
**mora** podići — inače povratnik zauvijek gleda staru snimku.

Niz okvira **nema** fade iz crnog ni u crno — isporučeni mp4 ih ima, ali
na stranici bi značili da se hero otvara na crnom, a poziv na rezervaciju
na kraju stoji na crnom. Ako ikad ponovno generiraš okvire, koristi
montažu bez `fade` filtara.

## Jezik

Zadani jezik je **engleski** — i varijabla u skripti i sam markup, da
tražilice i dijeljenje ne vide hrvatski tekst pod `lang="en"`. Hrvatska
verzija je na `?lang=hr` i na gumbu HR. Prijevodi stoje u jednoj tablici
(`T.hr` / `T.en`); statični markup je iz nje i generiran, pa se ne mogu
razići.

Ako ikad poželiš da stranica sama pogodi jezik po pregledniku, to je
jedan redak uz `var lang` — ali onda je teže testirati jer se razlikuje
od uređaja do uređaja.

## Mjerenje

### Uključivanje Google Analyticsa

1. U GA4 napravi property i web data stream za `pier-bistro.vercel.app`.
2. Prepiši **Measurement ID** (oblik `G-XXXXXXXXXX`) u `site/index.html`,
   u redak `var GA4_ID = "";` blizu vrha dokumenta.
3. Objavi. Dok je ID prazan, sve radi u suhom hodu — događaji se slažu u
   `dataLayer` i, uz `?mjerenje=debug` u adresi, ispisuju u konzolu.

### Što se mjeri

Uz standardne GA4 mjere (posjeti, izvori, trajanje, dubina skrolanja):

| Događaj | Kad se javi |
|---|---|
| `walkthrough_start` | gost je krenuo kroz šetnju |
| `walkthrough_chapter` | ušao u poglavlje (Prilaz / Ulaz / Šank / Salon) |
| `walkthrough_complete` | prošao do kraja, uz trajanje u sekundama |
| `walkthrough_skip` | kliknuo „preskoči" i gdje je stao |
| `scroll_hint_shown` | pokazao se poziv na skrolanje |
| `section_view` | sekcija stvarno ušla u vidno polje |
| `reservation_start` | prvi dodir forme i koje polje |
| `reservation_submit` | poslana rezervacija, s brojem gostiju i rokom |
| `reservation_invalid` | forma odbijena zbog praznih polja |
| `contact_click` | klik na telefon, e-mail ili kartu |
| `cta_click` | klik na „Rezerviraj stol" |
| `language_switch` | prebacivanje HR/EN |
| `web_vitals` | LCP, CLS, INP, FCP i TTFB s ocjenom i vrstom veze |
| `agent_visit` | AI pomoćnik ili automatizirani preglednik |
| `agent_visit_server` | AI pauk uhvaćen na rubu mreže |
| `consent_choice` | gost prihvatio ili odbio mjerenje |

U GA4 pod **Admin → Custom definitions** registriraj kao custom dimensions:
`promet_vrsta`, `agent_ime`, `agent_svrha`, `agent_signal`, `poglavlje`,
`metrika`, `ocjena`, `sekcija`, `nacin`, `sekcija` i `jezik` — inače ih
izvještaji ne vide, iako stižu.

### Agentski promet

Promet se dijeli na tri vrste u dimenziji `promet_vrsta`:

- **`covjek`** — običan posjetitelj
- **`agent`** — stranicu vozi program: AI pomoćnik koji je otvorio
  preglednik, ili alat za automatizaciju
- **`ai_preporuka`** — čovjek, ali je došao preko ChatGPT-a, Claudea,
  Perplexityja, Geminija i sličnih (prepoznaje se po referreru ili
  `utm_source`)

Pravi AI pauci — GPTBot, ClaudeBot, PerplexityBot — **ne izvršavaju
JavaScript**, pa ih gtag nikad ne vidi. Njih hvata `middleware.js` prije
nego što stranica uopće krene i šalje ih u isti GA4 preko Measurement
Protocola, kao `agent_visit_server`.

Da proradi, u Vercelu (Settings → Environment Variables) treba:

| Varijabla | Odakle |
|---|---|
| `GA4_ID` | isti Measurement ID kao u `index.html` |
| `GA4_API_SECRET` | GA4 → Admin → Data streams → Measurement Protocol API secrets |

Bez njih middleware samo propusti promet i ništa ne šalje.
Provjera da uopće radi: otvori `/?mw=test` — vrati klasifikaciju
umjesto stranice.

### Pristanak

Consent Mode v2 kreće sa svime odbijenim. Traka na dnu pita gosta jednom
i pamti izbor u `localStorage`. Dok nije prihvaćeno, GA4 šalje samo
bezkolačićne signale — tako nalaže GDPR, a Google iz njih i dalje
modelira promet.

## Strukturirani podaci

U `<head>` je `Restaurant` schema koju Google čita **kao činjenice** i
može ih pokazati u rezultatima pretrage. Sadrži adresu, radno vrijeme,
kuhinju i poveznicu na rezervaciju.

**Telefon je namjerno izostavljen** jer se dva izvora ne slažu. Čim se
zna koji je točan, dodaj `"telephone"` u schemu i upiši ga u `PODACI`.

## Prije objave

Svi podaci koje treba potvrditi su u `PODACI` objektu na vrhu skripte
u `site/index.html`. Dok je `potvrdjeno: false`, vrijednost se prikazuje
s točkastom podvlakom i prikazuje se fusnota.

Treba potvrditi:

- **telefon** — izvori se razlikuju: `+385 99 380 7950` (Google) i
  `+385 99 349 7033` (bookmeatable)
- **e-mail** — `info@pierbistro.hr` je pretpostavka
- **radno vrijeme** — trenutno 07:30–24:00 svaki dan, prema RestaurantGuru
- **popis jela** — sastavljen iz javnih recenzija

Traka „Prototip" na vrhu stranice uklanja se brisanjem `<div id="proto">`.

## Rezervacije

Forma je trenutno samo front-end — prikaže potvrdu, ali ništa ne šalje.
Za stvarni rad treba backend (zapis rezervacija + potvrdni e-mail).
