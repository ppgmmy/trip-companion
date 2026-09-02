import { useEffect, useMemo, useState } from "react";
import { WEEKDAY_LABELS, formatMoney, toDateId, tripDays } from "../data";
import PlacesPanel from "./PlacesPanel";

function pad(n) {
  return String(n).padStart(2, "0");
}

export function buildDays(trip) {
  if (!trip) return [];
  const start = new Date(trip.startDate);
  const total = tripDays(trip);
  const days = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({
      id: toDateId(d),
      index: i + 1,
      date: d,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY_LABELS[d.getDay()]}）`,
      items: [],
    });
  }
  return days;
}

export default function ItineraryTab({ trip, itinerary, setItinerary }) {
  const [dayId, setDayId] = useState(null);
  const [note, setNote] = useState("");
  const [time, setTime] = useState("10:00");

  const days = useMemo(() => buildDays(trip), [trip]);
  const activeDayId = dayId && days.some((d) => d.id === dayId) ? dayId : days[0]?.id;
  const activeDay = days.find((d) => d.id === activeDayId) || days[0];

  useEffect(() => {
    if (dayId || !days.length) return;
    const today = toDateId(new Date());
    const todayInTrip = days.find((d) => d.id === today);
    setDayId(todayInTrip?.id || days[0].id);
  }, [dayId, days]);

  function addItem(e) {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed || !activeDay) return;
    setItinerary((prev) => ({
      ...prev,
      [activeDay.id]: [...(prev[activeDay.id] || []), { id: `it-${Date.now()}`, time, text: trimmed }].sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));
    setNote("");
  }

  function removeItem(dayIdStr, itemId) {
    setItinerary((prev) => ({
      ...prev,
      [dayIdStr]: (prev[dayIdStr] || []).filter((x) => x.id !== itemId),
    }));
  }

  if (!trip) return null;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">選擇日期</span>
        <select
          value={activeDayId || ""}
          onChange={(e) => setDayId(e.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-jade/15 bg-white/90 px-4 text-base font-medium outline-none ring-jade focus:ring-2"
        >
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              Day {d.index} · {d.dateLabel}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={addItem} className="flex gap-2 rounded-3xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-11 w-24 shrink-0 rounded-2xl border border-jade/15 bg-mist px-2 text-center text-sm outline-none ring-jade focus:ring-2"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="加一項行程（例：早上逛 Siam Paragon）"
          className="h-11 min-w-0 flex-1 rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
        />
        <button type="submit" className="h-11 shrink-0 rounded-2xl bg-jade px-4 text-sm font-bold text-white transition active:scale-95">
          加
        </button>
      </form>

      <ol className="space-y-2">
        {(itinerary[activeDay?.id] || []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">
            此日暫無安排，用上方快速加入。
          </li>
        ) : (
          (itinerary[activeDay?.id] || []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
              <span className="w-12 shrink-0 text-xs font-bold text-jade-deep">{item.time}</span>
              <span className="min-w-0 flex-1 text-sm text-ink">{item.text}</span>
              <button
                type="button"
                onClick={() => removeItem(activeDay.id, item.id)}
                className="shrink-0 text-ink-faint transition active:scale-90"
                aria-label="刪除"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))
        )}
      </ol>

      <PlacesPanel trip={trip} />
    </div>
  );
}
