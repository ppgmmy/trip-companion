import { useLocalStorage } from "../hooks/useLocalStorage";

const MODES = [
  {
    id: "travel",
    label: "旅行",
    short: "旅",
    icon: (active) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "personal",
    label: "個人",
    short: "個",
    icon: (active) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path strokeLinecap="round" d="M8 9h8M8 12.5h5.5M8 16h6.5" />
        <circle cx="17" cy="7.5" r="2" fill="currentColor" stroke="none" opacity="0.85" />
      </svg>
    ),
  },
];

export default function ModeRail({ mode, onModeChange }) {
  const [collapsed, setCollapsed] = useLocalStorage("universal_mode_rail_collapsed", false, {
    migrate: (v) => v === true || v === "true" || v === 1,
  });

  const activeMode = MODES.find((m) => m.id === mode) || MODES[0];

  return (
    <aside
      className={`mode-rail sticky top-0 z-50 flex h-dvh flex-col border-r border-jade/15 bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur transition-[width] duration-200 safe-top safe-bottom ${
        collapsed ? "mode-rail--collapsed w-12" : "w-[4.75rem]"
      }`}
      aria-label="主類別"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mx-auto mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-jade/15 bg-mist text-ink-faint transition active:scale-95"
        aria-label={collapsed ? "展開類別選單" : "收起類別選單"}
        aria-expanded={!collapsed}
      >
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="mt-3 flex flex-1 flex-col gap-1.5 px-1.5" role="tablist">
        {collapsed ? (
          <button
            type="button"
            role="tab"
            aria-selected
            onClick={() => setCollapsed(false)}
            className="nav-btn is-active flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5"
            title={activeMode.label}
          >
            <span className="nav-icon flex h-9 w-9 items-center justify-center rounded-xl">{activeMode.icon(true)}</span>
            <span className="text-[10px] font-bold">{activeMode.short}</span>
          </button>
        ) : (
          MODES.map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onModeChange(item.id)}
                className={`nav-btn flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 transition ${
                  isActive ? "is-active bg-jade-soft/55" : "text-ink-faint"
                }`}
              >
                <span className="nav-icon flex h-9 w-9 items-center justify-center rounded-xl">{item.icon(isActive)}</span>
                <span className="text-[11px] font-bold leading-none">{item.label}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
