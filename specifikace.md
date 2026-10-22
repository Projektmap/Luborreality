# Zadání: aplikace Lubor Reality (kompletní specifikace pro vytvoření v Claude)

Vytvoř webovou aplikaci **Lubor Reality**, která každý den v 7:00 (Europe/Prague) vyhledá na českých realitních serverech nemovitosti podle zadání uživatele, porovná jejich cenu za m² s ostatními nabídkami ve stejné obci a zobrazí jen příležitosti pod cenou. Primárně jde o **stavební pozemky v Pardubickém a Královéhradeckém kraji**. Komunikuj se mnou česky a stručně.

## 1. Cíl a uživatel
- Uživatel: realitní makléř / investor (via finance reality). Chce každé ráno vidět nové pozemky (a volitelně domy a byty), které jsou výrazně pod cenou obce a mají potenciál (dvojdomky, trojdomky, stavební povolení, sítě).
- Uživatel si sám upravuje zadání v menu **Zadání**; změna se projeví při nejbližší denní aktualizaci.

## 2. Architektura
- **GitHub repozitář** `luborreality` (soukromý), větev `main`. **Vercel** projekt napojený na repo, auto-deploy při každém pushi. Adresa `https://luborreality.vercel.app`.
- Statický web (jeden soubor `index.html`, vanilla JS, bez frameworku) + jedna serverless funkce `api/zadani.js` (Node, CommonJS).
- Data jsou soubory v repu:
  - `zadani.json` – zadání vyhledávání (upravuje uživatel přes web),
  - `data/listings.json` – nalezené nabídky (zapisuje denní úloha),
  - `data/meta.json` – čas a souhrn poslední aktualizace.
- **Denní aktualizace**: naplánovaná úloha v Claude (scheduled task) s cron `CRON_TZ=Europe/Prague 0 7 * * *`, která repo naklonuje, vyhledá nabídky, zapíše JSON, commitne a pushne (Vercel nasadí).
- Ukládání zadání z webu: `api/zadani.js` zapisuje `zadani.json` do repa přes GitHub Contents API. Token je v proměnné prostředí Vercelu `GITHUB_TOKEN` (fine-grained token, jen repo luborreality, oprávnění **Contents: Read and write**). Volitelně `ZADANI_KOD` = heslo pro uložení.

## 3. Vzhled (via finance reality)
- Barvy: **oranžová** `#f08a24`, **zelená** `#6fb640` (tmavší `#4f8f2a`), **žlutá** `#f2c41a`, text `#3b3b3b`, pozadí `#faf9f6`, karty bílé. Světlé „soft“ odstíny pro štítky a pozadí (oranžová `#fdeedd`, zelená `#e9f5e1`, žlutá `#fdf6d5`). Podpora tmavého režimu.
- **Všechna call-to-action tlačítka zelená** (Zobrazit inzerát, Uložit zadání, Upravit zadání).
- Písmo: Nunito (nadpisy, 800) a Nunito Sans (text) z Google Fonts.
- Hlavička: značka „Lubor Reality“, podtitul „via finance reality · příležitosti pod cenou“, vlevo tři barevné lístky (oranžový, zelený, žlutý) jako jednoduchý symbol, vpravo „Poslední aktualizace … · další v 7:00“.
- Hero s jemným přechodem oranžová → žlutá → zelená, nadpis „Pozemky a nemovitosti **pod cenou** v Pardubickém a Královéhradeckém kraji“, pod ním souhrn z `meta.json` a 4 statistiky: aktivních příležitostí, nových dnes, se skóre 70+, nejvyšší sleva.
- Mobil od 390 px, bez vodorovného posouvání.

## 4. Menu a obrazovky
Lepivé menu: **Pozemky** (výchozí, s počtem) · **Domy** · **Byty** · vpravo oranžově **✎ Zadání**. Navigace přes hash (#pozemky, #domy, #byty, #zadani).

### Výpis (Pozemky / Domy / Byty)
- Filtr kraje (Oba kraje / Pardubický / Královéhradecký), řazení (nejvyšší skóre, největší sleva, nejnovější, nejnižší cena), vyhledávání (obec, štítek, text). Řazení a hledání pamatovat v localStorage.
- Řádek souhrnu: počet nabídek + aktuální zadání (plocha, cena do, min. sleva).
- Karta nabídky (2 sloupce na desktopu, 1 na mobilu):
  - kruh se skóre (≥70 zelený, 50–69 žlutý, jinak oranžový), titulek, obec · km od města · kraj,
  - 3 čísla: cena + plocha; Kč/m² + medián obce; sleva v % (vs. obec, nebo vs. obec + 5 km) a počet srovnávaných nabídek,
  - štítky (Levně, Dvojdomky, Trojdomky, Stavební povolení, Sítě na pozemku, K rekonstrukci, 3 jednotky, Změna dispozice),
  - věta „proč“ (příležitost + rizika), rozbalovací „Srovnávací nabídky“ (odkazy, Kč/m²),
  - zelené tlačítko **Zobrazit inzerát →**, další servery jako obrysová tlačítka, datum „od“,
  - nabídka z dnešního dne má žlutý štítek **NOVÉ**.
- Prázdný stav: vysvětlení + zelené tlačítko „Upravit zadání“.

### Zadání
- Přepínač Pozemky / Domy / Byty (✓ u aktivních).
- Pole: zapnout hledání (ano/ne), kraje (zaškrtávací), plocha od–do (m²), cena do (Kč), minimální sleva (% pod mediánem Kč/m² v obci), max. km od města (0 = jen ve městě), město od (obyvatel), u pozemků „jen stavební“, bonusy ve skóre (zaškrtávací), „musí obsahovat“ (slova), „vyloučit“ (slova), poznámka (volný text pro ranní hledání), případně kód pro uložení.
- Zelené tlačítko **Uložit zadání** → POST `/api/zadani`; hláška „Uloženo. Projeví se při aktualizaci zítra v 7:00.“
- Pod formulářem poznámka, které servery se prohledávají.

## 5. Datové struktury

### zadani.json
```json
{
 "upraveno": "2026-10-21",
 "pozemky": {"aktivni": true, "kraje": ["Pardubický","Královéhradecký"], "plochaMin": 750, "plochaMax": 2200, "cenaMax": 10000000,
   "minObyvatelMesta": 20000, "maxKmOdMesta": 5, "minSleva": 13, "jenStavebni": true,
   "bonusy": ["dvojdomky","trojdomky","povoleni","site"], "hledat": "",
   "vyloucit": "orná půda, les, louka, zahrada bez možnosti stavby, chata, záplavové území",
   "poznamka": "Primární zadání: stavební pozemky pro dvojdomky a trojdomky u větších měst."},
 "domy": {"aktivni": false, "kraje": ["Pardubický","Královéhradecký"], "plochaMin": 100, "plochaMax": 400, "cenaMax": 15000000,
   "minObyvatelMesta": 20000, "maxKmOdMesta": 5, "minSleva": 13, "bonusy": ["rekonstrukce","tri_jednotky"], "hledat": "", "vyloucit": "družstevní, dražba", "poznamka": ""},
 "byty": {"aktivni": false, "kraje": ["Pardubický","Královéhradecký"], "plochaMin": 30, "plochaMax": 76, "cenaMax": 6000000,
   "minObyvatelMesta": 20000, "maxKmOdMesta": 0, "minSleva": 13, "bonusy": ["rekonstrukce","dispozice"], "hledat": "", "vyloucit": "družstevní, dražba", "poznamka": ""}
}
```

### data/listings.json (pole objektů)
`id` („{zkratka}-{id inzerátu}“: cr ceskereality, br bezrealitky, rm realitymix, rg realingo, rx remax, bz bazoš), `src`, `url`, `alt` [{src, url}], `title` (česky, např. „Stavební pozemek 1 480 m² – Pardubice, Ohrazenice“), `type` (pozemek | dum | byt), `region` (Pardubický | Královéhradecký), `obec`, `mesto`, `kmOdMesta`, `price`, `area`, `ppm2`, `bench`, `benchN`, `benchMin`, `benchMax`, `comps` [{t, ppm2, url}], `discount` (0–1), případně `bench5`, `bench5N`, `bench5Min`, `bench5Max`, `comps5`, `discount5`, `score` (0–100), `tags`, `why`, `firstSeen`, `lastSeen` (YYYY-MM-DD), `priceHistory` [{d, p}], `active`.

### data/meta.json
`{"aktualizace": "2026-10-22T07:05:00+02:00", "souhrn": "1 věta česky", "zdroje": ["ceskereality.cz", …], "pocty": {"pozemek": n, "dum": n, "byt": n}}`

## 6. API `api/zadani.js`
- `GET` → přečte `zadani.json` z repa (GitHub Contents API, ref main) a vrátí `{zadani, requiresCode}`.
- `POST {zadani, kod}` → ověří kód (pokud je `ZADANI_KOD`), **vyčistí vstup** (jen známé klíče, čísla 0–1e9, kraje jen z povoleného seznamu, bonusy jen [a-z_], texty max 1 500 znaků), doplní `upraveno` (dnešní datum Europe/Prague) a uloží soubor commitem „Zadání upraveno <datum>“ (PUT contents se `sha`).
- Bez tokenu vrací 503 `{"error":"not_configured"}`; web pak zobrazí hlášku. Hlavička `Cache-Control: no-store`.
- Web při nedostupném API načte `zadani.json` staticky (jen pro čtení).

## 7. Denní aktualizace (prompt naplánované úlohy, 7:00 Europe/Prague)
1. Naklonuj repo, načti `zadani.json` (závazné; hledej jen sekce s `aktivni: true`) a `data/listings.json`.
2. **Zdroje** (jen čtení stránek přes WebFetch, stránky 1–2, nejnovější): ceskereality.cz (`/prodej/{pozemky|rodinne-domy|byty}/{pardubicky-kraj|kralovehradecky-kraj}/` + okresní a obecní stránky), bezrealitky.cz, realitymix.cz, realingo.cz, remax-czech.cz, reality.bazos.cz. **Sreality.cz a reality.idnes.cz automatický přístup zakazují – nepoužívat ani obcházet.** Ignorovat dražby, družstevní bydlení, chaty, ornou půdu, les, louky a nezastavitelné pozemky. Kontakty soukromých osob nekopírovat.
3. **Lokalita**: město = obec s aspoň `minObyvatelMesta` obyvateli (ověřit podle ČSÚ; např. Pardubice, Hradec Králové, Chrudim, Trutnov; hraniční Náchod, Svitavy, Jičín, Ústí nad Orlicí ověřit). Nabídka ve městě nebo max `maxKmOdMesta` km od hranice.
4. **Cenové srovnání**: `bench` = medián Kč/m² aktuálních nabídek stejného typu ve **stejné obci** (u pozemků jen stavební, posuzovanou nabídku nezahrnovat), `discount = round(1 − ppm2/bench, 3)`. Při méně než 5 srovnáních použít obec + okolí 5 km (`bench5`, `discount5`); když ani to nemá 5 nabídek, nabídku nezapisovat. Zapisovat jen nabídky se slevou ≥ `minSleva` %.
5. **Skóre 0–100**: sleva → min(40, sleva × 100) bodů, při slevě ≥ 15 % štítek „levne“; bonusy (jen zapnuté v zadání): dvojdomky +30, trojdomky +40 (místo dvojdomků), povoleni +25, site +10, rekonstrukce +15, tri_jednotky +35, dispozice +15; shoda se slovy „hledat“ +5, rozpor s poznámkou −15.
6. **Deduplikace**: typ + obec/ulice + plocha ±2 % + cena ±5 % = jedna nabídka, další URL do `alt`.
7. **Zápis**: nové nabídky (firstSeen = lastSeen = dnes), existující aktualizovat (lastSeen, změny ceny do priceHistory, přepočet), nabídky, které zadání už nesplňují nebo 3 dny zmizely/prodány, odstranit. Max 25 otevřených detailů za běh.
8. `data/meta.json` aktualizovat, ověřit JSON, commit „Aktualizace <datum>“, `git pull --rebase`, push, ověřit nasazení na Vercelu.
9. Poslat krátké shrnutí: počet nových, top 3 (titulek, cena, Kč/m² vs. medián, sleva, skóre, odkaz), nefunkční servery, odkaz na web.

## 8. Postup zprovoznění
1. Na GitHubu založit soukromý repozitář `luborreality` a dát Claude GitHub App přístup (Settings → Applications → Claude → Configure).
2. Claude vytvoří soubory (`index.html`, `api/zadani.js`, `zadani.json`, `data/listings.json` = `[]`, `data/meta.json`, `README.md`) a pushne do `main`.
3. Vercel: Create New → Project → Import `luborreality` → Deploy.
4. GitHub → Settings → Developer settings → Fine-grained tokens → token jen pro `luborreality`, **Contents: Read and write** → vložit do Vercelu jako `GITHUB_TOKEN` → Redeploy (stačí prázdný commit).
5. Claude vytvoří naplánovanou úlohu (bod 7) s cron `CRON_TZ=Europe/Prague 0 7 * * *` a hned ji jednou ručně spustí, aby aplikace měla data.

## 9. Kontrola před předáním
- JS bez chyb, všechny záložky fungují, mobil 390 px bez vodorovného posouvání (Playwright).
- `GET /api/zadani` vrací zadání, uložení změny se projeví commitem v repu.
- Po prvním běhu jsou v `data/listings.json` nabídky a web je zobrazuje.
