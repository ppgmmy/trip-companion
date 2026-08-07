import { useState } from "react";
import { DEFAULT_BADGES } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey, TRIP_SECTIONS } from "../storage";

export default function SpotsTab({ trip, spots, setSpots }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState([]);
  const [newBadge, setNewBadge] = useState("");
  const [customBadges, setCustomBadges] = useLocalStorage(tripKey(trip.id, "badges"), [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });

  const allBadges = [...DEFAULT_BADGES, ...customBadges.map((b) => ({ id: `custom-${b}`, label: b }))];

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

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSpots((prev) => [
      ...prev,
      {
        id: `spot-${Date.now()}`,
        name: name.trim(),
        area: area.trim(),
        rating,
        badges: selected,
        createdAt: Date.now(),
      },
    ]);
    setName("");
    setArea("");
    setRating(0);
    setSelected([]);
  }

  function removeSpot(id) {
    setSpots((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">足跡</h2>
        <p className="text-sm text-ink-soft">景點／Cafe／餐廳 · 依評分排序</p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="名稱（例：Siam Paragon 某 Cafe）"
          className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-4 outline-none ring-jade focus:ring-2"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="區域（例：Siam／Shibuya／Soho）"
          className="h-12 w-full rounded-2xl border border-jade/15 bg-mist px-4 outline-none ring-jade focus:ring-2"
        />
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">評分</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`min-h-11 min-w-11 rounded-2xl text-lg transition ${n <= rating ? "bg-jade text-white" : "bg-mist text-ink-faint"}`}
                aria-label={`${n} 星`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">標籤</p>
          <div className="flex flex-wrap gap-1.5">
            {allBadges.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBadge(b.id)}
                className={`min-h-10 rounded-2xl border px-3 text-xs font-bold transition ${selected.includes(b.id) ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              placeholder="自訂標籤（例：泰奶極正）"
              className="h-10 min-w-0 flex-1 rounded-2xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
            />
            <button type="button" onClick={addCustomBadge} className="h-10 shrink-0 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink transition active:scale-95">
              新增
            </button>
          </div>
        </div>
        <button type="submit" className="min-h-12 w-full rounded-2xl bg-jade font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]">
          記下足跡
        </button>
      </form>

      <ul className="space-y-2">
        {spots.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">尚未記下任何足跡</li>
        ) : (
          spots
            .slice()
            .sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)
            .map((s) => (
              <li key={s.id} className="rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{s.name}</p>
                    <p className="text-xs text-ink-faint">{s.area || "—"} · {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</p>
                  </div>
                  <button type="button" onClick={() => removeSpot(s.id)} className="shrink-0 text-ink-faint transition active:scale-90" aria-label="刪除">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {s.badges.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.badges.map((bid) => {
                      const badge = allBadges.find((b) => b.id === bid);
                      return badge ? (
                        <span key={bid} className="rounded-full bg-jade-soft px-2 py-0.5 text-[10px] font-semibold text-jade-deep">
                          {badge.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            ))
        )}
      </ul>
    </div>
  );
}
