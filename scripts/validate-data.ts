/**
 * validate-data.ts
 *
 * Valideert alle JSON bestanden in public/data/vacatures/ tegen het Zod schema.
 * Draait in GitHub Actions na elke push naar public/data/.
 */

import {readdirSync, readFileSync} from "fs";
import {join} from "path";
import {DailyOverviewSchema} from "~/lib/schemas";

const DATA_DIR = join(process.cwd(), "public", "data", "vacatures");
const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

let errors = 0;

for (const file of files) {
    const filePath = join(DATA_DIR, file);
    try {
        const raw = JSON.parse(readFileSync(filePath, "utf-8"));
        DailyOverviewSchema.parse(raw);
        console.log(`✅ ${file}`);
    } catch (err) {
        console.error(`❌ ${file}: ${err instanceof Error ? err.message : err}`);
        errors++;
    }
}

if (errors > 0) {
    console.error(`\n${errors} bestand(en) ongeldig. Deploy geannuleerd.`);
    process.exit(1);
}

console.log(`\n✅ Alle ${files.length} bestanden geldig.`);
