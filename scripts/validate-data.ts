/**
 * validate-data.ts
 *
 * Valideert alle JSON bestanden in public/data/vacatures/ tegen het Zod schema.
 * Draait in GitHub Actions na elke push naar public/data/.
 */

import {readdirSync, readFileSync} from "fs";
import {join} from "path";
import {DagOverzichtSchema} from "~/lib/schemas";

const DATA_DIR = join(process.cwd(), "public", "data", "vacatures");
const bestanden = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

let fouten = 0;

for (const bestand of bestanden) {
    const pad = join(DATA_DIR, bestand);
    try {
        const raw = JSON.parse(readFileSync(pad, "utf-8"));
        DagOverzichtSchema.parse(raw);
        console.log(`✅ ${bestand}`);
    } catch (err) {
        console.error(`❌ ${bestand}: ${err instanceof Error ? err.message : err}`);
        fouten++;
    }
}

if (fouten > 0) {
    console.error(`\n${fouten} bestand(en) ongeldig. Deploy geannuleerd.`);
    process.exit(1);
}

console.log(`\n✅ Alle ${bestanden.length} bestanden geldig.`);
