import { useState } from "react";

export default function CollapsibleSection({ title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="expense-section-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="expense-stat-label">{title}</p>
          {!open && summary && <p className="mt-1 text-sm font-semibold text-ink">{summary}</p>}
        </div>
        <span className="shrink-0 pt-0.5 text-[11px] font-bold text-ink-faint">{open ? "收起" : "展開"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
