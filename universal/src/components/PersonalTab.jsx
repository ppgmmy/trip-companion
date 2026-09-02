import { useEffect, useMemo, useRef, useState } from "react";
import {
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

const KINDS = [
  { id: "todo", label: "待辦", icon: "☑️" },
  { id: "event", label: "日程", icon: "📅" },
];

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "todo", label: "待辦" },
  { id: "event", label: "日程" },
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

function ThreeDayTimetable({
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
      title="黎緊 3 日 · 日程"
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
  const counts = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (item.done) return;
      const key = item.kind === "event" ? item.date : personalTodoStartDate(item);
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [items]);

  return (
    <SectionCard title="月曆" hint="紅點 = 該日有日程或待辦開始">
      <div className="flex items-center justify-between border-b border-jade/10 bg-mist/30 px-3 py-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-jade/15 bg-white text-sm font-bold text-ink-soft active:scale-95"
          aria-label="上個月"
        >
          ‹
        </button>
        <p className="text-xs font-bold text-ink">
          {year} 年 {month + 1} 月
        </p>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-jade/15 bg-white text-sm font-bold text-ink-soft active:scale-95"
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-jade/10 bg-jade-soft/30">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[9px] font-bold text-jade-deep">
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

          return (
            <button
              key={dateId}
              type="button"
              onClick={() => onSelectDay(dateId)}
              className={`relative flex aspect-square flex-col items-center justify-center border-b border-r border-jade/8 text-[11px] transition active:scale-95 ${
                isSelected ? "bg-jade text-white" : isToday ? "bg-jade-soft/70" : "bg-white"
              }`}
            >
              <span className={`font-bold ${isSelected ? "text-white" : isToday ? "text-jade-deep" : "text-ink"}`}>
                {Number(dateId.split("-")[2])}
              </span>
              {count > 0 && (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-coral"}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
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
    { selectedDate: todayId, viewMonth: null, kind: "todo", filterKind: "all", showCompleted: false },
    {
      migrate: (v) => {
        const base = v && typeof v === "object" ? v : {};
        return {
          selectedDate: base.selectedDate || todayId,
          viewMonth: base.viewMonth && typeof base.viewMonth === "object" ? base.viewMonth : null,
          kind: base.kind === "event" ? "event" : "todo",
          filterKind: ["all", "todo", "event"].includes(base.filterKind) ? base.filterKind : "all",
          showCompleted: Boolean(base.showCompleted),
        };
      },
    },
  );
  const [kind, setKind] = useState(personalUi.kind || "todo");
  const [filterKind, setFilterKind] = useState(personalUi.filterKind || "all");
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

  const threeDayHorizon = useMemo(
    () => [todayId, shiftDateId(todayId, 1), shiftDateId(todayId, 2)],
    [todayId],
  );
  const todayStats = useMemo(() => {
    const active = activeTodos(items, todayId);
    const events = eventsForDate(items, todayId).filter((i) => !i.done);
    return {
      activeTodos: active.length,
      events: events.length,
      highPriority: active.filter((i) => todoPriorityTier(personalTodoStartDate(i), todayId) === "high").length,
    };
  }, [items, todayId]);

  useEffect(() => {
    setPersonalUi((prev) => ({ ...prev, selectedDate, viewMonth, kind, filterKind, showCompleted }));
  }, [selectedDate, viewMonth, kind, filterKind, showCompleted, setPersonalUi]);

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
    if (kind === "event" && !entryTime.trim()) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    const startDate = entryDate || todayId;
    const entry =
      kind === "event"
        ? {
            id: uid("personal"),
            title: trimmed,
            date: startDate,
            time: entryTime.trim(),
            kind: "event",
            note: "",
            done: false,
            createdAt: Date.now(),
          }
        : {
            id: uid("personal"),
            title: trimmed,
            startDate,
            date: startDate,
            time: "",
            kind: "todo",
            note: "",
            done: false,
            createdAt: Date.now(),
          };
    setPersonal((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setTitle("");
    if (kind === "event") {
      selectDay(entry.date);
    } else {
      setEntryDate(todayId);
    }
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
    selectedDate && !threeDayHorizon.includes(selectedDate) ? eventsForDate(items, selectedDate) : [];

  return (
    <div className="space-y-3">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">個人日程</h2>
          <p className="text-[11px] text-ink-faint">待辦＝開始日期計優先 · 日程＝指定時間</p>
        </div>
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          className="shrink-0 rounded-xl border border-jade/15 bg-white px-2.5 py-1.5 text-[11px] font-bold text-jade-deep"
        >
          {calendarOpen ? "收起月曆" : "月曆"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl border border-jade/15 bg-jade-soft/40 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">進行中待辦</p>
          <p className="font-display text-lg font-bold text-jade-deep">{todayStats.activeTodos}</p>
        </div>
        <div className="rounded-xl border border-sky/20 bg-sky/8 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">今日日程</p>
          <p className="font-display text-lg font-bold text-ink">{todayStats.events}</p>
        </div>
        <div className="rounded-xl border border-coral/25 bg-coral-soft/60 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">逾週待辦</p>
          <p className="font-display text-lg font-bold text-coral">{todayStats.highPriority}</p>
        </div>
      </div>

      <SectionCard
        title={`新增${kindMeta.label}`}
        hint={kind === "event" ? "指定幾時去做（必填時間）" : "設定開始日期 · 由嗰日開始計生效時長"}
      >
        <form ref={formRef} onSubmit={addItem} className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => selectKind(k.id)}
                className={`min-h-9 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] ${
                  kind === k.id ? "badge-active border-transparent" : "border-jade/15 bg-mist/60 text-ink-soft"
                }`}
              >
                {k.icon} {k.label}
              </button>
            ))}
          </div>

          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "event" ? "幾時做咩？例如：食飯、開會…" : "备忘：要做嘅事…"}
            className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">{kind === "event" ? "日程日期" : "開始日期"}</p>
            {kind === "todo" && (
              <div className="mb-1.5 flex gap-1">
                {QUICK_START_DATES.map(({ label, offset }) => {
                  const dateId = shiftDateId(todayId, offset);
                  const active = entryDate === dateId;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setEntryDate(dateId)}
                      className={`min-h-7 flex-1 rounded-lg border text-[11px] font-bold active:scale-[0.98] ${
                        active ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {kind === "event" && (
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
            )}
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

          {kind === "event" && (
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
          )}

          <button type="submit" className="h-10 w-full rounded-xl bg-jade text-sm font-bold text-white">
            加入{kindMeta.label}
          </button>
        </form>
      </SectionCard>

      {(filterKind === "all" || filterKind === "todo") && (
        <ActiveTodosPanel
          items={items}
          todayId={todayId}
          showCompleted={showCompleted}
          onToggle={toggleItem}
          onRemove={removeItem}
        />
      )}

      {(filterKind === "all" || filterKind === "event") && (
        <ThreeDayTimetable
          horizon={threeDayHorizon}
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

      {filterKind === "todo" && (
        <div className="flex justify-end gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterKind(f.id)}
              className={`rounded-lg border px-2 py-1 text-[10px] font-bold active:scale-[0.98] ${
                filterKind === f.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className={`rounded-lg border px-2 py-1 text-[10px] font-bold active:scale-[0.98] ${
              showCompleted ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
            }`}
          >
            {showCompleted ? "隱藏完成" : "完成"}
          </button>
        </div>
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
    </div>
  );
}
