import { useState } from "react";
import { CURRENCIES, uid } from "../data";

const INITIAL = { city: "", country: "", flag: "✈️", startDate: "", endDate: "", targetCurrency: "JPY", budget: 50000 };

export default function TripForm({ onCreate, heading, initial = null, submitLabel = "建立並切換到此旅程" }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          city: initial.city || "",
          country: initial.country || "",
          flag: initial.flag || "✈️",
          startDate: initial.startDate || "",
          endDate: initial.endDate || "",
          targetCurrency: initial.targetCurrency || "JPY",
          budget: initial.budget ?? 50000,
        }
      : INITIAL
  );

  function submit(e) {
    e.preventDefault();
    if (!form.city || !form.startDate || !form.endDate) return;
    // 回程早過出發（或調轉咗）會令日數計錯——自動對調修正
    let { startDate, endDate } = form;
    if (endDate < startDate) [startDate, endDate] = [endDate, startDate];
    onCreate({
      id: initial?.id || uid("trip"),
      city: form.city.trim(),
      country: form.country.trim(),
      flag: form.flag || "✈️",
      startDate,
      endDate,
      targetCurrency: form.targetCurrency,
      baseCurrency: initial?.baseCurrency || "HKD",
      budget: Number(form.budget) || 0,
      createdAt: initial?.createdAt || Date.now(),
    });
    setForm(INITIAL);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {heading && <p className="text-xs font-bold uppercase tracking-wider text-ink-faint sm:col-span-2">{heading}</p>}
      <div className="grid grid-cols-[3.5rem_1fr] gap-2 sm:col-span-2">
        <label className="block">
          <span className="sr-only">旗幟</span>
          <input
            value={form.flag}
            onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value }))}
            maxLength={4}
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist text-center text-xl outline-none ring-jade focus:ring-2"
            placeholder="✈️"
          />
        </label>
        <label className="block">
          <span className="sr-only">城市</span>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            required
            placeholder="城市（例：倫敦／首爾／巴黎）"
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-4 outline-none ring-jade focus:ring-2"
          />
        </label>
      </div>
      <input
        value={form.country}
        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        placeholder="國家（可選）"
        className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-4 outline-none ring-jade focus:ring-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">開始</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            required
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">結束</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            required
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">當地幣種</span>
          <select
            value={form.targetCurrency}
            onChange={(e) => setForm((f) => ({ ...f, targetCurrency: e.target.value }))}
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          >
            {CURRENCIES.filter((c) => c.code !== "HKD").map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-faint">總預算（當地幣）</span>
          <input
            type="number"
            min="0"
            step="100"
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3 outline-none ring-jade focus:ring-2"
          />
        </label>
      </div>
      <button
        type="submit"
        className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98] sm:col-span-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
