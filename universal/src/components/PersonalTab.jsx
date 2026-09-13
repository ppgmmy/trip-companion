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

function itineraryForDate(itinerary, dateId) {
  const list = itinerary?.[dateId];
  if (!Array.isArray(list) || list.length === 0) return [];
  return [...list].sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

function itineraryCountMap(itinerary) {
  const map = {};
  if (!itinerary || typeof itinerary !== "object") return map;
  Object.entries(itinerary).forEach(([dateId, list]) => {
    if (Array.isArray(list) && list.length > 0) map[dateId] = list.length;
  });
  return map;
}

function dayAgendaEntries(items, itinerary, dateId) {
  const trip = itineraryForDate(itinerary, dateId).map((entry) => ({
    key: entry.id || `trip-${entry.time}-${entry.text}`,
    time: entry.time || "",
    title: entry.text || entry.title || "旅程行程",
    source: "trip",
    done: false,
  }));
  // 月曆：已完成都照顯示，方便回睇當日有過咩約
  const personal = eventsForDate(items, dateId).map((entry) => ({
    key: entry.id,
    time: entry.time || "",
    title: entry.title || "個人日程",
    source: "personal",
    done: Boolean(entry.done),
  }));
  return [...trip, ...personal].sort((a, b) => {
    // 未完成排前，已完成排後；同組再按時間
    if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
    return String(a.time || "99:99").localeCompare(String(b.time || "99:99"));
  });
}


function TripItineraryList({ items, tripLabel }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800/80">
        ✈️ 旅程{tripLabel ? ` · ${tripLabel}` : ""}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div
            key={item.id || `${item.time}-${item.text}`}
            className="flex items-center gap-1.5 rounded-md border border-amber-300/40 bg-amber-50/80 px-1.5 py-1"
          >
            <span className="w-10 shrink-0 text-[9px] font-bold tabular-nums text-amber-900">
              {item.time || "—"}
            </span>
            <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-ink">{item.text || item.title || "行程"}</p>
          </div>
        ))}
      </div>
    </div>
  );
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
    <section className={`overflow-hidden rounded-xl border border-jade/15 bg-white shadow-[var(--shadow-soft)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-1.5 border-b border-jade/10 bg-mist/40 px-2.5 py-1.5">
          <div className="min-w-0">
            {title && <p className="text-[11px] font-bold text-ink">{title}</p>}
            {hint && <p className="text-[9px] leading-tight text-ink-faint">{hint}</p>}
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
      className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 ${
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
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] font-bold ${
          item.done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
        }`}
        aria-label={item.done ? "標記未完成" : "標記完成"}
      >
        ✓
      </button>
      {isEvent ? (
        <span className="w-10 shrink-0 text-[9px] font-bold tabular-nums text-jade-deep">{item.time || "—"}</span>
      ) : (
        <span
          className={`shrink-0 rounded border px-1 py-px text-[8px] font-bold ${item.done ? "text-ink-faint" : priorityClass(tier)}`}
        >
          {activeLabel}
        </span>
      )}
      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left active:opacity-80">
        <p className={`truncate text-[11px] font-bold ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
          {item.title}
        </p>
        {!isEvent && !item.done && (
          <p className="truncate text-[9px] text-ink-faint">
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
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="space-y-0.5">
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
      <div className="space-y-1.5 p-2">
        {active.length === 0 ? (
          <p className="text-center text-[11px] text-ink-faint">無進行中待辦</p>
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
          <p className="text-[9px] text-ink-faint">另有 {doneTodos.length} 項已完成</p>
        )}
      </div>
    </SectionCard>
  );
}

function DayBlock({
  dateId,
  items,
  tripItems = [],
  tripLabel = "",
  showCompleted,
  active,
  onSelectDay,
  onToggle,
  onRemove,
  onPostpone,
  todayId,
}) {
  const dayEvents = eventsForDate(items, dateId);
  const pending = dayEvents.filter((i) => !i.done);
  const done = dayEvents.filter((i) => i.done);
  const visible = showCompleted ? dayEvents : pending;
  const hasContent = visible.length > 0 || tripItems.length > 0;
  const totalPending = pending.length + tripItems.length;

  return (
    <div className={`border-l-[3px] px-2.5 py-1.5 ${active ? "border-l-jade bg-jade-soft/20" : "border-l-transparent"}`}>
      <button
        type="button"
        onClick={() => onSelectDay(dateId)}
        className="mb-1 flex w-full items-center justify-between text-left"
      >
        <span className="text-[12px] font-bold text-ink">{formatPersonalDayLabel(dateId)}</span>
        <span className={`text-[9px] font-bold ${totalPending > 0 ? "text-coral" : "text-ink-faint"}`}>
          {totalPending > 0
            ? `${totalPending} 項`
            : dayEvents.length > 0
              ? "已完成"
              : "無行程"}
        </span>
      </button>

      {!hasContent ? (
        <p className="text-[10px] text-ink-faint">—</p>
      ) : (
        <div className="space-y-1.5">
          <TripItineraryList items={tripItems} tripLabel={tripLabel} />
          <ItemGroup
            label="📅 個人日程"
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
            <p className="text-[9px] text-ink-faint">另有 {done.length} 個已完成日程</p>
          )}
        </div>
      )}
    </div>
  );
}

function SevenDayTimetable({
  horizon,
  items,
  itinerary = {},
  tripLabel = "",
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
      hint="個人日程＋旅程行程"
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
            tripItems={itineraryForDate(itinerary, dateId)}
            tripLabel={tripLabel}
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

function PersonalCalendar({
  year,
  month,
  selectedDate,
  todayId,
  items,
  itinerary = {},
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}) {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const agendaByDate = useMemo(() => {
    const map = {};
    cells.forEach((dateId) => {
      if (!dateId) return;
      const entries = dayAgendaEntries(items, itinerary, dateId);
      if (entries.length) map[dateId] = entries;
    });
    return map;
  }, [cells, items, itinerary]);

  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-gradient-to-b from-jade-soft/35 to-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between px-2 py-1.5 sm:px-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-sm font-bold text-jade-deep shadow-sm active:scale-95"
          aria-label="上個月"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-[13px] font-bold text-ink">
            {year} 年 {month + 1} 月
          </p>
          <p className="text-[9px] text-ink-faint">有約高亮 · 橙旅程 · 藍個人</p>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-sm font-bold text-jade-deep shadow-sm active:scale-95"
          aria-label="下個月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px px-1 pb-0.5 sm:px-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-0.5 text-center text-[9px] font-bold text-jade-deep">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px px-1 pb-1.5 sm:px-2">
        {cells.map((dateId, idx) => {
          if (!dateId) {
            return <div key={`empty-${idx}`} className="min-h-[3.25rem] sm:min-h-[3.75rem]" />;
          }
          const isToday = dateId === todayId;
          const isSelected = dateId === selectedDate;
          const entries = agendaByDate[dateId] || [];
          const hasPlan = entries.length > 0;
          const visible = entries.slice(0, 2);
          const extra = entries.length - visible.length;
          const dayNum = Number(dateId.split("-")[2]);

          return (
            <button
              key={dateId}
              type="button"
              onClick={() => onSelectDay(dateId)}
              aria-label={
                hasPlan
                  ? `${dayNum}號，有 ${entries.length} 項行程`
                  : `${dayNum}號，未有行程`
              }
              className={`relative flex min-h-[3.25rem] flex-col rounded-md border p-px text-left transition active:scale-[0.98] sm:min-h-[3.75rem] sm:rounded-lg sm:p-0.5 ${
                isSelected
                  ? "border-jade bg-jade text-white shadow-md"
                  : hasPlan
                    ? isToday
                      ? "border-coral/45 bg-coral-soft/35 text-ink shadow-sm ring-1 ring-coral/30"
                      : "border-coral/30 bg-coral-soft/25 text-ink shadow-sm"
                    : isToday
                      ? "border-jade/35 bg-white text-ink ring-1 ring-jade/35"
                      : "border-transparent bg-white/55 text-ink-soft opacity-70"
              }`}
            >
              <span className="mb-px flex items-center justify-between gap-0.5">
                <span
                  className={`flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[9px] font-extrabold leading-none sm:h-4 sm:min-w-4 sm:text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : hasPlan
                        ? "bg-coral text-white"
                        : isToday
                          ? "bg-jade-soft text-jade-deep"
                          : "text-ink-soft"
                  }`}
                >
                  {dayNum}
                </span>
                {hasPlan && !isSelected && (
                  <span className="rounded-full bg-coral px-0.5 text-[7px] font-extrabold leading-none text-white">
                    {entries.length}
                  </span>
                )}
                {hasPlan && isSelected && (
                  <span className="rounded-full bg-white/25 px-0.5 text-[7px] font-extrabold leading-none text-white">
                    {entries.length}
                  </span>
                )}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden">
                {visible.map((entry) => (
                  <span
                    key={entry.key}
                    className={`block truncate rounded px-0.5 text-[7px] font-bold leading-tight sm:text-[8px] ${
                      entry.done
                        ? isSelected
                          ? "bg-white/15 text-white/75 line-through"
                          : "bg-mist text-ink-faint line-through"
                        : isSelected
                          ? entry.source === "trip"
                            ? "bg-amber-100/90 text-amber-950"
                            : "bg-white/25 text-white"
                          : entry.source === "trip"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-sky-100 text-sky-900"
                    }`}
                    title={`${entry.done ? "已完成 · " : ""}${entry.time ? `${entry.time} ` : ""}${entry.title}`}
                  >
                    {entry.done ? "✓ " : ""}
                    {entry.time ? `${entry.time} ` : ""}
                    {entry.title}
                  </span>
                ))}
                {extra > 0 && (
                  <span className={`text-[7px] font-bold ${isSelected ? "text-white/85" : "text-coral"}`}>
                    +{extra}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function PersonalTab({ personal, setPersonal, focusAddTick = 0, trip = null, itinerary = {} }) {
  const todayId = toDateId(new Date());
  const titleRef = useRef(null);
  const formRef = useRef(null);
  const undoRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [addFormOpen, setAddFormOpen] = useState(false);
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
  const tripItinerary = useMemo(
    () => (itinerary && typeof itinerary === "object" ? itinerary : {}),
    [itinerary],
  );
  const tripLabel = trip?.city || trip?.name || trip?.title || "";

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
    const todayTrip = itineraryForDate(tripItinerary, todayId).length;
    const weekTrip = sevenDayHorizon.reduce((sum, id) => sum + itineraryForDate(tripItinerary, id).length, 0);
    return {
      events: events.length + todayTrip,
      weekEvents: weekEvents + weekTrip,
    };
  }, [items, todayId, sevenDayHorizon, tripItinerary]);

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
    if (focusAddTick <= 0) return;
    setAddFormOpen(true);
    const t = window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      titleRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
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
  const selectedTripItems = selectedDate ? itineraryForDate(tripItinerary, selectedDate) : [];
  const selectedPersonalEvents = selectedDate ? eventsForDate(items, selectedDate) : [];
  const selectedPersonalVisible = showCompleted
    ? selectedPersonalEvents
    : selectedPersonalEvents.filter((i) => !i.done);
  // 果日有行程／日程先 show；月曆打開時撳日子即睇當日內容
  const showSelectedDayPanel =
    Boolean(selectedDate) &&
    (selectedTripItems.length > 0 || selectedPersonalVisible.length > 0) &&
    (calendarOpen || !sevenDayHorizon.includes(selectedDate));

  const activeView = PERSONAL_VIEWS.find((v) => v.id === section) || PERSONAL_VIEWS[0];

  return (
    <div className="space-y-2">
      {toast && <UndoToast message={toast.message} onUndo={toast.undo ? undoRemove : null} />}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-tight text-ink">
            {section === "mine" ? "行程" : section === "shared" ? "To-Do" : section === "daily" ? "每日" : "個人"}
          </h2>
          <p className="truncate text-[10px] text-ink-faint">{activeView.hint}</p>
        </div>
        {section === "mine" && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setAddFormOpen((v) => !v)}
              className="rounded-lg border border-jade/15 bg-white px-2 py-1 text-[10px] font-bold text-jade-deep"
            >
              {addFormOpen ? "收起新增" : "+ 新增"}
            </button>
            <button
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              className="rounded-lg border border-jade/15 bg-white px-2 py-1 text-[10px] font-bold text-jade-deep"
            >
              {calendarOpen ? "收起月曆" : "月曆"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {PERSONAL_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSection(v.id)}
            className={`min-h-8 rounded-lg border px-1.5 text-[11px] font-bold transition active:scale-[0.98] ${
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
      <div className="grid grid-cols-2 gap-1">
        <div className="rounded-lg border border-sky/20 bg-sky/8 px-2 py-1 text-center">
          <p className="text-[9px] font-bold text-ink-faint">今日</p>
          <p className="font-display text-base font-bold leading-tight text-ink">{todayStats.events}</p>
        </div>
        <div className="rounded-lg border border-jade/15 bg-jade-soft/40 px-2 py-1 text-center">
          <p className="text-[9px] font-bold text-ink-faint">近 7 日</p>
          <p className="font-display text-base font-bold leading-tight text-jade-deep">{todayStats.weekEvents}</p>
        </div>
      </div>

      
      {calendarOpen && (
        <PersonalCalendar
          year={viewMonth.year}
          month={viewMonth.month}
          selectedDate={selectedDate}
          todayId={todayId}
          items={items}
          itinerary={tripItinerary}
          onSelectDay={selectDay}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
        />
      )}

      {addFormOpen && (
      <SectionCard
        title="新增行程"
        hint="必填時間"
      >
        <form ref={formRef} onSubmit={addItem} className="space-y-1.5 p-2">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="幾時做咩？例如：食飯、開會…"
            className="h-8 w-full rounded-lg border border-jade/15 bg-mist px-2.5 text-[13px] outline-none ring-jade focus:ring-2"
          />

          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <div>
              <div className="mb-1 flex gap-1">
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
                      className={`min-h-6 flex-1 rounded-md border text-[10px] font-bold active:scale-[0.98] ${
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
                className="h-8 w-full rounded-lg border border-jade/15 bg-mist px-2 text-[11px] outline-none ring-jade focus:ring-2"
              />
            </div>
            <div className="w-[6.5rem]">
              <input
                type="time"
                value={entryTime}
                onChange={(e) => {
                  setEntryTime(e.target.value);
                  setTimeError(false);
                }}
                required
                className={`h-8 w-full rounded-lg border bg-mist px-1.5 text-[11px] outline-none ring-jade focus:ring-2 ${
                  timeError ? "border-coral ring-coral" : "border-jade/15"
                }`}
              />
              {timeError && <p className="mt-0.5 text-[9px] font-bold text-coral">要時間</p>}
              <div className="mt-1 flex flex-wrap gap-0.5">
                {TIME_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setEntryTime(t);
                      setTimeError(false);
                    }}
                    className={`rounded border px-1 py-px text-[9px] font-bold active:scale-95 ${
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

          <button type="submit" className="h-8 w-full rounded-lg bg-jade text-[13px] font-bold text-white">
            加入行程
          </button>
        </form>
      </SectionCard>
      )}



      <SevenDayTimetable
          horizon={sevenDayHorizon}
          items={items}
          itinerary={tripItinerary}
          tripLabel={tripLabel}
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

      {showSelectedDayPanel && (
        <SectionCard
          title={calendarOpen ? "當日行程" : "其他日期 · 行程"}
          hint={formatPersonalDayLabel(selectedDate)}
        >
          <div className="space-y-1.5 p-2">
            <TripItineraryList items={selectedTripItems} tripLabel={tripLabel} />
            <ItemGroup
              label="📅 個人日程"
              items={selectedPersonalVisible}
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
