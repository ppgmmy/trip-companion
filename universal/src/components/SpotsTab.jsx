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
import { isOsakaSeedFootprint } from "../data/osakaTripLog";

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
    <span className="tabular-nums text-[9px] font-bold tracking-tight text-amber-700" aria-label={`${value} 星`}>
      {"★".repeat(value)}
      <span className="text-ink-faint/50">{"☆".repeat(5 - value)}</span>
    </span>
  );
}

function TimePill({ time, lavish = false }) {
  if (time) {
    return (
      <span className={`footprint-time-pill ${lavish ? "footprint-time-pill--lavish" : "footprint-time-pill--compact"}`}>
        {time}
      </span>
    );
  }
  return (
    <span className={`footprint-time-muted ${lavish ? "footprint-time-muted--lavish" : "footprint-time-muted--compact"}`}>
      ···
    </span>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel = "確定刪除", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="footprint-confirm-card w-full max-w-sm overflow-hidden">
        <div className="footprint-confirm-card__glow" aria-hidden="true" />
        <div className="relative px-5 pb-4 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">再確認一次</p>
          <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-ink">{title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{message}</p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-jade/15 bg-white px-3 py-2.5 text-[13px] font-bold text-ink-soft transition active:scale-[0.98]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-2xl bg-gradient-to-br from-coral to-[#e11d48] px-3 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgb(244_63_94_/_0.65)] transition active:scale-[0.98]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpotCard({ spot, variant = "default", dayOptions, allBadges, onRemove, lavish = false }) {
  const meta = placeTypeMeta(spot.type);
  const accent = meta.accent || "border-l-jade";
  const day = dayOptions.find((d) => d.id === spot.dayId);
  const locked = isOsakaSeedFootprint(spot);

  if (variant === "timeline") {
    return (
      <article
        className={`overflow-hidden border border-l-[3px] ${accent} ${
          lavish
            ? "rounded-2xl border-jade/15 bg-white/95 shadow-[0_10px_28px_-18px_rgb(13_127_116_/_0.45)]"
            : "rounded-lg border-jade/10 bg-white/95"
        }`}
      >
        <div className={`flex items-start gap-1.5 ${lavish ? "px-3 py-2.5" : "px-2 py-1.5"}`}>
          <span className={`mt-0.5 leading-none ${lavish ? "text-base" : "text-sm"}`} aria-hidden="true">
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <p className={`font-bold leading-snug text-ink ${lavish ? "text-[13px]" : "text-[12px]"}`}>{spot.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[9px] font-semibold text-ink-faint">
                  <span className={`rounded px-1 py-px ${meta.tone}`}>{meta.label}</span>
                  {spot.area && <span>{spot.area}</span>}
                  <Stars value={spot.rating} />
                  {locked && <span className="rounded bg-mist px-1 py-px text-ink-faint">紀錄</span>}
                </p>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={() => onRemove(spot)}
                  className="shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-ink-faint opacity-60 transition hover:bg-rose-50 hover:text-coral hover:opacity-100 active:scale-90"
                  aria-label="刪除"
                >
                  刪除
                </button>
              )}
            </div>
            {spot.note && (
              <p
                className={`mt-1.5 leading-snug text-ink-soft ${
                  lavish ? "rounded-xl bg-gradient-to-br from-mist/90 to-jade-soft/40 px-2.5 py-2 text-[12px]" : "rounded-md bg-mist/70 px-1.5 py-1 text-[11px]"
                }`}
              >
                {spot.note}
              </p>
            )}
            {spot.badges?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-0.5">
                {spot.badges.map((bid) => {
                  const badge = allBadges.find((b) => b.id === bid);
                  return badge ? (
                    <span key={bid} className="rounded bg-jade-soft/90 px-1.5 py-px text-[9px] font-semibold text-jade-deep">
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
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        spot.rating >= 5 ? "border-jade/30" : "border-jade/10"
      }`}
    >
      <div className="flex items-stretch">
        <div className={`flex w-11 shrink-0 flex-col items-center justify-center border-r border-jade/10 ${meta.tone.split(" ")[0]}`}>
          <span className="text-lg" aria-hidden="true">
            {meta.icon}
          </span>
          <span className="mt-0.5 text-[8px] font-bold">{meta.label}</span>
        </div>
        <div className="min-w-0 flex-1 px-2.5 py-1.5">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">{spot.name}</p>
              <p className="mt-0.5 text-[10px] text-ink-faint">
                {spot.time && <span className="font-bold text-jade-deep">{spot.time} </span>}
                {day ? day.short : "未標日"}
                {spot.area ? ` · ${spot.area}` : ""}
                {spot.rating > 0 && (
                  <>
                    {" · "}
                    <Stars value={spot.rating} />
                  </>
                )}
                {locked && " · 紀錄"}
              </p>
            </div>
            {!locked && (
              <button
                type="button"
                onClick={() => onRemove(spot)}
                className="shrink-0 rounded p-0.5 text-[10px] font-bold text-ink-faint active:scale-90"
                aria-label="刪除"
              >
                刪除
              </button>
            )}
          </div>
          {spot.note && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-soft">{spot.note}</p>
          )}
          {spot.badges?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-0.5">
              {spot.badges.map((bid) => {
                const badge = allBadges.find((b) => b.id === bid);
                return badge ? (
                  <span key={bid} className="rounded bg-jade-soft/80 px-1.5 py-px text-[9px] font-semibold text-jade-deep">
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
  const locked = isOsakaSeedFootprint(spot);
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
          {!locked && (
            <button
              type="button"
              onClick={() => onRemove(spot)}
              className="rounded-lg bg-white/70 px-1.5 py-1 text-[10px] font-bold text-ink-faint backdrop-blur active:scale-90"
              aria-label="刪除"
            >
              刪除
            </button>
          )}
        </div>
        <p className="relative mt-2 line-clamp-2 font-display text-[14px] font-bold leading-snug text-ink">{spot.name}</p>
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold text-ink-faint/90">
          {spot.time && `${spot.time} · `}
          {day?.short || "—"}
          {spot.area ? ` · ${spot.area}` : ""}
          {locked ? " · 紀錄" : ""}
        </p>
        {spot.note && <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-soft">{spot.note}</p>}
      </div>
    </article>
  );
}

export default function SpotsTab({ trip, spots, setSpots, adapt = false, focusDayId = null, onFocusDayConsumed }) {
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
  const [highlightDayId, setHighlightDayId] = useState(null);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
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

  useEffect(() => {
    if (!focusDayId) return;
    setViewMode("timeline");
    setFilterType("all");
    setHighlightDayId(focusDayId);
    setExpandedDayId(focusDayId);
    const t = window.setTimeout(() => onFocusDayConsumed?.(), 120);
    return () => window.clearTimeout(t);
  }, [focusDayId, onFocusDayConsumed]);

  // 展開某日時：將嗰日標題捲到畫面頂，再由上睇落日程（避免仲留喺上一日底部）
  useEffect(() => {
    if (!expandedDayId) return;
    let timeoutId = 0;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        timeoutId = window.setTimeout(() => {
          document.getElementById(`footprint-day-${expandedDayId}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 40);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timeoutId);
    };
  }, [expandedDayId]);

  function toggleDayExpanded(id) {
    setExpandedDayId((prev) => (prev === id ? null : id));
  }

  function dayPreview(spotsList) {
    const names = spotsList.map((s) => s.name).filter(Boolean);
    const times = spotsList.map((s) => s.time).filter(Boolean);
    const range = times.length ? `${times[0]}${times.length > 1 ? `–${times[times.length - 1]}` : ""}` : "";
    const preview = names.slice(0, 3).join(" · ") + (names.length > 3 ? "…" : "");
    return { range, preview };
  }

  function requestRemoveSpot(spot) {
    if (!spot || isOsakaSeedFootprint(spot)) return;
    setPendingDelete({
      type: "spot",
      id: spot.id,
      title: `刪除「${spot.name || "呢項足跡"}」？`,
      message: "刪除後無法還原。旅程口述紀錄唔受影響。",
    });
  }

  function requestRemoveDay(day, count) {
    if (!day || !count) return;
    setPendingDelete({
      type: "day",
      dayId: day.id,
      title: `刪除 ${day.short} 可編輯足跡？`,
      message: `會刪除呢日 ${count} 項你自己加嘅足跡；旅程口述紀錄（唯讀）會保留。呢個動作無法還原。`,
    });
  }

  function confirmPendingDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "spot") {
      const id = pendingDelete.id;
      setSpots((prev) => prev.filter((s) => s.id !== id || isOsakaSeedFootprint(s)));
    } else if (pendingDelete.type === "day") {
      const dayKey = pendingDelete.dayId;
      setSpots((prev) =>
        prev.filter((s) => s.dayId !== dayKey || isOsakaSeedFootprint(s)),
      );
    }
    setPendingDelete(null);
  }

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

  function removeSpot(spotOrId) {
    const spot =
      typeof spotOrId === "object" && spotOrId
        ? spotOrId
        : normalized.find((s) => s.id === spotOrId);
    requestRemoveSpot(spot);
  }

  const heroStats = [
    { label: "地點", value: stats.total, tone: "text-jade-deep" },
    { label: "區域", value: stats.areas, tone: "text-ink" },
    { label: "日子", value: stats.daysCovered, tone: "text-ink" },
    { label: "均分", value: stats.avg, tone: "text-amber-800" },
  ];

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-jade/15 bg-gradient-to-br from-jade-soft/55 via-white to-sky-50/50 shadow-sm">
        <div className="relative px-3 pb-2.5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold leading-tight text-ink">旅程足跡</h2>
              <p className="truncate text-[10px] text-ink-soft">
                {trip?.city || "今次旅行"} · {stats.total} 地點
                {adapt ? " · 已優先室內" : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => {
                  setLogOpen((v) => !v);
                  setFormOpen(false);
                }}
                className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition active:scale-95 ${
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
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                  formOpen ? "bg-jade-deep text-white" : "bg-jade text-white"
                }`}
              >
                {formOpen ? "收起" : "＋ 記下"}
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/80 bg-white/85 px-1 py-1.5 text-center"
              >
                <p className="text-[8px] font-bold tracking-wide text-ink-faint">{item.label}</p>
                <p className={`font-display text-base font-bold tabular-nums leading-none ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
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
        <div className="space-y-2">
          {timelineGroups.map((group) => {
            const open = expandedDayId === group.day.id;
            const preview = dayPreview(group.spots);
            const removableCount = group.spots.filter((s) => !isOsakaSeedFootprint(s)).length;
            return (
              <section
                key={group.day.id}
                id={`footprint-day-${group.day.id}`}
                className={`footprint-day-shell footprint-day-shell--compact transition ${
                  highlightDayId === group.day.id ? "ring-2 ring-amber-400/70" : ""
                } ${open ? "footprint-day-shell--open border-jade/35 shadow-[var(--shadow-soft)]" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => toggleDayExpanded(group.day.id)}
                  className="footprint-day-row flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left"
                  aria-expanded={open}
                >
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-gradient-to-br from-jade via-[#14b8a6] to-jade-deep px-1.5 text-[11px] font-bold text-white shadow-[0_6px_14px_-8px_rgb(13_127_116_/_0.8)]">
                    {group.day.short}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">{group.day.label}</p>
                    {!open && (
                      <p className="mt-0.5 truncate text-[10px] leading-snug text-ink-faint">
                        {preview.range ? `${preview.range} · ` : ""}
                        {preview.preview || `${group.spots.length} 項足跡`}
                      </p>
                    )}
                    {open && highlightDayId === group.day.id && (
                      <p className="mt-0.5 text-[9px] font-bold text-amber-800">入口指向呢日</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-jade-soft/80 px-2 py-0.5 text-[9px] font-bold text-jade-deep">
                    {group.spots.length}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-jade-deep" aria-hidden="true">
                    {open ? "▴" : "▾"}
                  </span>
                </button>
                {open && (
                  <div className="footprint-day-inline border-t border-jade/10 bg-gradient-to-b from-[#f7fffc] via-white to-[#eefaf7] px-2.5 pb-2.5 pt-2">
                    <div className="relative pl-1.5">
                      {group.spots.length > 1 && <span className="footprint-rail footprint-rail--sheet" aria-hidden="true" />}
                      <div className="space-y-2">
                        {group.spots.map((spot, index) => (
                          <div
                            key={spot.id}
                            className="footprint-day-sheet__row relative flex gap-1.5"
                            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                          >
                            <span className="footprint-node footprint-node--sheet" aria-hidden="true" />
                            <div className="w-[2.9rem] shrink-0 pt-1">
                              <TimePill time={spot.time} lavish />
                            </div>
                            <div className="min-w-0 flex-1">
                              <SpotCard
                                spot={spot}
                                variant="timeline"
                                lavish
                                dayOptions={dayOptions}
                                allBadges={allBadges}
                                onRemove={requestRemoveSpot}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2.5">
                      {removableCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => requestRemoveDay(group.day, removableCount)}
                          className="w-full rounded-xl border border-coral/25 bg-gradient-to-r from-rose-50 to-white px-3 py-2 text-[11px] font-bold text-coral transition active:scale-[0.99]"
                        >
                          刪除呢日 {removableCount} 項可編輯足跡…
                        </button>
                      ) : (
                        <p className="px-1 text-center text-[10px] font-semibold text-ink-faint">
                          旅程紀錄 · 唯讀 · 要改透過口述更新
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.title || "確定刪除？"}
        message={pendingDelete?.message || ""}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmPendingDelete}
      />
    </div>
  );
}
