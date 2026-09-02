import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function pinIcon(color, active) {
  const size = active ? 18 : 14;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(18,33,31,${active ? 0.45 : 0.28});
      transform:translate(-50%,-50%);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const TripMap = forwardRef(function TripMap(
  { config, markers = [], selectedId, onSelect, heightClass = "h-56" },
  ref,
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markerMapRef = useRef(new Map());

  const selected = markers.find((m) => m.id === selectedId) || null;

  useImperativeHandle(ref, () => ({
    scrollIntoView() {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    focusMarker(id) {
      const map = mapRef.current;
      const marker = markerMapRef.current.get(id);
      const target = markers.find((m) => m.id === id);
      if (!map || !target) return;
      map.flyTo([target.lat, target.lng], 16, { duration: 0.45 });
      marker?.openTooltip();
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const lat = config.lat ?? 34.6819;
    const lng = config.lng ?? 135.5068;
    const zoom = config.zoom ?? 13;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerMapRef.current.clear();
    };
  }, [config.lat, config.lng, config.zoom]);

  // 繪製標記（換日時重畫 + 自動 fit 全部）
  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    markerMapRef.current.clear();
    const bounds = [];

    markers.forEach((m) => {
      const active = m.id === selectedId;
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m.color, active) });
      marker.bindTooltip(`${m.time} ${m.title}`, {
        permanent: active,
        direction: "top",
        offset: [0, -8],
        className: "trip-map-tooltip",
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect?.(m.id);
      });
      marker.addTo(group);
      markerMapRef.current.set(m.id, marker);
      bounds.push([m.lat, m.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [markers]);

  // 選中某一點：只喺頁內大地圖平移過去（唔開新頁）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const target = markers.find((m) => m.id === selectedId);
    if (!target) return;

    map.flyTo([target.lat, target.lng], 16, { duration: 0.45 });

    markerMapRef.current.forEach((marker, id) => {
      const m = markers.find((x) => x.id === id);
      if (!m) return;
      const active = id === selectedId;
      marker.setIcon(pinIcon(m.color, active));
      marker.unbindTooltip();
      marker.bindTooltip(`${m.time} ${m.title}`, {
        permanent: active,
        direction: "top",
        offset: [0, -8],
        className: "trip-map-tooltip",
      });
    });
  }, [selectedId, markers]);

  return (
    <section className="overflow-hidden rounded-3xl border border-jade/15 bg-white/90 shadow-[var(--shadow-soft)]" aria-label="行程地圖">
      <div className="border-b border-jade/10 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">行程地圖</p>
        <p className="text-xs text-ink-soft">{config.query} · 撳下面景點，地圖會喺呢度轉過去</p>
        {selected && (
          <div className="mt-2 rounded-xl bg-jade-soft/50 px-2.5 py-2">
            <p className="text-[11px] font-bold text-jade-deep">
              {selected.time} · {selected.kind === "food" ? "食" : "景點"}
            </p>
            <p className="text-sm font-bold text-ink">{selected.title}</p>
            {selected.area && <p className="text-[11px] text-ink-soft">{selected.area}</p>}
          </div>
        )}
      </div>

      <div ref={containerRef} className={`trip-map-canvas relative z-0 w-full ${heightClass}`} />

      {markers.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-jade/10 px-3 py-2 text-[10px] font-semibold text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" /> 食
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-jade" /> 景點
          </span>
        </div>
      )}

      {config.zones?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-jade/10 px-3 py-2">
          {config.zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => {
                const map = mapRef.current;
                if (map) map.flyTo([zone.lat, zone.lng], 14, { duration: 0.4 });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-ink-soft transition active:scale-95"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: zone.color }} aria-hidden="true" />
              {zone.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
});

export default TripMap;
