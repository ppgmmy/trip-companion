#!/usr/bin/env node
/**
 * 每日自動優化腳本（GitHub Actions / 本地）
 * 香港時區日期；同一天最多啟用一項（備援觸發冪等）。
 *
 * JSON 含衝突標記或無效時會自動合併／重建（見 feature-json.mjs）。
 * 會補齊 history 欠漏、輪播時避開昨日剛公告嘅 id，盡量每日都寫到。
 *
 *   node scripts/daily-optimization/run.mjs
 *   node scripts/daily-optimization/run.mjs --dry-run
 */

import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENABLED_PATH,
  HISTORY_PATH,
  ROOT,
  ensureFeatureJson,
  todayHktYmd,
  writeJson,
} from "./feature-json.mjs";

const dryRun = process.argv.includes("--dry-run");

function hktYmdFromIso(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return todayHktYmd(new Date(t));
}

/** Ensure every enabled id appears at least once in history (heal gaps). */
function backfillHistory(history, enabled, backlog) {
  const byId = new Map(backlog.map((item) => [item.id, item]));
  const seen = new Set(history.entries.map((entry) => entry.id));
  const additions = [];
  for (const id of enabled.enabled ?? []) {
    if (seen.has(id)) continue;
    const meta = byId.get(id);
    if (!meta) continue;
    additions.push({
      date: "1970-01-01",
      id,
      title: meta.title,
      description: meta.description,
      backfill: true,
    });
    seen.add(id);
  }
  if (!additions.length) return { history, healed: false };
  return {
    history: { entries: [...history.entries, ...additions] },
    healed: true,
  };
}

function pickCycleFeature(backlog, history, lastFeatureId) {
  if (!backlog.length) return null;
  // Prefer something other than yesterday / last announced id when possible.
  const lastDate = history.entries.filter((e) => !e.backfill).at(-1)?.date ?? null;
  const yesterdayIds = new Set(
    history.entries.filter((e) => e.date === lastDate).map((e) => e.id),
  );
  const avoid = new Set([lastFeatureId, ...yesterdayIds].filter(Boolean));

  for (let offset = 0; offset < backlog.length; offset++) {
    const candidate = backlog[(history.entries.length + offset) % backlog.length];
    if (!avoid.has(candidate.id)) return candidate;
  }
  return backlog[history.entries.length % backlog.length];
}

function main() {
  const today = todayHktYmd();
  console.log(`[daily-opt] today(HKT)=${today} dryRun=${dryRun}`);

  const ensured = ensureFeatureJson({ write: !dryRun });
  if (!ensured.ok) {
    console.error(`[daily-opt] feature JSON 無法修復：${ensured.error}`);
    process.exit(1);
  }

  let repaired = ensured.repaired;
  if (repaired) {
    console.log("[daily-opt] feature JSON 已自動修復");
  }

  const { backlog } = ensured;
  if (!backlog.length) {
    console.error("[daily-opt] backlog 為空，無法繼續。");
    process.exit(1);
  }

  const filled = backfillHistory(ensured.history, ensured.enabled, backlog);
  let history = filled.history;
  let enabled = ensured.enabled;
  if (filled.healed) {
    console.log(`[daily-opt] 已補齊 history 欠漏（enabled↔history 對齊）`);
    repaired = true;
    if (!dryRun) {
      writeJson(HISTORY_PATH, history);
    }
  }

  // Done today if history has today's date OR lastFeature was updated today (agent race).
  const doneToday =
    history.entries.find((entry) => entry.date === today && !entry.backfill) ||
    (hktYmdFromIso(enabled.updatedAt) === today && enabled.lastFeatureId
      ? {
          id: enabled.lastFeatureId,
          title: enabled.lastTitle ?? enabled.lastFeatureId,
        }
      : null);

  if (doneToday) {
    console.log(`[daily-opt] 今日(${today})已啟用 ${doneToday.id} — ${doneToday.title}，跳過。`);
    if (repaired && !dryRun) {
      writeFileSync(join(ROOT, ".daily-opt-repaired"), "1\n", "utf8");
      writeJson(ENABLED_PATH, enabled);
      writeJson(HISTORY_PATH, history);
    }
    writeFileSync(join(ROOT, ".daily-opt-skip"), "already\n", "utf8");
    process.exit(0);
  }

  const used = new Set([
    ...history.entries.map((entry) => entry.id),
    ...(enabled.enabled ?? []),
  ]);
  let next = backlog.find((feature) => !used.has(feature.id));
  let isCycle = false;

  if (!next) {
    next = pickCycleFeature(backlog, history, enabled.lastFeatureId);
    isCycle = true;
    console.log(
      `[daily-opt] 進入無限期輪播（第 ${Math.floor(history.entries.length / backlog.length) + 1} 輪）：${next.id} — ${next.title}`,
    );
  }

  const nextEnabled = {
    enabled: Array.from(new Set([...(enabled.enabled ?? []), next.id])),
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
  if (repaired) writeFileSync(join(ROOT, ".daily-opt-repaired"), "1\n", "utf8");
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

try {
  main();
} catch (err) {
  console.error("[daily-opt] unexpected error:", err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
}
