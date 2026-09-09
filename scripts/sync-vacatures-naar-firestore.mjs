#!/usr/bin/env node
/**
 * Sync browser-geverifieerde actieve vacatures naar Firestore.
 *
 * Gebruik:
 *   node scripts/sync-vacatures-naar-firestore.mjs <input.json> [service-account.json]
 *
 * Input JSON: array van objecten met
 *   titel, bedrijf, locatie, regio (limburg|antwerpen|brussel|vlaanderen|remote|andere),
 *   url, beschrijving, bron (indeed|vdab|jobat|linkedin|andere),
 *   functie?: "frontend" | "fullstack",
 *   tags?: string[], match?: { score, toelichting }, id?: string,
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

const REGIOS = ["limburg", "antwerpen", "brussel", "vlaanderen", "remote", "andere"];
const BRONNEN = ["indeed", "vdab", "jobat", "linkedin", "andere"];
const FUNCTIES = ["frontend", "fullstack"];

const [, , inputPath, serviceAccountArg] = process.argv;
if (!inputPath) {
  console.error("Gebruik: node sync-vacatures-naar-firestore.mjs <input.json> [service-account.json]");
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

// Document-id consistent houden over dagen heen: liefst uit de url (stabiel),
// enkel terugvallen op bedrijf+titel als er geen url is. Zie opmerking hierboven.
function genereerId(v) {
  if (v.id) return v.id;
  if (v.url) return slugify(normaliseerUrl(v.url));
  return slugify(`${v.bedrijf}-${v.titel}`);
}

function valideer(v, i) {
  const fouten = [];
  if (!v.titel) fouten.push("titel ontbreekt");
  if (!v.bedrijf) fouten.push("bedrijf ontbreekt");
  if (!v.locatie) fouten.push("locatie ontbreekt");
  if (!REGIOS.includes(v.regio)) fouten.push(`regio '${v.regio}' ongeldig (${REGIOS.join("|")})`);
  if (!v.url || (!v.url.startsWith("http") && !v.url.startsWith("/") && v.url !== "")) fouten.push("url ongeldig");
  if (!v.beschrijving) fouten.push("beschrijving ontbreekt");
  if (!BRONNEN.includes(v.bron)) fouten.push(`bron '${v.bron}' ongeldig (${BRONNEN.join("|")})`);
  if (v.functie != null && !FUNCTIES.includes(v.functie)) fouten.push(`functie '${v.functie}' ongeldig (${FUNCTIES.join("|")})`);
  if (fouten.length) throw new Error(`Vacature #${i} (${v.bedrijf ?? "?"} - ${v.titel ?? "?"}): ${fouten.join(", ")}`);
}

const input = JSON.parse(readFileSync(inputPath, "utf8"));
if (!Array.isArray(input)) {
  console.error("Input JSON moet een array zijn.");
  process.exit(1);
}

const vandaag = new Date().toISOString().slice(0, 10);
const nu = new Date().toISOString();

let nieuw = 0, bijgewerkt = 0, verwijderd = 0, overgeslagen = 0, gearchiveerd = 0;

for (const [i, v] of input.entries()) {
  if (v.nietInteressant) {
    const id = genereerId(v);
    const ref = db.collection("vacatures").doc(id);
    const snap = await ref.get();
    const archiefVelden = {
      isArchived: true,
      status: "niet-interessant",
      ...(v.archiefReden ? { archiefReden: v.archiefReden } : {}),
    };
    if (snap.exists) {
      await ref.set(archiefVelden, { merge: true });
      gearchiveerd++;
      console.log(`Gearchiveerd (niet-interessant): ${id}`);
    } else {
      overgeslagen++;
      console.log(`Overgeslagen (niet-interessant, doc bestaat niet): ${id}`);
    }
    continue;
  }

  if (v.verlopen) {
    const id = genereerId(v);
    const ref = db.collection("vacatures").doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      verwijderd++;
      console.log(`Verwijderd (verlopen): ${id}`);
    } else {
      overgeslagen++;
    }
    continue;
  }

  valideer(v, i);
  const id = genereerId(v);
  const ref = db.collection("vacatures").doc(id);
  const snap = await ref.get();

  const basisVelden = {
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
  };

  if (snap.exists) {
    await ref.set(basisVelden, { merge: true });
    bijgewerkt++;
    console.log(`Bijgewerkt: ${id}`);
  } else {
    await ref.set({ ...basisVelden, status: "nieuw", gevondenOp: nu });
    nieuw++;
    console.log(`Nieuw: ${id}`);
  }
}

await db.collection("overzicht").doc("huidig").set(
  {
    datum: vandaag,
    metadata: {
      bronBestand: inputPath,
      aantalGevonden: input.filter((v) => !v.verlopen && !v.nietInteressant).length,
      verwerktOp: nu,
    },
  },
  { merge: true }
);

console.log(`\nKlaar - ${nieuw} nieuw, ${bijgewerkt} bijgewerkt, ${gearchiveerd} gearchiveerd, ${verwijderd} verwijderd, ${overgeslagen} overgeslagen.`);
