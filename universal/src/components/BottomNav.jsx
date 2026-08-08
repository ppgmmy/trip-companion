const NAV = [
  { id: "itinerary", label: "行程", icon: (active) => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  )},
  { id: "checklist", label: "清單", icon: (active) => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m-7 8h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
  )},
  { id: "spots", label: "足跡", icon: (active) => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  )},
  { id: "expenses", label: "記帳", icon: (active) => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
  )},
  { id: "tools", label: "工具", icon: (active) => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>
  )},
];

export default function BottomNav({ active, onSelect }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg safe-bottom" aria-label="主要導覽">
      <div className="mx-3 mb-3 flex gap-1 rounded-3xl border border-jade/15 bg-white/85 p-2 shadow-[var(--shadow-nav)] backdrop-blur">
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`nav-btn flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition ${isActive ? "is-active" : "text-ink-faint"}`}
            >
              <span className="nav-icon flex h-8 w-12 items-center justify-center rounded-xl transition">{item.icon(isActive)}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
