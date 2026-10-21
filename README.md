# Lubor Reality

Denně aktualizované příležitosti (primárně stavební pozemky) v Pardubickém a Královéhradeckém kraji.

- `index.html` – aplikace (záložky Pozemky, Domy, Byty, Zadání)
- `zadani.json` – aktuální zadání vyhledávání, upravuje se v menu Zadání
- `data/listings.json`, `data/meta.json` – výsledky, plní je denní aktualizace v 7:00 (Europe/Prague)
- `api/zadani.js` – ukládání zadání (Vercel, proměnná `GITHUB_TOKEN`, volitelně `ZADANI_KOD`)
