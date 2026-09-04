#!/usr/bin/env node
// Trigt de GitHub Actions-workflow "Sync vacatures naar Firestore" (workflow_dispatch)
// en volgt de run tot ze klaar is. Bedoeld zodat de cowork-app / Claude Code de sync
// volledig vanaf de commandline kan starten zonder eerst naar main te hoeven pushen.
//
// Gebruik:
//   npm run trigger:sync              # gewone sync
//   npm run trigger:sync -- --dedupe  # sync + duplicaten echt opruimen
//   npm run trigger:sync -- --no-watch
//
// Vereist: GitHub CLI (`gh`) ingelogd met repo-scope.

import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const dedupeFix = args.has("--dedupe") || args.has("--dedupe-fix");
const watch = !args.has("--no-watch");
const ref = process.env.SYNC_REF || "main";
const workflow = "sync-firestore.yml";

function gh(cmdArgs, opts = {}) {
  const res = spawnSync("gh", cmdArgs, { stdio: "inherit", ...opts });
  if (res.error) {
    console.error(`\nKon 'gh' niet uitvoeren: ${res.error.message}`);
    console.error("Installeer de GitHub CLI en log in met 'gh auth login'.");
    process.exit(1);
  }
  return res;
}

console.log(
  `Workflow "${workflow}" starten op ref '${ref}'` +
    (dedupeFix ? " (met dedupe --apply)" : "") +
    " ...",
);

const runArgs = ["workflow", "run", workflow, "--ref", ref];
if (dedupeFix) runArgs.push("-f", "dedupe_fix=true");

const dispatched = gh(runArgs);
if (dispatched.status !== 0) {
  console.error("\nWorkflow starten is mislukt (zie output hierboven).");
  process.exit(dispatched.status ?? 1);
}

if (!watch) {
  console.log("\nWorkflow gestart. Volg de voortgang met: gh run list --workflow=" + workflow);
  process.exit(0);
}

// Even wachten zodat de run bestaat, dan de meest recente run volgen.
await new Promise((r) => setTimeout(r, 4000));

const list = spawnSync(
  "gh",
  ["run", "list", "--workflow", workflow, "--limit", "1", "--json", "databaseId"],
  { encoding: "utf8" },
);

let runId;
try {
  runId = JSON.parse(list.stdout)[0]?.databaseId;
} catch {
  /* val terug op 'gh run watch' zonder id */
}

console.log("\nRun volgen ...\n");
const watched = gh([
  "run",
  "watch",
  ...(runId ? [String(runId)] : []),
  "--exit-status",
]);
process.exit(watched.status ?? 0);
