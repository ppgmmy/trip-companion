import { useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, hashStr, toDateId, tripDays } from "../data";
import { isFeatureEnabled } from "../data/featureFlags";
import { EXPENSE_OPT_POOL } from "../expenseOptPool";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey } from "../storage";
import { BarChart, DoughnutChart } from "./Charts";
import {
  CategoryRanking,
  DailyOptBanner,
  EmptyStateTip,
  ExpenseInsightCards,
  ExpenseListExtras,
  FilteredCategorySummary,
  PinnedBudgetAlert,
  QuickAddHelpers,
} from "./ExpenseDailyExtras";

export default function ExpenseTab({ trip, expenses, setExpenses, rateState, fxStatus, onRefreshRate, onApplyManualRate, onOpenTool }) {
  const [categoryId, setCategoryId] = useState("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [manualRate, setManualRate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showHkd, setShowHkd] = useState(false);

  const days = tripDays(trip);
  const rate = rateState?.rate || 0;
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const totalHkd = useMemo(() => expenses.reduce((s, e) => s + (Number(e.baseAmount) || 0), 0), [expenses]);
  const avgDaily = totalSpent / days;
  const remaining = trip.budget - totalSpent;

  const todayId = toDateId(new Date());
  const opt = EXPENSE_OPT_POOL[hashStr(`${trip.id}-expopt-${todayId}`) % EXPENSE_OPT_POOL.length];
  const [optLog, setOptLog] = useLocalStorage(tripKey(trip.id, "exp_opt"), {}, {
    migrate: (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {}),
  });
  const optDone = !!optLog[todayId];
  const optDoneCount = Object.values(optLog).filter(Boolean).length;

  const budget = Number(trip.budget) || 0;
  const startMs = new Date(trip.startDate).getTime();
  const elapsedDays = Number.isFinite(startMs)
    ? Math.min(days, Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1))
    : 1;
  const remainingDays = Math.max(1, days - elapsedDays + 1);
  const pace = totalSpent / elapsedDays;
  const projectedTotal = pace * days;
  const budgetPct = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const dailyAllowance = budget > 0 ? Math.max(0, remaining) / remainingDays : 0;
  const burnColor = budgetPct >= 85 ? "text-coral" : budgetPct >= 60 ? "text-[#b45309]" : "text-jade";
  const burnBar = budgetPct >= 85
    ? "bg-gradient-to-r from-[#f59e0b] to-coral"
    : budgetPct >= 60
      ? "bg-gradient-to-r from-jade to-[#f59e0b]"
      : "bg-gradient-to-r from-[#34d399] to-jade";

  const catTotals = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + (Number(e.baseAmount) || 0);
    });
    return EXPENSE_CATEGORIES.map((c) => ({ ...c, value: map[c.id] || 0 }));
  }, [expenses]);

  const weeklyTotals = useMemo(() => {
    const weeks = {};
    expenses.forEach((e) => {
      const w = Math.ceil((new Date(e.date) - new Date(trip.startDate)) / 86400000 / 7) || 1;
      const key = `W${Math.min(Math.max(1, w), 5)}`;
      weeks[key] = (weeks[key] || 0) + (Number(e.baseAmount) || 0);
    });
    return ["W1", "W2", "W3", "W4", "W5"].map((id) => ({ id, label: id, value: weeks[id] || 0 }));
  }, [expenses, trip.startDate]);

  const categoryFilteredExpenses = useMemo(() => {
    let list = expenses.slice().reverse();
    if (isFeatureEnabled("category-filter") && filterCategory !== "all") {
      list = list.filter((e) => e.categoryId === filterCategory);
    }
    return list;
  }, [expenses, filterCategory]);

  const visibleExpenses = useMemo(() => {
    if (!isFeatureEnabled("expense-search") || !search.trim()) return categoryFilteredExpenses;
    const q = search.trim().toLowerCase();
    return categoryFilteredExpenses.filter((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId);
      const noteMatch = (e.note || "").toLowerCase().includes(q);
      const catMatch = (cat?.label || e.categoryId || "").toLowerCase().includes(q);
      const amountMatch = String(e.amount).includes(q) || String(Math.round(e.baseAmount || 0)).includes(q);
      return noteMatch || catMatch || amountMatch;
    });
  }, [categoryFilteredExpenses, search]);

  function addExpense(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const entry = {
      id: `exp-${Date.now()}`,
      categoryId,
      amount: value,
      baseAmount: value * rate,
      storedRate: rate,
      note: note.trim() || EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label || "開支",
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    };
    setExpenses((prev) => [...prev, entry]);
    setAmount("");
    setNote("");
  }

  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function duplicateLast() {
    const last = expenses[expenses.length - 1];
    if (!last) return;
    setCategoryId(last.categoryId);
    setAmount(String(last.amount));
    setNote(last.note || "");
  }

  const statusLabel = {
    idle: "同步中…",
    loading: "更新中…",
    live: "即時匯率",
    cached: "使用快取",
    fallback: "離線預設",
  }[fxStatus] || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">開支儀表板</h2>
          <p className="text-sm text-ink-soft">{trip.targetCurrency} → HKD 以記入當下匯率鎖定</p>
        </div>
        {isFeatureEnabled("remaining-days-chip") && (
          <span className="shrink-0 rounded-full bg-jade-soft px-3 py-1.5 text-xs font-bold text-jade-deep">
            剩 {remainingDays} 日
          </span>
        )}
      </div>

      <DailyOptBanner />

      <PinnedBudgetAlert budgetPct={budgetPct} remaining={remaining} currency={trip.targetCurrency} />

      <div className="rounded-3xl bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-coral">💡 每日行動 · {todayId}</p>
          <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-ink-faint">已累積做到 {optDoneCount} 日</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{opt.text}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOptLog((p) => ({ ...p, [todayId]: !p[todayId] }))}
            aria-pressed={optDone}
            className={`min-h-11 flex-1 rounded-2xl text-sm font-bold transition active:scale-[0.97] ${optDone ? "bg-jade text-white" : "border border-coral/30 bg-white/80 text-ink"}`}
          >
            {optDone ? "✅ 今日已做到" : "☐ 我今日會做"}
          </button>
          {opt.tool && onOpenTool && (
            <button
              type="button"
              onClick={() => onOpenTool(opt.tool)}
              className="min-h-11 shrink-0 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-4 text-sm font-bold text-white shadow-md transition active:scale-95"
            >
              🧰 工具
            </button>
          )}
        </div>
      </div>

      {budget > 0 && (
        <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">💰 預算消耗儀表</p>
            <span className={`text-sm font-black ${burnColor}`}>{budgetPct.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-[#efe9e0]">
            <div className={`h-full rounded-full transition-all duration-700 ${burnBar}`} style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-shell px-2 py-2.5">
              <p className="text-[11px] font-semibold text-ink-faint">照而家速度全程預計</p>
              <p className={`mt-0.5 text-sm font-black ${projectedTotal > budget ? "text-coral" : "text-ink"}`}>
                {formatMoney(projectedTotal, trip.targetCurrency)}
              </p>
            </div>
            <div className="rounded-2xl bg-shell px-2 py-2.5">
              <p className="text-[11px] font-semibold text-ink-faint">剩餘 {remainingDays} 日每日可用</p>
              <p className="mt-0.5 text-sm font-black text-ink">{formatMoney(dailyAllowance, trip.targetCurrency)}</p>
            </div>
          </div>
          <p className={`mt-2.5 text-center text-xs font-semibold ${totalSpent > budget || projectedTotal > budget ? "text-coral" : "text-jade"}`}>
            {totalSpent > budget
              ? `⚠️ 已爆 budget ${formatMoney(totalSpent - budget, trip.targetCurrency)}！`
              : projectedTotal > budget
                ? `⚠️ 照而家速度預計超支 ${formatMoney(projectedTotal - budget, trip.targetCurrency)}，要開始收油`
                : `✅ 進度健康，預計全程慳返 ${formatMoney(budget - projectedTotal, trip.targetCurrency)}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">總支出</p>
          <p className="mt-1 font-display text-xl font-bold">{formatMoney(totalSpent, trip.targetCurrency)}</p>
          <p className="text-sm text-jade-deep">{formatHkd(totalHkd)}（歷史鎖定加總）</p>
        </div>
        <div className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日均（{days} 天）</p>
          <p className="mt-1 font-display text-lg font-bold">{formatMoney(avgDaily, trip.targetCurrency)}</p>
        </div>
        <div className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">剩餘預算</p>
          <p className={`mt-1 font-display text-lg font-bold ${remaining < 0 ? "text-coral" : "text-jade-deep"}`}>
            {formatMoney(remaining, trip.targetCurrency)}
          </p>
        </div>
      </div>

      <ExpenseInsightCards
        trip={trip}
        expenses={expenses}
        days={days}
        totalSpent={totalSpent}
        budget={budget}
        elapsedDays={elapsedDays}
        remainingDays={remainingDays}
      />

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">分類分佈（HKD）</p>
        <DoughnutChart segments={catTotals} formatValue={(v) => formatHkd(v)} />
      </div>

      <CategoryRanking
        catTotals={catTotals}
        expenses={expenses}
        showPct
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
      />

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">每週支出（HKD）</p>
        <BarChart bars={weeklyTotals} formatLabel={(v) => `HK$${Math.round(v)}`} />
      </div>

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">匯率 {trip.targetCurrency} → HKD</p>
            <p className="mt-1 font-display text-lg font-bold">1 {trip.targetCurrency} ≈ {rate.toFixed(4)} HKD</p>
            <p className="mt-1 text-[11px] text-ink-faint">{statusLabel}</p>
          </div>
          <button type="button" onClick={onRefreshRate} disabled={fxStatus === "loading"} className="min-h-11 shrink-0 rounded-2xl bg-jade-soft px-3 text-xs font-bold text-jade-deep transition active:scale-95 disabled:opacity-60">
            立即更新
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={manualRate}
            onChange={(e) => setManualRate(e.target.value)}
            type="number"
            step="0.0001"
            min="0"
            placeholder={`手動輸入 1 ${trip.targetCurrency} = ? HKD`}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <button
            type="button"
            onClick={() => {
              onApplyManualRate(Number(manualRate));
              setManualRate("");
            }}
            className="h-11 shrink-0 rounded-2xl border border-jade/15 bg-white px-4 text-sm font-bold text-ink transition active:scale-95"
          >
            套用
          </button>
        </div>
      </div>

      <form onSubmit={addExpense} className="space-y-3 rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">新增開支</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`min-h-10 rounded-2xl border px-3 text-xs font-bold transition ${categoryId === c.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <QuickAddHelpers
          amount={amount}
          setAmount={setAmount}
          note={note}
          setNote={setNote}
          currency={trip.targetCurrency}
          expenses={expenses}
          rate={rate}
        />
        <div className="grid grid-cols-[1fr_1.2fr] gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`金額（${trip.targetCurrency}）`}
            className="h-12 rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備註（例：Siam 午餐）"
            className="h-12 rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          />
        </div>
        <p className="rounded-2xl bg-jade-soft/70 px-4 py-3 text-sm text-ink-soft">
          換算預覽（將鎖定）：{Number(amount) > 0 ? `${formatMoney(Number(amount), trip.targetCurrency)} ≈ ${formatHkd(Number(amount) * rate)} @ ${rate.toFixed(4)}` : "—"}
        </p>
        <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
          記入（鎖定匯率）
        </button>
      </form>

      <ExpenseListExtras
        trip={trip}
        expenses={expenses}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        search={search}
        setSearch={setSearch}
        searchMatchCount={visibleExpenses.length}
        searchPoolCount={categoryFilteredExpenses.length}
        showHkd={showHkd}
        setShowHkd={setShowHkd}
        onDuplicateLast={duplicateLast}
      />

      <FilteredCategorySummary
        trip={trip}
        expenses={expenses}
        filterCategory={filterCategory}
        totalSpent={totalSpent}
      />

      <ul className="space-y-2">
        {expenses.length === 0 ? (
          isFeatureEnabled("empty-state-tips") ? (
            <EmptyStateTip hasExpenses={false} />
          ) : (
            <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">尚未記帳</li>
          )
        ) : visibleExpenses.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">無符合條件嘅支出</li>
        ) : (
          visibleExpenses.map((entry) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId);
            return (
              <li key={entry.id} className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat?.color || "#64748b" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{entry.note}</p>
                  <p className="text-[11px] text-ink-faint">{entry.date} · {cat?.label || entry.categoryId}</p>
                </div>
                <div className="text-right">
                  {isFeatureEnabled("hkd-list-toggle") && showHkd ? (
                    <>
                      <p className="font-display text-sm font-bold text-jade-deep">{formatHkd(entry.baseAmount)}</p>
                      <p className="text-xs text-ink-soft">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                    </>
                  ) : isFeatureEnabled("hkd-list-toggle") ? (
                    <>
                      <p className="font-display text-sm font-bold text-jade-deep">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                      <p className="text-xs text-ink-soft">{formatHkd(entry.baseAmount)}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-sm font-bold text-jade-deep">{formatHkd(entry.baseAmount)}</p>
                      <p className="text-xs text-ink-soft">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => removeExpense(entry.id)} className="shrink-0 text-ink-faint transition active:scale-90" aria-label="刪除">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
