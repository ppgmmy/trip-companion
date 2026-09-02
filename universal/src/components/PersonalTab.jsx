import { useMemo, useState } from "react";
import { formatPersonalDayLabel, shiftDateId, toDateId, uid } from "../data";

const KINDS = [
  { id: "todo", label: "待辦", icon: "☑️" },
  { id: "event", label: "日程", icon: "📅" },
];

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const ta = a.time || "99:99";
    const tb = b.time || "99:99";
    if (ta !== tb) return ta.localeCompare(tb);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function itemsForDate(items, dateId) {
  return sortItems(items.filter((item) => item.date === dateId));
}

function DayBlock({ dateId, label, items, onToggle, onRemove, highlight }) {
  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <section
      className={`rounded-2xl border px-3 py-2.5 shadow-[var(--shadow-soft)] ${
        highlight ? "border-jade/30 bg-jade-soft/35" : "border-jade/10 bg-white/90"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{label}</h3>
        <span className="text-[10px] font-semibold text-ink-faint">
          {pending.length > 0 ? `${pending.length} 項待做` : items.length ? "已完成" : "無事項"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-center text-xs text-ink-faint">暫無安排</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {[...pending, ...done].map((item) => {
            const kind = KINDS.find((k) => k.id === item.kind) || KINDS[0];
            return (
              <li
                key={item.id}
                className={`flex items-start gap-2 rounded-xl px-2 py-2 ${item.done ? "bg-mist/40 opacity-70" : "bg-mist/70"}`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                    item.done ? "border-jade bg-jade text-white" : "border-jade/25 bg-white text-transparent"
                  }`}
                  aria-label={item.done ? "標記未完成" : "標記完成"}
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-snug ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
                    <span className="mr-1">{kind.icon}</span>
                    {item.title}
                  </p>
                  {item.time && <p className="mt-0.5 text-[11px] font-semibold text-jade-deep">{item.time}</p>}
                  {item.note && <p className="mt-0.5 text-[11px] text-ink-soft">{item.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-ink-faint transition active:scale-90"
                  aria-label="刪除"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function PersonalTab({ personal, setPersonal }) {
  const todayId = toDateId(new Date());
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayId);
  const [entryTime, setEntryTime] = useState("");
  const [kind, setKind] = useState("todo");
  const [note, setNote] = useState("");
  const [browseDate, setBrowseDate] = useState(todayId);

  const items = useMemo(() => (Array.isArray(personal) ? personal : []), [personal]);

  const horizon = useMemo(
    () => [todayId, shiftDateId(todayId, 1), shiftDateId(todayId, 2), shiftDateId(todayId, 3)],
    [todayId],
  );

  const upcomingLabels = useMemo(
    () => [
      { dateId: todayId, label: formatPersonalDayLabel(todayId), highlight: true },
      { dateId: shiftDateId(todayId, 1), label: formatPersonalDayLabel(shiftDateId(todayId, 1)), highlight: false },
      { dateId: shiftDateId(todayId, 2), label: formatPersonalDayLabel(shiftDateId(todayId, 2)), highlight: false },
      { dateId: shiftDateId(todayId, 3), label: formatPersonalDayLabel(shiftDateId(todayId, 3)), highlight: false },
    ],
    [todayId],
  );

  const todayPending = itemsForDate(items, todayId).filter((i) => !i.done).length;
  const browseItems = itemsForDate(items, browseDate);

  function addItem(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const entry = {
      id: uid("personal"),
      title: trimmed,
      date: entryDate || todayId,
      time: entryTime.trim(),
      kind: kind === "event" ? "event" : "todo",
      note: note.trim(),
      done: false,
      createdAt: Date.now(),
    };
    setPersonal((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setTitle("");
    setNote("");
    setEntryTime("");
    setEntryDate(todayId);
  }

  function toggleItem(id) {
    setPersonal((prev) => (Array.isArray(prev) ? prev : []).map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeItem(id) {
    setPersonal((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">個人</p>
        <h2 className="font-display text-xl font-bold text-ink">待辦同日程</h2>
        <p className="text-sm text-ink-soft">
          今日 {todayPending > 0 ? `仲有 ${todayPending} 項` : "無待辦"} · 顯示黎緊 3 日
        </p>
      </div>

      <div className="space-y-2">
        {upcomingLabels.map(({ dateId, label, highlight }) => (
          <DayBlock
            key={dateId}
            dateId={dateId}
            label={label}
            items={itemsForDate(items, dateId)}
            onToggle={toggleItem}
            onRemove={removeItem}
            highlight={highlight}
          />
        ))}
      </div>

      <form onSubmit={addItem} className="expense-section-card-compact space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">新增</p>
        <div className="grid grid-cols-2 gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`min-h-9 rounded-xl border px-2 text-xs font-bold ${kind === k.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {k.icon} {k.label}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "event" ? "日程標題" : "待辦事項"}
          className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />
        <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="h-9 rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
          />
          <input
            type="time"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            className="h-9 w-[5.5rem] rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
          />
          <button type="submit" className="h-9 rounded-xl bg-jade px-3 text-xs font-bold text-white">
            加入
          </button>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註（可選）"
          className="h-9 w-full rounded-xl border border-jade/15 bg-mist px-3 text-xs outline-none ring-jade focus:ring-2"
        />
      </form>

      <section className="rounded-2xl border border-jade/10 bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">日曆瀏覽</p>
          <input
            type="date"
            value={browseDate}
            onChange={(e) => setBrowseDate(e.target.value)}
            className="h-8 rounded-lg border border-jade/15 bg-mist px-2 text-xs outline-none"
          />
        </div>
        <p className="mt-1 text-sm font-bold text-ink">{formatPersonalDayLabel(browseDate)}</p>
        {browseItems.length === 0 ? (
          <p className="mt-2 text-center text-xs text-ink-faint">呢日無事項</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {browseItems.map((item) => {
              const k = KINDS.find((x) => x.id === item.kind) || KINDS[0];
              return (
                <li key={item.id} className="flex items-center gap-2 rounded-xl bg-mist/60 px-2.5 py-2 text-sm">
                  <span>{k.icon}</span>
                  <span className={`min-w-0 flex-1 font-semibold ${item.done ? "line-through text-ink-faint" : "text-ink"}`}>
                    {item.title}
                  </span>
                  {item.time && <span className="text-[11px] font-bold text-jade-deep">{item.time}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {items.some((i) => !horizon.includes(i.date)) && (
        <section className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-3 py-2">
          <p className="text-[11px] font-bold text-ink-soft">其他日期</p>
          <ul className="mt-1.5 space-y-1">
            {sortItems(items.filter((i) => !horizon.includes(i.date)))
              .slice(0, 8)
              .map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-ink">{item.title}</span>
                  <span className="shrink-0 text-ink-faint">{formatPersonalDayLabel(item.date)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
