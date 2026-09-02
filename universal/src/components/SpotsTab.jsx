import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BADGES,
  INDOOR_TAGS,
  PLACE_TYPES,
  inferPlaceType,
  placeTypeMeta,
  toDateId,
  tripDays,
  WEEKDAY_LABELS,
} from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey } from "../storage";

function buildTripDayOptions(trip) {
  if (!trip?.startDate) return [];
  const start = new Date(trip.startDate);
  const total = tripDays(trip);
  const days = [];
  for (let i = 0; i < total; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const id = toDateId(d);
    days.push({
      id,
      index: i + 1,
      label: `D${i + 1} · ${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY_LABELS[d.getDay()]}）`,
      short: `D${i + 1}`,
    });
  }
  return days;
}

function normalizeSpot(spot) {
  return {
    ...spot,
    type: inferPlaceType(spot),
    note: typeof spot.note === "string" ? spot.note : "",
    dayId: spot.dayId || "",
    badges: Array.isArray(spot.badges) ? spot.badges : [],
  };
}

function Stars({ value }) {
  return (
    <span className="tabular-nums text-[11px] font-bold tracking-tight text-amber-700" aria-label={`${value} 星`}>
      {"★".repeat(value)}
      <span className="text-ink-faint">{"☆".repeat(5 - value)}</span>
    </span>
  );
}

export default function SpotsTab({ trip, spots, setSpots, adapt = false }) {
  const dayOptions = useMemo(() => buildTripDayOptions(trip), [trip]);
  const todayId = toDateId(new Date());
  const defaultDay =
    dayOptions.find((d) => d.id === todayId)?.id || dayOptions[0]?.id || "";

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("spot");
  const [dayId, setDayId] = useState(defaultDay);
  const [rating, setRating] = useState(4);
  const [selected, setSelected] = useState([]);
  const [newBadge, setNewBadge] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("timeline"); // timeline | gallery
  const [customBadges, setCustomBadges] = useLocalStorage(tripKey(trip.id, "badges"), [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });

  useEffect(() => {
    if (!Array.isArray(spots)) return;
    const needs = spots.some((s) => !s.type || s.note == null || !Array.isArray(s.badges));
    if (!needs) return;
    setSpots(spots.map(normalizeSpot));
  }, [spots, setSpots]);

  useEffect(() => {
    if (!dayId && defaultDay) setDayId(defaultDay);
  }, [dayId, defaultDay]);

  const allBadges = [...DEFAULT_BADGES, ...customBadges.map((b) => ({ id: `custom-${b}`, label: b }))];

  const normalized = useMemo(() => spots.map(normalizeSpot), [spots]);

  const stats = useMemo(() => {
    const areas = new Set(normalized.map((s) => s.area).filter(Boolean));
    const byType = {};
    PLACE_TYPES.forEach((t) => {
      byType[t.id] = 0;
    });
    let ratingSum = 0;
    let rated = 0;
    normalized.forEach((s) => {
      byType[s.type] = (byType[s.type] || 0) + 1;
      if (s.rating > 0) {
        ratingSum += s.rating;
        rated += 1;
      }
    });
    return {
      total: normalized.length,
      areas: areas.size,
      avg: rated ? (ratingSum / rated).toFixed(1) : "—",
      byType,
      daysCovered: new Set(normalized.map((s) => s.dayId).filter(Boolean)).size,
    };
  }, [normalized]);

  const filtered = useMemo(() => {
    let list = normalized.slice();
    if (filterType !== "all") list = list.filter((s) => s.type === filterType);

    const indoorRank = (s) => {
      const tags = [...(s.badges || []), s.area || "", s.name || "", s.type || ""].join(" ");
      const indoor =
        INDOOR_TAGS.some((t) => tags.includes(t)) ||
        /cafe|咖啡|商場|museum|博物館|food|shop/i.test(tags) ||
        ["cafe", "food", "shop"].includes(s.type);
      return indoor ? 1 : 0;
    };

    list.sort((a, b) => {
      if (adapt) {
        const diff = indoorRank(b) - indoorRank(a);
        if (diff !== 0) return diff;
      }
      const dayA = a.dayId || "9999-99-99";
      const dayB = b.dayId || "9999-99-99";
      if (dayA !== dayB) return dayA.localeCompare(dayB);
      return (b.rating || 0) - (a.rating || 0) || (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }, [normalized, filterType, adapt]);

  const timelineGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach((spot) => {
      const key = spot.dayId || "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(spot);
    });
    const ordered = [];
    dayOptions.forEach((d) => {
      if (map.has(d.id)) ordered.push({ day: d, spots: map.get(d.id) });
    });
    if (map.has("_none")) {
      ordered.push({
        day: { id: "_none", index: null, label: "未標日子", short: "—" },
        spots: map.get("_none"),
      });
    }
    return ordered;
  }, [filtered, dayOptions]);

  function toggleBadge(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addCustomBadge(e) {
    e.preventDefault();
    const label = newBadge.trim();
    if (!label || customBadges.includes(label)) return;
    setCustomBadges((prev) => [...prev, label]);
    setNewBadge("");
  }

  function resetForm() {
    setName("");
    setArea("");
    setNote("");
    setType("spot");
    setDayId(defaultDay);
    setRating(4);
    setSelected([]);
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSpots((prev) => [
      ...prev,
      {
        id: `spot-${Date.now()}`,
        name: name.trim(),
        area: area.trim(),
        note: note.trim(),
        type,
        dayId: dayId || "",
        rating,
        badges: selected,
        createdAt: Date.now(),
      },
    ]);
    resetForm();
    setFormOpen(false);
  }

  function removeSpot(id) {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  }

  function SpotCard({ spot }) {
    const meta = placeTypeMeta(spot.type);
    const day = dayOptions.find((d) => d.id === spot.dayId);
    return (
      <article
        className={`overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-soft)] ${
          spot.rating >= 5 ? "border-jade/30" : "border-jade/10"
        }`}
      >
        <div className={`flex items-stretch`}>
          <div className={`flex w-14 shrink-0 flex-col items-center justify-center border-r border-jade/10 ${meta.tone.split(" ")[0]}`}>
            <span className="text-2xl" aria-hidden="true">
              {meta.icon}
            </span>
            <span className="mt-0.5 text-[9px] font-bold">{meta.label}</span>
          </div>
          <div className="min-w-0 flex-1 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink">{spot.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  {day ? day.short : "未標日"}
                  {spot.area ? ` · ${spot.area}` : ""}
                  {spot.rating > 0 ? (
                    <>
                      {" · "}
                      <Stars value={spot.rating} />
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeSpot(spot.id)}
                className="shrink-0 rounded p-1 text-ink-faint active:scale-90"
                aria-label="刪除"
              >
                ✕
              </button>
            </div>
            {spot.note && (
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-soft">
                {spot.note}
              </p>
            )}
            {spot.badges?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {spot.badges.map((bid) => {
                  const badge = allBadges.find((b) => b.id === bid);
                  return badge ? (
                    <span key={bid} className="rounded-full bg-jade-soft/80 px-2 py-0.5 text-[10px] font-semibold text-jade-deep">
                      {badge.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-jade/15 bg-gradient-to-br from-jade-soft/50 via-white to-sky-50/40 shadow-[var(--shadow-soft)]">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">旅程足跡</h2>
              <p className="mt-0.5 text-[12px] text-ink-soft">
                {trip?.city || "今次旅行"} · 去過邊 · 做過咩 · 一眼有畫面
                {adapt ? " · 已優先室內" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="shrink-0 rounded-xl bg-jade px-3 py-2 text-[11px] font-bold text-white shadow-sm active:scale-95"
            >
              {formOpen ? "收起" : "＋ 記下"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <div className="rounded-2xl bg-white/90 px-2 py-2 text-center shadow-sm">
              <p className="text-[9px] font-bold text-ink-faint">地點</p>
              <p className="font-display text-lg font-bold text-jade-deep">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-2 py-2 text-center shadow-sm">
              <p className="text-[9px] font-bold text-ink-faint">區域</p>
              <p className="font-display text-lg font-bold text-ink">{stats.areas}</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-2 py-2 text-center shadow-sm">
              <p className="text-[9px] font-bold text-ink-faint">日子</p>
              <p className="font-display text-lg font-bold text-ink">{stats.daysCovered}</p>
            </div>
            <div className="rounded-2xl bg-white/90 px-2 py-2 text-center shadow-sm">
              <p className="text-[9px] font-bold text-ink-faint">均分</p>
              <p className="font-display text-lg font-bold text-amber-800">{stats.avg}</p>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="mt-2.5 flex gap-1 overflow-x-auto pb-0.5">
              {PLACE_TYPES.filter((t) => stats.byType[t.id] > 0).map((t) => (
                <span
                  key={t.id}
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.tone}`}
                >
                  {t.icon} {t.label} {stats.byType[t.id]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="space-y-2.5 rounded-3xl border border-jade/15 bg-white/95 p-3.5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-bold text-ink">記下今次去過嘅地方</p>

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">類型</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLACE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border text-xs font-bold transition active:scale-[0.98] ${
                    type === t.id ? `${t.tone} ring-2 ring-jade/30` : "border-jade/15 bg-mist/60 text-ink-soft"
                  }`}
                >
                  <span aria-hidden="true">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="名稱（例：淺草寺、Blue Bottle）"
            className="h-11 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="區域（例：Asakusa／Siam）"
            className="h-11 w-full rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="當時做過咩／感覺？（例：排隊食炸雞、日落好靚、雨中漫步…）"
            className="w-full resize-none rounded-xl border border-jade/15 bg-mist px-3 py-2.5 text-sm outline-none ring-jade focus:ring-2"
          />

          {dayOptions.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-bold text-ink-faint">旅程第幾日</p>
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {dayOptions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDayId(d.id)}
                    className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold active:scale-[0.98] ${
                      dayId === d.id ? "border-jade bg-jade-soft/70 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
                    }`}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">評分</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`min-h-10 min-w-10 rounded-xl text-base transition ${
                    n <= rating ? "bg-jade text-white" : "bg-mist text-ink-faint"
                  }`}
                  aria-label={`${n} 星`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink-faint">標籤（選填）</p>
            <div className="flex flex-wrap gap-1.5">
              {allBadges.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBadge(b.id)}
                  className={`min-h-9 rounded-xl border px-2.5 text-[11px] font-bold transition ${
                    selected.includes(b.id) ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                placeholder="自訂標籤"
                className="h-9 min-w-0 flex-1 rounded-xl border border-jade/15 bg-mist px-3 text-xs outline-none ring-jade focus:ring-2"
              />
              <button
                type="button"
                onClick={addCustomBadge}
                className="h-9 shrink-0 rounded-xl border border-jade/15 bg-white px-3 text-[11px] font-bold text-ink"
              >
                新增
              </button>
            </div>
          </div>

          <button type="submit" className="min-h-11 w-full rounded-xl bg-jade text-sm font-bold text-white active:scale-[0.98]">
            記下足跡
          </button>
        </form>
      )}

      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold ${
              filterType === "all" ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
            }`}
          >
            全部
          </button>
          {PLACE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterType(t.id)}
              className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                filterType === t.id ? "border-jade bg-jade-soft/60 text-jade-deep" : "border-jade/15 bg-white text-ink-soft"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-jade/15 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`rounded-md px-2 py-1 text-[10px] font-bold ${
              viewMode === "timeline" ? "bg-jade text-white" : "text-ink-soft"
            }`}
          >
            時間軸
          </button>
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={`rounded-md px-2 py-1 text-[10px] font-bold ${
              viewMode === "gallery" ? "bg-jade text-white" : "text-ink-soft"
            }`}
          >
            圖牆
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-jade/25 bg-white/60 px-4 py-10 text-center">
          <p className="text-3xl" aria-hidden="true">
            🗺
          </p>
          <p className="mt-2 font-display text-sm font-bold text-ink">尚未記下任何足跡</p>
          <p className="mt-1 text-[12px] text-ink-faint">撳「＋ 記下」留低去過邊、做過咩</p>
        </div>
      ) : viewMode === "gallery" ? (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((spot) => {
            const meta = placeTypeMeta(spot.type);
            const day = dayOptions.find((d) => d.id === spot.dayId);
            return (
              <article
                key={spot.id}
                className={`relative flex min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl border p-3 shadow-[var(--shadow-soft)] ${meta.tone}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-2xl" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSpot(spot.id)}
                      className="rounded p-0.5 text-[10px] text-ink-faint active:scale-90"
                      aria-label="刪除"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 font-display text-[13px] font-bold leading-snug text-ink">{spot.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-faint">
                    {day?.short || "—"}
                    {spot.area ? ` · ${spot.area}` : ""}
                  </p>
                  {spot.note && <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink-soft">{spot.note}</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {timelineGroups.map((group) => (
            <section key={group.day.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-jade px-2 text-[11px] font-bold text-white">
                  {group.day.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{group.day.label}</p>
                  <p className="text-[10px] text-ink-faint">{group.spots.length} 個足跡</p>
                </div>
              </div>
              <div className="relative space-y-2 border-l-2 border-jade/20 pl-3 ml-3">
                {group.spots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
