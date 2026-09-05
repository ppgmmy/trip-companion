#!/usr/bin/env bash
# Commit + push daily-opt JSON changes (enable or repair).
# Env/inputs via args: $1=skip $2=repaired $3=title $4=id
set -euo pipefail

SKIP="${1:-true}"
REPAIRED="${2:-false}"
TITLE="${3:-}"
ID="${4:-}"

if [[ "$SKIP" == "true" && "$REPAIRED" != "true" ]]; then
  echo "Nothing to commit (skip && !repaired)"
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

rm -f .daily-opt-skip .daily-opt-result.json .daily-opt-repaired

git add universal/src/data/enabledExpenseFeatures.json optimization_history.json
if git diff --cached --quiet; then
  echo "Nothing to commit"
  exit 0
fi

if [[ "$SKIP" == "false" ]]; then
  MSG="$(cat <<EOF
feat(daily): enable ${ID} — ${TITLE}

Automated daily expense dashboard optimization.
EOF
)"
else
  MSG="$(cat <<EOF
fix(daily): auto-repair expense feature JSON conflict markers

Automated recovery so daily optimization can continue.
EOF
)"
fi
git commit -m "$MSG"

REF_NAME="${GITHUB_REF_NAME:-main}"
for attempt in 1 2 3; do
  git pull --rebase origin main && git push origin "HEAD:${REF_NAME}" && exit 0
  echo "Push conflict, retry $attempt..."
  sleep 3
done
echo "Push failed after retries"
exit 1
