## Git workflow

- Maak voor elke feature een nieuwe branch aan (bv. `feature/sorteer-op-match`, `fix/login-bug`)
- Commit en push de wijzigingen naar die branch
- Open een PR naar `main` via `gh pr create`
- Merge nooit rechtstreeks naar `main`

## Auto merge

- Uitzondering: een PR die **uitsluitend** `data/firestore-sync-input.json` wijzigt
  wordt automatisch gemerged en gesynct (zie *Firestore-sync* hieronder). Voor die
  vacature-updates volstaat het dus om een branch + PR te maken; niet zelf mergen.

`.github/workflows/auto-merge-vacature-sync.yml` mergt automatisch elke PR naar
`main` die **enkel** `data/firestore-sync-input.json` wijzigt en geldige JSON bevat (elke niet-verlopen vacature moet
`titel`, `bedrijf` en `url` hebben). Daarna start
die workflow `sync-firestore.yml` expliciet op `main` — een merge via `GITHUB_TOKEN`
triggert de push-trigger namelijk niet.

Raakt de PR ook maar één ander bestand, dan gebeurt er niets en wacht de PR op een
handmatige review.

De dagelijkse routine is dus: JSON genereren → branch + PR naar `main` → auto-merge
→ de Action synct. (Direct `npm run trigger:sync` draaien kan ook nog, maar dan sync
je de versie die al op `main` staat.)
