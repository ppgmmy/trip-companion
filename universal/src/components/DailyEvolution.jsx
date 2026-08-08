import { EVOLUTION_POOL } from "../evolutionPool";
import { hashStr, todayIndex, tripDays } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey } from "../storage";

/** Deterministic per-trip shuffle so the first N days each reveal a unique tool. */
function seededOrder(tripId, length) {
  const arr = Array.from({ length }, (_, i) => i);
  let seed = hashStr(tripId) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ideaForDay(trip, dayIdx) {
  const order = seededOrder(trip.id, EVOLUTION_POOL.length);
  return dayIdx < order.length
    ? EVOLUTION_POOL[order[dayIdx]]
    : EVOLUTION_POOL[hashStr(`${trip.id}-evo-bonus-${dayIdx}`) % EVOLUTION_POOL.length];
}

/**
 * All 18 upgrades are pre-implemented in the Toolkit tab.
 * This card now acts as a daily spotlight that deep-links to today's tool.
 * Past "marked as implemented" records are preserved and shown as history.
 */
export default function DailyEvolution({ trip, onOpenTool }) {
  const [implemented] = useLocalStorage(tripKey(trip.id, "evolution"), [], {
    migrate: (v) =>
      (Array.isArray(v) ? v : []).map((item) =>
        typeof item === "number" ? { day: item, name: ideaForDay(trip, item).name, date: null } : item
      ),
  });

  const dayIdx = todayIndex(trip);
  const days = tripDays(trip);
  const idea = ideaForDay(trip, dayIdx);

  return (
    <section
      aria-label="今日工具推介"
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] p-[1.5px] shadow-[0_14px_36px_-12px_rgb(124_58_237/0.45)]"
    >
      <div className="rounded-[calc(1.5rem-1.5px)] bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-lg shadow-md" aria-hidden="true">
              🎁
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">今日進化工具</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">Daily Upgrade · 已實裝</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[10px] font-bold text-[#7c3aed]">
            Day {dayIdx + 1} / {days}
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#faf5ff] to-[#fdf2f8] px-4 py-3">
          <p className="font-display text-[15px] font-bold text-ink">{idea.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{idea.desc}</p>
        </div>

        <button
          type="button"
          onClick={() => onOpenTool(idea.id)}
          className="mt-3 min-h-11 w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white shadow-md transition active:scale-[0.97]"
        >
          🧰 打開今日工具
        </button>

        <p className="mt-2.5 px-1 text-[11px] text-ink-faint">
          全部 {EVOLUTION_POOL.length} 個神級外掛已直接實裝，每日為你重點推介一個。
        </p>

        {implemented.length > 0 && (
          <details className="mt-3 rounded-2xl bg-[#faf5ff] px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-bold text-[#7c3aed]">
              進化歷史 · 已收集 {implemented.length} 個神級外掛
            </summary>
            <ul className="mt-2 space-y-1.5">
              {implemented
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((e) => (
                  <li key={e.day} className="flex items-center gap-2 text-[12px] text-ink-soft">
                    <span className="shrink-0 rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-bold text-[#7c3aed]">
                      Day {e.day + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{e.name}</span>
                    {e.date && <span className="shrink-0 text-[10px] text-ink-faint">{e.date}</span>}
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
