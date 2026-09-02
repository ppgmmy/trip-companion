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

export default function ModeRail({ mode, onModeChange }) {
  return (
    <aside className="mode-rail fixed inset-y-0 left-0 z-40 flex w-[4.75rem] items-center px-1.5" aria-label="主類別">
      <div
        className="mode-rail-card flex w-full flex-col gap-1 rounded-3xl border border-jade/15 bg-white/85 p-1.5 shadow-[var(--shadow-nav)] backdrop-blur"
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
              onClick={() => onModeChange(item.id)}
              className={`nav-btn flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition ${
                isActive ? "is-active" : "text-ink-faint"
              }`}
            >
              <span className="nav-icon flex h-8 w-full items-center justify-center rounded-xl transition">{item.icon(isActive)}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
