import { useEffect, useMemo, useState } from "react";
import { SHARED_TODO_MEMBERS, toDateId, uid } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

const FILTERS = [{ id: "all", label: "全部" }, ...SHARED_TODO_MEMBERS.map((m) => ({ id: m.id, label: m.label }))];
const SEED_KEY = "universal_shared_todo_seed_v1";

function memberMeta(id) {
  return SHARED_TODO_MEMBERS.find((m) => m.id === id) || SHARED_TODO_MEMBERS[0];
}

function formatDueLabel(dueDate) {
  if (!dueDate) return null;
  const today = toDateId(new Date());
  const [, m, d] = dueDate.split("-");
  const short = `${Number(m)}/${Number(d)}`;
  if (dueDate === today) return `今日 · ${short}`;
  if (dueDate < today) return `過期 · ${short}`;
  return short;
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-coral/20 bg-white p-5 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">再確認一次</p>
        <h3 className="mt-1.5 font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-jade/15 bg-white px-3 py-2.5 text-[13px] font-bold text-ink-soft active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-gradient-to-br from-coral to-[#ea580c] px-3 py-2.5 text-[13px] font-bold text-white active:scale-[0.98]"
          >
            確定刪除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SharedTodoPanel() {
  const [filter, setFilter] = useState("all");
  const [assignee, setAssignee] = useState("C");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [items, setItems] = useLocalStorage(REGISTRY_KEYS.sharedTodos, [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });

  // 一次性加入：9/11 C 買bra
  useEffect(() => {
    try {
      if (localStorage.getItem(SEED_KEY) === "1") return;
      localStorage.setItem(SEED_KEY, "1");
    } catch {
      return;
    }
    setItems((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(
        (i) => i.assignee === "C" && i.dueDate === "2026-09-11" && String(i.title || "").includes("買bra"),
      );
      if (exists) return list;
      return [
        ...list,
        {
          id: uid("shared"),
          title: "買bra",
          assignee: "C",
          dueDate: "2026-09-11",
          done: false,
          createdAt: Date.now(),
        },
      ];
    });
  }, [setItems]);

  const visible = useMemo(() => {
    const list = [...items].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const da = a.dueDate || "9999-99-99";
      const db = b.dueDate || "9999-99-99";
      if (da !== db) return da.localeCompare(db);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    if (filter === "all") return list;
    return list.filter((item) => item.assignee === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const map = { all: 0 };
    SHARED_TODO_MEMBERS.forEach((m) => {
      map[m.id] = 0;
    });
    items.forEach((item) => {
      if (!item.done) {
        map.all += 1;
        if (map[item.assignee] != null) map[item.assignee] += 1;
      }
    });
    return map;
  }, [items]);

  function addItem(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: uid("shared"),
        title: trimmed,
        assignee,
        dueDate: dueDate || "",
        done: false,
        createdAt: Date.now(),
      },
    ]);
    setTitle("");
    setDueDate("");
  }

  function toggleItem(id) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setItems((prev) => prev.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  const todayId = toDateId(new Date());

  return (
    <div className="todo-v1 space-y-3">
      <header className="todo-v1-hero relative overflow-hidden rounded-[1.75rem] px-5 pb-5 pt-6 text-white">
        <div className="todo-v1-hero__glow" aria-hidden="true" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">Trip Companion</p>
          <h2 className="mt-2 font-display text-[2rem] font-extrabold leading-[1.05] tracking-tight">To-Do List</h2>
          <p className="mt-2 max-w-[17rem] text-[13px] leading-relaxed text-white/85">
            第一版：記低要做嘅事，分派 C · M · S · P，到期就剔走。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SHARED_TODO_MEMBERS.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/14 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">{m.label}</p>
                <p className="font-display text-xl font-bold tabular-nums leading-none">{counts[m.id] || 0}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[1.35rem] border border-jade/15 bg-white/95 shadow-[var(--shadow-soft)]">
        <form onSubmit={addItem} className="space-y-2 border-b border-jade/10 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="要做咩…（例：買咖啡豆）"
            className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3.5 text-[15px] outline-none ring-jade focus:ring-2"
          />
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 w-full rounded-xl border border-jade/15 bg-mist px-2.5 text-[12px] outline-none ring-jade focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setDueDate(todayId)}
              className={`shrink-0 rounded-xl border px-3 text-[11px] font-bold active:scale-[0.98] ${
                dueDate === todayId ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              今日
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SHARED_TODO_MEMBERS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssignee(m.id)}
                className={`min-h-9 rounded-xl border text-[12px] font-bold active:scale-[0.98] ${
                  assignee === m.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            className="h-11 w-full rounded-2xl bg-jade text-[14px] font-bold text-white shadow-[var(--shadow-soft)] disabled:opacity-40"
          >
            加入 · {assignee}
            {dueDate ? ` · ${dueDate.slice(5).replace("-", "/")}` : ""}
          </button>
        </form>

        <div className="flex flex-wrap gap-1 border-b border-jade/10 px-3 py-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg border px-2 py-1 text-[10px] font-bold active:scale-[0.98] ${
                filter === f.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {f.label}
              {f.id !== "all" && counts[f.id] > 0
                ? ` (${counts[f.id]})`
                : f.id === "all" && counts.all > 0
                  ? ` (${counts.all})`
                  : ""}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 p-3">
          {visible.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">未有項目 · 喺上面加入第一件待辦</p>
          ) : (
            visible.map((item, index) => {
              const meta = memberMeta(item.assignee);
              const dueLabel = formatDueLabel(item.dueDate);
              const overdue = item.dueDate && !item.done && item.dueDate < todayId;
              return (
                <div
                  key={item.id}
                  className={`todo-v1-item flex items-center gap-2 rounded-2xl border px-3 py-2.5 ${
                    item.done ? "border-jade/10 bg-mist/40 opacity-80" : "border-jade/15 bg-white"
                  }`}
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-label={item.done ? "標示未完成" : "標示完成"}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${meta.chip}`}>
                    {meta.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`min-w-0 flex-1 text-left ${item.done ? "text-ink-faint line-through" : "text-ink"}`}
                  >
                    <span className="block text-[14px] font-bold leading-snug">{item.title}</span>
                    {dueLabel && (
                      <span className={`mt-0.5 block text-[10px] font-bold ${overdue ? "text-coral" : "text-ink-faint"}`}>
                        {dueLabel}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-ink-faint hover:bg-rose-50 hover:text-coral active:scale-90"
                    aria-label="刪除"
                  >
                    刪除
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `刪除「${pendingDelete.title}」？` : "確定刪除？"}
        message="刪除後無法還原。"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
