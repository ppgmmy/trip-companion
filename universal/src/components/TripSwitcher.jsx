import { useState } from "react";
import TripForm from "./TripForm";

export default function TripSwitcher({ trips, activeId, onSwitch, onCreate, onUpdate, onDelete, variant = "header" }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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
                  <li key={t.id} className="flex items-stretch gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitch(t.id);
                        setOpen(false);
                      }}
                      className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
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
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      aria-label={`編輯${t.city}`}
                      className="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-jade/15 bg-white text-ink-soft transition active:scale-90"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`確定刪除「${t.city}」？\n該旅程嘅行程、記帳、足跡、清單等所有資料會一併刪除，無法還原。`)) {
                          onDelete?.(t.id);
                          if (editing?.id === t.id) setEditing(null);
                        }
                      }}
                      aria-label={`刪除${t.city}`}
                      className="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-coral/20 bg-white text-coral transition active:scale-90"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {editing && (
              <div className="px-5 pt-4">
                <div className="rounded-2xl border border-jade/20 bg-jade-soft/40 p-4">
                  <TripForm
                    key={editing.id}
                    heading={`編輯旅程：${editing.city}`}
                    initial={editing}
                    submitLabel="儲存修改"
                    onCreate={(trip) => {
                      onUpdate?.(trip);
                      setEditing(null);
                    }}
                  />
                  <button type="button" onClick={() => setEditing(null)} className="mt-2 w-full text-center text-xs font-semibold text-ink-faint underline">
                    取消編輯
                  </button>
                </div>
              </div>
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
