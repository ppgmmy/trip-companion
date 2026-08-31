import { formatHkd, formatMoney, payerLabel } from "../data";

const CASH_KEYS = new Set(["cash-pool", "cash"]);

/** 簡潔顯示：個人（ppg／mo…）同一行；共用現金袋另列一行 */
export default function PayerSpendStats({ trip, payerTotals }) {
  if (!payerTotals?.length) return null;

  const personal = payerTotals.filter((row) => !CASH_KEYS.has(row.key));
  const cash = payerTotals.filter((row) => CASH_KEYS.has(row.key));

  function renderRow(row) {
    return (
      <span key={row.key} className="text-[11px] font-semibold text-ink-soft">
        <span className="font-bold text-ink">{row.label}</span>{" "}
        <span className="font-display font-black text-jade-deep">
          {formatMoney(row.amount, trip.targetCurrency)}
        </span>
        <span className="ml-1 text-ink-faint">
          ({formatHkd(row.hkd)}
          {row.count ? ` · ${row.count}筆` : ""})
        </span>
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-jade/15 bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      {personal.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">邊個用咗幾多</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">{personal.map(renderRow)}</div>
        </>
      )}
      {cash.length > 0 && (
        <div className={personal.length > 0 ? "mt-2 border-t border-jade/10 pt-2" : ""}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">共用現金袋</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">{cash.map(renderRow)}</div>
        </div>
      )}
    </div>
  );
}

export function payerSpendShareText(trip, payerTotals) {
  if (!payerTotals?.length) return "";
  const personal = payerTotals.filter((row) => !CASH_KEYS.has(row.key));
  const cash = payerTotals.filter((row) => CASH_KEYS.has(row.key));
  const lines = [`📊 ${trip.flag || ""} ${trip.city} · 邊個用咗幾多`.trim()];
  personal.forEach((row) => {
    lines.push(
      `${payerLabel(row.key) || row.label}：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）`,
    );
  });
  cash.forEach((row) => {
    lines.push(
      `共用現金袋 · ${row.label}：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）`,
    );
  });
  return lines.join("\n");
}
