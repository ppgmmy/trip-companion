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

function SectionCard({ title, hint, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-jade/10 bg-mist/40 px-3 py-2">
        <p className="text-xs font-bold text-ink">{title}</p>
        {hint && <p className="text-[10px] text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function SharedTodoPanel() {
  const [filter, setFilter] = useState("all");
  const [assignee, setAssignee] = useState("C");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
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

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const todayId = toDateId(new Date());

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {SHARED_TODO_MEMBERS.map((m) => (
          <div key={m.id} className={`rounded-xl border px-1.5 py-2 text-center ${m.chip.split(" ")[0]} border-jade/10`}>
            <p className="text-[10px] font-bold text-ink-faint">{m.label}</p>
            <p className="font-display text-base font-bold text-ink">{counts[m.id] || 0}</p>
          </div>
        ))}
      </div>

      <SectionCard title="To-Do List（C · M · S · P）" hint="可揀日期 · 按到期日排序">
        <form onSubmit={addItem} className="space-y-2 border-b border-jade/10 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="要做咩…（例：買bra）"
            className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 w-full rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setDueDate("2026-09-11")}
              className={`shrink-0 rounded-xl border px-2.5 text-[11px] font-bold active:scale-[0.98] ${
                dueDate === "2026-09-11"
                  ? "border-jade bg-jade-soft/60 text-jade-deep"
                  : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              9/11
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SHARED_TODO_MEMBERS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssignee(m.id)}
                className={`min-h-9 rounded-xl border text-xs font-bold active:scale-[0.98] ${
                  assignee === m.id ? `badge-active border-transparent` : `border-jade/15 bg-white text-ink-soft`
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button type="submit" className="h-10 w-full rounded-xl bg-jade text-sm font-bold text-white">
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
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold active:scale-[0.98] ${
                filter === f.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {f.label}
              {f.id !== "all" && counts[f.id] > 0 ? ` (${counts[f.id]})` : f.id === "all" && counts.all > 0 ? ` (${counts.all})` : ""}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 p-3">
          {visible.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-faint">無項目</p>
          ) : (
            visible.map((item) => {
              const meta = memberMeta(item.assignee);
              const dueLabel = formatDueLabel(item.dueDate);
              const overdue = item.dueDate && !item.done && item.dueDate < todayId;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    item.done ? "border-jade/10 bg-mist/40 opacity-80" : "border-jade/15 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                      item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${meta.chip}`}>
                    {meta.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`min-w-0 flex-1 text-left ${item.done ? "line-through text-ink-faint" : "text-ink"}`}
                  >
                    <span className="block text-sm font-bold leading-snug">{item.title}</span>
                    {dueLabel && (
                      <span className={`mt-0.5 block text-[10px] font-bold ${overdue ? "text-coral" : "text-ink-faint"}`}>
                        {dueLabel}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded p-1 text-ink-faint active:scale-90"
                    aria-label="刪除"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {filter === "all" && (
        <div className="grid grid-cols-2 gap-2">
          {SHARED_TODO_MEMBERS.map((m) => {
            const pending = items
              .filter((i) => i.assignee === m.id && !i.done)
              .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
            return (
              <section key={m.id} className="rounded-2xl border border-jade/10 bg-white/90 p-2.5 shadow-[var(--shadow-soft)]">
                <p className={`mb-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${m.chip}`}>
                  {m.label}
                </p>
                {pending.length === 0 ? (
                  <p className="text-[11px] text-ink-faint">無待做</p>
                ) : (
                  <ul className="space-y-1">
                    {pending.slice(0, 4).map((item) => (
                      <li key={item.id} className="truncate text-xs font-semibold text-ink">
                        · {item.dueDate ? `${item.dueDate.slice(5).replace("-", "/")} ` : ""}
                        {item.title}
                      </li>
                    ))}
                    {pending.length > 4 && (
                      <li className="text-[10px] text-ink-faint">+{pending.length - 4} 項</li>
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
