#!/usr/bin/env bash
# Shared CI entry for Daily Optimization (primary + backup retry).
# Writes GitHub Actions outputs: skip, repaired, title, id
set -euo pipefail

if git grep -nE '^(<<<<<<<|=======|>>>>>>>)' -- \
  universal/src/data/enabledExpenseFeatures.json optimization_history.json 2>/dev/null; then
  echo "::warning::偵測到衝突標記，交由 run.mjs 自動修復。"
fi

node scripts/daily-optimization/run.mjs

if [[ -f .daily-opt-repaired ]]; then
  echo "repaired=true" >> "$GITHUB_OUTPUT"
  echo "JSON auto-repaired."
else
  echo "repaired=false" >> "$GITHUB_OUTPUT"
fi

if [[ -f .daily-opt-skip ]]; then
  echo "skip=true" >> "$GITHUB_OUTPUT"
  echo "No new feature to enable."
else
  echo "skip=false" >> "$GITHUB_OUTPUT"
  if [[ -f .daily-opt-result.json ]]; then
    TITLE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.daily-opt-result.json','utf8')).title)")
    ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.daily-opt-result.json','utf8')).id)")
    echo "title=$TITLE" >> "$GITHUB_OUTPUT"
    echo "id=$ID" >> "$GITHUB_OUTPUT"
  fi
fi

node scripts/daily-optimization/ensure-feature-json.mjs --check
