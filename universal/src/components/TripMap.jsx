import { mapsEmbedUrl, mapsSearchUrl } from "../data/itineraryGuide";

export default function TripMap({ config, activeZoneId, heightClass = "h-52" }) {
  const embedUrl = mapsEmbedUrl({
    query: config.query,
    lat: config.lat,
    lng: config.lng,
    zoom: config.zoom,
  });

  return (
    <section className="overflow-hidden rounded-3xl border border-jade/15 bg-white/90 shadow-[var(--shadow-soft)]" aria-label="行程地圖">
      <div className="flex items-center justify-between gap-2 border-b border-jade/10 px-3 py-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-jade">行程地圖</p>
          <p className="text-xs text-ink-soft">{config.query}</p>
        </div>
        <a
          href={mapsSearchUrl(config.query)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-jade-soft px-2.5 py-1.5 text-[11px] font-bold text-jade-deep"
        >
          全屏開啟
        </a>
      </div>

      <div className={`relative w-full ${heightClass}`}>
        <iframe
          title="行程地圖"
          src={embedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {config.zones?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-jade/10 px-3 py-2">
          {config.zones.map((zone) => (
            <span
              key={zone.id}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeZoneId === zone.id ? "bg-jade text-white" : "bg-mist text-ink-soft"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: zone.color }} aria-hidden="true" />
              {zone.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
