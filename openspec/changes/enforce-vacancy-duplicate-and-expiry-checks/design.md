# Design

## Context

- Vacature-identiteit is al op twee plaatsen vastgelegd: `normalizeUrl`/`generateId` (gekopieerd in `sync-vacancies-to-firestore.mjs` en `dedupe-vacancies.mjs`) en `sameJobKey` in `scripts/vacancy-keys.mjs` (met test in `vacancy-keys.test.ts`). Het sync-script vangt een "tweeling" alleen op voor een **nieuw** document; de dedupe-pass 2 draait pas na de sync en faalt nooit (`continue-on-error: true` in `sync-firestore.yml`).
- De merge-gate in `auto-merge-vacature-sync.yml` draait een inline `node -e` zonder `vp install`: er zijn geen dependencies beschikbaar, alleen Node.
- `data/firestore-sync-input.json` (238 items, 107 actief) bevat nu al één actief duplicaat (Kingfisher/VDAB, "Full Stack Developer (.net / Angular)", Berchem) en drie actieve CraftCode-items waarvan de codejobs.be-tegenhanger `nietInteressant` is.
- Het item-formaat kent geen datum van "laatst gezien". `verlopen: true` verwijdert het Firestore-document (ook bij `status: gesolliciteerd`), `nietInteressant: true` archiveert het.
- Dit raakt Firestore niet via query's: geen app-query verandert en het archief (niet standaard geladen) blijft zoals het is. De post-sync check leest wel de volledige collectie `vacatures`, inclusief gearchiveerde documenten, zoals `dedupe-vacancies.mjs` nu al doet.

## Goals / Non-Goals

**Goals:**
- Eén gedeelde implementatie van "is dit dezelfde vacature?" die sync, dedupe en de nieuwe gate gebruiken, zodat ze niet uit elkaar kunnen lopen.
- Een gate die zonder dependencies draait in GitHub Actions én lokaal, met een duidelijke foutmelding per probleem.
- Verloop-controle die eerlijk is over wat ze niet kan weten.

**Non-Goals:**
- De Firestore-collectie in de gate controleren. Een PR-workflow krijgt geen service-account; Firestore-duplicaten worden na de sync gevangen.
- De scheduled task zelf aanpassen (staat buiten de repo).

## Decisions

### 1. Eén module voor identiteit: `scripts/vacancy-keys.mjs`
`normalizeUrl`, `slugify` en `canonicalId` verhuizen naar `vacancy-keys.mjs` naast `sameJobKey`; sync, dedupe en de nieuwe check importeren ze. De drie kopieën van `normalizeUrl` verdwijnen, inclusief de Indeed-`jk`-uitzondering. Tests uitbreiden in `vacancy-keys.test.ts`.
*Alternatief:* de check een eigen normalisatie geven. Verworpen: dat is precies hoe de "verschillende definities van duplicaat" ontstaan zijn.

`normalizeTitel` wordt strenger: naast lowercase en het strippen van een achtergeplakte locatie worden `full-stack`/`full stack`/`fullstack`, `front-end`/`front end`/`frontend` en `back-end`/`back end`/`backend` tot één vorm herleid, worden accenten gestript en vallen genderachtervoegsels zoals `(m/v/x)` weg. Gemeten op de huidige sync-input (238 items) vangt dit twee echte missers van de huidige sleutel: Kingfisher "Full Stack Developer (.NET / Angular)" (Antwerpen, actief) tegenover een door Tom gearchiveerde VDAB-versie, en LGA IT "Fullstack .NET developer" (Kontich, niet-interessant) tegenover "Full-Stack .NET Developer" (actief).
*Alternatief:* fuzzy matching op titelwoorden (Jaccard, rolniveau weggelaten). Verworpen: op de actieve paren gaf dat 6 treffers waarvan geen enkele een duplicaat was (verschillende rollen bij hetzelfde bedrijf, zoals CraftCode Lead tegenover Front-end of Delen Architect tegenover Developer). Rolniveau (`senior`, `lead`, `junior`) blijft daarom deel van de sleutel.
*Alternatief:* locatie negeren in de sleutel. Verworpen als fout, behouden als waarschuwing (controle 4): de vier treffers die dat extra oplevert zijn herplaatsingen met een nieuwe url en locatie, of staan al op `verlopen`/`nietInteressant`.

### 2. Gate als zuivere Node-module: `scripts/check-sync-input.mjs`
Exporteert `checkSyncInput(items, { today, maxAgeDays })` → `{ errors, warnings }` (zuivere functie, testbaar met Vitest) en heeft een CLI-wrapper (exit 1 bij fouten, `--json` voor machineleesbare output). Geen dependencies behalve `vacancy-keys.mjs`, dus de bestaande inline `node -e` in `auto-merge-vacature-sync.yml` wordt vervangen door `node scripts/check-sync-input.mjs`. Het shape-check van `titel`/`bedrijf`/`url` verhuist mee.
Controles, in volgorde:
1. **url/id-botsing** tussen alle items (ook `verlopen`/`nietInteressant`, want het document-id botst dan echt): fout.
2. **`sameJobKey`-botsing tussen twee actieve items**: fout. Er geldt een uitzondering voor items met een expliciete, afwijkende `id`, want die zijn bewust gescheiden documenten (bv. twee Indeed-vacatures). `extraBronnen`-urls tellen mee als "reeds bekende url".
3. **Actief item ↔ `nietInteressant`-item** met dezelfde `sameJobKey` of url (incl. `extraBronnen`): fout. Archief wint.
4. **Zelfde bedrijf + titel, andere locatie**: waarschuwing.
5. **`gecontroleerdOp`**: formaat, niet in de toekomst, ≤ 14 dagen oud. Ontbreekt de datum, dan is dat een waarschuwing tot een vaste invoerdatum (`GECONTROLEERD_VERPLICHT_VANAF`, een constante bovenaan het script), daarna een fout.
*Alternatief:* de gate op de Firestore-staat laten draaien. Verworpen, zie Non-Goals; de post-sync check dekt dat.

### 3. `gecontroleerdOp` als optioneel veld in de sync-input
`YYYY-MM-DD`, gezet door de scan wanneer de detailpagina nog live is. `sync-vacancies-to-firestore.mjs` schrijft het mee naar het document (`...(v.gecontroleerdOp ? { gecontroleerdOp } : {})`), zodat Firestore ook weet hoe vers een vacature is. `VacancySchema` in `app/lib/schemas.ts` verandert niet: Zod negeert het onbekende veld standaard, en de app toont het niet.
*Alternatief:* de leeftijd afleiden uit `gevondenOp`. Verworpen: dat is de dag van eerste vondst, niet van laatste bevestiging, en het wordt nooit overschreven.

### 4. Liveness-check: `scripts/check-vacancy-liveness.mjs`
Haalt met `fetch` (time-out 10 s, beperkte gelijktijdigheid, vriendelijke `User-Agent`) elke actieve url op en geeft per item één van: `levend`, `verlopen-kandidaat`, `onbekend`.
- **`verlopen-kandidaat`**: HTTP 404/410, of body bevat een marker uit een lijst per taal (o.a. "niet meer beschikbaar", "niet meer gepubliceerd", "no longer available", "position has been filled", "Er kan niet meer worden gesolliciteerd").
- **`levend`**: HTTP 200 zonder marker op een host uit een allowlist van publiek bereikbare bronnen (vdab.be, jobat.be, it-jobs.be, codejobs.be, kingfisher-recruitment.be, bedrijfssites). Anders `onbekend`.
- **`onbekend`**: LinkedIn en Indeed (login/bot-detectie), redirects naar een inlogpagina, time-outs en netwerkfouten. Nooit `levend`.
Met `--write` zet het script `gecontroleerdOp = vandaag` bij `levend`-items; `verlopen: true` zet het **nooit** zelf: een soft-404 of een tijdelijke fout mag geen document laten verwijderen. De scan beslist op basis van het rapport (en de browser voor `onbekend`).
*Alternatief:* de check in een geplande GitHub Action draaien. Verworpen voor nu: runners van GitHub worden door veel jobsites geblokkeerd, en de scan draait toch dagelijks lokaal. Een weekrapport in Actions kan later.

### 5. Post-sync check in Firestore faalt zichtbaar
`dedupe-vacancies.mjs` krijgt een vlag `--check`: dry-run die met exit 1 stopt als pass 1 of pass 2 groepen vindt. In `sync-firestore.yml` draait de stap `--check` (zonder `continue-on-error`) wanneer `dedupe_fix` niet is aangevinkt; `--apply` blijft ongewijzigd. De sync zelf is dan al geslaagd; alleen de job kleurt rood.
*Alternatief:* de sync blokkeren op duplicaten. Verworpen: de sync moet vers materiaal kunnen binnenhalen, en de duplicaten zijn al aanwezig vóór de sync.

### 6. Scantaak: werkwijze in de repo, stub lokaal
De app leest scheduled tasks uit `~/.claude/scheduled-tasks/<naam>/SKILL.md`; dat bestand mag dus niet verdwijnen of verplaatst worden. De lokale `SKILL.md` houdt alleen frontmatter en één opdracht: `git fetch origin main`, `git show origin/main:docs/daily-scan-task.md` lezen en uitvoeren. Zo staat de werkwijze in git (review via PR, geschiedenis) en volgt de scan altijd de versie op `main`, zoals STAP 1 al doet voor de sync-input.
*Alternatieven:* een symlink naar de repo (onzeker of de app die volgt, en `update_scheduled_task` kan hem door een gewoon bestand vervangen; de checkout kan op een andere branch staan) en het bestand laten staan zoals het is (niet reviewbaar, niet in git). Beide verworpen.

### 7. Rolling out zonder de dagelijkse flow te breken
De gate keurt vanaf dag één de bestaande Kingfisher/VDAB-dubbel en de drie CraftCode-items af. Volgorde: (1) eerst een data-PR die deze vier oplost, (2) dan de gate-PR, (3) dan pas de verplichting van `gecontroleerdOp` (`GECONTROLEERD_VERPLICHT_VANAF` = invoerdatum + 14 dagen), zodat de scan eerst alle items kan bijwerken. Omdat de data-PR enkel het sync-input-bestand raakt, wordt hij automatisch gemerged.

## Risks / Trade-offs

- [Een strengere `normalizeTitel` verandert de sleutel ook voor `dedupe-vacancies.mjs` pass 2 en de tweeling-detectie van de sync, waardoor in Firestore nieuwe duplicaatgroepen kunnen opduiken] → Eerst een dry-run tegen Firestore (taak 6.4); `--apply` pas na akkoord van Tom op het rapport.
- [Gate blokkeert de dagelijkse auto-merge bij een vals-positief duplicaat] → Alleen de drie sterke sleutels (url, id, `sameJobKey`) zijn fouten; de rest is waarschuwing. Een bewust verschillend item kan met een expliciet `id` gescheiden worden. De foutmelding noemt dat.
- [Soft-404: een pagina geeft 200 voor een gesloten vacature] → `levend` is alleen "geen bewijs van verlopen"; de markerlijst is uitbreidbaar en LinkedIn/Indeed blijven `onbekend`. De 14-dagengrens dwingt hercontrole af.
- [Jobsites blokkeren automatische requests] → Ze geven dan `onbekend`, nooit `levend`. Er is geen verslechtering ten opzichte van nu.
- [De scan stopt nu op dagen zonder nieuwe of verlopen vacatures en opent dan geen PR, dus datums verversen niet en de gate zou bij de eerstvolgende wijziging op oude data falen] → De scan ververst `gecontroleerdOp` ten minste elke 7 dagen met een aparte datum-PR (taak 8.1), ruim binnen de grens van 14 dagen. Dat is een extra, kleine PR per week.
- [De scheduled task wordt niet aangepast] → `gecontroleerdOp` ontbreekt dan, en dat wordt na de invoerdatum een fout. Dat is gewenst: de PR blijft dan staan en toont waarom, in plaats van stilletjes oude data te synchroniseren.
- [De stub kan `origin/main` niet lezen (offline, git-fout)] → De task stopt dan met een duidelijke melding in `scan.log` in plaats van een oude werkwijze te gebruiken; de `.bak`-kopie blijft als noodoplossing.
- [Items die voor de 14-dagengrens te vaak opnieuw gecontroleerd moeten worden] → Aantal bronnen met login is klein; de liveness-check neemt de publieke bronnen over.
- [Verlopen vacatures met `status: gesolliciteerd` worden nog steeds verwijderd] → Bestaand gedrag, buiten scope (zie proposal).

## Migration Plan

1. Data-PR: de Kingfisher/VDAB-dubbel samenvoegen (tweede url naar `extraBronnen`) en de drie actieve CraftCode-items archiveren of verwijderen; geen codewijziging, wordt auto-gemerged.
2. Code-PR: `vacancy-keys.mjs` uitbreiden, `check-sync-input.mjs`, `check-vacancy-liveness.mjs`, `--check` in dedupe, workflowwijzigingen en docs.
3. De werkwijze van de dagelijkse scan verhuist naar `docs/daily-scan-task.md` (zie beslissing 6) en wordt daar aangepast: `gecontroleerdOp` zetten, wekelijks verversen en `npm run check:sync-input` draaien vóór de PR. Eenmalig wordt de lokale `SKILL.md` vervangen door een stub (taakgroep 8); `check-vacature-duplicaten/SKILL.md` wordt omgezet of verwijderd.
4. Na 14 dagen: `GECONTROLEERD_VERPLICHT_VANAF` bereikt, ontbrekende datum wordt een fout.
Rollback: de workflowstap terugzetten naar de oude inline JSON-validatie; de scripts zijn additief en `gecontroleerdOp` is optioneel.

## Open Questions

- Welke extra "niet meer beschikbaar"-teksten moeten in de markerlijst (bv. specifieke formuleringen van it-jobs.be of bedrijfssites)? De lijst kan bij gebruik aangevuld worden zonder specwijziging.
