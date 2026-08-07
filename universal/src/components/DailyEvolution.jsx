import { useState } from "react";
import { EVOLUTION_POOL, buildEvolutionPrompt } from "../evolutionPool";
import { hashStr, todayIndex, tripDays } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey } from "../storage";

/** Deterministic per-trip shuffle so each day reveals a unique idea. */
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

export default function DailyEvolution({ trip }) {
  const [implemented, setImplemented] = useLocalStorage(tripKey(trip.id, "evolution"), [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });
  const [copied, setCopied] = useState(false);

  const dayIdx = todayIndex(trip);
  const days = tripDays(trip);
  const order = seededOrder(trip.id, EVOLUTION_POOL.length);
  const idea = EVOLUTION_POOL[order[dayIdx % order.length]];
  const done = implemented.includes(dayIdx);

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildEvolutionPrompt(idea, "universal", "universal_"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert("複製失敗，請手動選取");
    }
  }

  function toggleDone() {
    setImplemented((prev) => (prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]));
  }

  return (
    <section
      aria-label="每日隨機進化彩蛋"
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] p-[1.5px] shadow-[0_14px_36px_-12px_rgb(124_58_237/0.45)]"
    >
      <div className="rounded-[calc(1.5rem-1.5px)] bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-lg shadow-md" aria-hidden="true">
              🎁
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">今日隨機進化提案</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#a855f7]">Daily Upgrade Box</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[10px] font-bold text-[#7c3aed]">
            Day {dayIdx + 1} / {days} Evolution
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#faf5ff] to-[#fdf2f8] px-4 py-3">
          <p className="font-display text-[15px] font-bold text-ink">{idea.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{idea.desc}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="min-h-11 flex-1 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white shadow-md transition active:scale-[0.97]"
          >
            {copied ? "已複製 ✓" : "📋 一鍵複製 Cursor Prompt"}
          </button>
          <button
            type="button"
            onClick={toggleDone}
            aria-pressed={done}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-bold transition active:scale-95 ${
              done ? "border-transparent bg-jade text-white" : "border-[#a855f7]/30 bg-white text-[#7c3aed]"
            }`}
          >
            {done ? "✅ 已實裝" : "☐ 標記已實裝"}
          </button>
        </div>

        <p className="mt-2.5 px-1 text-[11px] text-ink-faint">
          {done
            ? "已實裝！你嘅 App 又進化咗一步。"
            : "夜晚返酒店貼俾 Cursor，10 秒將呢個功能永久寫入 App。"}
          {implemented.length > 0 && ` · 已收集 ${implemented.length} 個神級外掛`}
        </p>
      </div>
    </section>
  );
}
