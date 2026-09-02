import { WEEKDAY_LABELS, toDateId, tripDays } from "../data";

/** @deprecated 用 buildTripDayList；保留相容 */
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
