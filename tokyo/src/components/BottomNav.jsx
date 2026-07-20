function Icon({ children }) {
  return (
    <span className="nav-icon flex h-8 w-8 items-center justify-center rounded-xl transition group-[.is-active]:bg-rose-soft group-[.is-active]:text-rose-brand">
      {children}
    </span>
  );
}

const TABS = [
  {
    id: "itinerary",
    label: "行程",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-3m-6 3V2m6 15l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
      </svg>
    ),
  },
  {
    id: "checklist",
    label: "清單",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "cafelog",
    label: "足跡",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 3h7a3 3 0 010 6h-1v2a4 4 0 11-8 0V8H5a2 2 0 01-2-2V5a2 2 0 012-2h1m12 2h1a2 2 0 012 2v1a4 4 0 01-4 4h-1M8 21h6" />
      </svg>
    ),
  },
  {
    id: "expense",
    label: "開支",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1m8-5a8 8 0 11-16 0 8 8 0 0116 0z" />
      </svg>
    ),
  },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/60 bg-white/90 shadow-[var(--shadow-nav)] backdrop-blur-xl safe-bottom">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-0.5 px-1.5 pt-2 pb-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`nav-btn group flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-semibold text-ink-faint transition ${
              tab === item.id ? "is-active" : ""
            }`}
          >
            <Icon>{item.icon}</Icon>
            <span className={tab === item.id ? "text-rose-brand" : ""}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
