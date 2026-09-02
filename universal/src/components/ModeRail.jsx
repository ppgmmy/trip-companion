import { useEffect, useState } from "react";

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

export default function ModeRail({ mode, onModeChange, personalPending = 0 }) {
  const [open, setOpen] = useState(false);
  const activeMode = MODES.find((m) => m.id === mode) || MODES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function selectMode(id) {
    onModeChange(id);
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mode-rail-handle fixed left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-r-2xl border border-l-0 border-jade/15 bg-white/90 py-2.5 pl-1 pr-1.5 shadow-[var(--shadow-nav)] backdrop-blur transition active:scale-95"
          aria-label={`開啟類別選單（目前：${activeMode.label}）`}
        >
          <span className="nav-icon is-active flex h-8 w-8 items-center justify-center rounded-xl text-jade-deep">
            {activeMode.icon(true)}
          </span>
          <span className="text-[10px] font-bold leading-none text-jade-deep">{activeMode.label}</span>
          {personalPending > 0 && mode !== "personal" && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
              {personalPending > 9 ? "9+" : personalPending}
            </span>
          )}
          <svg className="mt-0.5 h-3 w-3 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {open && (
        <div className="mode-rail-overlay fixed inset-0 z-40" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-label="關閉類別選單"
          />
          <aside
            className="mode-rail-panel absolute left-2 top-1/2 w-[4.75rem] -translate-y-1/2"
            aria-label="主類別"
          >
            <div
              className="mode-rail-card flex flex-col gap-1 rounded-3xl border border-jade/15 bg-white/90 p-1.5 shadow-[var(--shadow-nav)] backdrop-blur"
              role="tablist"
            >
              {MODES.map((item) => {
                const isActive = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectMode(item.id)}
                    className={`nav-btn relative flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition ${
                      isActive ? "is-active" : "text-ink-faint"
                    }`}
                  >
                    <span className="nav-icon flex h-8 w-full items-center justify-center rounded-xl transition">{item.icon(isActive)}</span>
                    {item.label}
                    {item.id === "personal" && personalPending > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
                        {personalPending > 9 ? "9+" : personalPending}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
