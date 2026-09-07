# SollicitatiesApp — werkinstructies

## Git workflow

- Maak voor elke feature een nieuwe branch aan (bv. `feature/sorteer-op-match`, `fix/login-bug`)
- Commit en push de wijzigingen naar die branch
- Open een PR naar `main` via `gh pr create`
- Merge nooit rechtstreeks naar `main`
- Uitzondering: een PR die **uitsluitend** `data/firestore-sync-input.json` wijzigt
  wordt automatisch gemerged en gesynct (zie *Firestore-sync* hieronder). Voor die
  vacature-updates volstaat het dus om een branch + PR te maken; niet zelf mergen.

## Firestore-sync

De vacature-sync draait in GitHub Actions, niet meer lokaal.

- Workflow: `.github/workflows/sync-firestore.yml`
- Trigger: elke push naar `main` die `data/firestore-sync-input.json` wijzigt, plus handmatig
  via *Run workflow* (met optie om duplicaten echt op te ruimen) of via de CLI:

  ```
  npm run trigger:sync              # start de workflow en volgt de run
  npm run trigger:sync -- --dedupe  # idem, maar ruimt duplicaten ook echt op
  npm run trigger:sync -- --force   # sync ook als de input niet is gewijzigd
  ```

  `trigger:sync` gebruikt `gh workflow run sync-firestore.yml --ref main`, dus de
  cowork-app kan de sync volledig op GitHub starten zonder eerst naar `main` te pushen.
  Vereist een ingelogde GitHub CLI (`gh auth status`) met `repo`-scope.

  De workflow synct altijd de versie van `data/firestore-sync-input.json` die op
  `main` staat. Daarom stopt `trigger:sync` met exitcode 0 zonder de workflow te
  starten als dat bestand niet afwijkt van `origin/main` (committed of niet) — dan
  valt er niks te syncen. Met `--force` sla je die controle over.
- Auth: repo-secret `FIREBASE_SERVICE_ACCOUNT` — de volledige inhoud van de
  service-account JSON. De workflow schrijft die naar een tijdelijk bestand en ruimt
  het daarna op.

### Auto-merge van vacature-updates

`.github/workflows/auto-merge-vacature-sync.yml` mergt automatisch elke PR naar
`main` die **enkel** `data/firestore-sync-input.json` wijzigt en geldige JSON bevat
(elke niet-verlopen vacature moet `titel`, `bedrijf` en `url` hebben). Daarna start
die workflow `sync-firestore.yml` expliciet op `main` — een merge via `GITHUB_TOKEN`
triggert de push-trigger namelijk niet.

Raakt de PR ook maar één ander bestand, dan gebeurt er niets en wacht de PR op een
handmatige review.

De dagelijkse routine is dus: JSON genereren → branch + PR naar `main` → auto-merge
→ de Action synct. (Direct `npm run trigger:sync` draaien kan ook nog, maar dan sync
je de versie die al op `main` staat.)

## Dagelijkse vacaturescan (lokaal)

De scan draait als lokale scheduled task `dagelijkse-vacatures-frontend`
(`~/.claude/scheduled-tasks/`, draait als de Claude-app open is). Die task:

1. leest `data/firestore-sync-input.json` van `origin/main` als bekende stand;
2. doorzoekt alle bronnen met de Playwright-browser (LinkedIn/Indeed blijven achter
   hun login en worden overgeslagen met een notitie);
3. filtert op Toms profiel;
4. stopt als er **geen** nieuwe of nieuw-verlopen vacatures zijn;
5. bij wél wijzigingen: `data/firestore-sync-input.json` herschrijven,
   `npm run pdf:vacatures` draaien (overzicht-PDF naar
   `~/…/Werk/Vacatures zoeken/`), branch + PR → auto-merge → sync + deploy.

`npm run pdf:vacatures` genereert de overzicht-PDF uit de sync-input via headless
Chrome; opties `--out <map>` en `--date <DD_MM_YYYY>`.

De cloud-cowork-taak die dit vroeger deels deed, is afgevoerd.

Lokaal draaien kan nog steeds, met `secrets/firebase-service-account.json` op zijn plaats:

```
npm run sync:firestore -- data/firestore-sync-input.json
npm run dedupe:firestore            # dry-run
npm run dedupe:firestore -- --apply # ruimt harde duplicaten echt op
```

De oude lokale launchd-opzet (`scripts/run-firestore-sync.sh` en
`scripts/com.tomclaes.firestoresync.plist`) is verwijderd; de workflow hierboven
neemt die rol over.
