import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDateHorizon,
  daysBetweenDateIds,
  formatPersonalDayLabel,
  formatTodoActiveLabel,
  personalTodoStartDate,
  shiftDateId,
  toDateId,
  todoPriorityTier,
  uid,
} from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";
import UndoToast from "./UndoToast";
import DailyTodosPanel from "./DailyTodosPanel";
import SharedTodoPanel from "./SharedTodoPanel";

const PERSONAL_VIEWS = [
  { id: "mine", label: "行程", hint: "個人行程／日程時間表" },
  { id: "daily", label: "每日", hint: "每日習慣＋本月%" },
  { id: "shared", label: "To-Do", hint: "共用 To-Do List（C M S P）" },
];

const KINDS = [
  { id: "event", label: "行程", icon: "📅" },
];

const FILTERS = [
  { id: "event", label: "行程" },
];

const QUICK_START_DATES = [{ label: "今日開始", offset: 0 }];

const TIME_PRESETS = ["09:00", "12:00", "14:00", "18:00"];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function nextRoundedHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sortEvents(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || "99:99").localeCompare(b.time || "99:99");
  });
}

function eventsForDate(items, dateId) {
  return sortEvents(items.filter((item) => item.kind === "event" && item.date === dateId));
}

function activeTodos(items, todayId) {
  return items
    .filter((item) => item.kind === "todo" && !item.done && personalTodoStartDate(item) <= todayId)
    .sort((a, b) => {
      const ageDiff =
        daysBetweenDateIds(personalTodoStartDate(b), todayId) -
        daysBetweenDateIds(personalTodoStartDate(a), todayId);
      if (ageDiff !== 0) return ageDiff;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
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

function priorityClass(tier) {
  if (tier === "high") return "border-coral/35 bg-coral-soft/80 text-coral";
  if (tier === "medium") return "border-amber-300/50 bg-amber-50 text-amber-900";
  return "border-jade/20 bg-jade-soft/70 text-jade-deep";
}

function SectionCard({ title, hint, action, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-jade/10 bg-mist/40 px-3 py-2">
          <div className="min-w-0">
            {title && <p className="text-xs font-bold text-ink">{title}</p>}
            {hint && <p className="text-[10px] text-ink-faint">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function TimetableItem({ item, todayId, onToggle, onRemove, onPostpone }) {
  const kind = KINDS.find((k) => k.id === item.kind) || KINDS[0];
  const isEvent = item.kind === "event";
  const startDate = personalTodoStartDate(item);
  const tier = isEvent ? null : todoPriorityTier(startDate, todayId);
  const activeLabel = isEvent ? null : formatTodoActiveLabel(startDate, todayId);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        item.done
          ? "border-jade/10 bg-mist/35"
          : isEvent
            ? "border-sky/25 bg-sky/8"
            : "border-jade/20 bg-jade-soft/35"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
          item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
        }`}
        aria-label={item.done ? "標記未完成" : "標記完成"}
      >
        ✓
      </button>
      {isEvent ? (
        <span className="w-11 shrink-0 text-[10px] font-bold tabular-nums text-jade-deep">{item.time || "—"}</span>
      ) : (
        <span
          className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold ${item.done ? "text-ink-faint" : priorityClass(tier)}`}
        >
          {activeLabel}
        </span>
      )}
      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left active:opacity-80">
        <p className={`truncate text-xs font-bold ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          {item.title}
        </p>
        {!isEvent && !item.done && (
          <p className="truncate text-[10px] text-ink-faint">
            開始 {startDate.slice(5).replace("-", "/")}
          </p>
        )}
      </button>
      {!item.done && isEvent && onPostpone && (
        <button
          type="button"
          onClick={() => onPostpone(item.id)}
          className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold text-jade-deep active:scale-95"
          aria-label="延後一日"
        >
          +1日
        </button>
      )}
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

function ItemGroup({ label, items, todayId, onToggle, onRemove, onPostpone, muted = false }) {
  if (items.length === 0) return null;
  return (
    <div className={muted ? "opacity-80" : ""}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <TimetableItem
            key={item.id}
            item={item}
            todayId={todayId}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
          />
        ))}
      </div>
    </div>
  );
}

function ActiveTodosPanel({ items, todayId, showCompleted, onToggle, onRemove }) {
  const active = activeTodos(items, todayId);
  const doneTodos = items.filter((item) => item.kind === "todo" && item.done);

  return (
    <SectionCard title="進行中待辦" hint="由開始日期計生效時長 · 越久越優先">
      <div className="space-y-2 p-3">
        {active.length === 0 ? (
          <p className="text-center text-xs text-ink-faint">無進行中待辦</p>
        ) : (
          active.map((item) => (
            <TimetableItem key={item.id} item={item} todayId={todayId} onToggle={onToggle} onRemove={onRemove} />
          ))
        )}
        {showCompleted && doneTodos.length > 0 && (
          <ItemGroup
            label="✓ 已完成待辦"
            items={doneTodos}
            todayId={todayId}
            onToggle={onToggle}
            onRemove={onRemove}
            muted
          />
        )}
        {!showCompleted && doneTodos.length > 0 && active.length > 0 && (
          <p className="text-[10px] text-ink-faint">另有 {doneTodos.length} 項已完成</p>
        )}
      </div>
    </SectionCard>
  );
}

function DayBlock({ dateId, items, showCompleted, active, onSelectDay, onToggle, onRemove, onPostpone, todayId }) {
  const dayEvents = eventsForDate(items, dateId);
  const pending = dayEvents.filter((i) => !i.done);
  const done = dayEvents.filter((i) => i.done);
  const visible = showCompleted ? dayEvents : pending;
  const hasContent = visible.length > 0;

  return (
    <div className={`border-l-[3px] px-3 py-2.5 ${active ? "border-l-jade bg-jade-soft/20" : "border-l-transparent"}`}>
      <button
        type="button"
        onClick={() => onSelectDay(dateId)}
        className="mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-bold text-ink">{formatPersonalDayLabel(dateId)}</span>
        <span className={`text-[10px] font-bold ${pending.length > 0 ? "text-coral" : "text-ink-faint"}`}>
          {pending.length > 0 ? `${pending.length} 個日程` : dayEvents.length > 0 ? "已完成" : "無日程"}
        </span>
      </button>

      {!hasContent ? (
        <p className="text-[11px] text-ink-faint">—</p>
      ) : (
        <div className="space-y-2">
          <ItemGroup
            label="📅 日程"
            items={pending}
            todayId={todayId}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
          />
          {showCompleted && (
            <ItemGroup
              label="✓ 已完成"
              items={done}
              todayId={todayId}
              onToggle={onToggle}
              onRemove={onRemove}
              onPostpone={onPostpone}
              muted
            />
          )}
          {!showCompleted && done.length > 0 && pending.length > 0 && (
            <p className="text-[10px] text-ink-faint">另有 {done.length} 個已完成日程</p>
          )}
        </div>
      )}
    </div>
  );
}

function SevenDayTimetable({
  horizon,
  items,
  selectedDate,
  showCompleted,
  onFilterKind,
  onShowCompleted,
  filterKind,
  onSelectDay,
  onToggle,
  onRemove,
  onPostpone,
  todayId,
}) {
  return (
    <SectionCard
      title="黎緊 7 日 · 日程"
      hint="指定時間嘅安排"
      action={
        <div className="flex shrink-0 items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterKind(f.id)}
              className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-bold active:scale-[0.98] ${
                filterKind === f.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onShowCompleted((v) => !v)}
            className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-bold active:scale-[0.98] ${
              showCompleted ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
            }`}
          >
            {showCompleted ? "隱藏完成" : "完成"}
          </button>
        </div>
      }
    >
      <div className="divide-y divide-jade/10">
        {horizon.map((dateId) => (
          <DayBlock
            key={dateId}
            dateId={dateId}
            items={items}
            showCompleted={showCompleted}
            active={dateId === selectedDate}
            onSelectDay={onSelectDay}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
            todayId={todayId}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function PersonalCalendar({ year, month, selectedDate, todayId, items, onSelectDay, onPrevMonth, onNextMonth }) {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const eventCounts = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (item.done || item.kind !== "event") return;
      map[item.date] = (map[item.date] || 0) + 1;
    });
    return map;
  }, [items]);
  const todoStarts = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (item.done || item.kind !== "todo") return;
      const key = personalTodoStartDate(item);
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [items]);

  return (
    <section className="overflow-hidden rounded-3xl border border-jade/15 bg-gradient-to-b from-jade-soft/35 to-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-base font-bold text-jade-deep shadow-sm active:scale-95"
          aria-label="上個月"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-sm font-bold text-ink">
            {year} 年 {month + 1} 月
          </p>
          <p className="text-[10px] text-ink-faint">藍點日程 · 綠點待辦開始</p>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-base font-bold text-jade-deep shadow-sm active:scale-95"
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-bold text-jade-deep">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-4">
        {cells.map((dateId, idx) => {
          if (!dateId) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }
          const isToday = dateId === todayId;
          const isSelected = dateId === selectedDate;
          const ev = eventCounts[dateId] || 0;
          const td = todoStarts[dateId] || 0;

          return (
            <button
              key={dateId}
              type="button"
              onClick={() => onSelectDay(dateId)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[12px] transition active:scale-95 ${
                isSelected
                  ? "bg-jade text-white shadow-md"
                  : isToday
                    ? "bg-white text-jade-deep ring-2 ring-jade/50"
                    : "bg-white/85 text-ink hover:bg-jade-soft/40"
              }`}
            >
              <span className={`font-bold ${isSelected ? "text-white" : ""}`}>{Number(dateId.split("-")[2])}</span>
              {(ev > 0 || td > 0) && (
                <span className="mt-0.5 flex gap-0.5">
                  {ev > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-sky-500"}`} />
                  )}
                  {td > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-jade-soft" : "bg-jade"}`} />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function PersonalTab({ personal, setPersonal, focusAddTick = 0 }) {
  const todayId = toDateId(new Date());
  const titleRef = useRef(null);
  const formRef = useRef(null);
  const undoRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [personalUi, setPersonalUi] = useLocalStorage(
    REGISTRY_KEYS.personalUi,
    { selectedDate: todayId, viewMonth: null, kind: "event", filterKind: "event", showCompleted: false, section: "mine" },
    {
      migrate: (v) => {
        const base = v && typeof v === "object" ? v : {};
        return {
          selectedDate: base.selectedDate || todayId,
          viewMonth: base.viewMonth && typeof base.viewMonth === "object" ? base.viewMonth : null,
          kind: "event",
          filterKind: "event",
          showCompleted: Boolean(base.showCompleted),
          section: ["mine", "daily", "shared"].includes(base.section) ? base.section : "mine",
        };
      },
    },
  );
  const [section, setSection] = useState(personalUi.section || "mine");
  const [kind, setKind] = useState("event");
  const [filterKind, setFilterKind] = useState("event");
  const [showCompleted, setShowCompleted] = useState(Boolean(personalUi.showCompleted));
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayId);
  const [entryTime, setEntryTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(personalUi.selectedDate || todayId);
  const [viewMonth, setViewMonth] = useState(() => {
    if (personalUi.viewMonth?.year != null && personalUi.viewMonth?.month != null) {
      return personalUi.viewMonth;
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const items = useMemo(() => (Array.isArray(personal) ? personal : []), [personal]);

  useEffect(() => {
    if (!Array.isArray(personal)) return;
    let changed = false;
    const fixed = personal.map((item) => {
      let next = item;
      if (item.kind === "todo" && item.time) {
        next = { ...next, time: "" };
        changed = true;
      }
      if (item.kind === "todo" && !item.startDate) {
        const startDate = item.date || (item.createdAt ? toDateId(new Date(item.createdAt)) : todayId);
        next = { ...next, startDate, date: startDate };
        changed = true;
      }
      return next;
    });
    if (changed) setPersonal(fixed);
  }, [personal, setPersonal, todayId]);

  const sevenDayHorizon = useMemo(() => buildDateHorizon(todayId, 7), [todayId]);
  const todayStats = useMemo(() => {
    const events = eventsForDate(items, todayId).filter((i) => !i.done);
    const weekEvents = items.filter(
      (i) => i.kind === "event" && !i.done && sevenDayHorizon.includes(i.date),
    ).length;
    return {
      events: events.length,
      weekEvents,
    };
  }, [items, todayId, sevenDayHorizon]);

  useEffect(() => {
    setPersonalUi((prev) => ({ ...prev, selectedDate, viewMonth, kind, filterKind, showCompleted, section }));
  }, [selectedDate, viewMonth, kind, filterKind, showCompleted, section, setPersonalUi]);

  useEffect(() => {
    if (section === "mine") {
      setKind("event");
      setFilterKind("event");
      setEntryTime((t) => t || nextRoundedHour());
    }
  }, [section]);

  useEffect(() => {
    if (focusAddTick > 0) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [focusAddTick]);

  function selectDay(dateId) {
    setSelectedDate(dateId);
    if (kind === "event") setEntryDate(dateId);
    const [y, m] = dateId.split("-").map(Number);
    setViewMonth({ year: y, month: m - 1 });
  }

  function selectKind(nextKind) {
    setKind(nextKind);
    setTimeError(false);
    if (nextKind === "event") {
      setEntryDate(selectedDate || todayId);
      setEntryTime((t) => t || nextRoundedHour());
    } else {
      setEntryDate(todayId);
      setEntryTime("");
    }
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
    if (!entryTime.trim()) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    const startDate = entryDate || todayId;
    const entry = {
      id: uid("personal"),
      title: trimmed,
      date: startDate,
      time: entryTime.trim(),
      kind: "event",
      note: "",
      done: false,
      createdAt: Date.now(),
    };
    setPersonal((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setTitle("");
    selectDay(entry.date);
    titleRef.current?.focus({ preventScroll: true });
  }

  function toggleItem(id) {
    setPersonal((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  function postponeItem(id) {
    setPersonal((prev) =>
      (Array.isArray(prev) ? prev : []).map((item) =>
        item.kind === "event" && item.id === id ? { ...item, date: shiftDateId(item.date, 1), done: false } : item,
      ),
    );
  }

  function removeItem(id) {
    const before = items;
    setPersonal((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.id !== id));
    undoRef.current = before;
    setToast({ message: "已刪除", undo: true });
    window.setTimeout(() => setToast(null), 5000);
  }

  function undoRemove() {
    if (undoRef.current) setPersonal(undoRef.current);
    undoRef.current = null;
    setToast(null);
  }

  const kindMeta = KINDS.find((k) => k.id === kind) || KINDS[0];
  const outOfHorizonEvents =
    selectedDate && !sevenDayHorizon.includes(selectedDate) ? eventsForDate(items, selectedDate) : [];

  const activeView = PERSONAL_VIEWS.find((v) => v.id === section) || PERSONAL_VIEWS[0];

  return (
    <div className="space-y-3">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {section === "mine" ? "行程" : section === "shared" ? "To-Do" : section === "daily" ? "每日" : "個人"}
          </h2>
          <p className="text-[11px] text-ink-faint">{activeView.hint}</p>
        </div>
        {section === "mine" && (
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            className="shrink-0 rounded-xl border border-jade/15 bg-white px-2.5 py-1.5 text-[11px] font-bold text-jade-deep"
          >
            {calendarOpen ? "收起月曆" : "月曆"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {PERSONAL_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSection(v.id)}
            className={`min-h-10 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] ${
              section === v.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {section === "daily" && <DailyTodosPanel />}
      {section === "shared" && <SharedTodoPanel />}

      {section === "mine" && (
        <>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-xl border border-sky/20 bg-sky/8 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">今日行程</p>
          <p className="font-display text-lg font-bold text-ink">{todayStats.events}</p>
        </div>
        <div className="rounded-xl border border-jade/15 bg-jade-soft/40 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">近 7 日行程</p>
          <p className="font-display text-lg font-bold text-jade-deep">{todayStats.weekEvents}</p>
        </div>
      </div>

      <SectionCard
        title="新增行程"
        hint="指定幾時去做（必填時間）"
      >
        <form ref={formRef} onSubmit={addItem} className="space-y-2 p-3">
          <p className="rounded-xl border border-jade/15 bg-jade-soft/40 px-3 py-2 text-xs font-bold text-jade-deep">
            📅 新增行程（有時間嘅日程）
          </p>

          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="幾時做咩？例如：食飯、開會、睇醫生…"
            className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">行程日期</p>
            
            <div className="mb-1.5 flex gap-1">
                {[
                  { label: "今日", offset: 0 },
                  { label: "明日", offset: 1 },
                  { label: "後日", offset: 2 },
                ].map(({ label, offset }) => {
                  const dateId = shiftDateId(todayId, offset);
                  const active = entryDate === dateId;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setEntryDate(dateId);
                        setSelectedDate(dateId);
                      }}
                      className={`min-h-7 flex-1 rounded-lg border text-[11px] font-bold active:scale-[0.98] ${
                        active ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => {
                setEntryDate(e.target.value);
                if (kind === "event") setSelectedDate(e.target.value);
              }}
              className="h-9 w-full rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
            />
          </div>

          <div>
              <p className="mb-1 text-[10px] font-bold text-ink-faint">
                時間 <span className="text-coral">*</span>
              </p>
              <div className="space-y-1">
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => {
                    setEntryTime(e.target.value);
                    setTimeError(false);
                  }}
                  required
                  className={`h-9 w-full rounded-xl border bg-mist px-2 text-xs outline-none ring-jade focus:ring-2 ${
                    timeError ? "border-coral ring-coral" : "border-jade/15"
                  }`}
                />
                {timeError && <p className="text-[10px] font-bold text-coral">日程需要指定時間</p>}
                <div className="flex flex-wrap gap-1">
                  {TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setEntryTime(t);
                        setTimeError(false);
                      }}
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold active:scale-95 ${
                        entryTime === t
                          ? "border-jade bg-jade-soft/60 text-jade-deep"
                          : "border-jade/15 bg-white text-ink-soft"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          <button type="submit" className="h-10 w-full rounded-xl bg-jade text-sm font-bold text-white">
            加入行程
          </button>
        </form>
      </SectionCard>

{(true) && (
        <SevenDayTimetable
          horizon={sevenDayHorizon}
          items={items}
          selectedDate={selectedDate}
          showCompleted={showCompleted}
          filterKind={filterKind}
          onFilterKind={setFilterKind}
          onShowCompleted={setShowCompleted}
          onSelectDay={selectDay}
          onToggle={toggleItem}
          onRemove={removeItem}
          onPostpone={postponeItem}
          todayId={todayId}
        />
      )}

{calendarOpen && (
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
      )}

      {outOfHorizonEvents.length > 0 && (
        <SectionCard title="其他日期 · 日程" hint={formatPersonalDayLabel(selectedDate)}>
          <div className="space-y-2 p-3">
            <ItemGroup
              label="📅 日程"
              items={showCompleted ? outOfHorizonEvents : outOfHorizonEvents.filter((i) => !i.done)}
              todayId={todayId}
              onToggle={toggleItem}
              onRemove={removeItem}
              onPostpone={postponeItem}
            />
          </div>
        </SectionCard>
      )}
        </>
      )}
    </div>
  );
}
