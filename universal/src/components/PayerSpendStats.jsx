import { formatHkd, formatMoney, payerLabel } from "../data";

const CASH_POOL_KEYS = new Set(["cash-pool", "cash"]);

function paymentBits(row, currency) {
  const cash = row.byPayment?.cash;
  const card = row.byPayment?.card;
  const parts = [];
  if (card?.count) parts.push(`卡 ${formatMoney(card.amount, currency)}`);
  if (cash?.count) parts.push(`現金 ${formatMoney(cash.amount, currency)}`);
  return parts;
}

/** 簡潔：每人總額 + 卡／現金拆開；共用現金袋另列 */
export default function PayerSpendStats({ trip, payerTotals }) {
  if (!payerTotals?.length) return null;

  const personal = payerTotals.filter((row) => !CASH_POOL_KEYS.has(row.key));
  const cashPool = payerTotals.filter((row) => CASH_POOL_KEYS.has(row.key));

  return (
    <div className="rounded-xl border border-jade/15 bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      {personal.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">邊個用咗幾多</p>
          <ul className="mt-1.5 space-y-1">
            {personal.map((row) => {
              const bits = paymentBits(row, trip.targetCurrency);
              return (
                <li key={row.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="font-bold text-ink">{row.label}</span>
                  <span className="font-display font-black text-jade-deep">
                    {formatMoney(row.amount, trip.targetCurrency)}
                  </span>
                  <span className="text-ink-faint">
                    ({formatHkd(row.hkd)} · {row.count}筆)
                  </span>
                  {bits.length > 0 && (
                    <span className="w-full text-[10px] font-semibold text-ink-soft sm:w-auto">
                      {bits.join(" · ")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {cashPool.length > 0 && (
        <div className={personal.length > 0 ? "mt-2 border-t border-jade/10 pt-2" : ""}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">共用現金袋</p>
          <ul className="mt-1.5 space-y-1">
            {cashPool.map((row) => (
              <li key={row.key} className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
                <span className="font-bold text-ink">{row.label}</span>
                <span className="font-display font-black text-jade-deep">
                  {formatMoney(row.amount, trip.targetCurrency)}
                </span>
                <span className="text-ink-faint">
                  ({formatHkd(row.hkd)} · {row.count}筆)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function payerSpendShareText(trip, payerTotals) {
  if (!payerTotals?.length) return "";
  const personal = payerTotals.filter((row) => !CASH_POOL_KEYS.has(row.key));
  const cashPool = payerTotals.filter((row) => CASH_POOL_KEYS.has(row.key));
  const lines = [`📊 ${trip.flag || ""} ${trip.city} · 邊個用咗幾多`.trim()];
  personal.forEach((row) => {
    const bits = paymentBits(row, trip.targetCurrency);
    lines.push(
      `${payerLabel(row.key) || row.label}：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）` +
        (bits.length ? `｜${bits.join(" · ")}` : ""),
    );
  });
  cashPool.forEach((row) => {
    lines.push(
      `共用現金袋：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）`,
    );
  });
  return lines.join("\n");
}
