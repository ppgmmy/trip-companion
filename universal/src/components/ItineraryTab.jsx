import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildTripDayList,
  dayPlanForTrip,
  mapConfigForTrip,
  markersForDayPlan,
  slotsToItineraryItems,
} from "../data/itineraryGuide";
import { toDateId } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey, TRIP_SECTIONS } from "../storage";
import TripMap from "./TripMap";

const KIND_LABEL = { food: "食", spot: "景點" };
const KIND_STYLE = {
  food: "bg-coral-soft text-coral",
  spot: "bg-jade-soft text-jade-deep",
};

export { buildDays } from "./itineraryDays";

export default function ItineraryTab({ trip, itinerary, setItinerary }) {
  const mapRef = useRef(null);
  const todayId = toDateId(new Date());
  const [itineraryUi, setItineraryUi] = useLocalStorage(tripKey(trip.id, TRIP_SECTIONS.itineraryUi), { dayId: null }, {
    migrate: (v) => (v && typeof v === "object" ? v : { dayId: null }),
  });
  const [dayId, setDayId] = useState(itineraryUi.dayId);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [note, setNote] = useState("");
  const [time, setTime] = useState("10:00");

  const days = useMemo(() => buildTripDayList(trip), [trip]);
  const activeDayId = dayId && days.some((d) => d.id === dayId) ? dayId : days[0]?.id;
  const activeDay = days.find((d) => d.id === activeDayId) || days[0];
  const dayIndex = activeDay ? activeDay.index - 1 : 0;

  const dayPlan = useMemo(
    () => (trip && activeDayId ? dayPlanForTrip(trip, activeDayId, dayIndex) : null),
    [trip, activeDayId, dayIndex],
  );

  const mapConfig = useMemo(
    () => mapConfigForTrip(trip, dayPlan?.zone),
    [trip, dayPlan?.zone],
  );

  const mapMarkers = useMemo(
    () => markersForDayPlan(trip, dayPlan),
    [trip, dayPlan],
  );

  useEffect(() => {
    if (dayId) setItineraryUi((prev) => ({ ...prev, dayId }));
  }, [dayId, setItineraryUi]);

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
        a.time.localeCompare(b.time),
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

  function focusOnMap(markerId) {
    setSelectedMarkerId(markerId);
    mapRef.current?.scrollIntoView();
    window.requestAnimationFrame(() => mapRef.current?.focusMarker(markerId));
  }

  function applySuggestion() {
    if (!activeDay || !dayPlan?.slots?.length) return;
    const incoming = slotsToItineraryItems(dayPlan.slots);
    setItinerary((prev) => {
      const existing = prev[activeDay.id] || [];
      const merged = [...existing];
      incoming.forEach((item) => {
        const dup = merged.some((x) => x.time === item.time && x.text === item.text);
        if (!dup) merged.push(item);
      });
      merged.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [activeDay.id]: merged };
    });
  }

  if (!trip) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">行程地圖</h2>
        <p className="text-sm text-ink-soft">
          {trip.startDate} → {trip.endDate}
          {trip.city?.includes("大阪") || (trip.city || "").toLowerCase().includes("osaka")
            ? " · 堺筋本町基地 · 食→景點→食→景點"
            : " · 食→景點→食→景點"}
        </p>
      </div>

      <TripMap
        ref={mapRef}
        config={mapConfig}
        markers={mapMarkers}
        selectedId={selectedMarkerId}
        onSelect={focusOnMap}
        heightClass="h-56 sm:h-64"
      />

      <div className="flex items-center gap-2">
        <div className="scroll-thin -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">
          {days.map((d) => {
            const active = d.id === activeDayId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDayId(d.id)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.98] ${
                  active ? "border-jade bg-jade text-white shadow-[var(--shadow-soft)]" : "border-jade/15 bg-white/85 text-ink-soft"
                }`}
              >
                <p className="text-[10px] font-bold opacity-80">Day {d.index}</p>
                <p className={`text-xs font-bold ${active ? "text-white" : "text-ink"}`}>{d.dateLabel}</p>
              </button>
            );
          })}
        </div>
        {activeDayId !== todayId && days.some((d) => d.id === todayId) && (
          <button
            type="button"
            onClick={() => setDayId(todayId)}
            className="shrink-0 rounded-xl border border-jade/20 bg-jade-soft px-2.5 py-2 text-[10px] font-bold text-jade-deep"
          >
            今日
          </button>
        )}
      </div>

      {dayPlan && (
        <section className="rounded-3xl border border-jade/20 bg-white/90 p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-jade">今日建議</p>
              <h3 className="font-display text-base font-bold text-ink">{dayPlan.title}</h3>
              <p className="text-xs text-ink-soft">{dayPlan.vibe}</p>
            </div>
            <button
              type="button"
              onClick={applySuggestion}
              disabled={!hasSuggestion}
              className="shrink-0 rounded-xl bg-jade px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40"
            >
              套用
            </button>
          </div>

          <ol className="mt-3 space-y-2">
            {dayPlan.slots.map((s) => {
              const markerId = `${s.time}-${s.title}`;
              const active = selectedMarkerId === markerId;
              return (
              <li key={markerId}>
                <button
                  type="button"
                  onClick={() => focusOnMap(markerId)}
                  className={`w-full rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
                    active ? "bg-jade-soft/70 ring-2 ring-jade/30" : "bg-mist/70"
                  }`}
                >
                <div className="flex items-start gap-2">
                  <span className="w-10 shrink-0 text-xs font-bold text-jade-deep">{s.time}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${KIND_STYLE[s.kind]}`}>
                        {KIND_LABEL[s.kind]}
                      </span>
                      <p className="text-sm font-bold text-ink">{s.title}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">{s.detail}</p>
                    {s.area && <p className="mt-0.5 text-[10px] font-semibold text-ink-faint">{s.area}</p>}
                  </div>
                  {active && <span className="shrink-0 text-[10px] font-bold text-jade-deep">↑ 地圖</span>}
                </div>
                </button>
              </li>
            );
            })}
          </ol>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">我的手動行程</p>
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
            placeholder="加一項行程"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <button type="submit" className="h-11 shrink-0 rounded-2xl bg-jade px-4 text-sm font-bold text-white transition active:scale-95">
            加
          </button>
        </form>

        <ol className="space-y-2">
          {userItems.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-6 text-center text-sm text-ink-faint">
              此日暫無手動行程，可按「套用」加入建議，或自行新增。
            </li>
          ) : (
            userItems.map((item) => (
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
      </section>
    </div>
  );
}
