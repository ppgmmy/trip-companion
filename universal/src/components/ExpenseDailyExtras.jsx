import { useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, toDateId } from "../data";
import { getFeatureMeta, getLastEnabledFeature, isFeatureEnabled } from "../data/featureFlags";

function shiftDateId(dateId, deltaDays) {
  const d = new Date(`${dateId}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toDateId(d);
}

function sumByDate(expenses, dateId, field = "amount") {
  return expenses
    .filter((e) => e.date === dateId)
    .reduce((s, e) => s + (Number(e[field]) || 0), 0);
}

function loggingStreak(expenses) {
  if (!expenses.length) return 0;
  const dates = new Set(expenses.map((e) => e.date).filter(Boolean));
  let streak = 0;
  let cursor = toDateId(new Date());
  // If today has no entry, start from yesterday (still count ongoing streak)
  if (!dates.has(cursor)) cursor = shiftDateId(cursor, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDateId(cursor, -1);
  }
  return streak;
}

function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() - day - offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateId(monday), end: toDateId(sunday) };
}

function inRange(dateId, start, end) {
  return dateId >= start && dateId <= end;
}

function Sparkline({ values, currency, formatValue }) {
  const max = Math.max(...values, 1);
  const w = 280;
  const h = 56;
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" aria-hidden>
        <polyline fill="none" stroke="#0d9488" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pts.join(" ")} />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>6日前</span>
        <span>今日 · 最高 {formatValue(max)}</span>
      </div>
    </div>
  );
}

export function DailyOptBanner() {
  const enabled = isFeatureEnabled("daily-opt-banner");
  const last = getLastEnabledFeature();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!last.id || !last.updatedAt) return;
    const key = `expense-opt-dismissed:${last.id}:${last.updatedAt}`;
    setDismissed(localStorage.getItem(key) === "1");
  }, [last.id, last.updatedAt]);

  if (!enabled || !last.id || !last.title || dismissed) return null;
  const meta = getFeatureMeta(last.id);

  return (
    <div className="rounded-3xl border border-amber-300/50 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">✨ 今日自動優化</p>
          <p className="mt-1 text-sm font-bold text-ink">{last.title}</p>
          {meta?.description && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{meta.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            if (last.id && last.updatedAt) {
              localStorage.setItem(`expense-opt-dismissed:${last.id}:${last.updatedAt}`, "1");
            }
            setDismissed(true);
          }}
          className="shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-ink-faint"
          aria-label="關閉"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ExpenseInsightCards({ trip, expenses, days, totalSpent, budget, remainingDays }) {
  const todayId = toDateId(new Date());
  const yesterdayId = shiftDateId(todayId, -1);
  const todaySum = sumByDate(expenses, todayId);
  const yesterdaySum = sumByDate(expenses, yesterdayId);
  const delta = todaySum - yesterdaySum;

  const streak = loggingStreak(expenses);
  const biggest = useMemo(
    () => expenses.reduce((best, e) => (!best || Number(e.amount) > Number(best.amount) ? e : best), null),
    [expenses],
  );

  const sparkValues = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => sumByDate(expenses, shiftDateId(todayId, i - 6)));
  }, [expenses, todayId]);

  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(1);
  const thisWeekSum = expenses.filter((e) => inRange(e.date, thisWeek.start, thisWeek.end)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const lastWeekSum = expenses.filter((e) => inRange(e.date, lastWeek.start, lastWeek.end)).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const idealDaily = budget > 0 ? budget / Math.max(1, days) : 0;
  const actualDaily = totalSpent / Math.max(1, days);

  const topDay = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.date] = (map[e.date] || 0) + (Number(e.amount) || 0);
    });
    const entries = Object.entries(map);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { date: entries[0][0], amount: entries[0][1] };
  }, [expenses]);

  const cards = [];

  if (isFeatureEnabled("today-vs-yesterday")) {
    cards.push(
      <div key="ty" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">今日 vs 昨日</p>
        <p className="mt-1 font-display text-lg font-bold">{formatMoney(todaySum, trip.targetCurrency)}</p>
        <p className={`text-xs font-semibold ${delta > 0 ? "text-coral" : delta < 0 ? "text-jade" : "text-ink-faint"}`}>
          {delta === 0 ? "同昨日持平" : delta > 0 ? `比昨日多 ${formatMoney(delta, trip.targetCurrency)}` : `比昨日少 ${formatMoney(-delta, trip.targetCurrency)}`}
        </p>
      </div>,
    );
  }

  if (isFeatureEnabled("logging-streak")) {
    cards.push(
      <div key="streak" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">記帳連續日數</p>
        <p className="mt-1 font-display text-lg font-bold">{streak} 日</p>
        <p className="text-xs text-ink-faint">{streak > 0 ? "繼續保持！" : "今日記一筆就開始"}</p>
      </div>,
    );
  }

  if (isFeatureEnabled("biggest-expense") && biggest) {
    cards.push(
      <div key="big" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">單筆最高</p>
        <p className="mt-1 truncate font-display text-lg font-bold">{formatMoney(biggest.amount, trip.targetCurrency)}</p>
        <p className="truncate text-xs text-ink-faint">{biggest.note} · {biggest.date}</p>
      </div>,
    );
  }

  if (isFeatureEnabled("week-over-week")) {
    const wod = thisWeekSum - lastWeekSum;
    cards.push(
      <div key="wow" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">本週 vs 上週</p>
        <p className="mt-1 font-display text-lg font-bold">{formatMoney(thisWeekSum, trip.targetCurrency)}</p>
        <p className={`text-xs font-semibold ${wod > 0 ? "text-coral" : wod < 0 ? "text-jade" : "text-ink-faint"}`}>
          {wod === 0 ? "同上週持平" : wod > 0 ? `多 ${formatMoney(wod, trip.targetCurrency)}` : `少 ${formatMoney(-wod, trip.targetCurrency)}`}
        </p>
      </div>,
    );
  }

  if (isFeatureEnabled("pace-vs-ideal") && budget > 0) {
    cards.push(
      <div key="pace" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">實際日均 vs 理想</p>
        <p className="mt-1 font-display text-lg font-bold">{formatMoney(actualDaily, trip.targetCurrency)}</p>
        <p className={`text-xs font-semibold ${actualDaily > idealDaily ? "text-coral" : "text-jade"}`}>
          理想 {formatMoney(idealDaily, trip.targetCurrency)}／日 · 剩 {remainingDays} 日
        </p>
      </div>,
    );
  }

  if (isFeatureEnabled("top-spender-day") && topDay) {
    cards.push(
      <div key="topday" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">爆煲日</p>
        <p className="mt-1 font-display text-lg font-bold">{topDay.date}</p>
        <p className="text-xs text-coral">當日使咗 {formatMoney(topDay.amount, trip.targetCurrency)}</p>
      </div>,
    );
  }

  return (
    <>
      {cards.length > 0 && <div className="grid grid-cols-2 gap-2">{cards}</div>}

      {isFeatureEnabled("seven-day-sparkline") && (
        <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">近 7 日趨勢</p>
          <Sparkline values={sparkValues} currency={trip.targetCurrency} formatValue={(v) => formatMoney(v, trip.targetCurrency)} />
        </div>
      )}
    </>
  );
}

export function CategoryRanking({ trip, catTotals, showPct }) {
  if (!isFeatureEnabled("category-ranking")) return null;
  const ranked = [...catTotals].filter((c) => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  if (!ranked.length) return null;
  const total = ranked.reduce((s, c) => s + c.value, 0) || 1;
  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">分類排行榜（HKD）</p>
      <ul className="space-y-2">
        {ranked.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="w-5 text-xs font-bold text-ink-faint">{i + 1}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.label}</span>
            <span className="text-sm font-bold text-jade-deep">{formatHkd(c.value)}</span>
            {showPct && isFeatureEnabled("category-pct-labels") && (
              <span className="w-10 text-right text-[11px] text-ink-faint">{Math.round((c.value / total) * 100)}%</span>
            )}
          </li>
        ))}
      </ul>
      {isFeatureEnabled("avg-per-category") && (
        <p className="mt-3 text-[11px] text-ink-faint">提示：排行以本旅程累計計算，日均可按旅程日數自行估算。</p>
      )}
    </div>
  );
}

export function PinnedBudgetAlert({ budgetPct, remaining, currency }) {
  if (!isFeatureEnabled("pinned-budget-alert") || budgetPct < 80) return null;
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-md ${budgetPct >= 100 ? "bg-coral" : "bg-[#b45309]"}`}>
      {budgetPct >= 100
        ? `⚠️ 已超預算！剩餘 ${formatMoney(remaining, currency)}`
        : `⚠️ 已用 ${budgetPct.toFixed(0)}% 預算，剩餘 ${formatMoney(remaining, currency)} — 開始收油`}
    </div>
  );
}

export function ExpenseListExtras({
  trip,
  expenses,
  filterCategory,
  setFilterCategory,
  search,
  setSearch,
  showHkd,
  setShowHkd,
  onDuplicateLast,
}) {
  const showFilter = isFeatureEnabled("category-filter");
  const showSearch = isFeatureEnabled("expense-search");
  const showToggle = isFeatureEnabled("hkd-list-toggle");
  const showDup = isFeatureEnabled("duplicate-last");
  const showExport = isFeatureEnabled("export-csv");

  if (!showFilter && !showSearch && !showToggle && !showDup && !showExport) return null;

  function exportCsv() {
    const rows = [["date", "category", "note", "amount", "currency", "hkd", "rate"]];
    expenses.forEach((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId);
      rows.push([
        e.date,
        cat?.label || e.categoryId,
        `"${(e.note || "").replace(/"/g, '""')}"`,
        e.amount,
        trip.targetCurrency,
        e.baseAmount,
        e.storedRate,
      ]);
    });
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.city || "trip"}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showExport && (
          <button type="button" onClick={exportCsv} className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink">
            ⬇ 匯出 CSV
          </button>
        )}
        {showDup && expenses.length > 0 && (
          <button type="button" onClick={onDuplicateLast} className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink">
            ⎘ 複製上一筆
          </button>
        )}
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowHkd((v) => !v)}
            className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink"
          >
            顯示：{showHkd ? "港幣" : trip.targetCurrency}
          </button>
        )}
      </div>
      {showSearch && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋備註…"
          className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />
      )}
      {showFilter && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${filterCategory === "all" ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
          >
            全部
          </button>
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCategory(c.id)}
              className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${filterCategory === c.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuickAddHelpers({ amount, setAmount, note, setNote, currency }) {
  const chips = isFeatureEnabled("quick-amount-chips");
  const templates = isFeatureEnabled("note-templates");
  if (!chips && !templates) return null;

  const amounts = currency === "JPY" ? [500, 1000, 2000, 5000] : currency === "THB" ? [50, 100, 200, 500] : currency === "TWD" ? [100, 200, 500, 1000] : [10, 20, 50, 100];
  const notes = ["午餐", "晚餐", "咖啡", "交通", "超市", "手信"];

  return (
    <div className="space-y-2">
      {chips && (
        <div className="flex flex-wrap gap-1.5">
          {amounts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
              className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${String(amount) === String(n) ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      {templates && (
        <div className="flex flex-wrap gap-1.5">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${note === n ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyStateTip({ hasExpenses }) {
  if (hasExpenses || !isFeatureEnabled("empty-state-tips")) return null;
  return (
    <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-6 text-center text-sm text-ink-soft">
      尚未記帳 — 試吓用上方快速記帳，或撳右下角 ＋ 即場記一筆。
    </li>
  );
}
