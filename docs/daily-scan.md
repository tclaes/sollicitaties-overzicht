## Dagelijkse vacaturescan (lokaal)

De scan draait als lokale scheduled task `dagelijkse-vacatures-frontend`
(`~/.claude/scheduled-tasks/`, draait als de Claude-app open is).

**De volledige werkwijze staat in `docs/daily-scan-task.md`** (bron van waarheid, wijzig die via een PR).
Het lokale `~/.claude/scheduled-tasks/dagelijkse-vacatures-frontend/SKILL.md` is een dunne stub die
`git show origin/main:docs/daily-scan-task.md` leest en uitvoert; die stub hoeft niet meer aangepast te
worden (de app leest hem uit die vaste map, dus het bestand zelf kan niet naar de repo verhuizen).

Die task:

1. leest `data/firestore-sync-input.json` van `origin/main` als bekende stand, plus
   de Firestore-collectie `vacatures` (docs met `isArchived: true`) als lijst
   "niet interessant — niet opnieuw voorstellen";
2. doorzoekt alle bronnen met de Playwright-browser (LinkedIn/Indeed blijven achter
   hun login en worden overgeslagen met een notitie);
3. filtert op Toms profiel en laat gearchiveerde/niet-interessante URLs vallen;
4. stopt als er **geen** nieuwe of nieuw-verlopen vacatures zijn;
5. bij wél wijzigingen: `data/firestore-sync-input.json` herschrijven,
   `npm run pdf:vacatures` draaien (overzicht-PDF naar
   `~/…/Werk/Vacatures zoeken/`), branch + PR → auto-merge → sync + deploy.

### Duplicaten en verlopen vacatures

De scan moet drie regels halen; ze worden afgedwongen door `scripts/check-sync-input.mjs`
(`npm run check:sync-input`), die ook de merge-gate van `auto-merge-vacature-sync.yml` is. Bij een
fout wordt de PR niet gemerged.

- **Geen duplicaten.** Dezelfde vacature mag maar één keer actief in de sync-input staan: niet met
  dezelfde (genormaliseerde) url of document-id, en niet met dezelfde titel + bedrijf + locatie op een
  andere bron (ook niet als de schrijfwijze verschilt, zoals `Fullstack` / `Full-Stack (m/v/x)`).
  De tweede bron gaat in `extraBronnen`. Zijn het echt verschillende vacatures, geef elk item dan een eigen
  expliciet `id`. Zelfde bedrijf en titel op een andere locatie is een waarschuwing, geen fout.
- **Archief wint.** Een actief item mag niet dezelfde vacature zijn als een item met `nietInteressant: true`
  (ook via `extraBronnen`). Zet het op `nietInteressant: true` of laat het weg.
- **Recent gecontroleerd.** Elk actief item heeft `gecontroleerdOp` (`YYYY-MM-DD`, de dag waarop de pagina nog
  live gezien werd), maximaal 14 dagen oud. De scan houdt alles binnen 7 dagen en opent daarvoor zo nodig een
  verversings-PR. Een ontbrekende datum is een waarschuwing tot en met 2026-11-19 en een fout vanaf
  **2026-11-20** (`GECONTROLEERD_VERPLICHT_VANAF` in `scripts/check-sync-input.mjs`).

`npm run check:liveness` (`scripts/check-vacancy-liveness.mjs`) haalt de url van elk actief item op en meldt
`levend`, `verlopen-kandidaat` (HTTP 404/410 of een "niet meer beschikbaar"-melding in de zichtbare tekst) of
`onbekend`. LinkedIn, Indeed en StepStone (login), bot-controles, redirects, time-outs en pagina's die de
vacature niet tonen (zoals de VDAB-SPA) zijn altijd `onbekend`, nooit `levend`. Het script zet nooit zelf
`verlopen: true`; met `--write` zet het enkel `gecontroleerdOp` bij `levend`-items.

Na de sync draait `dedupe:firestore -- --check` in `sync-firestore.yml`: staan er nog duplicaten in Firestore,
dan faalt die stap (rood), zonder iets te wijzigen. Opruimen kan met `npm run trigger:sync -- --dedupe`.

### AI-werkwijze

Naast frontend/full-stack zoekt de scan ook naar rollen waar **ontwikkelen mét AI**
(Copilot, Cursor, Claude Code, agentic development/coding) een vast onderdeel van de job is — via
extra zoektermen (`AI-assisted developer`, `AI-native developer`, `agentic development`, `agentic engineering`, …) én door de
detailpagina's van gewone hits op die signalen na te lezen. De frontend-eis, regio en
vast contract blijven gelden. Rollen waarin je AI zelf bouwt (AI/LLM engineer, agents,
RAG, ML) worden niet opgenomen.

**Agentic development** hoort daar nadrukkelijk bij: rollen waarin je software
ontwikkelt *met* AI-agents (Claude Code, Cursor agent mode, Copilot agent, Codex,
agent-gedreven workflows, orchestratie/review van agent-output). Extra zoektermen:
`agentic development`, `agentic engineer`, `agentic coding`, `Claude Code`,
`AI agents developer workflow`, `vibe coding`. Onderscheid blijft: *met* agents
ontwikkelen telt, *agents bouwen als product* (agent frameworks, LLM-apps) niet.
_Status: deze termen staan pas actief zodra de lokale scheduled task
`dagelijkse-vacatures-frontend` ze ook gebruikt; die moet handmatig worden bijgewerkt._

Zulke vacatures krijgen de tag `AI-assisted` (zoekbaar in de app); agentic rollen
krijgen daarnaast de tag `agentic`. Er is (nog) geen apart veld in het schema.

`npm run pdf:vacatures` genereert de overzicht-PDF uit de sync-input via headless
Chrome; opties `--out <map>` en `--date <DD_MM_YYYY>`.

Lokaal draaien kan nog steeds, met `secrets/firebase-service-account.json` op zijn plaats:

```
npm run sync:firestore -- data/firestore-sync-input.json
npm run dedupe:firestore            # dry-run
npm run dedupe:firestore -- --check # dry-run, exitcode 1 bij duplicaten (zoals in de workflow)
npm run dedupe:firestore -- --apply # ruimt harde duplicaten echt op
npm run check:sync-input            # merge-gate op data/firestore-sync-input.json
npm run check:liveness              # liveness-rapport van de actieve vacatures
```
