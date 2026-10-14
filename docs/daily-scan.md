## Dagelijkse vacaturescan (lokaal)

De scan draait als lokale scheduled task `dagelijkse-vacatures-frontend`
(`~/.claude/scheduled-tasks/`, draait als de Claude-app open is).

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

### AI-werkwijze

Naast frontend/full-stack zoekt de scan ook naar rollen waar **ontwikkelen mét AI**
(Copilot, Cursor, Claude Code, agentic development/coding) een vast onderdeel van de job is — via
extra zoektermen (`AI-assisted developer`, `AI-native developer`, `agentic development`, `agentic engineering`, …) én door de
detailpagina's van gewone hits op die signalen na te lezen. De frontend-eis, regio en
vast contract blijven gelden. Rollen waarin je AI zelf bouwt (AI/LLM engineer, agents,
RAG, ML) worden niet opgenomen.

Zulke vacatures krijgen de tag `AI-assisted` (zoekbaar in de app). Er is (nog) geen
apart veld in het schema.

`npm run pdf:vacatures` genereert de overzicht-PDF uit de sync-input via headless
Chrome; opties `--out <map>` en `--date <DD_MM_YYYY>`.

Lokaal draaien kan nog steeds, met `secrets/firebase-service-account.json` op zijn plaats:

```
npm run sync:firestore -- data/firestore-sync-input.json
npm run dedupe:firestore            # dry-run
npm run dedupe:firestore -- --apply # ruimt harde duplicaten echt op
```
