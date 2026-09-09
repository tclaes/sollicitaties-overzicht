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
 * Werkwijze: groepeert alle documenten in `vacatures` op canoniek id (= genormaliseerde
 * url, zelfde logica als het sync-script). Groepen met >1 document zijn duplicaten.
 * Documenten zonder url-veld worden NIET automatisch gegroepeerd (te onzeker) en enkel
 * gerapporteerd.
 *
 * Per duplicaatgroep:
 *   - "winnaar" gekozen op status-prioriteit (gesolliciteerd > interview > aanbod >
 *     afgewezen > niet_wervend > nieuw), bij gelijke status de oudste gevondenOp.
 *   - ontbrekende velden van de winnaar worden aangevuld uit de andere documenten
 *     (zonder een bestaande waarde te overschrijven).
 *   - resultaat wordt geschreven onder het canonieke id; alle andere documenten in de
 *     groep worden verwijderd.
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

const args = process.argv.slice(2);
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

console.log(apply ? "Modus: APPLY (schrijft/verwijdert echt)" : "Modus: DRY-RUN (toont enkel het plan, geen writes)");
console.log("");

const snap = await db.collection("vacatures").get();
const allDocs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
console.log(`Totaal ${allDocs.length} documenten in 'vacatures'.`);

const groups = new Map(); // canonicalId -> docs[]
const withoutUrl = [];

for (const doc of allDocs) {
  const cid = canonicalId(doc.data);
  if (!cid) {
    withoutUrl.push(doc);
    continue;
  }
  if (!groups.has(cid)) groups.set(cid, []);
  groups.get(cid).push(doc);
}

const duplicateGroups = [...groups.entries()].filter(([, docs]) => docs.length > 1);

console.log(`${duplicateGroups.length} duplicaatgroep(en) gevonden (op basis van url).`);
if (withoutUrl.length) {
  console.log(`${withoutUrl.length} document(en) zonder url-veld — niet automatisch gegroepeerd:`);
  for (const d of withoutUrl) console.log(`  - ${d.id} (${d.data.bedrijf ?? "?"} - ${d.data.titel ?? "?"})`);
}
console.log("");

let merged = 0;
let deleted = 0;

for (const [cid, docs] of duplicateGroups) {
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
    merged++;
    for (const d of docs) {
      if (d.id !== cid) {
        await db.collection("vacatures").doc(d.id).delete();
        deleted++;
      }
    }
    console.log(`  -> geschreven onder '${cid}', ${docs.length - (docs.some((d) => d.id === cid) ? 1 : 0)} oude document(en) verwijderd.`);
  }
  console.log("");
}

if (apply) {
  console.log(`Klaar - ${merged} groep(en) samengevoegd, ${deleted} document(en) verwijderd.`);
} else {
  console.log(`Dry-run klaar. Niets geschreven. Voer opnieuw uit met --apply om dit plan echt uit te voeren:`);
  console.log(`  npm run dedupe:firestore -- --apply`);
}
