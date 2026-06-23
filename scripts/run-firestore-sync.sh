#!/usr/bin/env bash
# Automatische dagelijkse Firestore-sync voor SollicitatiesApp.
# Wordt elke dag om 12:30 aangeroepen door launchd (zie com.tomclaes.firestoresync.plist).
# Draait LOKAAL op Tom's Mac (niet in de Cowork-sandbox) omdat die geen netwerktoegang
# heeft tot *.googleapis.com.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR" || exit 1

INPUT="data/firestore-sync-input.json"
LOG="data/sync.log"

mkdir -p data

if [ ! -f "$INPUT" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - geen $INPUT gevonden, sync overgeslagen" >> "$LOG"
  exit 0
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - start sync" >> "$LOG"
npm run sync:firestore -- "$INPUT" >> "$LOG" 2>&1
STATUS=$?
echo "$(date '+%Y-%m-%d %H:%M:%S') - einde sync (exit $STATUS)" >> "$LOG"
exit $STATUS
