import { useState } from "react";
import { guideForTrip } from "../placesMeta";

function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function PlacesPanel({ trip }) {
  const [filter, setFilter] = useState("all");
  const guide = guideForTrip(trip);
  const places = filter === "indoor" ? guide.places.filter((pl) => pl.tag === "室內") : guide.places;

  return (
    <section aria-label="好去處推薦" className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">好去處</h2>
          <p className="text-xs text-ink-soft">
            {guide.label} · {guide.source === "city" ? "城市精選" : guide.source === "country" ? "國家通用推介" : "通用建議"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/80 p-1 shadow-[var(--shadow-soft)]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`min-h-9 rounded-xl px-3 text-[11px] font-bold transition ${filter === "all" ? "bg-jade text-white" : "text-ink-faint"}`}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => setFilter("indoor")}
            className={`min-h-9 rounded-xl px-3 text-[11px] font-bold transition ${filter === "indoor" ? "bg-jade text-white" : "text-ink-faint"}`}
          >
            室內
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {places.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-6 text-center text-sm text-ink-faint">
            此分類暫無推薦
          </p>
        ) : (
          places.map((pl) => (
            <article key={pl.name} className="rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="rounded-full bg-jade-soft px-2.5 py-0.5 text-[10px] font-bold text-jade-deep">{pl.tag}</span>
                <span className="text-[10px] font-semibold text-ink-faint">{pl.area}</span>
              </div>
              <h3 className="font-display text-[15px] font-bold text-ink">{pl.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{pl.detail}</p>
              <a
                href={mapsLink(pl.maps)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-jade-soft px-3 text-xs font-bold text-jade-deep transition active:scale-95"
              >
                在地圖查看
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
