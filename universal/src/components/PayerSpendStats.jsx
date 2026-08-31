import { formatHkd, formatMoney, payerLabel } from "../data";

/** 記帳頁扁列：純統計邊個用咗幾多，唔計欠款 */
export default function PayerSpendStats({ trip, payerTotals }) {
  if (!payerTotals?.length) return null;

  return (
    <div className="rounded-xl border border-jade/15 bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">邊個用咗幾多</p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {payerTotals.map((row) => (
          <span key={row.key} className="text-[11px] font-semibold text-ink-soft">
            <span className="font-bold text-ink">{row.label}</span>{" "}
            <span className="font-display font-black text-jade-deep">
              {formatMoney(row.amount, trip.targetCurrency)}
            </span>
            <span className="ml-1 text-ink-faint">({formatHkd(row.hkd)})</span>
          </span>
        ))}
      </div>
    </div>
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
