import { useEffect, useMemo, useRef, useState } from "react";
import { formatPersonalDayLabel, shiftDateId, toDateId, uid } from "../data";
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

const QUICK_DATES = [
  { label: "今日", offset: 0 },
  { label: "明日", offset: 1 },
  { label: "後日", offset: 2 },
];

const TIME_PRESETS = ["09:00", "12:00", "14:00", "18:00"];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function nextRoundedHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const ta = a.time || "99:99";
    const tb = b.time || "99:99";
    if (ta !== tb) return ta.localeCompare(tb);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function itemsForDate(items, dateId, filterKind = "all") {
  return sortItems(
    items.filter((item) => {
      if (item.date !== dateId) return false;
      if (filterKind === "all") return true;
      return item.kind === filterKind;
    }),
  );
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

function TimetableItem({ item, onToggle, onRemove, onPostpone }) {
  const kind = KINDS.find((k) => k.id === item.kind) || KINDS[0];
  const isEvent = item.kind === "event";

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
      <span
        className={`w-11 shrink-0 text-[10px] font-bold tabular-nums ${
          item.time ? "text-jade-deep" : "text-ink-faint"
        }`}
      >
        {item.time || "—"}
      </span>
      <span
        className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
          isEvent ? "bg-sky/15 text-sky-900" : "bg-jade-soft/80 text-jade-deep"
        }`}
      >
        {kind.label}
      </span>
      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left active:opacity-80">
        <p className={`truncate text-xs font-bold ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          {item.title}
        </p>
      </button>
      {!item.done && onPostpone && (
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

function ItemGroup({ label, items, onToggle, onRemove, onPostpone, muted = false }) {
  if (items.length === 0) return null;
  return (
    <div className={muted ? "opacity-80" : ""}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <TimetableItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
          />
        ))}
      </div>
    </div>
  );
}

function DayBlock({
  dateId,
  items,
  filterKind,
  showCompleted,
  active,
  onSelectDay,
  onToggle,
  onRemove,
  onPostpone,
}) {
  const dayItems = itemsForDate(items, dateId, filterKind);
  const events = dayItems.filter((i) => i.kind === "event" && !i.done);
  const todos = dayItems.filter((i) => i.kind === "todo" && !i.done);
  const done = dayItems.filter((i) => i.done);
  const pending = dayItems.filter((i) => !i.done);
  const splitView = filterKind === "all";
  const hasContent = showCompleted ? dayItems.length > 0 : pending.length > 0;

  return (
    <div
      className={`border-l-[3px] px-3 py-2.5 ${
        active ? "border-l-jade bg-jade-soft/20" : "border-l-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectDay(dateId)}
        className="mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-bold text-ink">{formatPersonalDayLabel(dateId)}</span>
        <span className={`text-[10px] font-bold ${pending.length > 0 ? "text-coral" : "text-ink-faint"}`}>
          {pending.length > 0
            ? `${pending.length} 項待做`
            : dayItems.length > 0
              ? "全部完成"
              : "無安排"}
        </span>
      </button>

      {!hasContent ? (
        <p className="text-[11px] text-ink-faint">—</p>
      ) : splitView ? (
        <div className="space-y-2">
          <ItemGroup label="📅 日程" items={events} onToggle={onToggle} onRemove={onRemove} onPostpone={onPostpone} />
          <ItemGroup label="☑️ 待辦" items={todos} onToggle={onToggle} onRemove={onRemove} onPostpone={onPostpone} />
          {showCompleted && (
            <ItemGroup
              label="✓ 已完成"
              items={done}
              onToggle={onToggle}
              onRemove={onRemove}
              onPostpone={onPostpone}
              muted
            />
          )}
          {!showCompleted && done.length > 0 && pending.length > 0 && (
            <p className="text-[10px] text-ink-faint">另有 {done.length} 項已完成</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <ItemGroup
            label="待做"
            items={pending}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
          />
          {showCompleted && (
            <ItemGroup
              label="✓ 已完成"
              items={done}
              onToggle={onToggle}
              onRemove={onRemove}
              onPostpone={onPostpone}
              muted
            />
          )}
          {!showCompleted && done.length > 0 && pending.length > 0 && (
            <p className="text-[10px] text-ink-faint">另有 {done.length} 項已完成</p>
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
  filterKind,
  showCompleted,
  onFilterKind,
  onShowCompleted,
  onSelectDay,
  onToggle,
  onRemove,
  onPostpone,
}) {
  return (
    <SectionCard
      title="黎緊 3 日"
      hint="按日分組 · 日程在上、待辦在下"
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
            filterKind={filterKind}
            showCompleted={showCompleted}
            active={dateId === selectedDate}
            onSelectDay={onSelectDay}
            onToggle={onToggle}
            onRemove={onRemove}
            onPostpone={onPostpone}
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
      if (!item.done) map[item.date] = (map[item.date] || 0) + 1;
    });
    return map;
  }, [items]);

  return (
    <SectionCard title="月曆" hint="紅點 = 該日有未完成項目">
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
  const [timeOpen, setTimeOpen] = useState(false);
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
  const [entryDate, setEntryDate] = useState(personalUi.selectedDate || todayId);
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
  const threeDayHorizon = useMemo(
    () => [todayId, shiftDateId(todayId, 1), shiftDateId(todayId, 2)],
    [todayId],
  );
  const todayStats = useMemo(() => {
    const todayItems = itemsForDate(items, todayId);
    return {
      pending: todayItems.filter((i) => !i.done).length,
      events: todayItems.filter((i) => i.kind === "event" && !i.done).length,
      todos: todayItems.filter((i) => i.kind === "todo" && !i.done).length,
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
    setEntryDate(dateId);
    const [y, m] = dateId.split("-").map(Number);
    setViewMonth({ year: y, month: m - 1 });
  }

  function selectKind(nextKind) {
    setKind(nextKind);
    if (nextKind === "event") {
      setTimeOpen(true);
      setEntryTime((t) => t || nextRoundedHour());
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
    const entry = {
      id: uid("personal"),
      title: trimmed,
      date: entryDate || selectedDate || todayId,
      time: kind === "event" || timeOpen ? entryTime.trim() : "",
      kind: kind === "event" ? "event" : "todo",
      note: "",
      done: false,
      createdAt: Date.now(),
    };
    setPersonal((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setTitle("");
    if (kind !== "event") {
      setEntryTime("");
      setTimeOpen(false);
    }
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
        item.id === id ? { ...item, date: shiftDateId(item.date, 1), done: false } : item,
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
  const outOfHorizonItems = selectedDate && !threeDayHorizon.includes(selectedDate)
    ? itemsForDate(items, selectedDate, filterKind)
    : [];

  return (
    <div className="space-y-3">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">個人日程</h2>
          <p className="text-[11px] text-ink-faint">待辦同日程分開睇 · 近 3 日優先</p>
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
        <div className="rounded-xl border border-jade/15 bg-white px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">今日待做</p>
          <p className="font-display text-lg font-bold text-coral">{todayStats.pending}</p>
        </div>
        <div className="rounded-xl border border-sky/20 bg-sky/8 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">日程</p>
          <p className="font-display text-lg font-bold text-ink">{todayStats.events}</p>
        </div>
        <div className="rounded-xl border border-jade/15 bg-jade-soft/40 px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-ink-faint">待辦</p>
          <p className="font-display text-lg font-bold text-jade-deep">{todayStats.todos}</p>
        </div>
      </div>

      <SectionCard
        title={`新增${kindMeta.label}`}
        hint={kind === "event" ? "日程建議填時間" : "待辦時間屬選填"}
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
            placeholder={kind === "event" ? "日程標題…" : "待辦事項…"}
            className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">日期</p>
            <div className="mb-1.5 flex gap-1">
              {QUICK_DATES.map(({ label, offset }) => {
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
                setSelectedDate(e.target.value);
              }}
              className="h-9 w-full rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
            />
          </div>

          {(kind === "event" || timeOpen) && (
            <div>
              <p className="mb-1 text-[10px] font-bold text-ink-faint">{kind === "event" ? "時間" : "時間（選填）"}</p>
              <div className="space-y-1">
                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
                  />
                  {kind === "todo" && (
                    <button
                      type="button"
                      onClick={() => {
                        setTimeOpen(false);
                        setEntryTime("");
                      }}
                      className="shrink-0 rounded-xl border border-jade/15 px-2 text-[10px] font-bold text-ink-faint"
                    >
                      清除
                    </button>
                  )}
                </div>
                {kind === "event" && (
                  <div className="flex flex-wrap gap-1">
                    {TIME_PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEntryTime(t)}
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
                )}
              </div>
            </div>
          )}

          {kind === "todo" && !timeOpen && (
            <button type="button" onClick={() => setTimeOpen(true)} className="text-[11px] font-bold text-jade-deep">
              ＋ 加時間
            </button>
          )}

          <button type="submit" className="h-10 w-full rounded-xl bg-jade text-sm font-bold text-white">
            加入{kindMeta.label}
          </button>
        </form>
      </SectionCard>

      <ThreeDayTimetable
        horizon={threeDayHorizon}
        items={items}
        selectedDate={selectedDate}
        filterKind={filterKind}
        showCompleted={showCompleted}
        onFilterKind={setFilterKind}
        onShowCompleted={setShowCompleted}
        onSelectDay={selectDay}
        onToggle={toggleItem}
        onRemove={removeItem}
        onPostpone={postponeItem}
      />

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

      {outOfHorizonItems.length > 0 && (
        <SectionCard title="其他日期" hint={formatPersonalDayLabel(selectedDate)}>
          <div className="space-y-2 p-3">
            {filterKind === "all" ? (
              <>
                <ItemGroup
                  label="📅 日程"
                  items={outOfHorizonItems.filter((i) => i.kind === "event" && !i.done)}
                  onToggle={toggleItem}
                  onRemove={removeItem}
                  onPostpone={postponeItem}
                />
                <ItemGroup
                  label="☑️ 待辦"
                  items={outOfHorizonItems.filter((i) => i.kind === "todo" && !i.done)}
                  onToggle={toggleItem}
                  onRemove={removeItem}
                  onPostpone={postponeItem}
                />
                {showCompleted && (
                  <ItemGroup
                    label="✓ 已完成"
                    items={outOfHorizonItems.filter((i) => i.done)}
                    onToggle={toggleItem}
                    onRemove={removeItem}
                    onPostpone={postponeItem}
                    muted
                  />
                )}
              </>
            ) : (
              <ItemGroup
                label="待做"
                items={outOfHorizonItems.filter((i) => !i.done)}
                onToggle={toggleItem}
                onRemove={removeItem}
                onPostpone={postponeItem}
              />
            )}
          </div>
        </SectionCard>
      )}

      {selectedDate && !threeDayHorizon.includes(selectedDate) && outOfHorizonItems.length === 0 && (
        <SectionCard title="其他日期" hint={formatPersonalDayLabel(selectedDate)}>
          <p className="px-3 py-4 text-center text-xs text-ink-faint">呢日無安排</p>
        </SectionCard>
      )}
    </div>
  );
}
