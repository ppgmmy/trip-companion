import { useEffect, useMemo, useState } from "react";
import { SHARED_TODO_MEMBERS, toDateId, uid } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

const SEED_KEY = "universal_shared_todo_seed_v1";

function memberMeta(id) {
  return SHARED_TODO_MEMBERS.find((m) => m.id === id) || SHARED_TODO_MEMBERS[0];
}

function formatDueLabel(dueDate) {
  if (!dueDate) return "無到期日";
  const today = toDateId(new Date());
  const [, m, d] = dueDate.split("-");
  const short = `${Number(m)} 月 ${Number(d)} 日`;
  if (dueDate === today) return `今日到期 · ${short}`;
  if (dueDate < today) return `已過期 · ${short}`;
  return `到期 · ${short}`;
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

function TodoRow({ item, index, todayId, onToggle, onDelete }) {
  const meta = memberMeta(item.assignee);
  const dueLabel = formatDueLabel(item.dueDate);
  const overdue = item.dueDate && !item.done && item.dueDate < todayId;
  return (
    <div
      className={`todo-v1-item flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${
        item.done ? "border-jade/10 bg-mist/50" : overdue ? "border-coral/25 bg-rose-50/60" : "border-jade/15 bg-white"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={item.done ? "改回未完成" : "標示完成"}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition active:scale-90 ${
          item.done ? "border-jade bg-jade text-white" : "border-jade/35 bg-white text-transparent hover:border-jade"
        }`}
      >
        ✓
      </button>
      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left">
        <p className={`text-[15px] font-bold leading-snug ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          {item.title}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold">
          <span className={`rounded-md border px-1.5 py-0.5 ${meta.chip}`}>負責人 {meta.label}</span>
          <span className={overdue ? "text-coral" : "text-ink-faint"}>{dueLabel}</span>
        </p>
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold text-ink-faint hover:bg-rose-50 hover:text-coral active:scale-90"
      >
        刪除
      </button>
    </div>
  );
}

export default function SharedTodoPanel() {
  const [personFilter, setPersonFilter] = useState("all");
  const [listMode, setListMode] = useState("open"); // open | done
  const [assignee, setAssignee] = useState("C");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [items, setItems] = useLocalStorage(REGISTRY_KEYS.sharedTodos, [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });

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

  const todayId = toDateId(new Date());

  const stats = useMemo(() => {
    const open = items.filter((i) => !i.done);
    const done = items.filter((i) => i.done);
    const overdue = open.filter((i) => i.dueDate && i.dueDate < todayId);
    const byPerson = {};
    SHARED_TODO_MEMBERS.forEach((m) => {
      byPerson[m.id] = open.filter((i) => i.assignee === m.id).length;
    });
    return { open: open.length, done: done.length, overdue: overdue.length, byPerson };
  }, [items, todayId]);

  const visible = useMemo(() => {
    let list = items.filter((i) => (listMode === "done" ? i.done : !i.done));
    if (personFilter !== "all") list = list.filter((i) => i.assignee === personFilter);
    return [...list].sort((a, b) => {
      const da = a.dueDate || "9999-99-99";
      const db = b.dueDate || "9999-99-99";
      if (da !== db) return da.localeCompare(db);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items, listMode, personFilter]);

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
    setListMode("open");
  }

  function toggleItem(id) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setItems((prev) => prev.filter((item) => item.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  const personFilters = [{ id: "all", label: "所有人" }, ...SHARED_TODO_MEMBERS.map((m) => ({ id: m.id, label: m.label }))];

  return (
    <div className="todo-v1 space-y-4">
      <header className="todo-v1-hero relative overflow-hidden rounded-[1.75rem] px-5 pb-5 pt-6 text-white">
        <div className="todo-v1-hero__glow" aria-hidden="true" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">Trip Companion</p>
          <h2 className="mt-2 font-display text-[2rem] font-extrabold leading-[1.05] tracking-tight">待辦清單</h2>
          <p className="mt-2 max-w-[18rem] text-[14px] leading-relaxed text-white/90">
            寫低要做嘅事 → 揀邊個負責 → 到日剔走。
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/14 px-3 py-2.5 backdrop-blur">
              <p className="text-[11px] font-semibold text-white/70">未完成</p>
              <p className="font-display text-2xl font-bold tabular-nums leading-none">{stats.open}</p>
            </div>
            <div className="rounded-2xl bg-white/14 px-3 py-2.5 backdrop-blur">
              <p className="text-[11px] font-semibold text-white/70">已過期</p>
              <p className="font-display text-2xl font-bold tabular-nums leading-none">{stats.overdue}</p>
            </div>
            <div className="rounded-2xl bg-white/14 px-3 py-2.5 backdrop-blur">
              <p className="text-[11px] font-semibold text-white/70">已完成</p>
              <p className="font-display text-2xl font-bold tabular-nums leading-none">{stats.done}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[1.35rem] border border-jade/15 bg-white/95 shadow-[var(--shadow-soft)]">
        <div className="border-b border-jade/10 bg-mist/50 px-4 py-2.5">
          <p className="text-[13px] font-extrabold text-ink">① 新增待辦</p>
          <p className="text-[12px] text-ink-faint">填內容、到期日、負責人，再撳加入</p>
        </div>
        <form onSubmit={addItem} className="space-y-3 p-4">
          <label className="block space-y-1">
            <span className="text-[12px] font-bold text-ink-soft">要做咩</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：買咖啡豆、交文件…"
              className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-3.5 text-[15px] outline-none ring-jade focus:ring-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[12px] font-bold text-ink-soft">到期日（可留空）</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-jade/15 bg-mist px-3 text-[14px] outline-none ring-jade focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setDueDate(todayId)}
                className={`shrink-0 rounded-2xl border px-3.5 text-[13px] font-bold active:scale-[0.98] ${
                  dueDate === todayId ? "border-jade bg-jade-soft/70 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
                }`}
              >
                今日
              </button>
            </div>
          </label>

          <fieldset className="space-y-1.5">
            <legend className="text-[12px] font-bold text-ink-soft">邊個負責</legend>
            <div className="grid grid-cols-4 gap-2">
              {SHARED_TODO_MEMBERS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAssignee(m.id)}
                  className={`min-h-11 rounded-2xl border text-[14px] font-bold active:scale-[0.98] ${
                    assignee === m.id ? "border-jade bg-jade text-white" : "border-jade/15 bg-white text-ink-soft"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!title.trim()}
            className="h-12 w-full rounded-2xl bg-jade text-[15px] font-bold text-white shadow-[var(--shadow-soft)] disabled:opacity-40"
          >
            加入清單 · 負責人 {assignee}
            {dueDate ? ` · ${dueDate.slice(5).replace("-", "/")}` : ""}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[1.35rem] border border-jade/15 bg-white/95 shadow-[var(--shadow-soft)]">
        <div className="border-b border-jade/10 bg-mist/50 px-4 py-2.5">
          <p className="text-[13px] font-extrabold text-ink">② 睇清單</p>
          <p className="text-[12px] text-ink-faint">先揀未完成／已完成，再按負責人篩選</p>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-mist p-1">
            <button
              type="button"
              onClick={() => setListMode("open")}
              className={`rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
                listMode === "open" ? "bg-white text-jade-deep shadow-sm" : "text-ink-soft"
              }`}
            >
              未完成 {stats.open}
            </button>
            <button
              type="button"
              onClick={() => setListMode("done")}
              className={`rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
                listMode === "done" ? "bg-white text-jade-deep shadow-sm" : "text-ink-soft"
              }`}
            >
              已完成 {stats.done}
            </button>
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-bold text-ink-soft">負責人篩選</p>
            <div className="flex flex-wrap gap-1.5">
              {personFilters.map((f) => {
                const count = f.id === "all" ? (listMode === "open" ? stats.open : stats.done) : listMode === "open" ? stats.byPerson[f.id] || 0 : items.filter((i) => i.done && i.assignee === f.id).length;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPersonFilter(f.id)}
                    className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-bold active:scale-[0.98] ${
                      personFilter === f.id
                        ? "border-jade bg-jade-soft/70 text-jade-deep"
                        : "border-jade/15 bg-white text-ink-soft"
                    }`}
                  >
                    {f.label}
                    {count > 0 ? ` · ${count}` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-jade/20 bg-mist/40 px-4 py-8 text-center">
                <p className="text-[15px] font-bold text-ink">
                  {listMode === "done" ? "未有已完成項目" : "未有未完成項目"}
                </p>
                <p className="mt-1 text-[13px] text-ink-faint">
                  {listMode === "open" ? "喺上面「新增待辦」加入第一件。" : "完成項目後會出現喺呢度。"}
                </p>
              </div>
            ) : (
              visible.map((item, index) => (
                <TodoRow
                  key={item.id}
                  item={item}
                  index={index}
                  todayId={todayId}
                  onToggle={toggleItem}
                  onDelete={setPendingDelete}
                />
              ))
            )}
          </div>
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
