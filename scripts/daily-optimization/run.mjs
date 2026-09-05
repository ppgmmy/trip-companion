/**
 * 每日自動優化腳本（GitHub Actions / 本地）
 * 香港時區日期；同一天最多啟用一項（備援觸發冪等）。
 *
 * 若 JSON 含 git 衝突標記或解析失敗，會嘗試自動合併／重建後繼續執行。
 *
 *   node scripts/daily-optimization/run.mjs
 *   node scripts/daily-optimization/run.mjs --dry-run
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const HISTORY_PATH = join(ROOT, "optimization_history.json");
const ENABLED_PATH = join(ROOT, "universal/src/data/enabledExpenseFeatures.json");
const BACKLOG_PATH = join(ROOT, "universal/src/data/expenseDailyBacklog.js");

const dryRun = process.argv.includes("--dry-run");
const CONFLICT_MARKER_RE = /^<<<<<<<|^=======|^>>>>>>>/m;

function todayHktYmd() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseBacklog(source) {
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

function hasConflictMarkers(raw) {
  return CONFLICT_MARKER_RE.test(raw);
}

function splitGitConflict(raw) {
  const match = raw.match(/^<<<<<<<[^\n]*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>>[^\n]*$/m);
  if (!match) return null;
  return { ours: match[1].trim(), theirs: match[2].trim() };
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeEnabledStates(a, b, backlogOrder) {
  const union = new Set([...(a?.enabled ?? []), ...(b?.enabled ?? [])]);
  const ordered = backlogOrder.filter((id) => union.has(id));
  for (const id of union) {
    if (!ordered.includes(id)) ordered.push(id);
  }

  const timeA = a?.updatedAt ? Date.parse(a.updatedAt) : 0;
  const timeB = b?.updatedAt ? Date.parse(b.updatedAt) : 0;
  const newer = timeB > timeA ? b : a;
  const older = timeB > timeA ? a : b;

  return {
    enabled: ordered,
    updatedAt: newer?.updatedAt ?? older?.updatedAt ?? new Date().toISOString(),
    lastFeatureId: newer?.lastFeatureId ?? older?.lastFeatureId ?? ordered.at(-1) ?? null,
    lastTitle: newer?.lastTitle ?? older?.lastTitle ?? null,
  };
}

function mergeHistories(a, b) {
  const byKey = new Map();
  for (const entry of [...(a?.entries ?? []), ...(b?.entries ?? [])]) {
    if (!entry?.date || !entry?.id) continue;
    const key = `${entry.date}::${entry.id}`;
    const existing = byKey.get(key);
    if (!existing || Object.keys(entry).length >= Object.keys(existing).length) {
      byKey.set(key, entry);
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

function rebuildEnabledFromHistory(history, backlog) {
  const validIds = new Set(backlog.map((item) => item.id));
  const enabled = history.entries.map((entry) => entry.id).filter((id) => validIds.has(id));
  const last = history.entries.at(-1);
  return {
    enabled: [...new Set(enabled)],
    updatedAt: last?.date ? `${last.date}T02:00:00.000Z` : new Date().toISOString(),
    lastFeatureId: last?.id ?? null,
    lastTitle: last?.title ?? null,
  };
}

function readJsonResilient(path, fallback, { kind, backlog, history } = {}) {
  if (!existsSync(path)) return { data: fallback, repaired: false };

  const raw = readFileSync(path, "utf8");

  if (!hasConflictMarkers(raw)) {
    const parsed = tryParseJson(raw);
    if (parsed !== null) return { data: parsed, repaired: false };
    console.warn(`[daily-opt] ${path} JSON 無效，嘗試重建…`);
  } else {
    console.warn(`[daily-opt] ${path} 偵測到 git 衝突標記，嘗試自動合併…`);
  }

  const parts = splitGitConflict(raw);
  if (parts) {
    const ours = tryParseJson(parts.ours);
    const theirs = tryParseJson(parts.theirs);

    if (kind === "history" && (ours || theirs)) {
      const merged = mergeHistories(ours ?? { entries: [] }, theirs ?? { entries: [] });
      console.log(`[daily-opt] 已自動合併 ${path}`);
      return { data: merged, repaired: true };
    }

    if (kind === "enabled" && (ours || theirs)) {
      const backlogOrder = backlog?.map((item) => item.id) ?? [];
      const merged = mergeEnabledStates(ours, theirs, backlogOrder);
      console.log(`[daily-opt] 已自動合併 ${path}`);
      return { data: merged, repaired: true };
    }
  }

  if (kind === "enabled" && history?.entries?.length && backlog?.length) {
    const rebuilt = rebuildEnabledFromHistory(history, backlog);
    console.log(`[daily-opt] 已從 optimization_history 重建 ${path}`);
    return { data: rebuilt, repaired: true };
  }

  if (kind === "history") {
    console.error(`[daily-opt] 無法修復 ${path}，使用空白 history 繼續。`);
    return { data: fallback, repaired: false };
  }

  console.error(`[daily-opt] 無法修復 ${path}，無法繼續。`);
  process.exit(1);
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function persistRepair(path, data, repaired) {
  if (!repaired || dryRun) return;
  writeJson(path, data);
  console.log(`[daily-opt] 已寫回修復後的 ${path}`);
}

function main() {
  const today = todayHktYmd();
  console.log(`[daily-opt] today(HKT)=${today} dryRun=${dryRun}`);

  const backlog = parseBacklog(readFileSync(BACKLOG_PATH, "utf8"));
  if (!backlog.length) {
    console.error("[daily-opt] backlog 為空，無法繼續。");
    process.exit(1);
  }

  const historyResult = readJsonResilient(HISTORY_PATH, { entries: [] }, { kind: "history" });
  persistRepair(HISTORY_PATH, historyResult.data, historyResult.repaired);
  const history = historyResult.data;

  const enabledResult = readJsonResilient(
    ENABLED_PATH,
    { enabled: [], updatedAt: null },
    { kind: "enabled", backlog, history },
  );
  persistRepair(ENABLED_PATH, enabledResult.data, enabledResult.repaired);
  const enabledState = enabledResult.data;

  const repaired = historyResult.repaired || enabledResult.repaired;
  if (repaired && !dryRun) {
    writeFileSync(join(ROOT, ".daily-opt-repaired"), "1\n", "utf8");
  }

  const doneToday = history.entries.find((entry) => entry.date === today);
  if (doneToday) {
    console.log(`[daily-opt] 今日(${today})已啟用 ${doneToday.id} — ${doneToday.title}，跳過。`);
    writeFileSync(join(ROOT, ".daily-opt-skip"), "already\n", "utf8");
    process.exit(0);
  }

  const used = new Set([
    ...history.entries.map((entry) => entry.id),
    ...(enabledState.enabled ?? []),
  ]);
  let next = backlog.find((feature) => !used.has(feature.id));
  let isCycle = false;

  if (!next) {
    // 全部啟用後進入無限期輪播：每日仍更新公告同 history，永不停止
    next = backlog[history.entries.length % backlog.length];
    isCycle = true;
    console.log(
      `[daily-opt] 進入無限期輪播（第 ${Math.floor(history.entries.length / backlog.length) + 1} 輪）：${next.id} — ${next.title}`,
    );
  }

  const nextEnabled = {
    enabled: Array.from(new Set([...(enabledState.enabled ?? []), next.id])),
    updatedAt: new Date().toISOString(),
    lastFeatureId: next.id,
    lastTitle: next.title,
  };
  const nextHistory = {
    entries: [
      ...history.entries,
      {
        date: today,
        id: next.id,
        title: next.title,
        description: next.description,
        ...(isCycle ? { cycle: true } : {}),
      },
    ],
  };

  console.log(`[daily-opt] ${isCycle ? "輪播" : "啟用"}功能：${next.id} — ${next.title}`);
  console.log(`[daily-opt] ${next.description}`);

  if (dryRun) {
    console.log("[daily-opt] dry-run：不寫入檔案");
    console.log(JSON.stringify({ nextEnabled, entry: nextHistory.entries.at(-1) }, null, 2));
    process.exit(0);
  }

  const skipPath = join(ROOT, ".daily-opt-skip");
  if (existsSync(skipPath)) unlinkSync(skipPath);

  writeJson(ENABLED_PATH, nextEnabled);
  writeJson(HISTORY_PATH, nextHistory);
  writeFileSync(
    join(ROOT, ".daily-opt-result.json"),
    `${JSON.stringify(
      {
        id: next.id,
        title: next.title,
        description: next.description,
        date: today,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log("[daily-opt] 已更新 enabledExpenseFeatures.json 與 optimization_history.json");
}

main();
