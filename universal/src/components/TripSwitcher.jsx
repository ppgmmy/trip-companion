import { useState } from "react";
import TripForm from "./TripForm";

export default function TripSwitcher({ trips, activeId, onSwitch, onCreate, variant = "header" }) {
  const [open, setOpen] = useState(false);
  const active = trips.find((t) => t.id === activeId) || null;

  return (
    <>
      {variant === "banner" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-jade/15 bg-white/80 px-4 py-2.5 text-left shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-lg">{active?.flag || "🌍"}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">
                {active ? `${active.city}${active.country ? ` · ${active.country}` : ""}` : "選擇／建立旅程"}
              </span>
              {active && (
                <span className="block text-[11px] text-ink-faint">
                  {active.startDate} → {active.endDate} · {active.targetCurrency}
                </span>
              )}
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-jade-deep">切換 ›</span>
        </button>
      ) : (
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
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="切換／新增旅程"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-[var(--shadow-soft)] scroll-thin pb-[env(safe-area-inset-bottom,0px)] sm:max-w-2xl">
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
              <ul className="space-y-2 px-5 pt-4 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
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

            <div className="px-5 py-4">
              <TripForm heading="新增旅程" onCreate={(trip) => { onCreate(trip); setOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
