#!/usr/bin/env node
/**
 * Sync browser-geverifieerde actieve vacatures naar Firestore.
 *
 * Gebruik:
 *   node scripts/sync-vacancies-to-firestore.mjs <input.json> [service-account.json]
 *
 * Input JSON: array van objecten met
 *   titel, bedrijf, locatie, regio (limburg|antwerpen|brussel|vlaanderen|remote|andere),
 *   url, beschrijving, bron (indeed|vdab|jobat|linkedin|andere),
 *   functie?: "frontend" | "fullstack",
 *   tags?: string[], match?: { score, toelichting }, id?: string,
 *   extraBronnen?: { bron: string, url: string }[]  -> dezelfde vacature ook gezien op
 *     andere bronnen. Maak GEEN apart item voor dezelfde vacature per bron: neem 1 item op
 *     (primaire url/bron) en zet de overige bron+url-paren hier. Zo blijft er 1 Firestore-
 *     document per echte vacature i.p.v. duplicaten (zie dedupe van 15-09-2026).
 *   verlopen?: boolean  -> true = verwijder dit document i.p.v. het bij te werken
 *   nietInteressant?: boolean  -> true = archiveer dit document (isArchived + status
 *     "niet-interessant"), optioneel met archiefReden. Overige velden mogen minimaal zijn.
 *
 * Service-account: pad als 2e argument, of via env var FIREBASE_SERVICE_ACCOUNT_PATH.
 *
 * Document-id: wordt afgeleid van de GENORMALISEERDE url (hostname + pad, zonder
 * queryparameters/trailing slash), niet van bedrijf+titel-tekst. Dat is bewust: bedrijf/titel
 * kunnen dag na dag licht anders geformuleerd worden ("Front-end" vs "Frontend Developer"),
 * wat met een tekst-gebaseerd id telkens een NIEUW document opleverde i.p.v. een update
 * (= de bron van de duplicaten die op 23-06-2026 zijn vastgesteld). Gebruik dus altijd dezelfde
 * directe url voor dezelfde vacature, en geef bij `verlopen: true` ook diezelfde url (of het
 * gekende `id`) mee — nooit enkel bedrijf/titel, anders wordt het verkeerde/geen document
 * verwijderd. Alleen als `url` ontbreekt valt dit script terug op bedrijf+titel.
 *
 * Belangrijk: status en gevondenOp van een BESTAAND Firestore-document worden nooit
 * overschreven. Die velden veranderen enkel via de app zelf (solliciteren/status wijzigen).
 * Dit script voegt alleen content toe of werkt content bij (titel/locatie/beschrijving/...).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sameJobKey } from "./vacancy-keys.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

const REGIONS = ["limburg", "antwerpen", "brussel", "vlaanderen", "remote", "andere"];
const SOURCES = ["indeed", "vdab", "jobat", "linkedin", "andere"];
const ROLES = ["frontend", "fullstack"];

// vp run <script> -- <args> forwards the literal "--" as an argv entry (unlike npm,
// which strips it), so filter it out before reading positional args.
const [inputPath, serviceAccountArg] = process.argv.slice(2).filter((a) => a !== "--");
if (!inputPath) {
  console.error("Gebruik: node sync-vacancies-to-firestore.mjs <input.json> [service-account.json]");
  process.exit(1);
}

const serviceAccountPath =
  serviceAccountArg ||
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  (existsSync(DEFAULT_SERVICE_ACCOUNT_PATH) ? DEFAULT_SERVICE_ACCOUNT_PATH : undefined);
if (!serviceAccountPath) {
  console.error(
    `Geen Firebase service-account JSON gevonden. Geef het pad op (2e argument of FIREBASE_SERVICE_ACCOUNT_PATH env var), ` +
      `of plaats het bestand op ${DEFAULT_SERVICE_ACCOUNT_PATH} (zie secrets/README.md).`
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
    const host = u.hostname.toLowerCase();
    // be.indeed.com/viewjob?jk=... - het pad is voor ELKE indeed-vacature identiek
    // ("/viewjob"), de echte identiteit zit in de jk-queryparameter. Zonder deze
    // uitzondering vallen alle indeed-viewjob-vacatures terug op hetzelfde
    // "be-indeed-com-viewjob"-id en overschrijven ze elkaar (zie fix #60). Tot nu toe
    // ving een handmatig `id: "indeed-<jk>"`-veld in de sync-input dit op; deze
    // uitzondering maakt dat automatisch, zodat het niet meer vergeten kan worden.
    const jk = u.searchParams.get("jk");
    if (host.endsWith("indeed.com") && /\/viewjob$/.test(path) && jk) {
      return `${host}/viewjob-${jk.toLowerCase()}`;
    }
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

// Document-id consistent houden over dagen heen: liefst uit de url (stabiel),
// enkel terugvallen op bedrijf+titel als er geen url is. Zie opmerking hierboven.
function generateId(v) {
  if (v.id) return v.id;
  if (v.url) return slugify(normalizeUrl(v.url));
  return slugify(`${v.bedrijf}-${v.titel}`);
}

function validate(v, i) {
  const errors = [];
  if (!v.titel) errors.push("titel ontbreekt");
  if (!v.bedrijf) errors.push("bedrijf ontbreekt");
  if (!v.locatie) errors.push("locatie ontbreekt");
  if (!REGIONS.includes(v.regio)) errors.push(`regio '${v.regio}' ongeldig (${REGIONS.join("|")})`);
  if (!v.url || (!v.url.startsWith("http") && !v.url.startsWith("/") && v.url !== "")) errors.push("url ongeldig");
  if (!v.beschrijving) errors.push("beschrijving ontbreekt");
  if (!SOURCES.includes(v.bron)) errors.push(`bron '${v.bron}' ongeldig (${SOURCES.join("|")})`);
  if (v.functie != null && !ROLES.includes(v.functie)) errors.push(`functie '${v.functie}' ongeldig (${ROLES.join("|")})`);
  if (errors.length) throw new Error(`Vacature #${i} (${v.bedrijf ?? "?"} - ${v.titel ?? "?"}): ${errors.join(", ")}`);
}

const input = JSON.parse(readFileSync(inputPath, "utf8"));
if (!Array.isArray(input)) {
  console.error("Input JSON moet een array zijn.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();

let created = 0, updated = 0, deleted = 0, skipped = 0, archived = 0;

// Bestaande documenten geïndexeerd op "zelfde vacature"-sleutel (titel+bedrijf+locatie).
// Een nieuwe url voor een vacature die al onder een andere url/bron bestaat (bv. it-jobs.be
// vs codejobs.be) mag geen tweede document worden: die url gaat naar extraBronnen van het
// bestaande document.
const existingByJobKey = new Map();
for (const d of (await db.collection("vacatures").get()).docs) {
  const key = sameJobKey(d.data());
  if (key && !existingByJobKey.has(key)) existingByJobKey.set(key, { id: d.id, data: d.data() });
}

for (const [i, v] of input.entries()) {
  if (v.nietInteressant) {
    const id = generateId(v);
    const ref = db.collection("vacatures").doc(id);
    const snap = await ref.get();
    const archiveFields = {
      isArchived: true,
      status: "niet-interessant",
      ...(v.archiefReden ? { archiefReden: v.archiefReden } : {}),
    };
    if (snap.exists) {
      await ref.set(archiveFields, { merge: true });
      archived++;
      console.log(`Gearchiveerd (niet-interessant): ${id}`);
    } else {
      skipped++;
      console.log(`Overgeslagen (niet-interessant, doc bestaat niet): ${id}`);
    }
    continue;
  }

  if (v.verlopen) {
    const id = generateId(v);
    const ref = db.collection("vacatures").doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      deleted++;
      console.log(`Verwijderd (verlopen): ${id}`);
    } else {
      skipped++;
    }
    continue;
  }

  validate(v, i);
  const id = generateId(v);
  const ref = db.collection("vacatures").doc(id);
  const snap = await ref.get();

  const baseFields = {
    id,
    titel: v.titel,
    bedrijf: v.bedrijf,
    locatie: v.locatie,
    regio: v.regio,
    url: v.url,
    beschrijving: v.beschrijving,
    bron: v.bron,
    ...(v.functie ? { functie: v.functie } : {}),
    tags: v.tags ?? [],
    ...(v.match ? { match: v.match } : {}),
    ...(v.extraBronnen ? { extraBronnen: v.extraBronnen } : {}),
  };

  if (snap.exists) {
    await ref.set(baseFields, { merge: true });
    updated++;
    console.log(`Bijgewerkt: ${id}`);
  } else {
    const key = sameJobKey(v);
    const twin = key ? existingByJobKey.get(key) : undefined;
    if (twin) {
      const extra = twin.data.extraBronnen ?? [];
      const known = new Set([twin.data.url, ...extra.map((b) => b.url)]);
      const additions = [{ bron: v.bron, url: v.url }, ...(v.extraBronnen ?? [])].filter(
        (b) => b.url && !known.has(b.url)
      );
      if (additions.length) {
        twin.data.extraBronnen = [...extra, ...additions];
        await db.collection("vacatures").doc(twin.id).set({ extraBronnen: twin.data.extraBronnen }, { merge: true });
      }
      skipped++;
      console.log(`Overgeslagen (zelfde vacature als ${twin.id}, url naar extraBronnen): ${id}`);
      continue;
    }
    await ref.set({ ...baseFields, status: "nieuw", gevondenOp: now });
    if (key) existingByJobKey.set(key, { id, data: baseFields });
    created++;
    console.log(`Nieuw: ${id}`);
  }
}

await db.collection("overzicht").doc("huidig").set(
  {
    datum: today,
    metadata: {
      bronBestand: inputPath,
      aantalGevonden: input.filter((v) => !v.verlopen && !v.nietInteressant).length,
      verwerktOp: now,
    },
  },
  { merge: true }
);

console.log(`\nKlaar - ${created} nieuw, ${updated} bijgewerkt, ${archived} gearchiveerd, ${deleted} verwijderd, ${skipped} overgeslagen.`);
