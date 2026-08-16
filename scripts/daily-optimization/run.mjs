/**
 * 每日自動優化腳本（GitHub Actions / 本地）
 * 香港時區日期；同一天最多啟用一項（備援觸發冪等）。
 *
 *   node scripts/daily-optimization/run.mjs
 *   node scripts/daily-optimization/run.mjs --dry-run
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const END_DATE = "2027-12-31";
const HISTORY_PATH = join(ROOT, "optimization_history.json");
const ENABLED_PATH = join(ROOT, "universal/src/data/enabledExpenseFeatures.json");
const BACKLOG_PATH = join(ROOT, "universal/src/data/expenseDailyBacklog.js");

const dryRun = process.argv.includes("--dry-run");

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

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const today = todayHktYmd();
  console.log(`[daily-opt] today(HKT)=${today} endDate=${END_DATE} dryRun=${dryRun}`);

  if (today > END_DATE) {
    console.log(`[daily-opt] 已超過終止日 ${END_DATE}，跳過。`);
    writeFileSync(join(ROOT, ".daily-opt-skip"), "past_end\n", "utf8");
    process.exit(0);
  }

  const history = readJson(HISTORY_PATH, { entries: [] });
  const doneToday = history.entries.find((e) => e.date === today);
  if (doneToday) {
    console.log(`[daily-opt] 今日(${today})已啟用 ${doneToday.id} — ${doneToday.title}，跳過。`);
    writeFileSync(join(ROOT, ".daily-opt-skip"), "already\n", "utf8");
    process.exit(0);
  }

  const backlog = parseBacklog(readFileSync(BACKLOG_PATH, "utf8"));
  const enabledState = readJson(ENABLED_PATH, { enabled: [], updatedAt: null });
  const used = new Set([
    ...history.entries.map((e) => e.id),
    ...(enabledState.enabled ?? []),
  ]);
  const next = backlog.find((f) => !used.has(f.id));

  if (!next) {
    console.log("[daily-opt] backlog 已全部啟用。");
    writeFileSync(join(ROOT, ".daily-opt-skip"), "exhausted\n", "utf8");
    process.exit(0);
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
      },
    ],
  };

  console.log(`[daily-opt] 啟用功能：${next.id} — ${next.title}`);
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
