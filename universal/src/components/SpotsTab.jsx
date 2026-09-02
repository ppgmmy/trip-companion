import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BADGES,
  INDOOR_TAGS,
  PLACE_TYPES,
  inferPlaceType,
  parseFootprintLogLine,
  placeTypeMeta,
  sortFootprintsChronological,
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

const DAY_LOG_EXAMPLE = `1300 黎到大阪
1500 堺筋本町 Roynet Premier 酒店 check-in
食 頂七家拉麵
踩電動滑板去心齋橋商店街
食堺筋本町 Sukiya
買水買糖返酒店`;

function normalizeSpot(spot) {
  return {
    ...spot,
    type: inferPlaceType(spot),
    note: typeof spot.note === "string" ? spot.note : "",
    time: typeof spot.time === "string" ? spot.time : "",
    dayId: spot.dayId || "",
    badges: Array.isArray(spot.badges) ? spot.badges : [],
  };
}

function Stars({ value }) {
  if (!value || value <= 0) return null;
  return (
    <span className="tabular-nums text-[11px] font-bold tracking-tight text-amber-700" aria-label={`${value} 星`}>
      {"★".repeat(value)}
      <span className="text-ink-faint/60">{"☆".repeat(5 - value)}</span>
    </span>
  );
}

function TimePill({ time }) {
  if (time) return <span className="footprint-time-pill">{time}</span>;
  return <span className="footprint-time-muted">···</span>;
}

function SpotCard({ spot, variant = "default", dayOptions, allBadges, onRemove }) {
  const meta = placeTypeMeta(spot.type);
  const accent = meta.accent || "border-l-jade";
  const day = dayOptions.find((d) => d.id === spot.dayId);

  if (variant === "timeline") {
    return (
      <article
        className={`overflow-hidden rounded-2xl border border-jade/10 border-l-[4px] ${accent} bg-white/95 shadow-[var(--shadow-soft)] transition hover:-translate-y-px hover:shadow-md`}
      >
        <div className="flex items-start gap-2.5 p-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl shadow-sm ${meta.tone}`}>
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-[15px] font-bold leading-snug text-ink">{spot.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] font-bold text-ink-faint">
                  <span className={`rounded-md border px-1.5 py-0.5 ${meta.tone}`}>{meta.label}</span>
                  {spot.area && <span>{spot.area}</span>}
                  <Stars value={spot.rating} />
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(spot.id)}
                className="shrink-0 rounded-lg p-1 text-ink-faint opacity-60 transition hover:bg-mist hover:opacity-100 active:scale-90"
                aria-label="刪除"
              >
                ✕
              </button>
            </div>
            {spot.note && (
              <p className="mt-2 rounded-xl bg-mist/70 px-2.5 py-2 text-[12px] leading-relaxed text-ink-soft">
                {spot.note}
              </p>
            )}
            {spot.badges?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {spot.badges.map((bid) => {
                  const badge = allBadges.find((b) => b.id === bid);
                  return badge ? (
                    <span key={bid} className="rounded-full bg-jade-soft/90 px-2 py-0.5 text-[10px] font-semibold text-jade-deep">
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
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-soft)] ${
        spot.rating >= 5 ? "border-jade/30" : "border-jade/10"
      }`}
    >
      <div className="flex items-stretch">
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
                {spot.time && <span className="font-bold text-jade-deep">{spot.time} </span>}
                {day ? day.short : "未標日"}
                {spot.area ? ` · ${spot.area}` : ""}
                {spot.rating > 0 && (
                  <>
                    {" · "}
                    <Stars value={spot.rating} />
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(spot.id)}
              className="shrink-0 rounded p-1 text-ink-faint active:scale-90"
              aria-label="刪除"
            >
              ✕
            </button>
          </div>
          {spot.note && <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-soft">{spot.note}</p>}
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

function GalleryTile({ spot, dayOptions, onRemove }) {
  const meta = placeTypeMeta(spot.type);
  const day = dayOptions.find((d) => d.id === spot.dayId);
  return (
    <article
      className={`relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-3xl border p-3.5 shadow-[var(--shadow-soft)] ${meta.tone}`}
    >
      <span className="pointer-events-none absolute -right-1 -top-1 text-5xl opacity-[0.12]" aria-hidden="true">
        {meta.icon}
      </span>
      <div>
        <div className="flex items-start justify-between gap-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-xl shadow-sm">
            {meta.icon}
          </span>
          <button
            type="button"
            onClick={() => onRemove(spot.id)}
            className="rounded-lg bg-white/70 p-1 text-[10px] text-ink-faint backdrop-blur active:scale-90"
            aria-label="刪除"
          >
            ✕
          </button>
        </div>
        <p className="relative mt-2 line-clamp-2 font-display text-[14px] font-bold leading-snug text-ink">{spot.name}</p>
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold text-ink-faint/90">
          {spot.time && `${spot.time} · `}
          {day?.short || "—"}
          {spot.area ? ` · ${spot.area}` : ""}
        </p>
        {spot.note && <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-soft">{spot.note}</p>}
      </div>
    </article>
  );
}

export default function SpotsTab({ trip, spots, setSpots, adapt = false }) {
  const dayOptions = useMemo(() => buildTripDayOptions(trip), [trip]);
  const todayId = toDateId(new Date());
  const defaultDay =
    dayOptions.find((d) => d.id === todayId)?.id || dayOptions[0]?.id || "";

  const [formOpen, setFormOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [logText, setLogText] = useState("");
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
    const needs = spots.some(
      (s) => !s.type || s.note == null || s.time == null || !Array.isArray(s.badges),
    );
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
      if (map.has(d.id)) ordered.push({ day: d, spots: sortFootprintsChronological(map.get(d.id)) });
    });
    if (map.has("_none")) {
      ordered.push({
        day: { id: "_none", index: null, label: "未標日子", short: "—" },
        spots: sortFootprintsChronological(map.get("_none")),
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
    setVisitTime("");
    setType("spot");
    setDayId(defaultDay);
    setRating(4);
    setSelected([]);
  }

  function importDayLog(e) {
    e.preventDefault();
    const lines = logText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const base = Date.now();
    const entries = lines
      .map((line, i) => {
        const parsed = parseFootprintLogLine(line);
        if (!parsed) return null;
        return {
          id: `spot-${base}-${i}`,
          name: parsed.name,
          area: parsed.area,
          note: parsed.note,
          time: parsed.time,
          type: parsed.type,
          dayId: dayId || defaultDay,
          rating: 0,
          badges: [],
          createdAt: base + i,
        };
      })
      .filter(Boolean);
    if (entries.length === 0) return;
    setSpots((prev) => [...prev, ...entries]);
    setLogText("");
    setLogOpen(false);
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
        time: visitTime.trim(),
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

  const heroStats = [
    { label: "地點", value: stats.total, tone: "text-jade-deep" },
    { label: "區域", value: stats.areas, tone: "text-ink" },
    { label: "日子", value: stats.daysCovered, tone: "text-ink" },
    { label: "均分", value: stats.avg, tone: "text-amber-800" },
  ];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-jade/15 bg-gradient-to-br from-jade-soft/55 via-white to-sky-50/50 shadow-[var(--shadow-soft)]">
        <span className="pointer-events-none absolute -right-6 -top-8 text-[7rem] opacity-[0.06]" aria-hidden="true">
          🗺
        </span>
        <div className="relative px-4 pb-3.5 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-jade-deep/70">Travel Log</p>
              <h2 className="font-display text-[1.35rem] font-bold leading-tight text-ink">旅程足跡</h2>
              <p className="mt-1 text-[12px] leading-snug text-ink-soft">
                {trip?.city || "今次旅行"} · 去過邊 · 做過咩
                {adapt ? " · 已優先室內" : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLogOpen((v) => !v);
                  setFormOpen(false);
                }}
                className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold shadow-sm transition active:scale-95 ${
                  logOpen ? "border-jade bg-jade-soft/80 text-jade-deep" : "border-jade/20 bg-white text-jade-deep"
                }`}
              >
                {logOpen ? "收起" : "貼流水"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen((v) => !v);
                  setLogOpen(false);
                }}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold shadow-sm transition active:scale-95 ${
                  formOpen ? "bg-jade-deep text-white" : "bg-jade text-white"
                }`}
              >
                {formOpen ? "收起" : "＋ 記下"}
              </button>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-4 gap-2">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/80 bg-white/85 px-2 py-2.5 text-center shadow-sm backdrop-blur-sm"
              >
                <p className="text-[9px] font-bold tracking-wide text-ink-faint">{item.label}</p>
                <p className={`font-display text-xl font-bold tabular-nums leading-none ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {stats.total > 0 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {PLACE_TYPES.filter((t) => stats.byType[t.id] > 0).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterType(t.id)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition active:scale-[0.98] ${
                    filterType === t.id ? `${t.tone} ring-2 ring-jade/25` : `${t.tone} opacity-90 hover:opacity-100`
                  }`}
                >
                  {t.icon} {t.label} {stats.byType[t.id]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {logOpen && (
        <form onSubmit={importDayLog} className="space-y-2.5 rounded-3xl border border-sky/20 bg-sky-50/30 p-3.5 shadow-[var(--shadow-soft)]">
          <div>
            <p className="text-xs font-bold text-ink">貼上一日流水</p>
            <p className="text-[10px] text-ink-faint">每行一項 · 開頭可寫 1300 或 13:00 · 自動認類型</p>
          </div>
          {dayOptions.length > 0 && (
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
                  {d.label}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            rows={7}
            placeholder={DAY_LOG_EXAMPLE}
            className="w-full resize-none rounded-xl border border-jade/15 bg-white px-3 py-2.5 font-mono text-[12px] leading-relaxed outline-none ring-jade focus:ring-2"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setLogText(DAY_LOG_EXAMPLE)}
              className="h-10 flex-1 rounded-xl border border-jade/15 bg-white text-[11px] font-bold text-ink-soft"
            >
              填入 D1 示例
            </button>
            <button type="submit" className="h-10 flex-1 rounded-xl bg-jade text-sm font-bold text-white">
              匯入流水
            </button>
          </div>
        </form>
      )}

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
            placeholder="當時做過咩／感覺？（例：排隊 20 分鐘、踩滑板過去…）"
            className="w-full resize-none rounded-xl border border-jade/15 bg-mist px-3 py-2.5 text-sm outline-none ring-jade focus:ring-2"
          />

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <p className="mb-1 text-[10px] font-bold text-ink-faint">幾點（選填）</p>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-jade/15 bg-mist px-2 text-sm outline-none ring-jade focus:ring-2"
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold text-ink-faint">評分</p>
              <div className="flex h-10 items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`min-h-9 min-w-9 flex-1 rounded-lg text-sm transition ${
                      n <= rating ? "bg-jade text-white" : "bg-mist text-ink-faint"
                    }`}
                    aria-label={`${n} 星`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

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

      <div className="flex items-center gap-2 rounded-2xl border border-jade/10 bg-white/80 p-1.5 shadow-sm">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`shrink-0 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition active:scale-[0.98] ${
              filterType === "all" ? "bg-jade text-white shadow-sm" : "bg-mist/50 text-ink-soft"
            }`}
          >
            全部
          </button>
          {PLACE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterType(t.id)}
              className={`shrink-0 rounded-xl border px-2 py-1.5 text-[10px] font-bold transition active:scale-[0.98] ${
                filterType === t.id ? `${t.tone} shadow-sm` : "border-transparent bg-mist/40 text-ink-soft"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-xl border border-jade/10 bg-mist/40 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${
              viewMode === "timeline" ? "bg-white text-jade-deep shadow-sm" : "text-ink-faint"
            }`}
          >
            時間軸
          </button>
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${
              viewMode === "gallery" ? "bg-white text-jade-deep shadow-sm" : "text-ink-faint"
            }`}
          >
            圖牆
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-jade/25 bg-gradient-to-b from-white/80 to-jade-soft/20 px-4 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-jade-soft/60 text-3xl shadow-sm" aria-hidden="true">
            🗺
          </span>
          <p className="mt-3 font-display text-base font-bold text-ink">尚未記下任何足跡</p>
          <p className="mt-1 text-[12px] text-ink-faint">撳「＋ 記下」或「貼流水」留低去過邊、做過咩</p>
        </div>
      ) : viewMode === "gallery" ? (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((spot) => (
            <GalleryTile key={spot.id} spot={spot} dayOptions={dayOptions} onRemove={removeSpot} />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {timelineGroups.map((group) => (
            <section key={group.day.id} className="footprint-day-shell">
              <div className="flex items-center gap-2.5 border-b border-jade/10 px-3.5 py-2.5">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-gradient-to-br from-jade to-jade-deep px-2 text-[11px] font-bold text-white shadow-sm">
                  {group.day.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{group.day.label}</p>
                  <p className="text-[10px] text-ink-faint">{group.spots.length} 個足跡</p>
                </div>
              </div>
              <div className="relative px-3 py-3 pl-5">
                {group.spots.length > 1 && <span className="footprint-rail" aria-hidden="true" />}
                <div className="space-y-3">
                  {group.spots.map((spot) => (
                    <div key={spot.id} className="relative flex gap-2.5">
                      <span className="footprint-node" aria-hidden="true" />
                      <div className="w-[3.1rem] shrink-0 pt-1">
                        <TimePill time={spot.time} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <SpotCard
                          spot={spot}
                          variant="timeline"
                          dayOptions={dayOptions}
                          allBadges={allBadges}
                          onRemove={removeSpot}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
