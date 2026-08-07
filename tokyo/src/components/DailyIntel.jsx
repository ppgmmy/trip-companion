import { useMemo, useState } from "react";
import {
  INDOOR_TAGS,
  ITINERARY,
  TRIP_DAYS,
  WEEKDAY_LABELS,
  formatJpy,
  todayIndex,
  weatherForDay,
} from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../storageKeys";

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateId(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function indoorNamesForDay(day) {
  if (!day) return [];
  return day.items
    .filter((it) => INDOOR_TAGS.includes(it.tag))
    .map((it) => it.title)
    .slice(0, 3);
}

function buildTip(weather, day) {
  const indoors = indoorNamesForDay(day);
  const indoorText = indoors.length ? indoors.join("、") : "澀谷 PARCO／Miyashita Park 室內動線";
  if (weather.rainy) {
    return `降雨機率 ${weather.rain}：已優先標亮室內動線（${indoorText}），建議帶摺疊傘。`;
  }
  if (weather.heatwave) {
    return `高溫 ${weather.temp}：已標亮冷氣商場與 Cafe（${indoorText}），正午避免長時間室外步行。`;
  }
  return `天氣尚可：室內外交替最舒服，正午仍建議進商場休息。`;
}

export default function DailyIntel({ expenses, budget }) {
  const [adapt, setAdapt] = useLocalStorage(STORAGE_KEYS.adapt, false, {
    legacyKeys: [],
    migrate: (v) => v === true || v === "true" || v === 1,
  });

  const idx = todayIndex();
  const day = ITINERARY[idx] || ITINERARY[0];
  const weather = weatherForDay(idx);

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + (e.jpy || 0), 0),
    [expenses]
  );
  const remaining = Math.max(0, budget - totalSpent);
  const remainingDays = Math.max(1, TRIP_DAYS - idx);
  const perDay = remaining / remainingDays;
  const avgPlanned = budget / TRIP_DAYS;
  const overPace = totalSpent > avgPlanned * (idx + 1) * 1.1;

  const date = day ? new Date(day.id) : new Date();
  const dateLabel = `${toDateId(date)}（${WEEKDAY_LABELS[date.getDay()]}）· Day ${idx + 1}/${TRIP_DAYS}`;

  return (
    <section className="space-y-3" aria-label="每日情報">
      <div className="overflow-hidden rounded-3xl bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-rose-soft/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-brand text-white shadow-[var(--shadow-soft)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">每日情報</h2>
              <p className="text-[11px] font-semibold text-ink-faint">{dateLabel}</p>
            </div>
          </div>
          <span className="text-2xl" aria-hidden="true">{weather.icon}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center">
          <div className="rounded-2xl bg-mist px-2 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">氣溫</p>
            <p className="font-display text-sm font-bold text-ink">{weather.temp}</p>
          </div>
          <div className="rounded-2xl bg-mist px-2 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">降雨</p>
            <p className="font-display text-sm font-bold text-ink">{weather.rain}</p>
          </div>
          <div className="rounded-2xl bg-mist px-2 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">天氣</p>
            <p className="font-display text-[13px] font-bold text-ink">{weather.label}</p>
          </div>
        </div>
        <p className="px-4 pb-3 text-[13px] leading-relaxed text-ink-soft">{buildTip(weather, day)}</p>
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setAdapt((v) => !v)}
            aria-pressed={adapt}
            className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border px-3.5 text-left text-[13px] font-bold transition active:scale-[0.98] ${
              adapt ? "border-rose-brand bg-rose-soft text-ink" : "border-rose-soft bg-mist text-ink"
            }`}
          >
            <span>依今日天氣調整行程（雨／熱浪）</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${adapt ? "bg-rose-brand text-white" : "bg-white text-ink-faint"}`}>
              {adapt ? "開" : "關"}
            </span>
          </button>
          <p className="mt-1.5 px-1 text-[11px] text-ink-faint">
            {adapt
              ? weather.rainy
                ? "今日偏雨：時間軸已標亮室內／低熱暴露項目"
                : "今日偏熱：時間軸已標亮冷氣／室內項目"
              : "開啟後會標亮今日室內／低熱暴露項目"}
          </p>
        </div>
      </div>

      <div className={`rounded-3xl border px-4 py-3 shadow-[var(--shadow-soft)] ${overPace ? "border-rose-brand/30 bg-rose-soft" : "border-teal/20 bg-teal-soft"}`}>
        <div className="flex items-start gap-2.5">
          <span className="text-lg" aria-hidden="true">{overPace ? "⚠️" : "✅"}</span>
          <div>
            <p className="font-display text-sm font-bold text-ink">
              {overPace ? "預算優化提示" : "預算節奏健康"}
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
              {overPace
                ? `目前花費略超前；剩餘 ${formatJpy(remaining)}，日均建議 ${formatJpy(Math.round(perDay))}。今日可多排：Cat Street 散步、明治神宮外苑、安靜 Cafe 久坐。`
                : `已花 ${formatJpy(Math.round(totalSpent))}／${formatJpy(budget)} · 日均可用 ${formatJpy(Math.round(perDay))}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
