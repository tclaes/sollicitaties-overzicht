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
  via *Run workflow* (met optie om duplicaten echt op te ruimen).
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

`scripts/run-firestore-sync.sh` en `scripts/com.tomclaes.firestoresync.plist` zijn de
oude lokale launchd-opzet. Die is vervangen door bovenstaande workflow.
