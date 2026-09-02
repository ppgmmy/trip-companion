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

function TimetableItem({ item, onToggle, onRemove, onPostpone, compact = false }) {
  const kind = KINDS.find((k) => k.id === item.kind) || KINDS[0];
  const isEvent = item.kind === "event";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${
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
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
          item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
        }`}
        aria-label={item.done ? "標記未完成" : "標記完成"}
      >
        ✓
      </button>
      {!compact && item.time && (
        <span className="w-10 shrink-0 text-[10px] font-bold tabular-nums text-jade-deep">{item.time}</span>
      )}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="min-w-0 flex-1 text-left active:opacity-80"
      >
        <p className={`truncate text-xs font-bold ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          <span className="mr-1">{kind.icon}</span>
          {compact && item.time && <span className="mr-1 text-jade-deep">{item.time}</span>}
          {item.title}
        </p>
        {!compact && item.note && <p className="truncate text-[10px] text-ink-soft">{item.note}</p>}
      </button>
      {!item.done && onPostpone && (
        <button
          type="button"
          onClick={() => onPostpone(item.id)}
          className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold text-jade-deep active:scale-95"
          aria-label="延後一日"
          title="延後一日"
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

function ThreeDayTimetable({
  horizon,
  items,
  selectedDate,
  filterKind,
  showCompleted,
  onSelectDay,
  onToggle,
  onRemove,
  onPostpone,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-jade/10 bg-mist/40 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-jade">黎緊 3 日 · 要做咩</p>
      </div>

      <div className="divide-y divide-jade/10">
        {horizon.map((dateId) => {
          const dayItems = itemsForDate(items, dateId, filterKind);
          const pending = dayItems.filter((i) => !i.done);
          const done = dayItems.filter((i) => i.done);
          const visible = showCompleted ? [...pending, ...done] : pending;
          const active = dateId === selectedDate;

          return (
            <div key={dateId} className={`px-3 py-2.5 ${active ? "bg-jade-soft/25" : ""}`}>
              <button
                type="button"
                onClick={() => onSelectDay(dateId)}
                className="mb-1.5 flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-bold text-ink">{formatPersonalDayLabel(dateId)}</span>
                <span className={`text-[10px] font-bold ${pending.length > 0 ? "text-coral" : "text-ink-faint"}`}>
                  {pending.length > 0 ? `${pending.length} 項待做` : dayItems.length > 0 ? "已完成" : "無安排"}
                </span>
              </button>

              {visible.length === 0 ? (
                <p className="text-[11px] text-ink-faint">—</p>
              ) : (
                <div className="space-y-1">
                  {visible.map((item) => (
                    <TimetableItem
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onRemove={onRemove}
                      onPostpone={onPostpone}
                      compact
                    />
                  ))}
                  {!showCompleted && done.length > 0 && pending.length > 0 && (
                    <p className="pt-0.5 text-[10px] text-ink-faint">+{done.length} 項已完成</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
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
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-jade/10 bg-mist/50 px-3 py-2">
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
  const todayPending = itemsForDate(items, todayId).filter((i) => !i.done).length;
  const todayEvents = itemsForDate(items, todayId, "event").filter((i) => !i.done).length;

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

  return (
    <div className="space-y-2.5">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}

      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">個人日程</h2>
          <p className="text-xs text-ink-soft">
            今日 {todayPending > 0 ? `仲有 ${todayPending} 項` : "無待辦"}
            {todayEvents > 0 && ` · ${todayEvents} 個日程`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          className="shrink-0 rounded-xl border border-jade/15 bg-white px-2.5 py-1.5 text-[11px] font-bold text-jade-deep"
        >
          {calendarOpen ? "收起月曆" : "月曆"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => selectKind(k.id)}
            className={`min-h-9 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] ${
              kind === k.id ? "badge-active border-transparent" : "border-jade/15 bg-white text-ink-soft"
            }`}
          >
            {k.icon} {k.label}
          </button>
        ))}
      </div>

      <form
        ref={formRef}
        onSubmit={addItem}
        className="rounded-2xl border border-jade/15 bg-white/90 p-2.5 shadow-[var(--shadow-soft)]"
      >
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "event" ? "日程標題…" : "待辦事項…"}
          className="mb-1.5 h-10 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />

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

        {(kind === "event" || timeOpen) && (
          <div className="mb-1.5 space-y-1">
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
                  唔要時間
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
                      entryTime === t ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {kind === "todo" && !timeOpen && (
          <button
            type="button"
            onClick={() => setTimeOpen(true)}
            className="mb-1.5 text-[11px] font-bold text-jade-deep"
          >
            ＋ 加時間（選填）
          </button>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-1.5">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => {
              setEntryDate(e.target.value);
              setSelectedDate(e.target.value);
            }}
            className="h-9 min-w-0 rounded-xl border border-jade/15 bg-mist px-2 text-xs outline-none ring-jade focus:ring-2"
          />
          <button type="submit" className="h-9 rounded-xl bg-jade px-4 text-xs font-bold text-white">
            加入{kindMeta.label}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterKind(f.id)}
              className={`min-h-7 flex-1 rounded-lg border text-[10px] font-bold active:scale-[0.98] ${
                filterKind === f.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold active:scale-[0.98] ${
            showCompleted ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
          }`}
        >
          {showCompleted ? "隱藏完成" : "顯示完成"}
        </button>
      </div>

      <ThreeDayTimetable
        horizon={threeDayHorizon}
        items={items}
        selectedDate={selectedDate}
        filterKind={filterKind}
        showCompleted={showCompleted}
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

      {selectedDate && !threeDayHorizon.includes(selectedDate) && (
        <section className="rounded-2xl border border-jade/10 bg-white/85 px-3 py-2 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-bold text-ink-faint">{formatPersonalDayLabel(selectedDate)}</p>
          <div className="mt-1.5 space-y-1">
            {itemsForDate(items, selectedDate, filterKind).length === 0 ? (
              <p className="text-xs text-ink-faint">無安排</p>
            ) : (
              itemsForDate(items, selectedDate, filterKind).map((item) => (
                <TimetableItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onRemove={removeItem}
                  onPostpone={postponeItem}
                  compact
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
