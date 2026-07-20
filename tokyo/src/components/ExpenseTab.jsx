import { useEffect, useMemo, useState } from "react";
import { BarChart, DoughnutChart } from "./Charts";
import { EXPENSE_CATEGORIES, TRIP_DAYS, lockedHkd, weekOf } from "../data";

function formatJpy(n) {
  return `¥ ${Math.round(n).toLocaleString("ja-JP")}`;
}

function formatHkd(n) {
  return `HK$ ${n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatWhen(ts) {
  if (!ts) return "尚未更新";
  return new Date(ts).toLocaleString("zh-HK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExpenseTab({
  expenses,
  setExpenses,
  rateState,
  budget,
  setBudget,
  fxStatus,
  onRefreshRate,
  onApplyManualRate,
}) {
  const rate = rateState?.hkdPerJpy || 0.051;
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [rateInput, setRateInput] = useState(String(Number((rate * 100).toFixed(2))));
  const [budgetInput, setBudgetInput] = useState(String(budget));
  const [filterCat, setFilterCat] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");

  useEffect(() => {
    setRateInput(String(Number((rate * 100).toFixed(2))));
  }, [rate]);

  // HKD totals always sum historically locked values — never totalJpy * live rate.
  const totalJpy = expenses.reduce((s, e) => s + (e.jpy || 0), 0);
  const totalHkd = expenses.reduce((s, e) => s + lockedHkd(e, rate), 0);
  const avgDailyJpy = totalJpy / TRIP_DAYS;
  const avgDailyHkd = totalHkd / TRIP_DAYS;
  const remaining = budget - totalJpy;

  const catTotalsHkd = useMemo(() => {
    const map = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0]));
    expenses.forEach((e) => {
      const id = e.categoryId || "other";
      map[id] = (map[id] || 0) + lockedHkd(e, rate);
    });
    return map;
  }, [expenses, rate]);

  const weekTotalsHkd = useMemo(() => {
    const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    expenses.forEach((e) => {
      const w = e.week || weekOf(new Date(e.createdAt));
      map[w] = (map[w] || 0) + lockedHkd(e, rate);
    });
    return map;
  }, [expenses, rate]);

  const topCat = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: catTotalsHkd[c.id] || 0 })).sort(
    (a, b) => b.total - a.total
  )[0];

  const doughnut = EXPENSE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    color: c.color,
    value: catTotalsHkd[c.id] || 0,
  }));

  const weekBars = [1, 2, 3, 4, 5].map((w) => ({
    id: `w${w}`,
    label: `W${w}`,
    value: weekTotalsHkd[w] || 0,
  }));

  const filtered = expenses.filter((e) => {
    const w = e.week || weekOf(new Date(e.createdAt));
    const catOk = filterCat === "all" || e.categoryId === filterCat;
    const weekOk = filterWeek === "all" || String(w) === String(filterWeek);
    return catOk && weekOk;
  });

  function selectCat(id) {
    setCategoryId(id);
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === id);
    if (cat) setNote(cat.note);
  }

  function addExpense(e) {
    e.preventDefault();
    const jpy = Number(amount);
    if (!Number.isFinite(jpy) || jpy <= 0) return;
    const now = Date.now();
    const storedRate = rate;
    const amountInHKD = jpy * storedRate;
    setExpenses((prev) => [
      {
        id: crypto.randomUUID(),
        jpy,
        storedRate,
        amountInHKD,
        hkd: amountInHKD,
        note: note.trim() || "未命名",
        categoryId: categoryId || "other",
        week: weekOf(new Date(now)),
        createdAt: now,
      },
      ...prev,
    ]);
    setAmount("");
    setNote("");
    setCategoryId(null);
  }

  const statusLabel =
    fxStatus === "loading"
      ? "正在更新匯率…"
      : fxStatus === "live"
        ? `線上匯率 · 更新於 ${formatWhen(rateState?.lastUpdated)}`
        : fxStatus === "cached"
          ? `使用快取／手動匯率 · ${formatWhen(rateState?.lastUpdated)}`
          : `預設／離線備援 · 100 JPY = 5.1 HKD`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">開支儀表板</h2>
        <p className="text-sm text-ink-soft">HKD 以記入當下匯率鎖定 · 之後改匯率不回溯</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">總支出</p>
          <p className="mt-1 font-display text-xl font-bold">{formatJpy(totalJpy)}</p>
          <p className="text-sm text-teal">{formatHkd(totalHkd)}（歷史鎖定加總）</p>
        </div>
        <div className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日均（31 天）</p>
          <p className="mt-1 font-display text-lg font-bold">{formatJpy(avgDailyJpy)}</p>
          <p className="text-xs text-ink-soft">{formatHkd(avgDailyHkd)}</p>
        </div>
        <div className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">最高分類</p>
          <p className="mt-1 font-display text-lg font-bold">{topCat?.total ? topCat.label : "—"}</p>
          {topCat?.total > 0 && (
            <p className="text-xs text-ink-soft">{formatHkd(topCat.total)}</p>
          )}
        </div>
        <div className="col-span-2 rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">預算 vs 實支（JPY）</p>
              <p className={`mt-1 font-display text-lg font-bold ${remaining < 0 ? "text-rose-brand" : "text-teal"}`}>
                剩餘 {formatJpy(remaining)}
              </p>
            </div>
            <p className="text-xs text-ink-soft">預算 {formatJpy(budget)}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-soft">
            <div
              className={`h-full rounded-full ${remaining < 0 ? "bg-rose-brand" : "bg-teal"}`}
              style={{ width: `${budget > 0 ? Math.min(100, Math.round((totalJpy / budget) * 100)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">匯率 JPY → HKD</p>
            <p className="mt-1 font-display text-xl font-bold text-teal">
              100 JPY = {(rate * 100).toFixed(2)} HKD
            </p>
            <p className="mt-1 text-xs text-ink-faint">{statusLabel}</p>
            <p className="mt-1 text-[11px] text-ink-faint">更新全球匯率不會改動已記入開支的 HKD。</p>
          </div>
          <button
            type="button"
            onClick={onRefreshRate}
            disabled={fxStatus === "loading"}
            className="min-h-11 shrink-0 rounded-2xl bg-rose-soft px-3 text-xs font-bold text-rose-deep active:scale-95 disabled:opacity-60"
          >
            {fxStatus === "loading" ? "更新中…" : "即時更新"}
          </button>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">本月預算（JPY）</span>
          <div className="flex gap-2">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
            />
            <button
              type="button"
              onClick={() => {
                const v = Number(budgetInput);
                if (!Number.isFinite(v) || v < 0) return alert("請輸入有效預算");
                setBudget(v);
              }}
              className="min-h-12 rounded-2xl bg-teal px-4 text-sm font-bold text-white"
            >
              套用
            </button>
          </div>
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-semibold">手動匯率（100 JPY = ? HKD）</span>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
            />
            <button
              type="button"
              onClick={() => {
                const v = Number(rateInput);
                if (!Number.isFinite(v) || v <= 0) return alert("請輸入有效匯率");
                onApplyManualRate(v);
              }}
              className="min-h-12 rounded-2xl bg-rose-brand px-4 text-sm font-bold text-white"
            >
              套用
            </button>
          </div>
        </label>
      </div>

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <h3 className="mb-3 font-display text-sm font-bold">分類佔比（鎖定 HKD）</h3>
        <DoughnutChart segments={doughnut} />
      </div>

      <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <h3 className="mb-3 font-display text-sm font-bold">每週開支比較 W1–W5（鎖定 HKD）</h3>
        <BarChart bars={weekBars} unit="hkd" />
      </div>

      <form onSubmit={addExpense} className="space-y-3 rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <div>
          <p className="mb-1.5 text-sm font-semibold">快速分類</p>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCat(cat.id)}
                className={`cat-btn min-h-10 rounded-2xl border border-rose-soft bg-mist px-3 text-xs font-bold text-ink-soft ${categoryId === cat.id ? "is-active" : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">金額（JPY）</span>
          <input
            required
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例如 1280"
            className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">項目／備註</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={60}
            placeholder="點分類或自行輸入"
            className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
          />
        </label>
        <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm text-ink-soft">
          換算預覽（將鎖定）：
          {Number(amount) > 0
            ? `${formatJpy(Number(amount))} ≈ ${formatHkd(Number(amount) * rate)} @ ${(rate * 100).toFixed(2)}`
            : "—"}
        </p>
        <button
          type="submit"
          className="flex w-full min-h-12 items-center justify-center rounded-2xl bg-rose-brand text-base font-bold text-white active:scale-[0.98]"
        >
          加入開支
        </button>
      </form>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">依分類篩選</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`filter-chip border ${filterCat === "all" ? "is-active" : ""}`}
            onClick={() => setFilterCat("all")}
          >
            全部
          </button>
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`filter-chip border ${filterCat === c.id ? "is-active" : ""}`}
              onClick={() => setFilterCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">依週次篩選</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`filter-chip border ${filterWeek === "all" ? "is-active" : ""}`}
            onClick={() => setFilterWeek("all")}
          >
            全部
          </button>
          {[1, 2, 3, 4, 5].map((w) => (
            <button
              key={w}
              type="button"
              className={`filter-chip border ${filterWeek === String(w) ? "is-active" : ""}`}
              onClick={() => setFilterWeek(String(w))}
            >
              W{w}
            </button>
          ))}
        </div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{filtered.length} 筆</p>
          <button
            type="button"
            className="min-h-10 rounded-2xl border border-rose-soft px-3 text-xs font-semibold text-ink-soft"
            onClick={() => {
              if (expenses.length && confirm("清空所有開支？")) setExpenses([]);
            }}
          >
            清空
          </button>
        </div>
        <ul className="space-y-2">
          {!filtered.length && (
            <li className="rounded-2xl border border-dashed border-rose-soft px-4 py-8 text-center text-sm text-ink-faint">
              還沒有紀錄，從第一杯咖啡或 PARCO 6F 開始吧。
            </li>
          )}
          {filtered.map((entry) => {
            const locked = lockedHkd(entry, rate);
            const snap = entry.storedRate || rate;
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{entry.note}</p>
                  <p className="text-xs text-ink-faint">
                    {EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId)?.label || "其他"} · W
                    {entry.week || weekOf(new Date(entry.createdAt))} · 鎖定 @{(snap * 100).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-rose-brand">{formatHkd(locked)}</p>
                  <p className="text-xs text-ink-soft">{formatJpy(entry.jpy)}</p>
                </div>
                <button
                  type="button"
                  className="min-h-10 min-w-10 text-ink-faint"
                  onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== entry.id))}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
