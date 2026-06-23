#!/usr/bin/env node
/**
 * Eenmalige opruiming van bestaande Firestore-duplicaten in de `vacatures`-collectie.
 *
 * Achtergrond: tot 23-06-2026 werd het document-id afgeleid van bedrijf+titel-tekst
 * (zie sync-vacatures-naar-firestore.mjs). Omdat die tekst dag na dag licht anders
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
 *   node scripts/dedupe-vacatures.mjs [service-account.json] [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

const STATUS_PRIORITEIT = ["gesolliciteerd", "interview", "aanbod", "afgewezen", "niet_wervend", "nieuw"];

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

function normaliseerUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const pad = u.pathname.replace(/\/+$/, "");
    return `${u.hostname}${pad}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

function canoniekId(data) {
  if (!data.url) return null;
  const genormaliseerd = normaliseerUrl(data.url);
  return genormaliseerd ? slugify(genormaliseerd) : null;
}

function statusRang(status) {
  const i = STATUS_PRIORITEIT.indexOf(status);
  return i === -1 ? STATUS_PRIORITEIT.length : i;
}

function kiesWinnaar(docs) {
  return [...docs].sort((a, b) => {
    const ra = statusRang(a.data.status);
    const rb = statusRang(b.data.status);
    if (ra !== rb) return ra - rb;
    const ta = a.data.gevondenOp ?? "";
    const tb = b.data.gevondenOp ?? "";
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  })[0];
}

function mergeVelden(winnaar, anderen) {
  const merged = { ...winnaar.data };
  for (const doc of anderen) {
    for (const [k, v] of Object.entries(doc.data)) {
      if (k === "status" || k === "gevondenOp") continue; // nooit overschrijven, zie sync-script-invariant
      const huidig = merged[k];
      const leeg = huidig === undefined || huidig === null || huidig === "" || (Array.isArray(huidig) && huidig.length === 0);
      if (leeg && v !== undefined && v !== null && v !== "") {
        merged[k] = v;
      }
    }
  }
  return merged;
}

console.log(apply ? "Modus: APPLY (schrijft/verwijdert echt)" : "Modus: DRY-RUN (toont enkel het plan, geen writes)");
console.log("");

const snap = await db.collection("vacatures").get();
const alleDocs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
console.log(`Totaal ${alleDocs.length} documenten in 'vacatures'.`);

const groepen = new Map(); // canoniekId -> docs[]
const zonderUrl = [];

for (const doc of alleDocs) {
  const cid = canoniekId(doc.data);
  if (!cid) {
    zonderUrl.push(doc);
    continue;
  }
  if (!groepen.has(cid)) groepen.set(cid, []);
  groepen.get(cid).push(doc);
}

const duplicaatGroepen = [...groepen.entries()].filter(([, docs]) => docs.length > 1);

console.log(`${duplicaatGroepen.length} duplicaatgroep(en) gevonden (op basis van url).`);
if (zonderUrl.length) {
  console.log(`${zonderUrl.length} document(en) zonder url-veld — niet automatisch gegroepeerd:`);
  for (const d of zonderUrl) console.log(`  - ${d.id} (${d.data.bedrijf ?? "?"} - ${d.data.titel ?? "?"})`);
}
console.log("");

let samengevoegd = 0;
let verwijderd = 0;

for (const [cid, docs] of duplicaatGroepen) {
  const winnaar = kiesWinnaar(docs);
  const anderen = docs.filter((d) => d !== winnaar);
  const merged = mergeVelden(winnaar, anderen);
  merged.id = cid;

  console.log(`Groep '${cid}':`);
  console.log(`  Winnaar: ${winnaar.id} (status: ${winnaar.data.status ?? "?"}, gevondenOp: ${winnaar.data.gevondenOp ?? "?"})`);
  for (const d of anderen) {
    console.log(`  Te verwijderen: ${d.id} (status: ${d.data.status ?? "?"}, gevondenOp: ${d.data.gevondenOp ?? "?"})`);
  }

  if (apply) {
    await db.collection("vacatures").doc(cid).set(merged, { merge: true });
    samengevoegd++;
    for (const d of docs) {
      if (d.id !== cid) {
        await db.collection("vacatures").doc(d.id).delete();
        verwijderd++;
      }
    }
    console.log(`  -> geschreven onder '${cid}', ${docs.length - (docs.some((d) => d.id === cid) ? 1 : 0)} oude document(en) verwijderd.`);
  }
  console.log("");
}

if (apply) {
  console.log(`Klaar - ${samengevoegd} groep(en) samengevoegd, ${verwijderd} document(en) verwijderd.`);
} else {
  console.log(`Dry-run klaar. Niets geschreven. Voer opnieuw uit met --apply om dit plan echt uit te voeren:`);
  console.log(`  npm run dedupe:firestore -- --apply`);
}
