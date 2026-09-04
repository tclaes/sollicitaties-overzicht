# SollicitatiesApp — werkinstructies

## Git workflow

- Maak voor elke feature een nieuwe branch aan (bv. `feature/sorteer-op-match`, `fix/login-bug`)
- Commit en push de wijzigingen naar die branch
- Open een PR naar `main` via `gh pr create`
- Merge nooit rechtstreeks naar `main`

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

De dagelijkse routine is dus: JSON genereren → committen naar `main` → de Action synct.

Lokaal draaien kan nog steeds, met `secrets/firebase-service-account.json` op zijn plaats:

```
npm run sync:firestore -- data/firestore-sync-input.json
npm run dedupe:firestore            # dry-run
npm run dedupe:firestore -- --apply # ruimt harde duplicaten echt op
```

De oude lokale launchd-opzet (`scripts/run-firestore-sync.sh` en
`scripts/com.tomclaes.firestoresync.plist`) is verwijderd; de workflow hierboven
neemt die rol over.
