import { useMemo, useState } from "react";
import { formatHkd, payerLabel } from "../data";
import { computeSplitSettlement, splitSettlementShareText } from "../utils/splitSettlement";

export default function SplitSettlementPanel({ trip, expenses }) {
  const settlement = useMemo(() => computeSplitSettlement(expenses), [expenses]);
  const [copied, setCopied] = useState(false);

  if (!settlement) return null;

  async function share() {
    const text = splitSettlementShareText(settlement, `${trip.flag || ""} ${trip.city}`.trim());
    try {
      if (navigator.share) {
        await navigator.share({ title: "分帳結算", text });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-xl border border-jade/15 bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-jade">分帳結算</p>
          <p className={`mt-1 text-sm font-bold ${settlement.balanced ? "text-jade-deep" : "text-ink"}`}>
            {settlement.summary}
          </p>
          <p className="mt-1 text-[11px] text-ink-soft">
            {payerLabel("ppg")} {formatHkd(settlement.effectivePaid.ppg)} · {payerLabel("mo")}{" "}
            {formatHkd(settlement.effectivePaid.mo)} · 各應 {formatHkd(settlement.fairShare)}
          </p>
        </div>
        <button
          type="button"
          onClick={share}
          className="shrink-0 rounded-xl bg-jade-soft px-2.5 py-1.5 text-[11px] font-bold text-jade-deep"
        >
          {copied ? "已複製" : "分享"}
        </button>
      </div>
    </div>
  );
}
