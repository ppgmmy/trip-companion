import { useEffect, useMemo, useRef, useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, toDateId, tripDays } from "../data";
import { isFeatureEnabled } from "../data/featureFlags";
import { BarChart, DoughnutChart } from "./Charts";
import {
  AnalysisSectionTitle,
  AnalysisStory,
  CategoryRanking,
  DailyOptBanner,
  DuplicateLastPanel,
  EmptyStateTip,
  ExpenseInsightCards,
  ExpenseListExtras,
  ExportCsvPanel,
  FilteredCategorySummary,
  PinnedBudgetAlert,
  QuickAddHelpers,
  SevenDayTrendPanel,
} from "./ExpenseDailyExtras";

const PANELS = [
  { id: "overview", label: "概覽" },
  { id: "analysis", label: "分析" },
  { id: "ledger", label: "記帳" },
];

function formatDayHeading(dateId) {
  if (!dateId) return "未知日期";
  const today = toDateId(new Date());
  const yesterday = toDateId(new Date(Date.now() - 86400000));
  const [, m, d] = dateId.split("-");
  const base = `${Number(m)}/${Number(d)}`;
  if (dateId === today) return `今日 · ${base}`;
  if (dateId === yesterday) return `昨日 · ${base}`;
  return base;
}

export default function ExpenseTab({ trip, expenses, setExpenses, rateState, fxStatus, onRefreshRate, onApplyManualRate }) {
  const [categoryId, setCategoryId] = useState("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateId(new Date()));
  const [manualRate, setManualRate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showHkd, setShowHkd] = useState(false);
  const [panel, setPanel] = useState("ledger");
  const [editingId, setEditingId] = useState(null);
  const [fxOpen, setFxOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState("");
  const tabRefs = useRef({});
  const tabRailRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const el = tabRefs.current[panel];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [panel]);

  useEffect(() => {
    try {
      const legacy = sessionStorage.getItem("expense-panel-v1");
      if (legacy === "insights" || legacy === "charts") {
        setPanel("analysis");
        sessionStorage.setItem("expense-panel-v1", "analysis");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("expense-panel-v1", panel);
    } catch {}
  }, [panel]);

  const days = tripDays(trip);
  const rate = rateState?.rate || 0;
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const totalHkd = useMemo(() => expenses.reduce((s, e) => s + (Number(e.baseAmount) || 0), 0), [expenses]);
  const avgDaily = totalSpent / days;
  const remaining = trip.budget - totalSpent;

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

  const todayId = toDateId(new Date());
  const todaySpent = useMemo(
    () => expenses.filter((e) => e.date === todayId).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [expenses, todayId],
  );
  const todayLeft = budget > 0 ? dailyAllowance - todaySpent : null;

  const catTotals = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + (Number(e.baseAmount) || 0);
    });
    return EXPENSE_CATEGORIES.map((c) => ({ ...c, value: map[c.id] || 0 }));
  }, [expenses]);

  const topCat = useMemo(() => {
    const ranked = [...catTotals].filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
    return ranked[0] || null;
  }, [catTotals]);

  const weeklyTotals = useMemo(() => {
    const weeks = {};
    expenses.forEach((e) => {
      const w = Math.ceil((new Date(e.date) - new Date(trip.startDate)) / 86400000 / 7) || 1;
      const key = `W${Math.min(Math.max(1, w), 5)}`;
      weeks[key] = (weeks[key] || 0) + (Number(e.baseAmount) || 0);
    });
    return ["W1", "W2", "W3", "W4", "W5"].map((id) => ({ id, label: `第${id.slice(1)}週`, value: weeks[id] || 0 }));
  }, [expenses, trip.startDate]);

  const peakWeek = useMemo(() => {
    const ranked = [...weeklyTotals].filter((w) => w.value > 0).sort((a, b) => b.value - a.value);
    return ranked[0] || null;
  }, [weeklyTotals]);

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

  const groupedExpenses = useMemo(() => {
    const groups = [];
    const index = new Map();
    visibleExpenses.forEach((entry) => {
      const key = entry.date || "unknown";
      if (!index.has(key)) {
        index.set(key, { date: key, items: [], sum: 0 });
        groups.push(index.get(key));
      }
      const g = index.get(key);
      g.items.push(entry);
      g.sum += Number(entry.amount) || 0;
    });
    return groups;
  }, [visibleExpenses]);

  function resetForm() {
    setEditingId(null);
    setAmount("");
    setNote("");
    setEntryDate(toDateId(new Date()));
    setCategoryId("food");
  }

  function flash(msg) {
    setSaveFlash(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setSaveFlash(""), 2200);
  }

  function submitExpense(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const date = entryDate || toDateId(new Date());

    if (editingId) {
      setExpenses((prev) =>
        prev.map((item) => {
          if (item.id !== editingId) return item;
          return {
            ...item,
            categoryId,
            amount: value,
            baseAmount: value * rate,
            storedRate: rate,
            note: note.trim() || EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label || "開支",
            date,
            updatedAt: Date.now(),
          };
        }),
      );
      flash("已更新呢筆開支");
      resetForm();
      return;
    }

    const entry = {
      id: `exp-${Date.now()}`,
      categoryId,
      amount: value,
      baseAmount: value * rate,
      storedRate: rate,
      note: note.trim() || EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label || "開支",
      date,
      createdAt: Date.now(),
    };
    setExpenses((prev) => [...prev, entry]);
    flash(date === todayId ? "已記入今日開支" : `已補記 ${formatDayHeading(date)}`);
    setAmount("");
    setNote("");
  }

  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
    flash("已刪除");
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setCategoryId(entry.categoryId);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setEntryDate(entry.date || toDateId(new Date()));
    setPanel("ledger");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function duplicateFrom(entry) {
    if (!entry) return;
    setEditingId(null);
    setCategoryId(entry.categoryId);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setEntryDate(toDateId(new Date()));
    setPanel("ledger");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    flash(`已複製「${entry.note || EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId)?.label || "開支"}」— 改金額後記入`);
  }

  function duplicateLast() {
    duplicateFrom(expenses[expenses.length - 1]);
  }

  function jumpToLedgerCategory(catId) {
    setFilterCategory(catId);
    setPanel("ledger");
  }

  const statusLabel = {
    idle: "同步中…",
    loading: "更新中…",
    live: "即時匯率",
    cached: "使用快取",
    fallback: "離線預設",
  }[fxStatus] || "—";

  const doughnutCenter = topCat
    ? { label: "最多", value: topCat.label }
    : { label: "分類", value: "—" };

  const draftAmount = Number(amount) || 0;
  const afterToday = todayLeft != null && entryDate === todayId ? todayLeft - (editingId ? 0 : draftAmount) : null;

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

      <div className="expense-panel-rail sticky top-0 z-20 -mx-1 bg-mist/90 px-1 py-2 backdrop-blur-md">
        <div
          ref={tabRailRef}
          role="tablist"
          aria-label="開支儀表板分類"
          className="scroll-thin flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5"
        >
          {PANELS.map((item) => {
            const isActive = panel === item.id;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[item.id] = node;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setPanel(item.id)}
                className={`snap-start shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-95 ${
                  isActive
                    ? "bg-jade text-white shadow-[var(--shadow-soft)]"
                    : "border border-jade/15 bg-white/85 text-ink-soft"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {saveFlash && (
        <div className="rounded-2xl bg-jade px-4 py-2.5 text-center text-sm font-bold text-white shadow-[var(--shadow-soft)]">
          ✓ {saveFlash}
        </div>
      )}

      <div key={panel} className="tab-panel space-y-4" role="tabpanel">
        {panel === "overview" && (
          <>
            <DailyOptBanner />
            <PinnedBudgetAlert budgetPct={budgetPct} remaining={remaining} currency={trip.targetCurrency} />

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
                  <div className="rounded-2xl bg-[#f1f5f4] px-2 py-2.5">
                    <p className="text-[11px] font-semibold text-ink-faint">照而家速度全程預計</p>
                    <p className={`mt-0.5 text-sm font-black ${projectedTotal > budget ? "text-coral" : "text-ink"}`}>
                      {formatMoney(projectedTotal, trip.targetCurrency)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f1f5f4] px-2 py-2.5">
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
          </>
        )}

        {panel === "analysis" && (
          <>
            <AnalysisStory
              trip={trip}
              expenses={expenses}
              days={days}
              totalSpent={totalSpent}
              budget={budget}
              elapsedDays={elapsedDays}
              remainingDays={remainingDays}
            />

            <AnalysisSectionTitle
              eyebrow="01 · 而家狀態"
              title="今日同節奏點樣？"
              hint="用白話對比今日、理想日均，同有冇爆煲日。"
            />
            <ExpenseInsightCards
              trip={trip}
              expenses={expenses}
              days={days}
              totalSpent={totalSpent}
              budget={budget}
              elapsedDays={elapsedDays}
              remainingDays={remainingDays}
              showTrend={false}
            />

            <AnalysisSectionTitle
              eyebrow="02 · 錢去咗邊"
              title="最多使喺邊類？"
              hint={topCat ? `而家最多係「${topCat.label}」。撳排行可跳去記帳睇清單。` : "記幾筆之後就會睇到分類佔比。"}
            />
            <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">分類佔比（折合港幣）</p>
              {expenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-faint">未有支出，記一筆就會顯示圓餅</p>
              ) : (
                <DoughnutChart
                  segments={catTotals}
                  formatValue={(v) => formatHkd(v)}
                  centerLabel={doughnutCenter.label}
                  centerValue={doughnutCenter.value}
                />
              )}
            </div>

            <CategoryRanking
              catTotals={catTotals}
              expenses={expenses}
              showPct
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              onJumpToLedger={jumpToLedgerCategory}
            />

            <AnalysisSectionTitle
              eyebrow="03 · 時間走勢"
              title="邊段時間使得多？"
              hint={peakWeek ? `${peakWeek.label} 使得最多（${formatHkd(peakWeek.value)}）。` : "有記帳之後會顯示每週同近 7 日走勢。"}
            />
            <SevenDayTrendPanel trip={trip} expenses={expenses} />
            <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">旅程每週使費（港幣）</p>
              <p className="mb-3 text-[11px] text-ink-faint">由出發日起計第 1–5 週，越高柱＝嗰週使得越多</p>
              <BarChart bars={weeklyTotals} formatLabel={(v) => `HK$${Math.round(v)}`} />
            </div>
          </>
        )}

        {panel === "ledger" && (
          <>
            <div className="rounded-3xl bg-white/85 shadow-[var(--shadow-soft)]">
              <button
                type="button"
                onClick={() => setFxOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={fxOpen}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">匯率 · {statusLabel}</p>
                  <p className="mt-0.5 truncate font-display text-sm font-bold text-ink">
                    1 {trip.targetCurrency} ≈ {rate.toFixed(4)} HKD
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-ink-soft">
                  {fxOpen ? "收起" : "展開"}
                </span>
              </button>
              {fxOpen && (
                <div className="space-y-3 border-t border-jade/10 px-4 pb-4 pt-3">
                  <button
                    type="button"
                    onClick={onRefreshRate}
                    disabled={fxStatus === "loading"}
                    className="min-h-11 w-full rounded-2xl bg-jade-soft px-3 text-xs font-bold text-jade-deep transition active:scale-95 disabled:opacity-60"
                  >
                    立即更新匯率
                  </button>
                  <div className="flex gap-2">
                    <input
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder={`手動 1 ${trip.targetCurrency} = ? HKD`}
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
              )}
            </div>

            <form ref={formRef} onSubmit={submitExpense} className="space-y-3 rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  {editingId ? "編輯開支" : "新增開支"}
                </p>
                {editingId && (
                  <button type="button" onClick={resetForm} className="text-[11px] font-bold text-ink-faint">
                    取消編輯
                  </button>
                )}
              </div>

              {budget > 0 && (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl bg-[#f1f5f4] px-2 py-2">
                    <p className="text-[10px] font-semibold text-ink-faint">今日已使</p>
                    <p className="text-sm font-black text-ink">{formatMoney(todaySpent, trip.targetCurrency)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f1f5f4] px-2 py-2">
                    <p className="text-[10px] font-semibold text-ink-faint">今日建議剩餘</p>
                    <p className={`text-sm font-black ${todayLeft != null && todayLeft < 0 ? "text-coral" : "text-jade-deep"}`}>
                      {todayLeft != null ? formatMoney(todayLeft, trip.targetCurrency) : "—"}
                    </p>
                  </div>
                </div>
              )}

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

              <DuplicateLastPanel
                trip={trip}
                expenses={expenses}
                onDuplicate={duplicateFrom}
                editingId={editingId}
              />

              <QuickAddHelpers
                amount={amount}
                setAmount={setAmount}
                note={note}
                setNote={setNote}
                currency={trip.targetCurrency}
                expenses={expenses}
                rate={rate}
                categoryId={categoryId}
              />

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日期（可補記舊日）</span>
                <input
                  type="date"
                  value={entryDate}
                  min={trip.startDate || undefined}
                  max={trip.endDate || undefined}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
                />
              </label>

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
                換算預覽（將鎖定）：{draftAmount > 0 ? `${formatMoney(draftAmount, trip.targetCurrency)} ≈ ${formatHkd(draftAmount * rate)} @ ${rate.toFixed(4)}` : "—"}
                {afterToday != null && draftAmount > 0 && entryDate === todayId && !editingId && (
                  <span className={`mt-1 block text-xs font-semibold ${afterToday < 0 ? "text-coral" : "text-jade-deep"}`}>
                    記入後今日剩餘約 {formatMoney(afterToday, trip.targetCurrency)}
                  </span>
                )}
              </p>

              <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
                {editingId ? "儲存修改" : "記入（鎖定匯率）"}
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

            <div className="space-y-3">
              {expenses.length === 0 ? (
                isFeatureEnabled("empty-state-tips") ? (
                  <ul><EmptyStateTip hasExpenses={false} /></ul>
                ) : (
                  <div className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">尚未記帳</div>
                )
              ) : visibleExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">無符合條件嘅支出</div>
              ) : (
                groupedExpenses.map((group) => (
                  <section key={group.date} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 px-1">
                      <h3 className="text-xs font-bold text-ink-soft">{formatDayHeading(group.date)}</h3>
                      <p className="text-[11px] font-semibold text-ink-faint">
                        {group.items.length} 筆 · {formatMoney(group.sum, trip.targetCurrency)}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {group.items.map((entry) => {
                        const cat = EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId);
                        const isEditing = editingId === entry.id;
                        return (
                          <li
                            key={entry.id}
                            className={`flex items-center gap-2 rounded-2xl bg-white/85 px-3 py-3 shadow-[var(--shadow-soft)] ${isEditing ? "ring-2 ring-jade/40" : ""}`}
                          >
                            <button
                              type="button"
                              onClick={() => startEdit(entry)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left transition active:scale-[0.99]"
                              aria-label={`編輯 ${entry.note}`}
                            >
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat?.color || "#64748b" }} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink">{entry.note}</p>
                                <p className="text-[11px] text-ink-faint">{cat?.label || entry.categoryId} · 撳我編輯</p>
                              </div>
                              <div className="text-right">
                                {isFeatureEnabled("hkd-list-toggle") && showHkd ? (
                                  <>
                                    <p className="font-display text-sm font-bold text-jade-deep">{formatHkd(entry.baseAmount)}</p>
                                    <p className="text-xs text-ink-soft">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-display text-sm font-bold text-jade-deep">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                                    <p className="text-xs text-ink-soft">{formatHkd(entry.baseAmount)}</p>
                                  </>
                                )}
                              </div>
                            </button>
                            {isFeatureEnabled("duplicate-last") && (
                              <button
                                type="button"
                                onClick={() => duplicateFrom(entry)}
                                className="shrink-0 p-1.5 text-jade-deep transition active:scale-90"
                                aria-label={`複製 ${entry.note}`}
                                title="複製為新開支"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                            <button type="button" onClick={() => removeExpense(entry.id)} className="shrink-0 p-1.5 text-ink-faint transition active:scale-90" aria-label="刪除">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>

            <ExportCsvPanel trip={trip} expenses={expenses} filterCategory={filterCategory} />
          </>
        )}
      </div>
    </div>
  );
}
