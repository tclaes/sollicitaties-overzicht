/**
 * extract-pdf.ts
 *
 * Extraheert tekst uit het dagelijkse vacature-PDF en print het naar stdout.
 * De Claude scheduled task gebruikt deze output om de JSON te structureren.
 *
 * Gebruik: npx tsx scripts/extract-pdf.ts [--datum=YYYY-MM-DD]
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const VACATURES_DIR =
  process.env.VACATURES_DIR ??
  "/Users/tomclaes/Library/CloudStorage/OneDrive-Personal/Vacatures/Vacatures zoeken";

function bepaalDatum(): string {
  const arg = process.argv.find((a) => a.startsWith("--datum="))?.split("=")[1];
  return arg ?? new Date().toISOString().slice(0, 10);
}

function zoekPdf(datum: string): string {
  const [jaar, maand, dag] = datum.split("-");
  const patroon = `${dag}_${maand}_${jaar}`;

  const bestanden = readdirSync(VACATURES_DIR).filter(
    (f) => f.endsWith(".pdf") && f.includes(patroon)
  );

  if (bestanden.length === 0) {
    throw new Error(`Geen PDF gevonden voor datum ${datum} in ${VACATURES_DIR}`);
  }

  const voorkeur = bestanden.find((f) => f.includes("frontend_limburg"));
  const bestand = voorkeur ?? bestanden[0];
  console.error(`PDF: ${bestand}`);
  return join(VACATURES_DIR, bestand);
}

async function hoofd() {
  const datum = bepaalDatum();
  const pdfPad = zoekPdf(datum);

  const pdfParse = (await import("pdf-parse")).default;
  const buffer = readFileSync(pdfPad);
  const { text } = await pdfParse(buffer);

  // JSON naar stdout: de agent leest dit en structureert de vacatures
  process.stdout.write(
    JSON.stringify({
      datum,
      bestand: pdfPad.split("/").pop(),
      tekst: text,
    })
  );
}

hoofd().catch((err) => {
  console.error("Fout:", err.message);
  process.exit(1);
});
