import { useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, payerLabel } from "../data";

const PAYER_HINTS = {
  ppg: "ppg 個人支出",
  mo: "mo 個人支出",
  "cash-pool": "共用現金袋（九萬日圓等），唔屬 ppg／mo",
  shared: "共同開支標記",
};

const PAYER_COLORS = {
  ppg: "#0d9488",
  mo: "#0ea5e9",
  "cash-pool": "#f59e0b",
  shared: "#a855f7",
};

function normalizePayerKey(payer) {
  if (!payer || payer === "cash") return "cash-pool";
  return payer;
}

function entriesForPayer(expenses, payerKey) {
  return expenses
    .filter((entry) => normalizePayerKey(entry.payer) === payerKey)
    .slice()
    .reverse();
}

/** 記帳頁：ppg／mo／現金／大家分攤分開顯示，可展開睇明細 */
export default function PayerSpendStats({
  trip,
  expenses,
  payerTotals,
  totalHkd,
  activePayer = "all",
  onJumpToPayer,
}) {
  const [expandedKey, setExpandedKey] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();
    payerTotals.forEach((row) => map.set(row.key, { ...row, items: entriesForPayer(expenses, row.key) }));
    return [...map.values()];
  }, [expenses, payerTotals]);

  if (!grouped.length) return null;

  function toggleExpand(key) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  return (
    <section className="rounded-xl border border-jade/15 bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">邊個用咗幾多</p>
        {activePayer !== "all" && (
          <button
            type="button"
            onClick={() => onJumpToPayer?.("all")}
            className="text-[10px] font-bold text-jade-deep"
          >
            顯示全部
          </button>
        )}
      </div>

      <ul className="mt-2 space-y-2">
        {grouped.map((row) => {
          const pct = totalHkd > 0 ? Math.round((row.hkd / totalHkd) * 100) : 0;
          const isExpanded = expandedKey === row.key;
          const isActive = activePayer === row.key;
          const hint = PAYER_HINTS[row.key];
          const color = PAYER_COLORS[row.key] || "#64748b";
          const preview = row.items.slice(0, isExpanded ? row.items.length : 3);

          return (
            <li
              key={row.key}
              className={`overflow-hidden rounded-xl border ${isActive ? "border-jade/40 bg-jade-soft/30" : "border-jade/10 bg-mist/40"}`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(row.key)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:scale-[0.99]"
                aria-expanded={isExpanded}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{row.label}</p>
                  <p className="mt-0.5 text-[10px] text-ink-faint">
                    {hint || `${row.count} 筆`}
                    {!isExpanded && row.count > 3 ? " · 撳展開明細" : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-black text-jade-deep">
                    {formatMoney(row.amount, trip.targetCurrency)}
                  </p>
                  <p className="text-[10px] font-semibold text-ink-faint">
                    {formatHkd(row.hkd)} · {pct}%
                  </p>
                </div>
              </button>

              <div className="h-1 bg-white/80 px-3">
                <div className="h-full rounded-full bg-jade/15">
                  <div className="h-full rounded-full bg-jade/50 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {(isExpanded || preview.length > 0) && (
                <ul className="border-t border-jade/10 bg-white/70 px-3 py-2">
                  {preview.map((entry) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.id === entry.categoryId);
                    return (
                      <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink">{entry.note || cat?.label || "開支"}</p>
                          <p className="text-[10px] text-ink-faint">{entry.date?.slice(5).replace("-", "/") || "—"}</p>
                        </div>
                        <p className="shrink-0 font-display font-bold text-jade-deep">
                          {formatMoney(entry.amount, trip.targetCurrency)}
                        </p>
                      </li>
                    );
                  })}
                  {!isExpanded && row.count > 3 && (
                    <li className="pt-1 text-[10px] font-bold text-jade-deep">仲有 {row.count - 3} 筆…</li>
                  )}
                </ul>
              )}

              <div className="flex gap-1 border-t border-jade/10 bg-white/50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onJumpToPayer?.(row.key)}
                  className="min-h-8 flex-1 rounded-lg bg-jade-soft px-2 text-[10px] font-bold text-jade-deep"
                >
                  {isActive ? "已篩選清單" : "喺清單篩選"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleExpand(row.key)}
                  className="min-h-8 rounded-lg border border-jade/15 bg-white px-2 text-[10px] font-bold text-ink-soft"
                >
                  {isExpanded ? "收起" : "明細"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function payerSpendShareText(trip, payerTotals) {
  if (!payerTotals?.length) return "";
  const lines = [
    `📊 ${trip.flag || ""} ${trip.city} · 邊個用咗幾多`.trim(),
    ...payerTotals.map(
      (row) =>
        `${payerLabel(row.key) || row.label}：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）`,
    ),
  ];
  return lines.join("\n");
}
