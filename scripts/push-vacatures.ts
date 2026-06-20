/**
 * push-vacatures.ts
 *
 * Leest het dagelijkse PDF-rapport van de Cowork scheduled task,
 * extraheert gestructureerde vacaturedata via Claude API,
 * en commit het resultaat als JSON naar de GitHub repo.
 *
 * Gebruik: npm run push-vacatures [-- --datum 2026-06-20]
 * Automatisch: koppel dit script aan de Cowork "dagelijks-frontend-vacatures-limburg" task.
 */

import "dotenv/config";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { Octokit } from "@octokit/rest";
import { DagOverzichtSchema, VacatureSchema } from "../app/lib/schemas.js";
import { datumUitBestandsnaam } from "../app/lib/date.js";
import type { Vacature } from "../app/lib/schemas.js";

// ── Config ──────────────────────────────────────────────────────────────────

const VACATURES_DIR =
  process.env.VACATURES_DIR ??
  "/Users/tomclaes/Library/CloudStorage/OneDrive-Personal/Vacatures/Vacatures zoeken";

const GITHUB_OWNER = vereist("GITHUB_OWNER");
const GITHUB_REPO = vereist("GITHUB_REPO");
const GITHUB_TOKEN = vereist("GITHUB_TOKEN");
const ANTHROPIC_API_KEY = vereist("ANTHROPIC_API_KEY");

function vereist(naam: string): string {
  const waarde = process.env[naam];
  if (!waarde) throw new Error(`Omgevingsvariabele ${naam} ontbreekt`);
  return waarde;
}

// ── Datum bepalen ────────────────────────────────────────────────────────────

function bepaalDatum(): string {
  const arg = process.argv.find((a) => a.startsWith("--datum="))?.split("=")[1];
  return arg ?? new Date().toISOString().slice(0, 10);
}

// ── PDF zoeken ───────────────────────────────────────────────────────────────

function zoekPdf(datum: string): string {
  // datum = "2026-06-20" → zoekt naar *_20_06_2026.pdf
  const [jaar, maand, dag] = datum.split("-");
  const patroon = `${dag}_${maand}_${jaar}`;

  const bestanden = readdirSync(VACATURES_DIR).filter(
    (f) => f.endsWith(".pdf") && f.includes(patroon)
  );

  if (bestanden.length === 0) {
    throw new Error(`Geen PDF gevonden voor datum ${datum} in ${VACATURES_DIR}`);
  }

  // Voorkeur: dagelijks limburg rapport
  const voorkeur = bestanden.find((f) => f.includes("frontend_limburg"));
  const bestand = voorkeur ?? bestanden[0];

  console.log(`📄 PDF gevonden: ${bestand}`);
  return join(VACATURES_DIR, bestand);
}

// ── PDF → tekst ──────────────────────────────────────────────────────────────

async function extracteerTekst(pdfPad: string): Promise<string> {
  // pdf-parse heeft geen named export in ESM, gebruik dynamic import
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = readFileSync(pdfPad);
  const data = await pdfParse(buffer);
  return data.text;
}

// ── Claude: tekst → gestructureerde vacatures ────────────────────────────────

async function extracteerVacatures(
  pdfTekst: string,
  datum: string,
  bronBestand: string
): Promise<Vacature[]> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const bericht = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Je krijgt de tekst van een dagelijks PDF-rapport met frontend vacatures in België.
Extraheer alle vacatures als een JSON array.

Regels:
- id: slug van bedrijf + titel, lowercase, koppeltekens, geen speciale tekens (bv. "cegeka-senior-frontend-developer")
- regio: een van "limburg" | "antwerpen" | "brussel" | "vlaanderen" | "remote" | "andere"
- bron: een van "indeed" | "vdab" | "jobat" | "linkedin" | "andere"
- status: altijd "nieuw"
- gevondenOp: "${datum}T12:00:00.000Z"
- tags: maximaal 6 relevante technologieën of trefwoorden uit de beschrijving
- beschrijving: korte samenvatting van max 3 zinnen
- url: de directe link als vermeld in de tekst, anders de bedrijfswebsite

Retourneer ALLEEN een JSON array, geen uitleg, geen markdown code blocks.

PDF tekst:
---
${pdfTekst.slice(0, 12000)}
---`,
      },
    ],
  });

  const tekst =
    bericht.content[0].type === "text" ? bericht.content[0].text : "";

  // Verwijder eventuele markdown wrapping
  const json = tekst
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const raw: unknown[] = JSON.parse(json);
  return raw.map((item) => VacatureSchema.parse(item));
}

// ── GitHub commit ─────────────────────────────────────────────────────────────

async function commitNaarGitHub(
  datum: string,
  inhoud: string
): Promise<void> {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const pad = `data/vacatures/${datum}.json`;

  // Controleer of bestand al bestaat (voor update vs create)
  let huidigeSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: pad,
    });
    if (!Array.isArray(data) && "sha" in data) {
      huidigeSha = data.sha;
      console.log(`📝 Bestand bestaat al, wordt overschreven`);
    }
  } catch {
    console.log(`✨ Nieuw bestand wordt aangemaakt`);
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: pad,
    message: `data: vacatures ${datum}`,
    content: Buffer.from(inhoud).toString("base64"),
    ...(huidigeSha ? { sha: huidigeSha } : {}),
  });

  console.log(`✅ Gecommit naar GitHub: ${pad}`);
}

// ── Hoofdprogramma ────────────────────────────────────────────────────────────

async function hoofd() {
  const datum = bepaalDatum();
  console.log(`\n🔍 Verwerking vacatures voor ${datum}\n`);

  // 1. PDF zoeken
  const pdfPad = zoekPdf(datum);

  // 2. Tekst extraheren
  console.log("📖 PDF tekst extraheren...");
  const pdfTekst = await extracteerTekst(pdfPad);
  console.log(`   ${pdfTekst.length} tekens gelezen`);

  // 3. Claude extractie
  console.log("🤖 Vacatures extraheren via Claude...");
  const vacatures = await extracteerVacatures(
    pdfTekst,
    datum,
    pdfPad.split("/").pop()!
  );
  console.log(`   ${vacatures.length} vacatures gevonden`);

  // 4. DagOverzicht samenstellen en valideren
  const overzicht = DagOverzichtSchema.parse({
    datum,
    vacatures,
    metadata: {
      bronBestand: pdfPad.split("/").pop()!,
      aantalGevonden: vacatures.length,
      verwerktOp: new Date().toISOString(),
    },
  });

  const json = JSON.stringify(overzicht, null, 2);

  // 5. GitHub commit
  console.log("🚀 Uploaden naar GitHub...");
  await commitNaarGitHub(datum, json);

  console.log(`\n✅ Klaar! ${vacatures.length} vacatures gepusht voor ${datum}\n`);
}

hoofd().catch((err) => {
  console.error("❌ Fout:", err.message);
  process.exit(1);
});
