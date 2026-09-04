import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PAYER_ID, DEFAULT_PAYMENT_METHOD, EXPENSE_CATEGORIES, RATE_TTL_MS, aggregateByPayer, aggregateByPaymentMethod, expenseEntryTags, formatHkd, formatMoney, lastExpensePrefs, lastPaymentDefaults, normalizeExpensePayer, normalizePaymentMethod, payerLabel, paymentMethodLabel, recentCustomPayers, resolvePayerFields, resolvePayerForSave, saveExpensePrefs, savePayerPrefs, toDateId, tripDays } from "../data";
import { isFeatureEnabled } from "../data/featureFlags";
import { amountExpressionPreview, frequentAmounts, parseAmountExpression, suggestCategoryByHour } from "../utils/expenseInput";
import { BarChart, DoughnutChart } from "./Charts";
import CollapsibleSection from "./CollapsibleSection";
import PwaQuickAddHint from "./PwaQuickAddHint";
import PayerSpendStats from "./PayerSpendStats";
import SwipeableExpenseItem from "./SwipeableExpenseItem";
import UndoToast from "./UndoToast";
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
  FxRateImpactPanel,
  LedgerSummaryBar,
  PinnedBudgetAlert,
  PayerPaymentBreakdown,
  QuickAddHelpers,
  SevenDayTrendPanel,
  TodayBudgetGauge,
  BudgetRunwayPanel,
  SpendingTimelineAlignPanel,
} from "./ExpenseDailyExtras";
import PayerPaymentFields from "./PayerPaymentFields";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

function formatRateWhen(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const PANELS = [
  { id: "ledger", label: "記帳" },
  { id: "analysis", label: "分析" },
  { id: "overview", label: "概覽" },
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

function migrateExpenseUi(v) {
  const base = v && typeof v === "object" ? v : {};
  return {
    // 上碟：每次開 App 落「記帳」面板
    panel: "ledger",
    listTodayOnly: base.listTodayOnly !== false,
    showHkd: Boolean(base.showHkd),
    filterCategory: base.filterCategory || "all",
    filterPayer: base.filterPayer || "all",
    filterPaymentMethod: base.filterPaymentMethod || "all",
    search: typeof base.search === "string" ? base.search : "",
  };
}

export default function ExpenseTab({
  trip,
  expenses,
  setExpenses,
  rateState,
  fxStatus,
  onRefreshRate,
  initialPanel = null,
  onInitialPanelApplied,
}) {
  const [categoryId, setCategoryId] = useState(() => lastExpensePrefs().categoryId || suggestCategoryByHour());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateId(new Date()));
  const [expenseUi, setExpenseUi] = useLocalStorage(REGISTRY_KEYS.expenseUi, migrateExpenseUi(null), {
    migrate: migrateExpenseUi,
  });
  const [panel, setPanel] = useState(expenseUi.panel || "ledger");
  const [filterCategory, setFilterCategory] = useState(expenseUi.filterCategory || "all");
  const [filterPayer, setFilterPayer] = useState(expenseUi.filterPayer || "all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(expenseUi.filterPaymentMethod || "all");
  const [search, setSearch] = useState(expenseUi.search || "");
  const [showHkd, setShowHkd] = useState(Boolean(expenseUi.showHkd));
  const [editingId, setEditingId] = useState(null);
  const [payer, setPayer] = useState(() => lastPaymentDefaults(expenses).payer);
  const [customPayer, setCustomPayer] = useState(() => lastPaymentDefaults(expenses).customPayer);
  const [paymentMethod, setPaymentMethod] = useState(() => lastPaymentDefaults(expenses).paymentMethod);
  const [toast, setToast] = useState(null);
  const [listTodayOnly, setListTodayOnly] = useState(expenseUi.listTodayOnly !== false);
  const undoRef = useRef(null);
  const tabRefs = useRef({});
  const tabRailRef = useRef(null);
  const formRef = useRef(null);
  const amountRef = useRef(null);

  useEffect(() => {
    setExpenseUi((prev) => ({
      ...prev,
      panel,
      listTodayOnly,
      showHkd,
      filterCategory,
      filterPayer,
      filterPaymentMethod,
      search,
    }));
  }, [panel, listTodayOnly, showHkd, filterCategory, filterPayer, filterPaymentMethod, search, setExpenseUi]);

  useEffect(() => {
    if (!initialPanel || !PANELS.some((p) => p.id === initialPanel)) return;
    setPanel(initialPanel);
    onInitialPanelApplied?.();
  }, [initialPanel, onInitialPanelApplied]);

  useEffect(() => {
    const el = tabRefs.current[panel];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [panel]);

  const suggestedAmounts = useMemo(() => frequentAmounts(expenses), [expenses]);
  const hasActiveListFilter = filterCategory !== "all" || filterPayer !== "all" || filterPaymentMethod !== "all" || Boolean(search.trim());

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

  const recentPayers = useMemo(() => recentCustomPayers(expenses), [expenses]);
  const payerTotals = useMemo(() => aggregateByPayer(expenses), [expenses]);
  const paymentTotals = useMemo(() => aggregateByPaymentMethod(expenses), [expenses]);

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
    if (filterPayer !== "all") {
      list = list.filter((e) => {
        const normalized = normalizeExpensePayer(e);
        const key = normalized.payer || DEFAULT_PAYER_ID;
        return key === filterPayer;
      });
    }
    if (filterPaymentMethod !== "all") {
      list = list.filter((e) => normalizePaymentMethod(e.paymentMethod) === filterPaymentMethod);
    }
    return list;
  }, [expenses, filterCategory, filterPayer, filterPaymentMethod]);

  const visibleExpenses = useMemo(() => {
    if (!isFeatureEnabled("expense-search") || !search.trim()) return categoryFilteredExpenses;
    const q = search.trim().toLowerCase();
    return categoryFilteredExpenses.filter((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId);
      const noteMatch = (e.note || "").toLowerCase().includes(q);
      const catMatch = (cat?.label || e.categoryId || "").toLowerCase().includes(q);
      const amountMatch = String(e.amount).includes(q) || String(Math.round(e.baseAmount || 0)).includes(q);
      const payerMatch = payerLabel(e.payer).toLowerCase().includes(q) || (e.payer || "").toLowerCase().includes(q);
      const paymentMatch = paymentMethodLabel(e.paymentMethod).toLowerCase().includes(q);
      return noteMatch || catMatch || amountMatch || payerMatch || paymentMatch;
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

  const displayGroups = useMemo(() => {
    if (!listTodayOnly || hasActiveListFilter) return groupedExpenses;
    return groupedExpenses.filter((group) => group.date === todayId);
  }, [groupedExpenses, hasActiveListFilter, listTodayOnly, todayId]);

  const hiddenOlderCount = useMemo(() => {
    if (!listTodayOnly || hasActiveListFilter) return 0;
    return groupedExpenses.filter((group) => group.date !== todayId).reduce((sum, group) => sum + group.items.length, 0);
  }, [groupedExpenses, hasActiveListFilter, listTodayOnly, todayId]);

  function resetForm() {
    const defaults = lastPaymentDefaults(expenses);
    setEditingId(null);
    setAmount("");
    setNote("");
    setEntryDate(toDateId(new Date()));
    setCategoryId(suggestCategoryByHour());
    setPayer(defaults.payer);
    setCustomPayer(defaults.customPayer);
    setPaymentMethod(defaults.paymentMethod);
  }

  function showToast(message, undoSnapshot = null) {
    undoRef.current = undoSnapshot;
    setToast({ message, undo: Boolean(undoSnapshot) });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast(null);
      undoRef.current = null;
    }, 2800);
  }

  function undoLastAction() {
    if (!undoRef.current) return;
    setExpenses(undoRef.current);
    undoRef.current = null;
    setToast(null);
  }

  function submitExpense(e) {
    e.preventDefault();
    const value = parseAmountExpression(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const date = entryDate || toDateId(new Date());
    const resolvedPayer = resolvePayerForSave(payer, customPayer);
    const before = expenses;

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
            payer: resolvedPayer,
            paymentMethod: normalizePaymentMethod(paymentMethod),
            updatedAt: Date.now(),
          };
        }),
      );
      showToast("已更新呢筆開支");
      resetForm();
      amountRef.current?.blur();
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
      payer: resolvedPayer,
      paymentMethod: normalizePaymentMethod(paymentMethod),
      createdAt: Date.now(),
    };
    savePayerPrefs({ payer: resolvedPayer, customPayer: customPayer.trim(), paymentMethod });
    saveExpensePrefs({ categoryId });
    setExpenses((prev) => [...prev, entry]);
    showToast(date === todayId ? "已記入今日開支" : `已補記 ${formatDayHeading(date)}`, before);
    setAmount("");
    setNote("");
    // 唔自動彈數字鍵盤，避免遮住剛記入嘅內容
    amountRef.current?.blur();
  }

  function removeExpense(id) {
    const before = expenses;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
    showToast("已刪除", before);
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setCategoryId(entry.categoryId);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setEntryDate(entry.date || toDateId(new Date()));
    const payerFields = resolvePayerFields(entry);
    setPayer(payerFields.payer);
    setCustomPayer(payerFields.customPayer);
    setPaymentMethod(normalizePaymentMethod(entry.paymentMethod));
    setPanel("ledger");
    window.requestAnimationFrame(() => amountRef.current?.focus({ preventScroll: true }));
  }

  function duplicateFrom(entry) {
    if (!entry) return;
    setEditingId(null);
    setCategoryId(entry.categoryId);
    setAmount(String(entry.amount));
    setNote(entry.note || "");
    setEntryDate(toDateId(new Date()));
    const payerFields = resolvePayerFields(entry);
    setPayer(payerFields.payer);
    setCustomPayer(payerFields.customPayer);
    setPaymentMethod(normalizePaymentMethod(entry.paymentMethod));
    setPanel("ledger");
    window.requestAnimationFrame(() => amountRef.current?.focus({ preventScroll: true }));
    showToast(`已複製「${entry.note || EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId)?.label || "開支"}」— 改金額後記入`);
  }

  function handleAmountKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function jumpToLedgerCategory(catId) {
    setFilterCategory(catId);
    setPanel("ledger");
  }

  function jumpToLedgerPayer(payerKey) {
    setFilterPayer(payerKey);
    setFilterPaymentMethod("all");
    if (payerKey !== "all") setListTodayOnly(false);
    setPanel("ledger");
  }

  function jumpToLedgerPayment(methodKey) {
    setFilterPaymentMethod(methodKey);
    setFilterPayer("all");
    setPanel("ledger");
  }

  const statusLabel = {
    idle: "同步中…",
    loading: "更新中…",
    live: "即時匯率",
    cached: "使用快取",
    fallback: "離線預設",
  }[fxStatus] || "—";

  const rateUpdatedAt = rateState?.lastUpdated;
  const rateMeta = rateUpdatedAt
    ? `線上更新 ${formatRateWhen(rateUpdatedAt)} · 下次約 ${formatRateWhen(rateUpdatedAt + RATE_TTL_MS)} · 每 12 小時自動更新`
    : "每 12 小時自動更新";

  const doughnutCenter = topCat
    ? { label: "最多", value: topCat.label }
    : { label: "分類", value: "—" };

  const draftAmount = amountExpressionPreview(amount) ?? (Number(amount) || 0);
  const afterToday = todayLeft != null && entryDate === todayId ? todayLeft - (editingId ? 0 : draftAmount) : null;

  return (
    <div className="w-full min-w-0 space-y-2.5 overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-tight text-ink">開支儀表板</h2>
          <p className="text-[11px] leading-tight text-ink-soft">{trip.targetCurrency} → HKD · 記入當下匯率</p>
        </div>
        {isFeatureEnabled("remaining-days-chip") && (
          <span className="shrink-0 rounded-full bg-jade-soft px-2 py-1 text-[10px] font-bold text-jade-deep">
            剩 {remainingDays} 日
          </span>
        )}
      </div>

      <div className="expense-panel-rail sticky top-0 z-20 -mx-0.5 bg-mist/90 px-0.5 py-1 backdrop-blur-md">
        <div
          ref={tabRailRef}
          role="tablist"
          aria-label="開支儀表板分類"
          className="scroll-thin flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-0.5"
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
                className={`snap-start shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
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

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-lg px-3">
          <div className="pointer-events-auto">
            <UndoToast message={toast.message} onUndo={toast.undo ? undoLastAction : null} />
          </div>
        </div>
      )}

      <div key={panel} className="tab-panel space-y-3" role="tabpanel">
        {panel === "overview" && (
          <>
            <DailyOptBanner />
            <PinnedBudgetAlert
              budgetPct={budgetPct}
              remaining={remaining}
              budget={budget}
              totalSpent={totalSpent}
              remainingDays={remainingDays}
              dailyAllowance={dailyAllowance}
              currency={trip.targetCurrency}
            />

            <TodayBudgetGauge
              trip={trip}
              expenses={expenses}
              todaySpent={todaySpent}
              dailyAllowance={dailyAllowance}
              budget={budget}
            />

            <BudgetRunwayPanel
              trip={trip}
              totalSpent={totalSpent}
              budget={budget}
              remaining={remaining}
              pace={pace}
              remainingDays={remainingDays}
              elapsedDays={elapsedDays}
            />

            <SpendingTimelineAlignPanel
              trip={trip}
              totalSpent={totalSpent}
              budget={budget}
              days={days}
              elapsedDays={elapsedDays}
            />

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

            <FxRateImpactPanel trip={trip} expenses={expenses} currentRate={rate} />
          </>
        )}

        {panel === "analysis" && (
          <div className="space-y-3">
            <AnalysisStory
              trip={trip}
              expenses={expenses}
              days={days}
              totalSpent={totalSpent}
              budget={budget}
              elapsedDays={elapsedDays}
              remainingDays={remainingDays}
            />

            <CollapsibleSection
              title="01 · 而家狀態"
              summary={todaySpent > 0 ? `今日已使 ${formatMoney(todaySpent, trip.targetCurrency)}` : "今日尚未記帳"}
              defaultOpen={false}
            >
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
            </CollapsibleSection>

            <CollapsibleSection
              title="02 · 錢去咗邊"
              summary={topCat ? `最多：${topCat.label}` : "記幾筆後顯示分類佔比"}
              defaultOpen={false}
            >
              <AnalysisSectionTitle
                eyebrow="02 · 錢去咗邊"
                title="最多使喺邊類？"
                hint={topCat ? `而家最多係「${topCat.label}」。撳排行可跳去記帳睇清單。` : "記幾筆之後就會睇到分類佔比。"}
              />
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
              <div className="mt-4">
                <CategoryRanking
                  catTotals={catTotals}
                  expenses={expenses}
                  showPct
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  onJumpToLedger={jumpToLedgerCategory}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="02b · 邊個用咗幾多"
              summary={payerTotals[0] ? `${payerTotals[0].label} 用最多` : "記幾筆後顯示統計"}
              defaultOpen={false}
            >
              <PayerPaymentBreakdown
                trip={trip}
                expenses={expenses}
                payerTotals={payerTotals}
                paymentTotals={paymentTotals}
                totalHkd={totalHkd}
                onJumpToPayer={jumpToLedgerPayer}
                onJumpToPayment={jumpToLedgerPayment}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="03 · 時間走勢"
              summary={peakWeek ? `${peakWeek.label} 使得最多` : "記帳後顯示趨勢"}
              defaultOpen={false}
            >
              <AnalysisSectionTitle
                eyebrow="03 · 時間走勢"
                title="邊段時間使得多？"
                hint={peakWeek ? `${peakWeek.label} 使得最多（${formatHkd(peakWeek.value)}）。` : "有記帳之後會顯示每週同近 7 日走勢。"}
              />
              <SevenDayTrendPanel trip={trip} expenses={expenses} />
              <div className="mt-4">
                <p className="expense-stat-label">旅程每週使費（港幣）</p>
                <BarChart bars={weeklyTotals} formatLabel={(v) => `HK$${Math.round(v)}`} />
              </div>
            </CollapsibleSection>
          </div>
        )}

        {panel === "ledger" && (
          <div className="space-y-2">
            <PwaQuickAddHint />
            <LedgerSummaryBar
              trip={trip}
              expenses={expenses}
              visibleCount={visibleExpenses.length}
              todaySpent={todaySpent}
              totalSpent={totalSpent}
              totalHkd={totalHkd}
              rate={rate}
              fxLabel={statusLabel}
              fxMeta={rateMeta}
              onRefreshRate={onRefreshRate}
              fxStatus={fxStatus}
              remaining={remaining}
              remainingDays={remainingDays}
              dailyAllowance={dailyAllowance}
              todayLeft={todayLeft}
            />

            <PayerSpendStats trip={trip} payerTotals={payerTotals} onJumpToPayer={jumpToLedgerPayer} />

            <form ref={formRef} onSubmit={submitExpense} className="expense-section-card-compact space-y-1.5">
              {editingId && (
                <div className="flex justify-end">
                  <button type="button" onClick={resetForm} className="text-[11px] font-bold text-ink-faint">
                    取消編輯
                  </button>
                </div>
              )}

              <PayerPaymentFields
                payer={payer}
                setPayer={setPayer}
                customPayer={customPayer}
                setCustomPayer={setCustomPayer}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                recentPayers={recentPayers}
                defaultOpen={Boolean(editingId)}
              />

              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleAmountKeyDown}
                placeholder={`金額（${trip.targetCurrency}）`}
                className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-center font-display text-lg font-bold outline-none ring-jade focus:ring-2"
              />

              {suggestedAmounts.length > 0 && !amount && (
                <div className="expense-chip-row">
                  {suggestedAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(String(value))}
                      className="shrink-0 rounded-xl border border-jade/15 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-soft"
                    >
                      {formatMoney(value, trip.targetCurrency)}
                    </button>
                  ))}
                </div>
              )}

              {draftAmount > 0 && (
                <p className="text-center text-[11px] font-semibold text-ink-soft">
                  {amountExpressionPreview(amount) != null && amount.trim() !== String(draftAmount) && (
                    <span>= {formatMoney(draftAmount, trip.targetCurrency)} · </span>
                  )}
                  ≈ {formatHkd(draftAmount * rate)}
                  {afterToday != null && entryDate === todayId && !editingId && (
                    <span className={afterToday < 0 ? " text-coral" : " text-jade-deep"}>
                      {" "}· 記入後今日剩 {formatMoney(afterToday, trip.targetCurrency)}
                    </span>
                  )}
                </p>
              )}

              <div className="grid grid-cols-[1fr_auto] gap-1.5">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="備註"
                  className="h-9 rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
                />
                <input
                  type="date"
                  value={entryDate}
                  min={trip.startDate || undefined}
                  max={trip.endDate || undefined}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="h-9 w-[8.5rem] rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
                />
              </div>

              <div className="expense-chip-row">
                {EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${categoryId === c.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <QuickAddHelpers note={note} setNote={setNote} expenses={expenses} categoryId={categoryId} />

              <DuplicateLastPanel
                trip={trip}
                expenses={expenses}
                onDuplicate={duplicateFrom}
                editingId={editingId}
              />

              <div className="flex gap-1.5">
                <button type="submit" className="min-h-10 flex-1 rounded-xl bg-jade text-sm font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
                  {editingId ? "儲存" : "記入"}
                </button>
              </div>
            </form>

            <ExpenseListExtras
              trip={trip}
              expenses={expenses}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              filterPayer={filterPayer}
              setFilterPayer={setFilterPayer}
              filterPaymentMethod={filterPaymentMethod}
              setFilterPaymentMethod={setFilterPaymentMethod}
              payerTotals={payerTotals}
              paymentTotals={paymentTotals}
              search={search}
              setSearch={setSearch}
              searchMatchCount={visibleExpenses.length}
              searchPoolCount={categoryFilteredExpenses.length}
              showHkd={showHkd}
              setShowHkd={setShowHkd}
            />

            <FilteredCategorySummary
              trip={trip}
              expenses={expenses}
              filterCategory={filterCategory}
              totalSpent={totalSpent}
            />

            {!hasActiveListFilter && hiddenOlderCount > 0 && (
              <button
                type="button"
                onClick={() => setListTodayOnly((v) => !v)}
                className="w-full rounded-xl border border-jade/15 bg-white px-3 py-2 text-xs font-bold text-jade-deep"
              >
                {listTodayOnly ? `顯示全部（另有 ${hiddenOlderCount} 筆舊記錄）` : "只顯示今日"}
              </button>
            )}

              {expenses.length === 0 ? (
                isFeatureEnabled("empty-state-tips") ? (
                  <ul><EmptyStateTip hasExpenses={false} /></ul>
                ) : (
                  <div className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">尚未記帳</div>
                )
              ) : visibleExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">無符合條件嘅支出</div>
              ) : displayGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">今日尚未記帳</div>
              ) : (
                displayGroups.map((group) => (
                  <section key={group.date} className="space-y-2.5">
                    <div className="expense-day-header py-1.5">
                      <h3 className="text-xs font-bold text-ink">{formatDayHeading(group.date)}</h3>
                      <div className="text-right">
                        <p className="font-display text-sm font-black text-jade-deep">{formatMoney(group.sum, trip.targetCurrency)}</p>
                        <p className="text-[10px] font-semibold text-ink-faint">{group.items.length} 筆</p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {group.items.map((entry) => {
                        const cat = EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId);
                        const isEditing = editingId === entry.id;
                        const tags = expenseEntryTags(entry);
                        return (
                          <li key={entry.id} className="list-none">
                          <SwipeableExpenseItem
                            className={isEditing ? "ring-2 ring-jade/40" : ""}
                            onDelete={() => removeExpense(entry.id)}
                            onDuplicate={() => duplicateFrom(entry)}
                          >
                          <div className="rounded-xl px-3 py-2.5 shadow-[var(--shadow-soft)]">
                            <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(entry)}
                              className="flex min-w-0 flex-1 items-start gap-3 text-left transition active:scale-[0.99]"
                              aria-label={`編輯 ${entry.note}`}
                            >
                              <span
                                className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                                style={{ background: cat?.color || "#64748b" }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-snug text-ink">{entry.note}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span className="expense-meta-pill">{cat?.label || entry.categoryId}</span>
                                  {tags.map((tag) => (
                                    <span key={`${entry.id}-${tag.kind}`} className="expense-meta-pill">
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                {isFeatureEnabled("hkd-list-toggle") && showHkd ? (
                                  <>
                                    <p className="font-display text-base font-black text-jade-deep">{formatHkd(entry.baseAmount)}</p>
                                    <p className="text-xs font-semibold text-ink-soft">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-display text-base font-black text-jade-deep">{formatMoney(entry.amount, trip.targetCurrency)}</p>
                                    <p className="text-xs font-semibold text-ink-soft">{formatHkd(entry.baseAmount)}</p>
                                  </>
                                )}
                              </div>
                            </button>
                            {isFeatureEnabled("duplicate-last") && (
                              <button
                                type="button"
                                onClick={() => duplicateFrom(entry)}
                                className="shrink-0 rounded-xl p-2 text-jade-deep transition active:scale-90"
                                aria-label={`複製 ${entry.note}`}
                                title="複製為新開支"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                            <button type="button" onClick={() => removeExpense(entry.id)} className="shrink-0 rounded-xl p-2 text-ink-faint transition active:scale-90" aria-label="刪除">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            </div>
                          </div>
                          </SwipeableExpenseItem>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}

            <ExportCsvPanel trip={trip} expenses={expenses} filterCategory={filterCategory} />
          </div>
        )}
      </div>
    </div>
  );
}
