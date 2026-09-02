import { useEffect, useMemo, useRef, useState } from "react";
import { formatPersonalDayLabel, shiftDateId, toDateId, uid } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";
import UndoToast from "./UndoToast";

const KINDS = [
  { id: "todo", label: "待辦", icon: "☑️" },
  { id: "event", label: "日程", icon: "📅" },
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const TIMETABLE_START = 6;
const TIMETABLE_END = 23;

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

function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) {
    cells.push(toDateId(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseHour(time) {
  if (!time) return null;
  const [h] = time.split(":").map(Number);
  return Number.isFinite(h) ? h : null;
}

function TimetableRow({ hour, items, onToggle, onRemove }) {
  const label = `${String(hour).padStart(2, "0")}:00`;

  return (
    <div className="personal-timetable-row grid grid-cols-[2.75rem_1fr] border-b border-jade/8 last:border-b-0">
      <div className="border-r border-jade/10 py-2 pr-1.5 text-right text-[10px] font-bold tabular-nums text-ink-faint">
        {label}
      </div>
      <div className="min-h-[2.25rem] space-y-1 py-1 pl-2">
        {items.length === 0 ? (
          <span className="block h-5" aria-hidden="true" />
        ) : (
          items.map((item) => (
            <TimetableItem key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  );
}

function TimetableItem({ item, onToggle, onRemove }) {
  const kind = KINDS.find((k) => k.id === item.kind) || KINDS[0];
  const isEvent = item.kind === "event";

  return (
    <div
      className={`flex items-start gap-1.5 rounded-lg border px-2 py-1.5 ${
        item.done
          ? "border-jade/10 bg-mist/40 opacity-75"
          : isEvent
            ? "border-sky/25 bg-sky/10"
            : "border-jade/20 bg-jade-soft/45"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
          item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
        }`}
        aria-label={item.done ? "標記未完成" : "標記完成"}
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-bold leading-snug ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          <span className="mr-0.5">{kind.icon}</span>
          {item.title}
        </p>
        {item.time && <p className="text-[10px] font-semibold text-jade-deep">{item.time}</p>}
        {item.note && <p className="text-[10px] text-ink-soft">{item.note}</p>}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 rounded p-1 text-ink-faint active:scale-90"
        aria-label="刪除"
      >
        ✕
      </button>
    </div>
  );
}

function PersonalCalendar({ year, month, selectedDate, todayId, items, onSelectDay, onPrevMonth, onNextMonth }) {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const counts = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      map[item.date] = (map[item.date] || 0) + 1;
    });
    return map;
  }, [items]);

  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-jade/10 bg-mist/50 px-3 py-2.5">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-jade/15 bg-white text-sm font-bold text-ink-soft active:scale-95"
          aria-label="上個月"
        >
          ‹
        </button>
        <p className="font-display text-sm font-bold text-ink">
          {year} 年 {month + 1} 月
        </p>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-jade/15 bg-white text-sm font-bold text-ink-soft active:scale-95"
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-jade/10 bg-jade-soft/30">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5 text-center text-[10px] font-bold text-jade-deep">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((dateId, idx) => {
          if (!dateId) {
            return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-jade/5 bg-mist/20" />;
          }
          const isToday = dateId === todayId;
          const isSelected = dateId === selectedDate;
          const count = counts[dateId] || 0;
          const pending = items.filter((i) => i.date === dateId && !i.done).length;

          return (
            <button
              key={dateId}
              type="button"
              onClick={() => onSelectDay(dateId)}
              className={`relative flex aspect-square flex-col items-center justify-center border-b border-r border-jade/8 text-xs transition active:scale-95 ${
                isSelected ? "bg-jade text-white" : isToday ? "bg-jade-soft/70" : "bg-white hover:bg-mist/60"
              }`}
            >
              <span className={`font-bold tabular-nums ${isSelected ? "text-white" : isToday ? "text-jade-deep" : "text-ink"}`}>
                {Number(dateId.split("-")[2])}
              </span>
              {count > 0 && (
                <span
                  className={`mt-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                    isSelected ? "bg-white/25 text-white" : pending > 0 ? "bg-coral/15 text-coral" : "bg-jade/15 text-jade-deep"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayTimetable({ dateId, items, onToggle, onRemove }) {
  const untimed = items.filter((i) => !i.time);
  const byHour = useMemo(() => {
    const map = {};
    for (let h = TIMETABLE_START; h <= TIMETABLE_END; h += 1) map[h] = [];
    items.forEach((item) => {
      const hour = parseHour(item.time);
      if (hour == null) return;
      const slot = Math.min(TIMETABLE_END, Math.max(TIMETABLE_START, hour));
      map[slot].push(item);
    });
    return map;
  }, [items]);

  const hasAny = items.length > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-jade/10 bg-mist/40 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-jade">當日時間表</p>
        <h3 className="font-display text-base font-bold text-ink">{formatPersonalDayLabel(dateId)}</h3>
        <p className="text-[11px] text-ink-faint">
          {hasAny ? `${items.filter((i) => !i.done).length} 項待做 · ${items.length} 項總計` : "暫無安排"}
        </p>
      </div>

      {untimed.length > 0 && (
        <div className="border-b border-jade/10 bg-amber/5 px-3 py-2">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">待安排（無時間）</p>
          <div className="space-y-1">
            {untimed.map((item) => (
              <TimetableItem key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      <div className="personal-timetable max-h-[min(52vh,28rem)] overflow-y-auto scroll-thin">
        {Array.from({ length: TIMETABLE_END - TIMETABLE_START + 1 }, (_, i) => TIMETABLE_START + i).map((hour) => (
          <TimetableRow key={hour} hour={hour} items={byHour[hour]} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </div>

      {!hasAny && (
        <p className="px-3 py-6 text-center text-xs text-ink-faint">撳上面月曆揀日期，或喺下方快速新增</p>
      )}
    </section>
  );
}

export default function PersonalTab({ personal, setPersonal, focusAddTick = 0 }) {
  const todayId = toDateId(new Date());
  const titleRef = useRef(null);
  const undoRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [personalUi, setPersonalUi] = useLocalStorage(REGISTRY_KEYS.personalUi, { selectedDate: todayId, viewMonth: null }, {
    migrate: (v) => {
      const base = v && typeof v === "object" ? v : {};
      return {
        selectedDate: base.selectedDate || todayId,
        viewMonth: base.viewMonth && typeof base.viewMonth === "object" ? base.viewMonth : null,
      };
    },
  });
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(personalUi.selectedDate || todayId);
  const [entryTime, setEntryTime] = useState("");
  const [kind, setKind] = useState("todo");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(personalUi.selectedDate || todayId);
  const [viewMonth, setViewMonth] = useState(() => {
    if (personalUi.viewMonth?.year != null && personalUi.viewMonth?.month != null) {
      return personalUi.viewMonth;
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const items = useMemo(() => (Array.isArray(personal) ? personal : []), [personal]);
  const selectedItems = useMemo(() => itemsForDate(items, selectedDate), [items, selectedDate]);
  const todayPending = itemsForDate(items, todayId).filter((i) => !i.done).length;

  useEffect(() => {
    setPersonalUi((prev) => ({ ...prev, selectedDate, viewMonth }));
  }, [selectedDate, viewMonth, setPersonalUi]);

  useEffect(() => {
    if (focusAddTick > 0) {
      titleRef.current?.focus({ preventScroll: true });
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusAddTick]);

  function selectDay(dateId) {
    setSelectedDate(dateId);
    setEntryDate(dateId);
    const [y, m] = dateId.split("-").map(Number);
    setViewMonth({ year: y, month: m - 1 });
  }

  function shiftMonth(delta) {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function addItem(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const entry = {
      id: uid("personal"),
      title: trimmed,
      date: entryDate || selectedDate || todayId,
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
    selectDay(entry.date);
  }

  function toggleItem(id) {
    setPersonal((prev) => (Array.isArray(prev) ? prev : []).map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeItem(id) {
    const before = items;
    setPersonal((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.id !== id));
    undoRef.current = before;
    setToast({ message: "已刪除待辦", undo: true });
    window.setTimeout(() => setToast(null), 5000);
  }

  function undoRemove() {
    if (undoRef.current) setPersonal(undoRef.current);
    undoRef.current = null;
    setToast(null);
  }

  return (
    <div className="space-y-3">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">個人</p>
        <h2 className="font-display text-xl font-bold text-ink">Schedule Book</h2>
        <p className="text-sm text-ink-soft">
          月曆揀日 · 時間表睇安排 · 今日 {todayPending > 0 ? `仲有 ${todayPending} 項` : "無待辦"}
        </p>
      </div>

      <PersonalCalendar
        year={viewMonth.year}
        month={viewMonth.month}
        selectedDate={selectedDate}
        todayId={todayId}
        items={items}
        onSelectDay={selectDay}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
      />

      <DayTimetable dateId={selectedDate} items={selectedItems} onToggle={toggleItem} onRemove={removeItem} />

      <form onSubmit={addItem} className="expense-section-card-compact space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">
          快速新增 · {formatPersonalDayLabel(entryDate)}
        </p>
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
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "event" ? "日程標題" : "待辦事項"}
          className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />
        <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => {
              setEntryDate(e.target.value);
              setSelectedDate(e.target.value);
            }}
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

      <section className="rounded-2xl border border-jade/10 bg-white/85 px-3 py-2.5 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">黎緊 3 日概覽</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[todayId, shiftDateId(todayId, 1), shiftDateId(todayId, 2)].map((dateId) => {
            const dayItems = itemsForDate(items, dateId);
            const pending = dayItems.filter((i) => !i.done).length;
            const active = dateId === selectedDate;
            return (
              <button
                key={dateId}
                type="button"
                onClick={() => selectDay(dateId)}
                className={`rounded-xl border px-2 py-2 text-left transition active:scale-[0.98] ${
                  active ? "border-jade bg-jade-soft/60" : "border-jade/10 bg-mist/50"
                }`}
              >
                <p className="text-[10px] font-bold text-jade-deep">{formatPersonalDayLabel(dateId).split(" · ")[0]}</p>
                <p className="text-lg font-black text-ink">{pending}</p>
                <p className="text-[9px] text-ink-faint">項待做</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
