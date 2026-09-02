import { formatHkd, formatMoney } from "../data";

function paymentBits(row, currency) {
  const cash = row.byPayment?.cash;
  const card = row.byPayment?.card;
  const parts = [];
  if (card?.count) parts.push(`卡 ${formatMoney(card.amount, currency)}`);
  if (cash?.count) parts.push(`現金 ${formatMoney(cash.amount, currency)}`);
  return parts;
}

/** 簡潔：ppg／mo／現金／大家分攤；個人再拆卡／現金 */
export default function PayerSpendStats({ trip, payerTotals, onJumpToPayer }) {
  if (!payerTotals?.length) return null;

  return (
    <div className="rounded-xl border border-jade/15 bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
        邊個用咗幾多{onJumpToPayer ? " · 點擊篩選" : ""}
      </p>
      <ul className="mt-1.5 space-y-1">
        {payerTotals.map((row) => {
          const bits = row.key === "cash-pool" || row.key === "cash" ? [] : paymentBits(row, trip.targetCurrency);
          const inner = (
            <>
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
            </>
          );
          return (
            <li key={row.key}>
              {onJumpToPayer ? (
                <button
                  type="button"
                  onClick={() => onJumpToPayer(row.key)}
                  className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-1 py-0.5 text-left text-[11px] transition active:bg-jade-soft/40"
                >
                  {inner}
                </button>
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function payerSpendShareText(trip, payerTotals) {
  if (!payerTotals?.length) return "";
  const lines = [`📊 ${trip.flag || ""} ${trip.city} · 邊個用咗幾多`.trim()];
  payerTotals.forEach((row) => {
    const bits = row.key === "cash-pool" || row.key === "cash" ? [] : paymentBits(row, trip.targetCurrency);
    lines.push(
      `${row.label}：${formatMoney(row.amount, trip.targetCurrency)}（${formatHkd(row.hkd)}，${row.count} 筆）` +
        (bits.length ? `｜${bits.join(" · ")}` : ""),
    );
  });
  return lines.join("\n");
}
