import { useState } from "react";
import { CURRENCIES, uid } from "../data";

export default function TripSwitcher({ trips, activeId, onSwitch, onCreate }) {
  const [open, setOpen] = useState(false);
  const active = trips.find((t) => t.id === activeId) || null;

  const [form, setForm] = useState({
    city: "",
    country: "",
    flag: "✈️",
    startDate: "",
    endDate: "",
    targetCurrency: "JPY",
    budget: 50000,
  });

  function submit(e) {
    e.preventDefault();
    if (!form.city || !form.startDate || !form.endDate) return;
    const trip = {
      id: uid("trip"),
      city: form.city.trim(),
      country: form.country.trim(),
      flag: form.flag || "✈️",
      startDate: form.startDate,
      endDate: form.endDate,
      targetCurrency: form.targetCurrency,
      baseCurrency: "HKD",
      budget: Number(form.budget) || 0,
      createdAt: Date.now(),
    };
    onCreate(trip);
    setOpen(false);
    setForm({ city: "", country: "", flag: "✈️", startDate: "", endDate: "", targetCurrency: "JPY", budget: 50000 });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-jade/20 bg-white/85 px-4 text-left shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="text-xl">{active?.flag || "🌍"}</span>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-bold text-ink">
                  {active ? `${active.city}${active.country ? ` · ${active.country}` : ""}` : "選擇／建立旅程"}
                </span>
                <span className="block text-[11px] text-ink-faint">
                  {active ? `${active.startDate} → ${active.endDate} · ${active.targetCurrency}` : "點此切換或新增"}
                </span>
              </span>
            </span>
            <svg className="h-4 w-4 shrink-0 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-jade text-white shadow-[var(--shadow-soft)] transition active:scale-90"
          aria-label="新增旅程"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="切換／新增旅程"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-[var(--shadow-soft)] scroll-thin">
            <div className="sticky top-0 flex items-center justify-between border-b border-jade-soft/60 bg-white px-5 py-4">
              <h3 className="font-display text-lg font-bold text-ink">我的旅程</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-mist text-ink-soft transition active:scale-90"
                aria-label="關閉"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {trips.length > 0 && (
              <ul className="space-y-2 px-5 pt-4">
                {trips.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitch(t.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                        t.id === activeId ? "border-jade bg-jade-soft/60" : "border-jade/15 bg-mist"
                      }`}
                    >
                      <span className="text-2xl">{t.flag}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-bold text-ink">
                          {t.city}
                          {t.country ? ` · ${t.country}` : ""}
                        </span>
                        <span className="block text-[11px] text-ink-faint">
                          {t.startDate} → {t.endDate} · {t.targetCurrency} · 預算 {t.budget.toLocaleString()}
                        </span>
                      </span>
                      {t.id === activeId && <span className="text-jade-deep text-lg">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submit} className="space-y-3 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">新增旅程</p>
              <div className="grid grid-cols-[3.5rem_1fr] gap-2">
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
              <div className="grid grid-cols-2 gap-2">
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
              <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
                建立並切換到此旅程
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
