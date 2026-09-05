#!/usr/bin/env node
/**
 * Validate (and optionally repair) daily-opt feature JSON files.
 *
 *   node scripts/daily-optimization/ensure-feature-json.mjs
 *   node scripts/daily-optimization/ensure-feature-json.mjs --check   # CI: fail if broken / needs repair
 *   node scripts/daily-optimization/ensure-feature-json.mjs --repair  # write repairs to disk
 */

import {
  ENABLED_PATH,
  HISTORY_PATH,
  ensureFeatureJson,
  hasConflictMarkers,
} from "./feature-json.mjs";
import { existsSync, readFileSync } from "node:fs";

const checkOnly = process.argv.includes("--check");
const forceRepair = process.argv.includes("--repair") || !checkOnly;

function fileLooksBroken(path) {
  if (!existsSync(path)) return `missing: ${path}`;
  const raw = readFileSync(path, "utf8");
  if (hasConflictMarkers(raw)) return `conflict markers: ${path}`;
  try {
    JSON.parse(raw);
  } catch (err) {
    return `invalid JSON: ${path} (${err instanceof Error ? err.message : err})`;
  }
  return null;
}

const preIssues = [fileLooksBroken(ENABLED_PATH), fileLooksBroken(HISTORY_PATH)].filter(Boolean);

if (checkOnly && preIssues.length) {
  console.error("[ensure-feature-json] FAIL — broken feature JSON:");
  for (const issue of preIssues) console.error(`  - ${issue}`);
  console.error("Run: node scripts/daily-optimization/ensure-feature-json.mjs --repair");
  process.exit(1);
}

const result = ensureFeatureJson({ write: forceRepair && !checkOnly });

if (!result.ok) {
  console.error(`[ensure-feature-json] FAIL — ${result.error}`);
  process.exit(1);
}

if (checkOnly) {
  console.log(
    `[ensure-feature-json] OK — enabled=${result.enabled.enabled.length} history=${result.history.entries.length}`,
  );
  process.exit(0);
}

if (result.repaired) {
  console.log("[ensure-feature-json] repaired and wrote:");
  console.log(`  - ${ENABLED_PATH}`);
  console.log(`  - ${HISTORY_PATH}`);
} else {
  console.log(
    `[ensure-feature-json] already healthy — enabled=${result.enabled.enabled.length} history=${result.history.entries.length}`,
  );
}
