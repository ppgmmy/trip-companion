const MODES = [
  {
    id: "travel",
    label: "旅行",
    icon: (active) => (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "personal",
    label: "個人",
    icon: (active) => (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path strokeLinecap="round" d="M8 9h8M8 12.5h5.5M8 16h6.5" />
        <circle cx="17" cy="7.5" r="2" fill="currentColor" stroke="none" opacity="0.85" />
      </svg>
    ),
  },
];

export default function ModeRail({ mode, onModeChange, personalPending = 0 }) {
  return (
    <div
      className="mode-toggle inline-flex rounded-full border border-jade/15 bg-white/90 p-0.5 shadow-[var(--shadow-soft)]"
      role="tablist"
      aria-label="主類別"
    >
      {MODES.map((item) => {
        const isActive = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onModeChange(item.id)}
            className={`nav-btn relative flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none transition active:scale-95 ${
              isActive ? "is-active bg-jade text-white shadow-sm" : "text-ink-faint"
            }`}
          >
            <span className="nav-icon flex h-4 w-4 items-center justify-center">{item.icon(isActive)}</span>
            {item.label}
            {item.id === "personal" && personalPending > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-coral px-0.5 text-[8px] font-bold text-white">
                {personalPending > 9 ? "9+" : personalPending}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
