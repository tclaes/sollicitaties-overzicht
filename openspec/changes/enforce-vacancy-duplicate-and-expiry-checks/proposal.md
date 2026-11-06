# Proposal

## Why

Dubbele vacatures duiken regelmatig opnieuw op in de app, en er staan vacatures tussen die niet meer bestaan of waarop niet meer gesolliciteerd kan worden. De huidige bescherming is te los:

- De dedupe-regel (`sameJobKey` in `scripts/vacancy-keys.mjs`) draait pas **na** de sync, enkel als niet-falende dry-run (`continue-on-error` in `sync-firestore.yml`). Niemand ziet het als er duplicaten overblijven.
- De merge-gate van `auto-merge-vacature-sync.yml` controleert alleen of de JSON geldig is en `titel`, `bedrijf` en `url` bevat. Er is geen enkele duplicaatcontrole vóór de merge.
- In de huidige `data/firestore-sync-input.json` staat al een echt duplicaat tussen de actieve items: "Full Stack Developer (.net / Angular)" in Berchem, zowel via kingfisher-recruitment.be als via vdab.be. Drie CraftCode-vacatures staan tegelijk actief (it-jobs.be) en als niet-interessant (codejobs.be): Tom archiveerde ze, maar dezelfde vacature komt via een andere bron terug.
- Of een vacature nog bestaat, hangt volledig af van het geheugen van de dagelijkse scan. Er is geen vastgelegd moment waarop een actief item opnieuw gecontroleerd moet zijn, dus verlopen vacatures blijven staan tot iemand het toevallig merkt.

## What Changes

- Nieuwe controle op `data/firestore-sync-input.json` (`scripts/check-sync-input.mjs`) die duplicaten per vacature **hard blokkeert**:
  - zelfde genormaliseerde url of zelfde document-id bij twee items;
  - zelfde `sameJobKey` (titel + bedrijf + locatie) bij twee actieve items;
  - een actief item met dezelfde `sameJobKey` of url als een item met `nietInteressant: true` (archief wint van een nieuwe bron);
  - waarschuwing (niet blokkerend) bij zelfde bedrijf + titel met een andere locatie.
- Dezelfde controle wordt de merge-gate in `auto-merge-vacature-sync.yml` en draait ook lokaal (`npm run check:sync-input`), zodat de dagelijkse scan ze vóór het openen van de PR kan draaien. Faalt ze, dan wordt de PR niet automatisch gemerged.
- Verloop-regel: elk actief item krijgt een nieuw optioneel veld `gecontroleerdOp` (YYYY-MM-DD, de dag waarop de scan de detailpagina nog live zag). De controle faalt als een actief item ouder is dan 14 dagen of het veld mist (met een overgangsperiode voor bestaande items, zie design).
- Nieuw script `scripts/check-vacancy-liveness.mjs`: haalt de url van elk actief item op bij publiek bereikbare bronnen en markeert items met een 404/410 of een bekende "niet meer beschikbaar"-tekst als kandidaat-`verlopen`. Bronnen achter een login (LinkedIn, Indeed) geven "onbekend", nooit "levend", en blijven afhankelijk van de browsercontrole van de scan.
- De post-sync dedupe-check in `sync-firestore.yml` laat de job zichtbaar falen (nieuwe vlag `--check` op `dedupe-vacancies.mjs`) als er in Firestore nog duplicaatgroepen bestaan.
- `docs/daily-scan.md` krijgt de regels (volgorde van de stappen, `gecontroleerdOp` zetten, check draaien vóór de PR).

## Capabilities

### New Capabilities
- `vacancy-data-integrity`: regels waaraan de vacaturedata (sync-input en Firestore) moet voldoen vóór en na de sync: geen duplicaten, geen vacatures van een archief-item opnieuw actief en geen actieve vacatures zonder recente liveness-controle.

### Modified Capabilities
<!-- Geen: de bestaande specs (responsive-layout, responsive-vacancy-list, theme) gaan over UI en veranderen niet. -->

## Impact

- **`data/firestore-sync-input.json`**: raakt het bestand in het datamodel (nieuw optioneel veld `gecontroleerdOp`) en de bestaande Kingfisher/VDAB-dubbel moet in een aparte data-PR opgeruimd worden voordat de gate op `main` streng wordt.
- **Firestore-model**: `gecontroleerdOp` wordt als optioneel veld mee gesynct in `sync-vacancies-to-firestore.mjs`. De app (`app/lib/schemas.ts`) hoeft niet te veranderen; er is geen UI-wijziging.
- **Code en workflows**: `scripts/` (nieuw: `check-sync-input.mjs`, `check-vacancy-liveness.mjs`; aangepast: `dedupe-vacancies.mjs`, `sync-vacancies-to-firestore.mjs`, `vacancy-keys.mjs`), `.github/workflows/auto-merge-vacature-sync.yml`, `.github/workflows/sync-firestore.yml`, `package.json`, `docs/daily-scan.md`, `docs/firestore-sync.md`.
- **Scantaak** `dagelijkse-vacatures-frontend`: de volledige werkwijze verhuist naar `docs/daily-scan-task.md` in de repo; de lokale `~/.claude/scheduled-tasks/…/SKILL.md` (buiten git) wordt een dunne stub die die tekst van `origin/main` leest. De nieuwe stappen (`gecontroleerdOp`, checks vóór de PR, wekelijkse verversing) komen daarna als gewone PR in dat document. De gate in de repo vangt het af als de scan ze overslaat.

## Buiten scope

- Het verplaatsen van het bestand zelf: de app blijft de task uit `~/.claude/scheduled-tasks/` lezen.
- Een UI-wijziging in de app (badge "mogelijk verlopen", filter op controledatum).
- Verlopen vacatures waarop al gesolliciteerd is: het huidige gedrag (`verlopen: true` verwijdert het document) blijft ongewijzigd. Als Tom die wil behouden, is dat een aparte change.
- Het automatisch inloggen op LinkedIn of Indeed om daar liveness te controleren.
- Het automatisch samenvoegen van duplicaten in de sync-input. De gate rapporteert en blokkeert, de scan of Tom lost op.
- Fuzzy matching op titel (bv. "Front-end" tegenover "Frontend") buiten de bestaande normalisatie.
