# Tasks

## 1. Bestaande duplicaten opruimen (data-PR, enkel `data/firestore-sync-input.json`)

- [x] 1.1 Voeg de VDAB-url van "Full Stack Developer (.net / Angular)" (Berchem) toe aan `extraBronnen` van het Kingfisher-item en verwijder het aparte VDAB-item (of markeer het `verlopen: true` met die url); verifieer met een script dat `sameJobKey` voor de actieve items geen botsing meer geeft
- [x] 1.2 Los de drie CraftCode-items op (it-jobs.be actief ↔ codejobs.be `nietInteressant`): zet de it-jobs.be-items op `nietInteressant: true` en neem de url van de codejobs.be-items op in `extraBronnen`; verifieer dat er geen actief item meer is met de `sameJobKey` van een niet-interessant item
- [x] 1.3 Zet het actieve Kingfisher-item "Full Stack Developer (.NET / Angular)" (Antwerpen) op `nietInteressant: true`, want dezelfde vacature is via VDAB al door Tom gearchiveerd; neem de Kingfisher-url op in `extraBronnen` van het archief-item; verifieer met het meetscript (V1-sleutel) dat er geen actief item meer is met de sleutel van een niet-interessant item
- [x] 1.4 Zet het actieve LGA IT-item "Full-Stack .NET Developer" (Kontich) op `nietInteressant: true`, want "Fullstack .NET developer" (Kontich) staat al als niet-interessant; verifieer zoals bij 1.3
- [ ] 1.5 Valideer met `JSON.parse` en open de PR; verifieer dat auto-merge en daarna `sync-firestore.yml` slagen

## 2. Gedeelde identiteit in `scripts/vacancy-keys.mjs`

- [x] 2.1 Verplaats `slugify`, `normalizeUrl` (incl. Indeed-`jk`) en `canonicalId` uit `sync-vacancies-to-firestore.mjs` en `dedupe-vacancies.mjs` naar `vacancy-keys.mjs` en importeer ze daar; verifieer dat `npm run dedupe:firestore` en een droge run van de sync (`node --check`) nog laden en dat het gedrag gelijk blijft
- [x] 2.2 Maak `normalizeTitel` strenger: `full-stack`/`full stack`/`fullstack`, `front-end`/`frontend` en `back-end`/`backend` naar één vorm, accenten strippen, `(m/v/x)`-achtervoegsels weg; rolniveau (`senior`, `lead`, `junior`) blijft in de sleutel. Verifieer met testgevallen in `vacancy-keys.test.ts`: "Fullstack .NET developer" = "Full-Stack .NET Developer (m/v/x)", "Lead Front-End Developer" ≠ "Front-end Developer", en de bestaande CraftCode-test blijft slagen
- [x] 2.3 Breid `scripts/vacancy-keys.test.ts` uit met `normalizeUrl`/`canonicalId`: trailing slash, querystring, `www`, Indeed met verschillende `jk`; verifieer met `npm test`
- [x] 2.4 Bijwerken van `scripts/vacancy-keys.d.mts` voor de nieuwe exports; verifieer met `vp check`

## 3. Duplicaat- en archiefcontrole op de sync-input

- [x] 3.1 Maak `scripts/check-sync-input.mjs` met de zuivere functie `checkSyncInput(items, { today, maxAgeDays })` en de CLI-wrapper (exit 1 bij fouten, `--json`); verplaats de bestaande shape-check (`titel`/`bedrijf`/`url`) mee; verifieer dat `node scripts/check-sync-input.mjs` op de opgeschoonde data slaagt
- [x] 3.2 Controle 1 en 2: url/id-botsing en `sameJobKey`-botsing tussen actieve items, met uitzondering voor een expliciet afwijkend `id`; test naast de code in `scripts/check-sync-input.test.ts` met de scenario's "zelfde url met queryparameters", "Indeed met verschillende jk" en "dezelfde vacature op twee jobsites"
- [x] 3.3 Controle 3: actief item tegen `nietInteressant`-item (url, `extraBronnen`, `sameJobKey`), `verlopen` blokkeert niets; test de scenario's "niet-interessante vacature duikt op via andere bron" en "verlopen item blokkeert niets"
- [x] 3.4 Controle 4: waarschuwing bij zelfde bedrijf + titel met een andere locatie; test dat het resultaat "geslaagd" blijft
- [x] 3.5 Voeg `check:sync-input` toe aan `package.json` en laat de foutmelding per probleem beide items, urls en de aanwijzing (`extraBronnen` of expliciet `id`) noemen; verifieer met een testbestand dat de CLI-uitvoer leesbaar is

## 4. `gecontroleerdOp` (verloopregel)

- [x] 4.1 Voeg controle 5 toe aan `checkSyncInput`: formaat, niet in de toekomst, ≤ 14 dagen, uitzondering voor `verlopen`/`nietInteressant`; ontbrekende datum is een waarschuwing tot `GECONTROLEERD_VERPLICHT_VANAF`, daarna een fout; test de scenario's "recent", "te lang niet gecontroleerd", "ontbrekende datum tijdens de invoerperiode" en "uitgezonderd"
- [x] 4.2 Schrijf `gecontroleerdOp` mee in `sync-vacancies-to-firestore.mjs` (`baseFields`) en documenteer het in de header van het script; verifieer dat een item zonder het veld ongewijzigd werkt
- [x] 4.3 Controleer dat `app/lib/schemas.ts` een document met `gecontroleerdOp` zonder fout parset (testcase in `schemas.test.ts`); geen UI-wijziging

## 5. Liveness-check op publieke bronnen

- [x] 5.1 Maak `scripts/check-vacancy-liveness.mjs` met een zuivere classificatiefunctie (status + body + host → `levend` | `verlopen-kandidaat` | `onbekend`), allowlist van publieke hosts en de markerlijst; test de scenario's "404", "marker in de pagina", "bron achter login" en "netwerkfout" met gemockte responses
- [x] 5.2 CLI: time-out, gelijktijdigheidslimiet, rapport (tekst en `--json`), `--write` zet enkel `gecontroleerdOp` bij `levend`-items en zet nooit `verlopen`; voeg `check:liveness` toe aan `package.json`; verifieer op een kopie van de data dat `--write` alleen die datums wijzigt
- [x] 5.3 Draai de check één keer tegen de echte data (zonder `--write`) en leg in de PR-beschrijving vast hoeveel items `levend`, `verlopen-kandidaat` en `onbekend` zijn

## 6. Workflows

- [ ] 6.1 Vervang in `auto-merge-vacature-sync.yml` de inline `node -e`-validatie door `node scripts/check-sync-input.mjs`; verifieer in een testbranch dat een PR met een bewust duplicaat niet wordt gemerged en dat de fout in het jobresultaat staat
- [x] 6.2 Voeg `--check` toe aan `dedupe-vacancies.mjs` (exit 1 bij gevonden groepen, schrijft niets) en gebruik het in de stap "Dedupe-check" van `sync-firestore.yml` zonder `continue-on-error`; `--apply` blijft ongewijzigd; verifieer tegen de Firestore-emulator of een dry-run dat een duplicaat exit 1 geeft en een schone collectie exit 0
- [x] 6.3 Controleer dat `vp test` in `ci.yml` de nieuwe scripttests (`scripts/*.test.ts`) meeneemt; `ci.yml` zelf blijft ongewijzigd omdat de sync-input daar in `paths-ignore` staat en de auto-merge-workflow de gate draait
- [ ] 6.4 Draai na taak 2.2 `npm run dedupe:firestore` als dry-run tegen Firestore (strengere sleutel kan nieuwe pass 2-groepen vinden), zet het rapport in de PR-beschrijving en voer `--apply` alleen uit na akkoord van Tom; verifieer dat het dry-run-rapport geen writes uitvoert

## 7. Docs en rollout

- [x] 7.1 Werk `docs/daily-scan.md` bij: `gecontroleerdOp` zetten, `npm run check:liveness` en `npm run check:sync-input` draaien vóór de PR, `extraBronnen` voor dezelfde vacature op een andere bron, archief wint; verifieer dat de beschreven commando's letterlijk werken
- [x] 7.2 Werk `docs/firestore-sync.md` en `docs/git.md` bij (nieuwe merge-gate, post-sync `--check`, `gecontroleerdOp` als optioneel veld); verifieer dat de verwijzingen kloppen
- [x] 7.3 Zet `GECONTROLEERD_VERPLICHT_VANAF` op invoerdatum + 14 dagen en vermeld de datum in `docs/daily-scan.md`; verifieer dat een item zonder datum vóór die datum waarschuwt en erna faalt
- [ ] 7.4 Integratiecheck: draai `npm test`, `vp check` en `npm run lint:sheriff` en controleer dat een PR met enkel de sync-input nog automatisch wordt gemerged en dat de sync daarna slaagt

## 8. Scantaak naar de repo (stub lokaal, werkwijze in `docs/daily-scan-task.md`)

`~/.claude/scheduled-tasks/dagelijkse-vacatures-frontend/SKILL.md` staat buiten git en moet daar blijven staan, anders vindt de app de task niet meer. De volledige werkwijze verhuist naar de repo; het lokale bestand wordt een dunne stub die de tekst van `origin/main` leest. Maak vóór het vervangen een kopie (`SKILL.md.bak`).

- [ ] 8.1 Kopieer de huidige werkwijze (alles na de frontmatter, STAP 1 t/m 6) ongewijzigd naar `docs/daily-scan-task.md` en vervang de tekst uit de lokale `SKILL.md` door een stub: frontmatter (`name`, `description`) ongewijzigd, plus de opdracht om `git fetch origin main` te draaien, `git show origin/main:docs/daily-scan-task.md` te lezen en die stap voor stap uit te voeren. Verifieer door de task één keer handmatig te draaien (`run_scheduled_task`) en te controleren dat STAP 1 t/m 6 gevolgd worden en dat de volledige tekst niet meer in de lokale `SKILL.md` staat
- [x] 8.2 `docs/daily-scan-task.md`, STAP 4: de uitstap "geen nieuwe en geen nieuw-verlopen vacatures → stop" blijft alleen gelden als alle actieve items een `gecontroleerdOp` van ≤ 7 dagen hebben; anders gaat de scan door naar een verversings-PR (alleen datums). Verifieer met een lezing van de stap dat beide paden beschreven zijn
- [x] 8.3 `docs/daily-scan-task.md`, STAP 2/5: laat de scan `npm run check:liveness -- --write` draaien op de publieke bronnen en `gecontroleerdOp` handmatig zetten voor LinkedIn/Indeed-items die in de browser nog live zijn; nieuwe items krijgen `gecontroleerdOp` = vandaag. Verifieer dat de geschreven JSON de datum bevat
- [x] 8.4 `docs/daily-scan-task.md`, STAP 5: voeg vóór `git add` een stap toe die `npm run check:sync-input` draait en bij een fout eerst oplost (tweede bron naar `extraBronnen`, of het item weglaten) in plaats van de PR te openen; vermeld de fout in `scan.log` en STAP 6. Verifieer door een bewust duplicaat in een kopie van de data te zetten
- [x] 8.5 `docs/daily-scan-task.md`, STAP 5b: neem het resultaat van de gate (auto-merge niet gebeurd door de check) op in de rapportage
- [ ] 8.6 `check-vacature-duplicaten/SKILL.md` (lokaal): pas aan zodat het `npm run dedupe:firestore -- --check` gebruikt (exit-code), of verwijder de task omdat `sync-firestore.yml` die controle nu zichtbaar doet; kies na taak 6.2 en verifieer dat er niet twee taken hetzelfde rapporteren
- [x] 8.7 Werk `docs/daily-scan.md` bij: verwijs naar `docs/daily-scan-task.md` als bron van de werkwijze, leg uit dat de lokale `SKILL.md` een stub is en niet meer aangepast hoeft te worden, en dat wijzigingen via een PR lopen. Verifieer dat `CLAUDE.md` en `docs/daily-scan.md` naar het juiste bestand verwijzen

## Workflow follow-up

- Archiveer de change nadat de PR is gemerged en de tests groen zijn, en werk de relevante docs bij.
