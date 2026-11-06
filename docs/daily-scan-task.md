# Dagelijkse vacaturescan — werkwijze van de scheduled task

Dit document is de **bron van de werkwijze** van de lokale scheduled task `dagelijkse-vacatures-frontend`.
De lokale `~/.claude/scheduled-tasks/dagelijkse-vacatures-frontend/SKILL.md` is een dunne stub die
`git show origin/main:docs/daily-scan-task.md` leest en uitvoert; wijzig de werkwijze dus hier, via een PR.
Samenvatting en achtergrond: `docs/daily-scan.md`.

---

Dagelijkse frontend- en full-stack-vacaturescan van Tom Claes. Draait lokaal op zijn Mac. Antwoord in het Nederlands. Werk zoveel mogelijk zelfstandig af; stop alleen bij een echte blokkade.

## Omgeving

- Repo / werkmap: `/Users/tomclaes/Code/SollicitatiesApp`
- Node/npm: begin elke Bash-sessie met `export PATH="/Users/tomclaes/.nvm/versions/node/v22.21.1/bin:$PATH"`
- Browser: gebruik de MCP-server **`vacaturescan-browser`** (`mcp__vacaturescan-browser__browser_*`). Die hangt via CDP aan een apart Chrome-venster met Toms echte profiel, waarin hij is ingelogd op Indeed en LinkedIn.
  - Werkt geen enkele browser-tool (geen verbinding)? Dan draait dat Chrome-venster niet. Start het:
    `open "/Users/tomclaes/.claude/vacaturescan-chrome-start.command"` en wacht ~8 s. Lukt het daarna nog niet: sla de scan over en meld dat Tom `~/.claude/vacaturescan-chrome-start.command` moet starten. Val NIET terug op een andere browser.
- PDF-output: `/Users/tomclaes/Library/CloudStorage/OneDrive-Personal/Werk/Vacatures zoeken/`

## Profiel Tom (voor de filter)

10+ jaar frontend. Expert: Angular, TypeScript, Web Components, designsystemen. Sterk: React, Nuxt 3. Basis: Node.js/JS-fullstack, Drupal-frontend. Geen expertise: .NET, PHP, Python, Java-backend, ML/AI-engineering. Interesse: rollen waar AI-tools (Copilot, Cursor, Claude Code, agentic development/coding) centraal staan in de ontwikkelworkflow — ontwikkelen **met** AI. Géén interesse in zelf AI-toepassingen, agents of LLM-pipelines bouwen. Woont in Beringen (Limburg), voorkeur Limburg of remote.

## STAP 1 — bekende stand ophalen

```
cd /Users/tomclaes/Code/SollicitatiesApp
git fetch origin main --quiet
git show origin/main:data/firestore-sync-input.json > /tmp/bekende-vacatures.json
```

JSON-array van vacatures (velden: titel, bedrijf, locatie, regio, url, beschrijving, bron, tags, `verlopen: true` voor verlopen posten, `nietInteressant: true` voor als niet-interessant gearchiveerde posten). Wat hier in staat is "bekend". Normaliseer voor vergelijking elke `url` tot `hostname + pad` (lowercase, zonder querystring, zonder trailing slash).

Lees daarnaast Firestore rechtstreeks uit via de Firebase-MCP (project uit `.firebaserc`): `firestore_query_collection` op collectie `vacatures` met filter `isArchived == true`. Normaliseer de `url` van elk resultaat. Samen met de `nietInteressant: true`-items uit de JSON is dat de set **"niet interessant — niet opnieuw voorstellen"**. Firestore is autoritatief: het vangt een archivering van vandaag op die nog niet op `main` staat.

## STAP 2 — scan alle bronnen (via `vacaturescan-browser`)

Open elke bron en lees de vacatures. Wacht bij JS-pagina's tot de lijst geladen is. Werk in nieuwe tabs; sluit ze na gebruik.

Zoek op elke bron zowel op **frontend** als op **full-stack** (React/Vue/Angular/Node/TypeScript) developer.

**Publieke bronnen:** Kingfisher Recruitment (kingfisher-recruitment.be/vacatures/it/development), Clovr (clovr.be/vacatures), Codejobs.be (/vacatures/limburg), Kwery (kwery.be/jobs), AE (jobs.lever.co/ae-2), Recommand (recommand.eu/en/jobs), Talent-IT (talent-it.be/nl/vacatures — alle pagina's), Lowi (careers.lowi.ai), PHPro (phpro.be/nl/jobs), VDAB (vdab.be/vindeenjob — zoek "frontend developer", "fullstack developer", "react developer", "angular developer" in Limburg/Vlaams-Brabant/Antwerpen), ictjob.be (front-end-developer + full-stack-developer + detailpagina's van leads), englishjobs.be (frontend_developer + fullstack_developer per provincie: limburg, antwerpen, leuven), applisquare.be/vacatures, Cegeka, Born Digital, DevLab.Career, Motmans & Partners.

**Extra publieke bronnen (nieuw):**
- techjobs.be — techjobs.be/nl/ict-jobs/frontend én techjobs.be/nl/ict-jobs/fullstack.
- it-jobs.be — zoek "frontend developer" en "fullstack developer", filter regio Limburg/Antwerpen/Leuven.
- it-vacatures.be — idem.
- Wellfound (wellfound.com/location/belgium) — startup/scale-up rollen, veel remote; filter op frontend/full-stack.
- Cronos Groep (cronos-groep.be/nl/vacatures) — koepel met veel Limburgse dochterbedrijven.
- iO (iodigital.com/nl/careers), In The Pocket (inthepocket.com/jobs), Dropsolid (dropsolid.com/nl/jobs), Craftzing, Bagaar — productbedrijven met frontend/full-stack rollen.
- Greenhouse — job-boards op `boards.greenhouse.io` (en `job-boards.greenhouse.io`). Zoek breed via WebSearch met queries als `site:boards.greenhouse.io (frontend OR fullstack OR react OR angular OR vue) developer (Belgium OR Antwerp OR Leuven OR Limburg OR remote)`, en check de Greenhouse-boards van bedrijven die via een career-site naar Greenhouse doorlinken. Lees telkens de detailpagina voor locatie/remote-beleid; veel Greenhouse-rollen zijn US-only of "remote (EU)" — filter volgens STAP 3 (regio Limburg/Antwerpen/Leuven/Mechelen/Kempen of volledig remote).

**Ingelogde bronnen (het profiel is ingelogd):**
- LinkedIn: linkedin.com/jobs/search/?keywords=frontend%20developer&location=Limburg — ook "fullstack developer", "react developer" en "angular developer", regio Limburg / Vlaams-Brabant / Antwerpen.
- Indeed: be.indeed.com/jobs?q=frontend+developer&l=Limburg — ook "fullstack developer", "react developer", "angular developer".
- Jobat (jobat.be), StepStone (stepstone.be) — frontend + full-stack developer in de regio.
- Skillerjobs (app.skillerjobs.be/jobseeker) — AI-matchingplatform; als Tom ingelogd is, lees de aanbevolen jobs voor zijn profiel. Toont het een login-/verificatiescherm: overslaan met notitie "Skillerjobs — Tom moet opnieuw inloggen", niks invullen.

Toont een van deze een **login- of verificatiescherm** i.p.v. resultaten? Probeer NIET in te loggen en vul niks in. Noteer "sessie verlopen — Tom moet opnieuw inloggen" en ga door.

Doe daarnaast 3-5 WebSearch-zoekopdrachten op frontend/full-stack/React/Vue/Angular/TypeScript developer × Hasselt/Genk/Limburg/Leuven/Mechelen/Antwerpen/Turnhout; veelbelovende bedrijfssites nakijken.

**AI-werkwijze (ontwikkelen mét AI) — twee sporen:**
1. *Extra zoekopdrachten* (getest op 12-10-2026):
   - **LinkedIn** (regio Belgium): één OR-query werkt: `developer ("AI-native" OR "AI-first" OR "AI-assisted" OR Copilot OR Cursor OR "Claude Code")`, plus `AI-assisted frontend developer`. Voeg daarnaast een tweede OR-query toe voor agentic development: `developer ("agentic development" OR "agentic engineering" OR "agentic coding" OR "agentic workflow" OR "AI agents" OR "vibe coding")` en `agentic frontend developer`. Lees per kaart de beschrijving in het rechterpaneel (wacht tot de titel in het paneel overeenkomt met de kaart — het paneel loopt achter op klikken) en zoek naar de signalen uit STAP 3.
   - **Indeed**: `developer ("AI-native" OR "AI-first" OR "AI-assisted" OR Copilot OR Cursor OR "Claude Code")` met l=Antwerpen&radius=50, daarna idem voor Limburg en Leuven; herhaal met `developer ("agentic development" OR "agentic engineering" OR "agentic coding")`.
   - **VDAB**: trefwoord `AI-assisted developer` (levert de meeste relevante hits; ook `AI-native`, `agentic development`, `agentic coding`). Open detailpagina's één voor één via navigeren — `window.open` wordt geblokkeerd.
   - Overige bronnen (Jobat, StepStone, ictjob, techjobs): `AI-assisted developer`, `AI-native developer`, `agentic development`, `agentic coding`, `developer Copilot`, `developer Cursor`.
   - 2-3 WebSearch-queries zoals `("AI-native" OR "AI-first" OR "AI-assisted" OR "agentic development" OR "agentic engineering" OR "agentic coding" OR Copilot OR Cursor OR "Claude Code") (frontend OR fullstack OR react OR angular) developer (Limburg OR Antwerpen OR Leuven OR remote)`.
   - **Ruis die je meteen negeert:** contractor-opdrachten voor het trainen van AI-codeeragents ("Claude Code User"), trainer-/coachrollen, titels met "AI Engineer / AI Software Engineer" (AI bouwen), en alles buiten de regio.
2. *Verrijken van gewone hits* — de meeste vacatures noemen AI enkel in de beschrijving. Kijk op elke frontend/full-stack-detailpagina die je toch leest of er AI-werkwijze-signalen in staan (zie STAP 3).

**Volledigheid is verplicht:** loop ELKE bron uit de lijsten hierboven af (publiek, extra, ingelogd) en doe alle AI/agentic-zoekopdrachten, ook als de scan lang duurt. Rond NIET af vóór alle bronnen geprobeerd zijn. Een bron mag alleen worden overgeslagen door een concrete blokkade (login-scherm, Cloudflare/bot-controle, pagina laadt niet); noteer dan bron + reden. "Tijd" of "lengte van de scan" is geen reden.

**Cloudflare / bot-controle** ("Just a moment…", "Challenge Validation", CAPTCHA, "verify you are human") behandel je als een login-scherm: NIET omzeilen, niet aanklikken, niks invullen. Noteer "bot-controle — Tom moet handmatig bevestigen" en ga door met de volgende bron. Probeer eventueel dezelfde bron nog één keer via een andere route (zoekopdracht via WebSearch op die site).

Faalt een bron: noteren en door, niet blijven proberen.

## STAP 3 — filter

**Wel opnemen:**
- **Frontend** — vast contract, frontend-zwaartepunt (React, Vue, Angular, TypeScript). → `functie: "frontend"`
- **Full-stack** — vast contract, echte frontend-component in een JS/TS-stack (React/Vue/Angular + Node.js, of full-stack met .NET/Java/PHP waar de frontend een volwaardig deel van de rol is, niet enkel "een plus"). → `functie: "fullstack"`
- Regio: Limburg, Leuven, Mechelen, Antwerpen (incl. Kontich), Kempen (Turnhout/Geel/Herentals/Mol), Aarschot/Diest, Sint-Truiden/Tongeren/Hasselt-Genk, noordwest-Antwerpen. Volledig remote mag ook.

**Niet opnemen:** freelance-/projectopdrachten; rollen met een backend-kern (.NET/Java/PHP/Python) waar frontend enkel een pluspunt is; pure backend-, data- of ML/AI-engineeringrollen; alles buiten de regio; en deze bedrijven: With Eleven, Xplore Group, VanRoey, Climapulse, Alpine Digital, Fenego, Buzzworks, Pelckmans.

**AI-werkwijze** (extra kenmerk, verandert niets aan de regels hierboven — frontend-component, regio en vast contract blijven verplicht):
- *Signalen (→ markeren):* team werkt AI-first / AI-native / AI-assisted / agentic (agentic development, agentic engineering, developers sturen AI-agents aan om code te schrijven); dagelijks gebruik van AI-codingtools (GitHub Copilot, Cursor, Claude Code, Windsurf, agentic coding) als vast onderdeel van de ontwikkelworkflow; "je ontwikkelt met AI" e.d. Het moet een **echt onderdeel van de job** zijn — "interesse in AI is een plus" of een vage vermelding van "innovatie/AI" telt niet.
- *Agentic development ≠ agents bouwen:* "agentic development/engineering/coding" waarbij het team ontwikkelt **met** AI-agents (Claude Code, Cursor agents, Copilot agent mode) → wel markeren. Rollen waarin je zélf agents/agent-systemen bouwt → uitsluiten (zie hieronder).
- *Uitsluiten (AI bouwen i.p.v. ermee ontwikkelen):* AI Engineer, LLM Engineer, GenAI Developer, Prompt Engineer, ML/MLOps, data science; rollen waarvan de kern is: agents, RAG-pipelines, LangChain/LlamaIndex, vector databases, fine-tuning of model-evaluatie. Deze vallen al onder "ML/AI-engineeringrollen" hieronder en worden **niet** opgenomen, ook niet als er ook frontend in zit.
- *Borderline:* frontendrol voor een AI-product (bv. de UI van een chat-/AI-applicatie bouwen) — opnemen als gewone frontendrol als het frontendwerk de kern is, met toelichting in `beschrijving`; enkel als AI-werkwijze markeren als ook de signalen hierboven aanwezig zijn.
- Een "AI-native Software Engineer" zonder duidelijke frontend-component valt weg (frontend-eis blijft gelden).

Markeren = tag `AI-assisted` toevoegen aan `tags`, plus in `beschrijving` kort welk signaal je zag (bv. "Team werkt dagelijks met Cursor + Copilot").

Bij twijfel: opnemen, met een korte toelichting in `beschrijving` waarom het borderline is, en zet `functie` op je beste inschatting. Verzin nooit een vacature of een detail dat je niet op de pagina zag.

### Match-score (per nieuwe vacature)

Beoordeel elke **nieuwe** vacature die je opneemt tegen Toms profiel (bovenaan) en geef ze een `match: { "score": ..., "toelichting": ... }`. De app toont dit als badge en sorteert er standaard op.

`score` — exact één van deze Nederlandse waarden (de sync en app kennen geen andere):
- `sterk` — frontend-zwaartepunt in Angular, TypeScript, Web Components of designsystemen (zijn expertise), regio Limburg of volledig remote, vast contract. Een AI-werkwijze-signaal (`AI-assisted`) is een plus, geen vereiste.
- `goed` — frontend of full-stack in React of Vue/Nuxt (sterk, geen expertise), of Angular/TypeScript-rol met een kleiner minpunt (regio Antwerpen/Leuven/Mechelen/Kempen, of frontend iets minder dominant).
- `matig` — echte frontend-component maar met duidelijke afstand: JS/TS-fullstack met backend-zwaartepunt in Node, Drupal-frontend, een stack waar hij enkel basis in heeft, of meerdere minpunten tegelijk.
- `laag` — voldoet net aan het filter, maar frontend is bijzaak, stack is vreemd (.NET/Java/PHP/Python-dominant) of meerdere vereisten ontbreken. Wees hier eerlijk; liever `laag` dan een vacature opblazen.
- `borderline` — je nam ze enkel op "bij twijfel" (zie hierboven): onduidelijk contract, onduidelijk frontend-aandeel, AI-productfrontend e.d. Leg in de toelichting uit wat onduidelijk is.

`toelichting` — één à twee korte Nederlandse zinnen met **concrete feiten uit de detailpagina** (gevraagde stack, regio/remote, contract, AI-signaal) en wat de score drukt of verhoogt, bv. "Angular + TypeScript is de kern, Hasselt, vast contract; werkt dagelijks met Copilot." Alleen wat je effectief las: verzin niets, en zag je iets niet (bv. stack ontbreekt), zeg dat dan.

Regels: vermeld nooit vaardigheden die Tom niet heeft (zie "Geen expertise" in het profiel). Geef alleen een `match` aan nieuwe items — voor bestaande vacatures laat je het veld weg (Firestore bewaart de bestaande waarde). Een duplicaat dat je samenvoegt via `extraBronnen` krijgt één `match`, op het hoofditem.

## STAP 4 — verschil bepalen

Vergelijk de gefilterde scan met de bekende stand (op genormaliseerde URL):

- **Nieuw** = in de scan, niet bekend (of bekend met `verlopen: true`), **en** de genormaliseerde URL zit niet in de set "niet interessant — niet opnieuw voorstellen". Zit ze daar wel in: negeren (niet toevoegen, niet in de PDF).

**Dedupe over bronnen heen (belangrijk — bron van de duplicaten van 15-09-2026):**
Dezelfde vacature verschijnt vaak op meerdere bronnen (bv. VDAB + Jobat + StepStone, of
een tweede keer via dezelfde recruiter). Maak daar NOOIT twee losse items van. Herken
een dubbel aan gelijke combinatie van titel + bedrijf + locatie/omschrijving (ook al
verschilt de URL of exacte spelling van bedrijf, zoals "ENABLERS" vs "Enablers bv") —
zowel binnen deze scan als tussen deze scan en de bekende stand.
- Neem 1 item op met de bron die je het meest betrouwbaar/compleet vindt als primaire
  `url`/`bron` — bij twijfel: de bron waar al een bekend Firestore-document met
  niet-"nieuw" status (bv. `gesolliciteerd`) aan hangt heeft voorrang, zodat je
  Toms sollicitatie-status niet kwijtraakt.
- Zet de overige bron+url-paren in `extraBronnen: [{ "bron": ..., "url": ... }]` op dat
  ene item, in plaats van een los item aan te maken.
- Twijfel je of het echt dezelfde vacature is (bv. zelfde generieke titel maar andere
  locatie/klant bij een recruiter als Kingfisher, bedrijf "onbekend"): behandel het dan
  als 2 aparte vacatures — merge nooit blind puur op titel.
- **Nieuw verlopen** = bekend en niet-verlopen, maar deze scan vond de vacature niet meer bij een bron die je wél succesvol kon lezen. Voorzichtig: alleen als je de bron-lijst effectief zag én de vacature daar weg is. Faalde de bron of was er een login-scherm, laat de vacature staan.

### Liveness en `gecontroleerdOp` (verloopregel)

Elk actief item in de sync-input draagt `gecontroleerdOp` (`YYYY-MM-DD`): de dag waarop de detailpagina nog live gezien werd. De merge-gate (`scripts/check-sync-input.mjs`) weigert actieve items waarvan die datum ouder is dan **14 dagen** (of ontbreekt, vanaf 2026-11-20). De scan houdt daarom alles binnen **7 dagen**:

1. Draai op de bekende stand: `node scripts/check-vacancy-liveness.mjs /tmp/bekende-vacatures.json --json` (alleen rapport, schrijft niets). Uitkomsten:
   - `levend` → zet `gecontroleerdOp` op vandaag.
   - `verlopen-kandidaat` (HTTP 404/410 of "niet meer beschikbaar") → bevestig eerst in de browser. Bevestigd = nieuw-verlopen (`verlopen: true`). Niet bevestigd = laat staan.
   - `onbekend` (LinkedIn, Indeed, StepStone, VDAB-detailpagina's als SPA, bot-controle, time-out) → het script weet het niet. Zag je de vacature in STAP 2 op de bron zelf in de browser, zet dan `gecontroleerdOp` op vandaag. Anders: laat de datum ongewijzigd.
2. Elke vacature die je in STAP 2 live zag, krijgt `gecontroleerdOp` = vandaag.
3. Het script zet nooit zelf `verlopen: true`.

**Stopregel:** geen nieuwe, geen nieuw-verlopen vacatures **én** elk actief item heeft `gecontroleerdOp` van maximaal 7 dagen oud? Log één regel naar `/Users/tomclaes/Library/CloudStorage/OneDrive-Personal/Werk/Vacatures zoeken/scan.log` (datum + "geen wijziging" + eventuele verlopen login-sessies) en **stop hier**. Geen PDF, geen PR.

Is er niets nieuws maar zijn er items ouder dan 7 dagen? Ga door naar STAP 5 als **verversings-PR**: alleen `gecontroleerdOp`-wijzigingen, geen PDF (stap 3 overslaan), PR-titel `Vacaturescan: verversing gecontroleerdOp <datum>`.

## STAP 5 — bij wijzigingen: JSON + PDF + PR

1. `git switch main && git pull --quiet`
2. Schrijf `data/firestore-sync-input.json` opnieuw met een klein python-script: volledige lijst = bekende vacatures + nieuwe, met nieuw-verlopen posten op `verlopen: true`. Per item alleen: `titel`, `bedrijf`, `locatie`, `regio` (limburg|antwerpen|brussel|vlaanderen|remote|andere), `url`, `beschrijving`, `bron` (indeed|vdab|jobat|linkedin|andere — anders "andere"), `gecontroleerdOp` (zie "Liveness en `gecontroleerdOp`" in STAP 4: vandaag voor wat je live zag, anders de bestaande waarde), `functie` (`frontend` of `fullstack`), `tags`, voor **nieuwe** items `match: { "score": "sterk|goed|matig|laag|borderline", "toelichting": "..." }` (zie "Match-score" in STAP 3), optioneel `extraBronnen: [{ "bron", "url" }]` voor dezelfde vacature op andere bronnen (zie dedupe-regel in STAP 4 — nooit een los item per bron), plus `verlopen: true` waar van toepassing. 2 spaties inspringing, afsluitende newline. Behoud bestaande verlopen posten. Raak bestaande items niet aan voor `match` (niet toevoegen, niet wijzigen). Vul bij bestaande posten zonder `functie` de waarde aan waar je ze zeker weet. Voor vacatures met AI-werkwijze-signalen (STAP 3): tag `AI-assisted` in `tags` (exacte spelling). Schrijf (nog) **geen** apart veld zoals `aiWerkwijze` — de sync kent dat niet.

   Voor vacatures uit de set "niet interessant" (uit Firestore of al met `nietInteressant: true` in de JSON): behoud/zet het item met `nietInteressant: true` en de bekende `archiefReden` (indien beschikbaar uit Firestore), met minimaal `titel`, `bedrijf`, `url`. Verwijder ze niet.
2b. **Gate:** draai `npm run check:sync-input`. De check weigert (exitcode 1) o.a. duplicaten (zelfde url of dezelfde titel + bedrijf + locatie), een actieve vacature die al als `nietInteressant` gearchiveerd is, en actieve items zonder recente `gecontroleerdOp`. Los elke `FOUT` op vóór je verdergaat: een tweede bron van dezelfde vacature gaat naar `extraBronnen` van het eerste item; een vacature die al gearchiveerd is, laat je weg of zet je op `nietInteressant: true`; zijn het echt verschillende vacatures, geef dan beide items een eigen expliciet `id`. Een `WAARSCHUWING` (zelfde bedrijf en titel, andere locatie) mag blijven, maar controleer het. Lukt oplossen niet na twee pogingen: open **geen** PR, log de fout in `scan.log` en meld het bovenaan in STAP 6.
3. `npm run pdf:vacatures` (alleen als er nieuwe of nieuw-verlopen vacatures zijn) — schrijft `vacatures_actief_overzicht_<vandaag>.pdf` naar de Vacatures-zoeken-map.
4. `git add data/firestore-sync-input.json` (NIETS anders). Check met `git diff --cached --stat`.
5. `git switch -c vacaturescan/sync-input-<JJJJ-MM-DD>` — bestaat die branch lokaal al van een vorige run, kies een unieke suffix (`...-<datum>-b`). Commit `Vacaturescan: sync-input bijgewerkt (<datum>)`, `git push -u origin <branch>`. Controleer met `git branch --show-current` dat je effectief op de nieuwe branch staat vóór je commit.
6. `gh pr create --base main --title "Vacaturescan: sync-input <datum>" --body "Automatische dagelijkse vacaturescan."` — de workflow `auto-merge-vacature-sync.yml` mergt de PR (want enkel dat bestand) en start `sync-firestore.yml` + `deploy.yml`. Niet zelf mergen.
7. Log naar `scan.log`: datum, aantal nieuw (waarvan `AI-assisted`), aantal nieuw-verlopen, PR-nummer, eventuele verlopen login-sessies.

## STAP 5b — controleer dat de nieuwe vacatures effectief in de app staan

Alleen als er een PR was. Wacht tot `auto-merge-vacature-sync.yml` én `sync-firestore.yml` groen zijn:

```
gh run list --workflow=auto-merge-vacature-sync.yml --limit 1
gh run list --workflow=sync-firestore.yml --limit 1
# eventueel: gh run watch <run-id>
```

Faalt `auto-merge-vacature-sync.yml` in de stap "Sync-input valideren", dan blijft de PR open: lees de reden met `gh run view <run-id> --log-failed`, los het op in een nieuwe commit op dezelfde branch en meld het in het rapport. Staat er na de sync een rode `Dedupe-check` in `sync-firestore.yml`, meld dat dan ook (er staan duplicaten in Firestore; opruimen via `npm run trigger:sync -- --dedupe` na akkoord van Tom).

Controleer daarna dat elke nieuwe vacature in Firestore staat (collectie `vacatures`, doc-id = genormaliseerde url) en dat het veld `match` (score + toelichting) is meegekomen. Gebruik de Firebase-MCP (`firestore_get_document` / `firestore_query_collection` op project uit `.firebaserc`) of open de live app. Staat een nieuwe vacature er niet: check de sync-run-logs, meld het in het rapport en stop — niet opnieuw pushen zonder oorzaak.

## STAP 6 — rapporteer

Kort: welke bronnen gescand/gelukt/gefaald (elke bron uit de lijst moet voorkomen, met reden bij overslaan), hoeveel nieuw (frontend/full-stack, hoeveel daarvan met tag `AI-assisted`, en de verdeling per match-score sterk/goed/matig/laag/borderline — noem de `sterk`-vacatures bij naam), welke AI-zoekopdrachten iets opleverden, hoeveel nieuw-verlopen, hoeveel `gecontroleerdOp`-datums ververst (levend / onbekend uit de liveness-check), de uitkomst van de gate (`check:sync-input`, ook als je een fout moest oplossen), PR-nummer + link (of "geen wijziging"), en of de nieuwe vacatures na de sync in de app stonden. **Als een bron een Cloudflare/bot-controle toonde: noem die bron bovenaan, Tom moet de controle zelf handmatig bevestigen in het scan-Chrome-venster.** **Als LinkedIn/Indeed/Jobat/StepStone/Skillerjobs een login-scherm toonde: zeg dat expliciet bovenaan** — Tom start dan `~/.claude/vacaturescan-chrome-start.command` en logt daar opnieuw in.