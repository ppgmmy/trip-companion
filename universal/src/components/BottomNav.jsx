import { useRef } from "react";

const TRAVEL_NAV = [
  { id: "itinerary", label: "行程", icon: (active) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  )},
  { id: "checklist", label: "清單", icon: (active) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m-7 8h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
  )},
  { id: "spots", label: "足跡", icon: (active) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  )},
  { id: "expenses", label: "記帳", icon: (active) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
  )},
  { id: "tools", label: "工具", icon: (active) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>
  )},
];

const MODES = [
  {
    id: "travel",
    label: "旅行",
    icon: (active) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "personal",
    label: "個人",
    icon: (active) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path strokeLinecap="round" d="M8 9h8M8 12.5h5.5M8 16h6.5" />
        <circle cx="17" cy="7.5" r="2" fill="currentColor" stroke="none" opacity="0.85" />
      </svg>
    ),
  },
];

export default function BottomNav({
  mode,
  onModeChange,
  travelActive,
  onTravelSelect,
  onLongPressExpenses,
}) {
  const pressTimer = useRef(null);
  const longPressFired = useRef(false);

  function clearPressTimer() {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleExpensePointerDown() {
    if (!onLongPressExpenses) return;
    longPressFired.current = false;
    clearPressTimer();
    pressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      onModeChange("travel");
      onLongPressExpenses();
      if (navigator.vibrate) navigator.vibrate(12);
    }, 500);
  }

  function handleExpensePointerUp(item) {
    clearPressTimer();
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onModeChange("travel");
    onTravelSelect(item.id);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full safe-bottom" aria-label="主要導覽">
      <div className="mx-auto w-full max-w-lg box-border px-4">
        <div className="mb-3 overflow-hidden rounded-3xl border border-jade/15 bg-white/85 shadow-[var(--shadow-nav)] backdrop-blur">
          {mode === "travel" && (
            <div className="flex gap-0.5 border-b border-jade/10 p-1.5" aria-label="旅行分頁">
              {TRAVEL_NAV.map((item) => {
                const isActive = travelActive === item.id;
                const useLongPress = item.id === "expenses" && onLongPressExpenses;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={useLongPress ? undefined : () => onTravelSelect(item.id)}
                    onPointerDown={useLongPress ? handleExpensePointerDown : undefined}
                    onPointerUp={useLongPress ? () => handleExpensePointerUp(item) : undefined}
                    onPointerLeave={useLongPress ? clearPressTimer : undefined}
                    onPointerCancel={useLongPress ? clearPressTimer : undefined}
                    className={`nav-btn flex min-h-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition ${isActive ? "is-active" : "text-ink-faint"}`}
                  >
                    <span className="nav-icon flex h-7 w-9 items-center justify-center rounded-lg transition">{item.icon(isActive)}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-1 p-1.5" role="tablist" aria-label="主類別">
            {MODES.map((item) => {
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onModeChange(item.id)}
                  className={`nav-btn flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold transition ${
                    isActive ? "is-active bg-jade-soft/50" : "text-ink-faint"
                  }`}
                >
                  <span className="nav-icon flex h-8 w-12 items-center justify-center rounded-xl transition">{item.icon(isActive)}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
