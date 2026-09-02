import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function pinIcon(color, active) {
  const size = active ? 16 : 13;
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

export default function TripMap({
  config,
  markers = [],
  selectedId,
  onSelect,
  heightClass = "h-56",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [config.lat, config.lng, config.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = [];

    markers.forEach((m) => {
      const active = m.id === selectedId;
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m.color, active) });
      marker.bindPopup(
        `<div style="min-width:10rem;font-family:system-ui,sans-serif">
          <p style="margin:0;font-size:11px;font-weight:700;color:#0f766e">${m.time} · ${m.kind === "food" ? "食" : "景點"}</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#12211f">${m.title}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#3f5a55">${m.detail || ""}</p>
        </div>`,
      );
      marker.on("click", () => onSelect?.(m.id));
      marker.addTo(group);
      bounds.push([m.lat, m.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (config.lat != null && config.lng != null) {
      map.setView([config.lat, config.lng], config.zoom ?? 13);
    }
  }, [markers, selectedId, config.lat, config.lng, config.zoom, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group || !selectedId) return;
    const target = markers.find((m) => m.id === selectedId);
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
    group.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const pos = layer.getLatLng();
        if (Math.abs(pos.lat - target.lat) < 0.0001 && Math.abs(pos.lng - target.lng) < 0.0001) {
          layer.openPopup();
        }
      }
    });
  }, [selectedId, markers]);

  return (
    <section className="overflow-hidden rounded-3xl border border-jade/15 bg-white/90 shadow-[var(--shadow-soft)]" aria-label="行程地圖">
      <div className="border-b border-jade/10 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-jade">行程地圖</p>
        <p className="text-xs text-ink-soft">{config.query} · 點標記或下方項目定位</p>
      </div>

      <div ref={containerRef} className={`relative z-0 w-full ${heightClass}`} />

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
            <span
              key={zone.id}
              className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-ink-soft"
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
