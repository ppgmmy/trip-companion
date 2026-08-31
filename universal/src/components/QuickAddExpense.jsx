import { useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, toDateId } from "../data";
import PayerPaymentFields from "./PayerPaymentFields";

export default function QuickAddExpense({ trip, rate, onSave, onClose }) {
  const [categoryId, setCategoryId] = useState("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateId(new Date()));
  const [payer, setPayer] = useState("me");
  const [customPayer, setCustomPayer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  function save(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onSave({
      id: `exp-${Date.now()}`,
      categoryId,
      amount: value,
      baseAmount: value * rate,
      storedRate: rate,
      note: note.trim() || EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label || "開支",
      date: entryDate || toDateId(new Date()),
      payer: customPayer.trim() || payer || "me",
      paymentMethod,
      createdAt: Date.now(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="快速記帳"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={save} className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-base font-bold text-ink">⚡ 快速記帳</p>
          <span className="shrink-0 rounded-full bg-jade-soft px-2.5 py-1 text-[11px] font-bold text-jade-deep">
            {trip.flag} {trip.city} · 跟隨當前旅程
          </span>
        </div>
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`金額（${trip.targetCurrency}）`}
          className="h-14 w-full rounded-2xl border border-jade/15 bg-mist px-4 text-center font-display text-2xl font-bold outline-none ring-jade focus:ring-2"
        />
        <div className="flex flex-wrap justify-center gap-1.5">
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
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-faint">日期</span>
          <input
            type="date"
            value={entryDate}
            min={trip.startDate || undefined}
            max={trip.endDate || undefined}
            onChange={(e) => setEntryDate(e.target.value)}
            className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註（可留空）"
          className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />
        <PayerPaymentFields
          payer={payer}
          setPayer={setPayer}
          customPayer={customPayer}
          setCustomPayer={setCustomPayer}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          compact
        />
        <p className="rounded-2xl bg-jade-soft/70 px-4 py-2.5 text-center text-sm text-ink-soft">
          {Number(amount) > 0 ? `${formatMoney(Number(amount), trip.targetCurrency)} ≈ ${formatHkd(Number(amount) * rate)}` : "輸入金額後自動換算港幣"}
        </p>
        <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
          記入{trip.city}（鎖定匯率）
        </button>
      </form>
    </div>
  );
}
