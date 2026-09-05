#!/usr/bin/env node
/**
 * 每日自動優化腳本（GitHub Actions / 本地）
 * 香港時區日期；同一天最多啟用一項（備援觸發冪等）。
 *
 * JSON 含衝突標記或無效時會自動合併／重建（見 feature-json.mjs）。
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

function main() {
  const today = todayHktYmd();
  console.log(`[daily-opt] today(HKT)=${today} dryRun=${dryRun}`);

  const ensured = ensureFeatureJson({ write: !dryRun });
  if (!ensured.ok) {
    console.error(`[daily-opt] feature JSON 無法修復：${ensured.error}`);
    process.exit(1);
  }

  if (ensured.repaired) {
    console.log("[daily-opt] feature JSON 已自動修復");
    if (!dryRun) writeFileSync(join(ROOT, ".daily-opt-repaired"), "1\n", "utf8");
  }

  const { backlog, history, enabled } = ensured;
  if (!backlog.length) {
    console.error("[daily-opt] backlog 為空，無法繼續。");
    process.exit(1);
  }

  const doneToday = history.entries.find((entry) => entry.date === today);
  if (doneToday) {
    console.log(`[daily-opt] 今日(${today})已啟用 ${doneToday.id} — ${doneToday.title}，跳過。`);
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
    next = backlog[history.entries.length % backlog.length];
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
