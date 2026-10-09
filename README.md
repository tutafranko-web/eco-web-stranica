# PIER bistro — web stranica

Statična stranica za PIER bistro, Velo Varoš, Split.

## Sadržaj

| Putanja | Što je |
|---|---|
| `site/index.html` | **aktivna verzija** — vođena šetnja s poglavljima |
| `site/v1.html` | prethodna verzija (bez letvice poglavlja) |
| `site/frames/hi/` | 200 frameova 1296×2304 za scroll animaciju |
| `site/frames/lo/` | 50 frameova 640×1138, učitavaju se prvi |
| `site/img/` | galerija i poster |
| `mobil.html` | pregled u okviru mobitela, s prebacivanjem verzija |
| `vercel.json` | statični deploy iz `site/`, dugo keširanje frameova |

## Scroll animacija

Nije video nego niz slika na canvasu — scrubbanje `<video>` elementa
trza na iOS Safariju. Učitavanje je dvorazinsko: mala serija (1,3 MB)
omogući skrolanje odmah, oštra (11 MB) se dopunjava u pozadini i
zamjenjuje je frame po frame. Na `saveData` ili 2G vezi oštra se ne pokreće.

## Prije objave

Svi podaci koje treba potvrditi su u `PODACI` objektu na vrhu skripte
u `site/index.html`. Dok je `potvrdjeno: false`, vrijednost se prikazuje
s točkastom podvlakom i prikazuje se fusnota.

Treba potvrditi:

- **telefon** — izvori se razlikuju: `+385 99 380 7950` (Google) i
  `+385 99 349 7033` (bookmeatable)
- **e-mail**
- **radno vrijeme** — trenutno 07:30–24:00 svaki dan, prema RestaurantGuru
- **popis jela** — sastavljen iz javnih recenzija

Traka „Prototip" na vrhu stranice uklanja se brisanjem `<div id="proto">`.

## Rezervacije

Forma je trenutno samo front-end — prikaže potvrdu, ali ništa ne šalje.
Za stvarni rad treba backend (zapis rezervacija + potvrdni e-mail).
