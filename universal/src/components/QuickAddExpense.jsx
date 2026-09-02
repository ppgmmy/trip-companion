import { useRef, useState } from "react";
import { DEFAULT_PAYER_ID, DEFAULT_PAYMENT_METHOD, EXPENSE_CATEGORIES, formatHkd, formatMoney, lastPaymentDefaults, normalizePaymentMethod, recentCustomPayers, resolvePayerForSave, savePayerPrefs, toDateId } from "../data";
import { amountExpressionPreview, frequentAmounts, parseAmountExpression, suggestCategoryByHour } from "../utils/expenseInput";
import PayerPaymentFields from "./PayerPaymentFields";

export default function QuickAddExpense({ trip, rate, expenses = [], onSave, onClose }) {
  const defaults = lastPaymentDefaults(expenses);
  const [categoryId, setCategoryId] = useState(() => suggestCategoryByHour());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateId(new Date()));
  const [payer, setPayer] = useState(defaults.payer);
  const [customPayer, setCustomPayer] = useState(defaults.customPayer);
  const [paymentMethod, setPaymentMethod] = useState(defaults.paymentMethod);
  const recentPayers = recentCustomPayers(expenses);
  const amountRef = useRef(null);
  const formRef = useRef(null);
  const suggestedAmounts = frequentAmounts(expenses);
  const draftAmount = amountExpressionPreview(amount) ?? (Number(amount) || 0);

  function save(e) {
    e.preventDefault();
    const value = parseAmountExpression(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onSave({
      id: `exp-${Date.now()}`,
      categoryId,
      amount: value,
      baseAmount: value * rate,
      storedRate: rate,
      note: note.trim() || EXPENSE_CATEGORIES.find((c) => c.id === categoryId)?.label || "開支",
      date: entryDate || toDateId(new Date()),
      payer: resolvePayerForSave(payer, customPayer),
      paymentMethod: normalizePaymentMethod(paymentMethod),
      createdAt: Date.now(),
    });
    savePayerPrefs({
      payer: resolvePayerForSave(payer, customPayer),
      customPayer: customPayer.trim(),
      paymentMethod,
    });
    setAmount("");
    setNote("");
    window.requestAnimationFrame(() => amountRef.current?.focus({ preventScroll: true }));
  }

  function handleAmountKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
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
      <form ref={formRef} onSubmit={save} className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-base font-bold text-ink">⚡ 快速記帳</p>
          <span className="shrink-0 rounded-full bg-jade-soft px-2.5 py-1 text-[11px] font-bold text-jade-deep">
            {trip.flag} {trip.city} · 跟隨當前旅程
          </span>
        </div>
        <input
          ref={amountRef}
          autoFocus
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleAmountKeyDown}
          placeholder={`金額（${trip.targetCurrency}）`}
          className="h-14 w-full rounded-2xl border border-jade/15 bg-mist px-4 text-center font-display text-2xl font-bold outline-none ring-jade focus:ring-2"
        />
        {suggestedAmounts.length > 0 && !amount && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestedAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="rounded-2xl border border-jade/15 bg-white px-3 py-1.5 text-xs font-bold text-ink-soft"
              >
                {formatMoney(value, trip.targetCurrency)}
              </button>
            ))}
          </div>
        )}
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
        <div className="grid grid-cols-[1fr_auto] gap-1.5">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備註（可留空）"
            className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <input
            type="date"
            value={entryDate}
            min={trip.startDate || undefined}
            max={trip.endDate || undefined}
            onChange={(e) => setEntryDate(e.target.value)}
            className="h-11 w-[8.5rem] rounded-2xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
          />
        </div>
        <PayerPaymentFields
          payer={payer}
          setPayer={setPayer}
          customPayer={customPayer}
          setCustomPayer={setCustomPayer}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          recentPayers={recentPayers}
        />
        <p className="rounded-2xl bg-jade-soft/70 px-4 py-2.5 text-center text-sm text-ink-soft">
          {draftAmount > 0
            ? `${formatMoney(draftAmount, trip.targetCurrency)} ≈ ${formatHkd(draftAmount * rate)}`
            : "輸入金額後自動換算港幣（支援 850+120）"}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-2xl border border-jade/15 bg-white font-bold text-ink-soft">
            關閉
          </button>
          <button type="submit" className="min-h-12 flex-[2] rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
            記入
          </button>
        </div>
      </form>
    </div>
  );
}
