#!/usr/bin/env node
/**
 * Eenmalige opruiming van bestaande Firestore-duplicaten in de `vacatures`-collectie.
 *
 * Achtergrond: tot 23-06-2026 werd het document-id afgeleid van bedrijf+titel-tekst
 * (zie sync-vacancies-to-firestore.mjs). Omdat die tekst dag na dag licht anders
 * geformuleerd kon zijn, ontstonden er meerdere documenten voor dezelfde vacature.
 * Sinds 23-06-2026 wordt het id afgeleid van de genormaliseerde url, wat dit voorkomt
 * voor NIEUWE schrijfbeurten — maar bestaande duplicaten in Firestore blijven staan
 * tot dit script gedraaid is.
 *
 * Werkwijze — twee opeenvolgende passes:
 *
 * Pass 1 (url-duplicaten): groepeert alle documenten op canoniek id (= genormaliseerde
 * url, zelfde logica als het sync-script). Groepen met >1 document zijn duplicaten.
 * Documenten zonder url-veld worden NIET gegroepeerd (te onzeker) en enkel gerapporteerd.
 *
 * Pass 2 (dezelfde vacature via meerdere bronnen): dezelfde job wordt soms door de scan
 * op meerdere sites gevonden (linkedin/indeed/de eigen bedrijfssite/...) met elk een eigen
 * url, dus die ontsnappen aan pass 1 (zie bv. de Dignify-vacature op 16-09-2026, 3x met
 * verschillende url). Na pass 1 wordt daarom nog gegroepeerd op (genormaliseerde titel +
 * genormaliseerde bedrijfsnaam + locatie-kern). Bedrijfsnaam wordt genormaliseerd door
 * parenthetische toevoegingen te strippen ("Dignify (Customer Collective)" -> "dignify"),
 * locatie door enkel het stuk vóór de eerste "(" te nemen ("Genk (hybride)" -> "genk").
 * Dit is bewust conservatief: titel + bedrijf + locatie moeten alle drie matchen, anders
 * blijven twee losse vacatures bij dezelfde (vaak anonieme) recruiter — bv. twee
 * "onbekend (via Kingfisher Recruitment)"-rollen in andere steden, of twee losse
 * Soda-vacatures met verschillende linkedin-job-id en locatie — terecht gescheiden.
 *
 * Per duplicaatgroep (beide passes):
 *   - "winnaar" gekozen op status-prioriteit (gesolliciteerd > interview > aanbod >
 *     afgewezen > niet_wervend > nieuw), bij gelijke status de oudste gevondenOp.
 *   - ontbrekende velden van de winnaar worden aangevuld uit de andere documenten
 *     (zonder een bestaande waarde te overschrijven).
 *   - resultaat wordt geschreven onder het canonieke id (pass 1) resp. het id van de
 *     winnaar (pass 2); alle andere documenten in de groep worden verwijderd.
 *   - pass 2 verliest de url's van de verwijderde documenten niet: die worden toegevoegd
 *     aan het `extraBronnen`-veld van de winnaar (bron + url), zodat sync-vacancies-to-
 *     firestore.mjs ze blijft meesturen.
 *
 * Veiligheid: standaard DRY-RUN (toont enkel het plan, schrijft niets). Pas met de vlag
 * --apply worden de writes/deletes echt uitgevoerd.
 *
 * Gebruik:
 *   node scripts/dedupe-vacancies.mjs [service-account.json] [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

const STATUS_PRIORITY = ["gesolliciteerd", "interview", "aanbod", "afgewezen", "niet_wervend", "nieuw"];

// vp run <script> -- <args> forwards the literal "--" as an argv entry (unlike npm,
// which strips it), so filter it out before reading flags/positional args.
const args = process.argv.slice(2).filter((a) => a !== "--");
const apply = args.includes("--apply");
const serviceAccountArg = args.find((a) => a !== "--apply");

const serviceAccountPath =
  serviceAccountArg ||
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  (existsSync(DEFAULT_SERVICE_ACCOUNT_PATH) ? DEFAULT_SERVICE_ACCOUNT_PATH : undefined);
if (!serviceAccountPath) {
  console.error(
    `Geen Firebase service-account JSON gevonden. Geef het pad op (1e argument of FIREBASE_SERVICE_ACCOUNT_PATH env var), ` +
      `of plaats het bestand op ${DEFAULT_SERVICE_ACCOUNT_PATH}.`
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

function canonicalId(data) {
  if (!data.url) return null;
  const normalized = normalizeUrl(data.url);
  return normalized ? slugify(normalized) : null;
}

function normalizeTitel(titel) {
  return (titel ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeBedrijf(bedrijf) {
  return (bedrijf ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // parenthetische toevoegingen strippen, bv. "(Customer Collective)"
    .trim()
    .replace(/\s+/g, " ");
}

function locatieKern(locatie) {
  return (locatie ?? "")
    .split("(")[0]
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function sameJobKey(data) {
  const titel = normalizeTitel(data.titel);
  const bedrijf = normalizeBedrijf(data.bedrijf);
  const locatie = locatieKern(data.locatie);
  if (!titel || !bedrijf || !locatie) return null;
  return `${titel}|${bedrijf}|${locatie}`;
}

function statusRank(status) {
  const i = STATUS_PRIORITY.indexOf(status);
  return i === -1 ? STATUS_PRIORITY.length : i;
}

function pickWinner(docs) {
  return [...docs].sort((a, b) => {
    const ra = statusRank(a.data.status);
    const rb = statusRank(b.data.status);
    if (ra !== rb) return ra - rb;
    const ta = a.data.gevondenOp ?? "";
    const tb = b.data.gevondenOp ?? "";
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  })[0];
}

function mergeFields(winner, others) {
  const merged = { ...winner.data };
  for (const doc of others) {
    for (const [k, v] of Object.entries(doc.data)) {
      if (k === "status" || k === "gevondenOp") continue; // nooit overschrijven, zie sync-script-invariant
      const current = merged[k];
      const empty = current === undefined || current === null || current === "" || (Array.isArray(current) && current.length === 0);
      if (empty && v !== undefined && v !== null && v !== "") {
        merged[k] = v;
      }
    }
  }
  return merged;
}

// Zoals mergeFields, maar voor pass 2: de url's van de "verliezende" documenten (elk een
// andere bron voor dezelfde vacature) gaan niet verloren, maar komen in extraBronnen.
function mergeSameJob(winner, others) {
  const merged = mergeFields(winner, others);
  const extraBronnen = Array.isArray(merged.extraBronnen) ? [...merged.extraBronnen] : [];
  const knownUrls = new Set([merged.url, ...extraBronnen.map((b) => b.url)].filter(Boolean));
  for (const doc of others) {
    if (doc.data.url && !knownUrls.has(doc.data.url)) {
      extraBronnen.push({ bron: doc.data.bron ?? "andere", url: doc.data.url });
      knownUrls.add(doc.data.url);
    }
  }
  if (extraBronnen.length) merged.extraBronnen = extraBronnen;
  return merged;
}

console.log(apply ? "Modus: APPLY (schrijft/verwijdert echt)" : "Modus: DRY-RUN (toont enkel het plan, geen writes)");
console.log("");

const snap = await db.collection("vacatures").get();
const allDocs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
console.log(`Totaal ${allDocs.length} documenten in 'vacatures'.`);
console.log("");

let merged = 0;
let deleted = 0;

// --- Pass 1: url-duplicaten ---
console.log("--- Pass 1: duplicaten op basis van url ---");

const urlGroups = new Map(); // canonicalId -> docs[]
const withoutUrl = [];

for (const doc of allDocs) {
  const cid = canonicalId(doc.data);
  if (!cid) {
    withoutUrl.push(doc);
    continue;
  }
  if (!urlGroups.has(cid)) urlGroups.set(cid, []);
  urlGroups.get(cid).push(doc);
}

const urlDuplicateGroups = [...urlGroups.entries()].filter(([, docs]) => docs.length > 1);

console.log(`${urlDuplicateGroups.length} duplicaatgroep(en) gevonden.`);
if (withoutUrl.length) {
  console.log(`${withoutUrl.length} document(en) zonder url-veld — niet automatisch gegroepeerd:`);
  for (const d of withoutUrl) console.log(`  - ${d.id} (${d.data.bedrijf ?? "?"} - ${d.data.titel ?? "?"})`);
}
console.log("");

// id -> effectieve data na pass 1, gebruikt als invoer voor pass 2 (zodat we niet op
// verouderde/net-verwijderde documenten groeperen).
const effectiveById = new Map(allDocs.map((d) => [d.id, d.data]));

for (const [cid, docs] of urlDuplicateGroups) {
  const winner = pickWinner(docs);
  const others = docs.filter((d) => d !== winner);
  const mergedDoc = mergeFields(winner, others);
  mergedDoc.id = cid;

  console.log(`Groep '${cid}':`);
  console.log(`  Winnaar: ${winner.id} (status: ${winner.data.status ?? "?"}, gevondenOp: ${winner.data.gevondenOp ?? "?"})`);
  for (const d of others) {
    console.log(`  Te verwijderen: ${d.id} (status: ${d.data.status ?? "?"}, gevondenOp: ${d.data.gevondenOp ?? "?"})`);
  }

  if (apply) {
    await db.collection("vacatures").doc(cid).set(mergedDoc, { merge: true });
    for (const d of docs) {
      if (d.id !== cid) {
        await db.collection("vacatures").doc(d.id).delete();
        deleted++;
      }
    }
    console.log(`  -> geschreven onder '${cid}', ${docs.length - (docs.some((d) => d.id === cid) ? 1 : 0)} oude document(en) verwijderd.`);
  }
  merged++;

  for (const d of docs) effectiveById.delete(d.id);
  effectiveById.set(cid, mergedDoc);
  console.log("");
}

// --- Pass 2: dezelfde vacature via meerdere bronnen (zelfde titel+bedrijf+locatie, andere url) ---
console.log("--- Pass 2: dezelfde vacature via meerdere bronnen ---");

const remainingDocs = [...effectiveById.entries()].map(([id, data]) => ({ id, data }));

const jobGroups = new Map(); // sameJobKey -> docs[]
for (const doc of remainingDocs) {
  const key = sameJobKey(doc.data);
  if (!key) continue;
  if (!jobGroups.has(key)) jobGroups.set(key, []);
  jobGroups.get(key).push(doc);
}

const jobDuplicateGroups = [...jobGroups.entries()].filter(([, docs]) => docs.length > 1);
console.log(`${jobDuplicateGroups.length} duplicaatgroep(en) gevonden.`);
console.log("");

for (const [key, docs] of jobDuplicateGroups) {
  const winner = pickWinner(docs);
  const others = docs.filter((d) => d !== winner);
  const mergedDoc = mergeSameJob(winner, others);
  mergedDoc.id = winner.id;

  console.log(`Groep '${key}':`);
  console.log(`  Winnaar: ${winner.id} (status: ${winner.data.status ?? "?"}, gevondenOp: ${winner.data.gevondenOp ?? "?"})`);
  for (const d of others) {
    console.log(`  Te verwijderen (url naar extraBronnen): ${d.id} (status: ${d.data.status ?? "?"}, gevondenOp: ${d.data.gevondenOp ?? "?"})`);
  }

  if (apply) {
    await db.collection("vacatures").doc(winner.id).set(mergedDoc, { merge: true });
    for (const d of others) {
      await db.collection("vacatures").doc(d.id).delete();
      deleted++;
    }
    console.log(`  -> geschreven onder '${winner.id}', ${others.length} oude document(en) verwijderd.`);
  }
  merged++;
  console.log("");
}

if (apply) {
  console.log(`Klaar - ${merged} groep(en) samengevoegd, ${deleted} document(en) verwijderd.`);
} else {
  console.log(`Dry-run klaar. Niets geschreven. Voer opnieuw uit met --apply om dit plan echt uit te voeren:`);
  console.log(`  npm run dedupe:firestore -- --apply`);
}
