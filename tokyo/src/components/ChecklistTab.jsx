import { CHECKLIST } from "../data";

export default function ChecklistTab({ checked, setChecked }) {
  const ids = CHECKLIST.flatMap((g) => g.items.map((i) => i.id));
  const done = ids.filter((id) => checked[id]).length;
  const pct = ids.length ? (done / ids.length) * 100 : 0;

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function reset() {
    if (!confirm("確定重設所有勾選？")) return;
    const next = {};
    ids.forEach((id) => {
      next[id] = false;
    });
    setChecked(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">行李清單</h2>
          <p className="text-sm text-ink-soft">東京短途 · 狀態自動保存</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-2xl border border-rose-soft bg-white/80 px-3 text-xs font-semibold text-rose-deep active:scale-95"
        >
          重設
        </button>
      </div>

      <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">完成進度</span>
          <span className="font-semibold text-rose-brand">
            {done} / {ids.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-brand to-teal transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {CHECKLIST.map((group) => (
        <section key={group.category}>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
            {group.category}
          </h3>
          <ul className="divide-y divide-rose-soft overflow-hidden rounded-3xl bg-white/85 shadow-[var(--shadow-soft)]">
            {group.items.map((item) => {
              const on = Boolean(checked[item.id]);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={`checklist-item flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left active:bg-rose-soft/40 ${on ? "is-checked" : ""}`}
                  >
                    <span className="check-box flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-[#fecdd3] text-sm font-bold">
                      {on ? "✓" : ""}
                    </span>
                    <span className="item-label text-[15px] font-medium text-ink">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
