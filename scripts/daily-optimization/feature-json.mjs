/**
 * Shared helpers for expense daily-opt JSON files.
 * Used by run.mjs (auto-repair) and ensure-feature-json.mjs (CI / prebuild guard).
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "../..");

export const HISTORY_PATH = join(ROOT, "optimization_history.json");
export const ENABLED_PATH = join(ROOT, "universal/src/data/enabledExpenseFeatures.json");
export const BACKLOG_PATH = join(ROOT, "universal/src/data/expenseDailyBacklog.js");

export const CONFLICT_MARKER_RE = /^<<<<<<<|^=======|^>>>>>>>/m;

export function todayHktYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseBacklog(source) {
  const items = [];
  const blockRe =
    /\{\s*id:\s*"([^"]+)",\s*title:\s*"((?:\\"|[^"])*)",\s*description:\s*"((?:\\"|[^"])*)"/g;
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    items.push({
      id: m[1],
      title: m[2].replace(/\\"/g, '"'),
      description: m[3].replace(/\\"/g, '"'),
    });
  }
  return items;
}

export function loadBacklog() {
  if (!existsSync(BACKLOG_PATH)) return [];
  return parseBacklog(readFileSync(BACKLOG_PATH, "utf8"));
}

export function hasConflictMarkers(raw) {
  return CONFLICT_MARKER_RE.test(raw);
}

export function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tryReadGitHeadJson(relativePath) {
  try {
    const raw = execSync(`git show HEAD:${relativePath}`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return tryParseJson(raw);
  } catch {
    return null;
  }
}

function findJsonObjectStrings(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          out.push(text.slice(i, j + 1));
          i = j;
          break;
        }
      }
    }
  }
  return out;
}

/** Extract every parseable JSON object from conflicted / broken text. */
export function extractJsonCandidates(raw) {
  const candidates = [];
  const seen = new Set();

  const push = (value) => {
    if (!value || typeof value !== "object") return;
    const key = JSON.stringify(value);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(value);
  };

  const direct = tryParseJson(raw);
  if (direct) {
    push(direct);
    return candidates;
  }

  const single = raw.match(/^<<<<<<<[^\n]*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>>[^\n]*$/m);
  if (single) {
    push(tryParseJson(single[1].trim()));
    push(tryParseJson(single[2].trim()));
  }

  const stripped = raw
    .split("\n")
    .filter((line) => !/^(<<<<<<<|=======|>>>>>>>)/.test(line))
    .join("\n");
  push(tryParseJson(stripped.trim()));

  for (const block of findJsonObjectStrings(raw)) push(tryParseJson(block));
  for (const block of findJsonObjectStrings(stripped)) push(tryParseJson(block));

  return candidates;
}

export function mergeEnabledStates(states, backlogOrder) {
  const list = states.filter(Boolean);
  const union = new Set();
  for (const state of list) {
    for (const id of state.enabled ?? []) union.add(id);
  }
  const ordered = backlogOrder.filter((id) => union.has(id));
  for (const id of union) {
    if (!ordered.includes(id)) ordered.push(id);
  }

  let newest = null;
  let newestTs = -1;
  for (const state of list) {
    const ts = state.updatedAt ? Date.parse(state.updatedAt) : 0;
    if (ts >= newestTs) {
      newestTs = ts;
      newest = state;
    }
  }

  return {
    enabled: ordered,
    updatedAt: newest?.updatedAt ?? new Date().toISOString(),
    lastFeatureId: newest?.lastFeatureId ?? ordered.at(-1) ?? null,
    lastTitle: newest?.lastTitle ?? null,
  };
}

export function mergeHistories(states) {
  const byKey = new Map();
  for (const state of states.filter(Boolean)) {
    for (const entry of state.entries ?? []) {
      if (!entry?.date || !entry?.id) continue;
      const key = `${entry.date}::${entry.id}`;
      const existing = byKey.get(key);
      if (!existing || Object.keys(entry).length >= Object.keys(existing).length) {
        byKey.set(key, entry);
      }
    }
  }
  return {
    entries: [...byKey.values()].sort((left, right) => {
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) return byDate;
      return String(left.id).localeCompare(String(right.id));
    }),
  };
}

export function rebuildEnabledFromHistory(history, backlog) {
  const validIds = new Set(backlog.map((item) => item.id));
  const enabled = [];
  for (const entry of history.entries ?? []) {
    if (validIds.has(entry.id) && !enabled.includes(entry.id)) enabled.push(entry.id);
  }
  const ordered = backlog.map((item) => item.id).filter((id) => enabled.includes(id));
  for (const id of enabled) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  const last = (history.entries ?? []).at(-1);
  return {
    enabled: ordered,
    updatedAt: last?.date ? `${last.date}T02:00:00.000Z` : new Date().toISOString(),
    lastFeatureId: last?.id ?? ordered.at(-1) ?? null,
    lastTitle: last?.title ?? null,
  };
}

export function normalizeEnabled(state, backlog = []) {
  const backlogOrder = backlog.map((item) => item.id);
  const enabled = [...new Set((state?.enabled ?? []).filter((id) => typeof id === "string" && id))];
  const ordered = backlogOrder.filter((id) => enabled.includes(id));
  for (const id of enabled) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return {
    enabled: ordered,
    updatedAt: state?.updatedAt ?? new Date().toISOString(),
    lastFeatureId: state?.lastFeatureId ?? ordered.at(-1) ?? null,
    lastTitle: state?.lastTitle ?? null,
  };
}

export function normalizeHistory(state) {
  const entries = [];
  const seen = new Set();
  for (const entry of state?.entries ?? []) {
    if (!entry?.date || !entry?.id) continue;
    const key = `${entry.date}::${entry.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      date: entry.date,
      id: entry.id,
      title: entry.title ?? "",
      description: entry.description ?? "",
      ...(entry.cycle ? { cycle: true } : {}),
    });
  }
  entries.sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) return byDate;
    return String(left.id).localeCompare(String(right.id));
  });
  return { entries };
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/**
 * Read + auto-repair one JSON file.
 * @returns {{ data: object, repaired: boolean, error?: string }}
 */
export function readJsonResilient(path, fallback, { kind, backlog, history } = {}) {
  if (!existsSync(path)) return { data: fallback, repaired: false };

  const raw = readFileSync(path, "utf8");
  const conflicted = hasConflictMarkers(raw);
  const parsed = conflicted ? null : tryParseJson(raw);

  if (parsed !== null) {
    if (kind === "enabled") return { data: normalizeEnabled(parsed, backlog ?? []), repaired: false };
    if (kind === "history") return { data: normalizeHistory(parsed), repaired: false };
    return { data: parsed, repaired: false };
  }

  if (conflicted) {
    console.warn(`[feature-json] ${path} has conflict markers — auto-merging…`);
  } else {
    console.warn(`[feature-json] ${path} is invalid JSON — attempting rebuild…`);
  }

  const candidates = extractJsonCandidates(raw);

  if (kind === "history") {
    const historyCandidates = candidates.filter((c) => Array.isArray(c?.entries));
    if (historyCandidates.length) {
      const merged = normalizeHistory(mergeHistories(historyCandidates));
      console.log(`[feature-json] merged history from ${historyCandidates.length} candidate(s)`);
      return { data: merged, repaired: true };
    }
    console.error(`[feature-json] could not repair ${path}; using empty history`);
    return { data: fallback, repaired: true };
  }

  if (kind === "enabled") {
    const enabledCandidates = candidates.filter((c) => Array.isArray(c?.enabled));
    const backlogOrder = (backlog ?? []).map((item) => item.id);
    const parts = [];
    if (enabledCandidates.length) {
      parts.push(mergeEnabledStates(enabledCandidates, backlogOrder));
    }
    // Prefer last known good committed version so partial conflict hunks cannot drop features.
    const headEnabled = tryReadGitHeadJson("universal/src/data/enabledExpenseFeatures.json");
    if (Array.isArray(headEnabled?.enabled)) {
      parts.push(headEnabled);
    }
    // Always union with history rebuild so a partial conflict side cannot drop features.
    if (history?.entries?.length && backlog?.length) {
      parts.push(rebuildEnabledFromHistory(history, backlog));
    }
    if (parts.length) {
      const merged = normalizeEnabled(mergeEnabledStates(parts, backlogOrder), backlog);
      console.log(
        `[feature-json] repaired enabled from ${enabledCandidates.length} candidate(s)` +
          (history?.entries?.length ? " + history" : ""),
      );
      return { data: merged, repaired: true };
    }
    return {
      data: fallback,
      repaired: false,
      error: `unable to repair ${path}`,
    };
  }

  return { data: fallback, repaired: false, error: `unable to repair ${path}` };
}

/**
 * Ensure both feature JSON files are valid on disk.
 * @param {{ write?: boolean }} opts
 */
export function ensureFeatureJson({ write = true } = {}) {
  const backlog = loadBacklog();
  const historyResult = readJsonResilient(HISTORY_PATH, { entries: [] }, { kind: "history" });
  const enabledResult = readJsonResilient(
    ENABLED_PATH,
    { enabled: [], updatedAt: null, lastFeatureId: null, lastTitle: null },
    { kind: "enabled", backlog, history: historyResult.data },
  );

  if (enabledResult.error) {
    return {
      ok: false,
      repaired: false,
      error: enabledResult.error,
      history: historyResult.data,
      enabled: enabledResult.data,
    };
  }

  const repaired = historyResult.repaired || enabledResult.repaired;
  if (write && repaired) {
    writeJson(HISTORY_PATH, historyResult.data);
    writeJson(ENABLED_PATH, enabledResult.data);
  }

  try {
    if (!Array.isArray(enabledResult.data.enabled)) throw new Error("enabled must be an array");
    if (!Array.isArray(historyResult.data.entries)) throw new Error("entries must be an array");
  } catch (err) {
    return {
      ok: false,
      repaired,
      error: err instanceof Error ? err.message : String(err),
      history: historyResult.data,
      enabled: enabledResult.data,
    };
  }

  return {
    ok: true,
    repaired,
    history: historyResult.data,
    enabled: enabledResult.data,
    backlog,
  };
}
