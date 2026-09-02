import { useMemo } from "react";
import { formatHkd, formatMoney, toDateId, todayIndex, tripDays, weatherForDay } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripKey, TRIP_SECTIONS } from "../storage";

const LOW_COST = {
  default: ["市區公園散步", "Window Shopping", "免費觀景點", "安靜 Cafe 久坐"],
};

export default function DailyIntel({ trip, expenses, personal = [] }) {
  const [adapt, setAdapt] = useLocalStorage(tripKey(trip.id, TRIP_SECTIONS.adapt), false, {
    migrate: (v) => v === true || v === "true" || v === 1,
  });

  const idx = todayIndex(trip);
  const days = tripDays(trip);
  const weather = weatherForDay(trip, idx);

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [expenses]
  );
  const remaining = Math.max(0, trip.budget - totalSpent);
  const remainingDays = Math.max(1, days - idx);
  const perDay = remaining / remainingDays;
  const avgPlanned = trip.budget / days;
  const overPace = totalSpent > avgPlanned * (idx + 1) * 1.1;

  const todayPersonal = useMemo(() => {
    const todayId = toDateId(new Date());
    return (Array.isArray(personal) ? personal : [])
      .filter((item) => item.date === todayId && !item.done)
      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }, [personal]);

  const date = new Date(new Date(trip.startDate).getTime() + idx * 86400000);
  const dateLabel = `${trip.startDate.slice(5).replace("-", "/")} 起第 ${idx + 1}/${days} 天`;

  return (
    <section className="space-y-3" aria-label="每日情報">
      <div className="overflow-hidden rounded-3xl bg-white/85 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-jade-soft/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-jade text-white shadow-[var(--shadow-soft)]">
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
        <p className="px-4 pb-3 text-[13px] leading-relaxed text-ink-soft">
          {weather.rainy
            ? `降雨機率 ${weather.rain}：建議優先室內動線，帶摺疊傘。`
            : weather.heatwave
              ? `高溫 ${weather.temp}：正午避免長時間室外步行，多進商場／Cafe 休息。`
              : `天氣尚可：室內外交替最舒服，正午仍建議稍作休息。`}
        </p>
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setAdapt((v) => !v)}
            aria-pressed={adapt}
            className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border px-3.5 text-left text-[13px] font-bold transition active:scale-[0.98] ${
              adapt ? "border-jade bg-jade-soft/60 text-ink" : "border-jade/15 bg-mist text-ink"
            }`}
          >
            <span>依今日天氣調整行程（雨／熱浪）</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${adapt ? "bg-jade text-white" : "bg-white text-ink-faint"}`}>
              {adapt ? "開" : "關"}
            </span>
          </button>
          <p className="mt-1.5 px-1 text-[11px] text-ink-faint">
            {adapt ? "已開啟：會在清單／足跡優先顯示室內項目" : "開啟後會優先顯示今日室內／低熱暴露項目"}
          </p>
        </div>
      </div>

      {todayPersonal.length > 0 && (
        <div className="rounded-3xl border border-jade/20 bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-jade">今日個人</p>
          <ul className="mt-2 space-y-1.5">
            {todayPersonal.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-[13px]">
                <span aria-hidden="true">{item.kind === "event" ? "📅" : "☑️"}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{item.title}</span>
                {item.time && <span className="shrink-0 text-[11px] font-bold text-jade-deep">{item.time}</span>}
              </li>
            ))}
          </ul>
          {todayPersonal.length > 4 && (
            <p className="mt-1.5 text-[11px] text-ink-faint">仲有 {todayPersonal.length - 4} 項 · 見「個人」分頁</p>
          )}
        </div>
      )}

      <div className={`rounded-3xl border px-4 py-3 shadow-[var(--shadow-soft)] ${overPace ? "border-coral/30 bg-coral-soft" : "border-jade/20 bg-jade-soft/70"}`}>
        <div className="flex items-start gap-2.5">
          <span className="text-lg" aria-hidden="true">{overPace ? "⚠️" : "✅"}</span>
          <div>
            <p className="font-display text-sm font-bold text-ink">{overPace ? "預算優化提示" : "預算節奏健康"}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
              {overPace
                ? `目前花費略超前；剩餘 ${formatMoney(remaining, trip.targetCurrency)}，日均建議 ${formatMoney(Math.round(perDay), trip.targetCurrency)}。今日可多排：${LOW_COST.default.join("、")}。`
                : `已花 ${formatMoney(Math.round(totalSpent), trip.targetCurrency)}／${formatMoney(trip.budget, trip.targetCurrency)} · 日均可用 ${formatMoney(Math.round(perDay), trip.targetCurrency)}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
