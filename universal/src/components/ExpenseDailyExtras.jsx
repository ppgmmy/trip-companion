import { useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, formatHkd, formatMoney, toDateId } from "../data";
import { getFeatureMeta, getLastEnabledFeature, isFeatureEnabled } from "../data/featureFlags";

function shiftDateId(dateId, deltaDays) {
  const d = new Date(`${dateId}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toDateId(d);
}

function sumByDate(expenses, dateId, field = "amount") {
  return expenses
    .filter((e) => e.date === dateId)
    .reduce((s, e) => s + (Number(e[field]) || 0), 0);
}

function loggingStreak(expenses) {
  if (!expenses.length) return 0;
  const dates = new Set(expenses.map((e) => e.date).filter(Boolean));
  let streak = 0;
  let cursor = toDateId(new Date());
  // If today has no entry, start from yesterday (still count ongoing streak)
  if (!dates.has(cursor)) cursor = shiftDateId(cursor, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDateId(cursor, -1);
  }
  return streak;
}

function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() - day - offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateId(monday), end: toDateId(sunday) };
}

function inRange(dateId, start, end) {
  return dateId >= start && dateId <= end;
}

function formatWeekRange(bounds) {
  const [, m1, d1] = bounds.start.split("-");
  const [, m2, d2] = bounds.end.split("-");
  return `${Number(m1)}/${Number(d1)}–${Number(m2)}/${Number(d2)}`;
}

function formatShortDate(dateId) {
  if (!dateId) return "—";
  const [, m, d] = dateId.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function tripDayNumber(tripStartDate, dateId) {
  const start = new Date(`${tripStartDate}T12:00:00`).getTime();
  const target = new Date(`${dateId}T12:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(target)) return null;
  return Math.max(1, Math.floor((target - start) / 86400000) + 1);
}

function TopSpenderDayPanel({ trip, expenses }) {
  const analysis = useMemo(() => {
    const byDate = {};
    expenses.forEach((e) => {
      if (!e.date) return;
      if (!byDate[e.date]) byDate[e.date] = { amount: 0, hkd: 0, items: [] };
      byDate[e.date].amount += Number(e.amount) || 0;
      byDate[e.date].hkd += Number(e.baseAmount) || 0;
      byDate[e.date].items.push(e);
    });

    const entries = Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
    if (!entries.length) return null;

    entries.sort((a, b) => b.amount - a.amount);
    const top = entries[0];
    const second = entries[1] || null;
    const activeDays = entries.length;
    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    const avgActiveDay = totalAmount / activeDays;
    const aboveAvg = top.amount - avgActiveDay;
    const pctAboveAvg = avgActiveDay > 0 ? Math.round((aboveAvg / avgActiveDay) * 100) : 0;
    const shareOfTrip = totalAmount > 0 ? Math.round((top.amount / totalAmount) * 100) : 0;

    const catMap = {};
    top.items.forEach((e) => {
      catMap[e.categoryId] = (catMap[e.categoryId] || 0) + (Number(e.amount) || 0);
    });
    const topCats = Object.entries(catMap)
      .map(([id, amt]) => ({
        id,
        label: EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id,
        color: EXPENSE_CATEGORIES.find((c) => c.id === id)?.color || "#64748b",
        amount: amt,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const top5 = entries.slice(0, 5);
    const maxBar = top.amount || 1;
    const dayNum = tripDayNumber(trip.startDate, top.date);

    let insight = "留意呢日消費模式，之後可以提早收油";
    if (pctAboveAvg >= 80) insight = `比平均日高出 ${pctAboveAvg}%，值得檢視當日大額消費`;
    else if (pctAboveAvg >= 40) insight = "明顯高於平均，睇吓係咪一次性大買";
    else if (shareOfTrip >= 35) insight = `單日佔全程 ${shareOfTrip}%，集中消費日`;
    else if (second && top.amount - second.amount < top.amount * 0.1) insight = "同第二高日差唔多，消費較平均分散";

    return {
      top,
      second,
      avgActiveDay,
      aboveAvg,
      pctAboveAvg,
      shareOfTrip,
      topCats,
      top5,
      maxBar,
      dayNum,
      activeDays,
      insight,
    };
  }, [expenses, trip.startDate]);

  if (!isFeatureEnabled("top-spender-day") || !analysis) return null;

  const { top, second, avgActiveDay, aboveAvg, pctAboveAvg, shareOfTrip, topCats, top5, maxBar, dayNum, activeDays, insight } = analysis;
  const topBar = Math.max(12, Math.round((top.amount / maxBar) * 100));
  const avgBar = Math.max(8, Math.round((avgActiveDay / maxBar) * 100));

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">爆煲日提示</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            {formatShortDate(top.date)}
            {dayNum ? ` · 旅程第 ${dayNum} 日` : ""}
            {` · ${top.items.length} 筆`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-coral/15 px-2.5 py-1 text-[11px] font-bold text-coral">
          最高日
        </span>
      </div>

      <div className="mb-3 text-center">
        <p className="font-display text-2xl font-black text-coral">{formatMoney(top.amount, trip.targetCurrency)}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-ink-faint">{formatHkd(top.hkd)}</p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">爆煲日</p>
            <p className="font-display text-sm font-bold text-coral">{formatMoney(top.amount, trip.targetCurrency)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-coral transition-all duration-700"
              style={{ width: `${topBar}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">有記帳日平均（{activeDays} 日）</p>
            <p className="font-display text-sm font-bold text-ink-faint">{formatMoney(avgActiveDay, trip.targetCurrency)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className="h-full rounded-full bg-[#94a3b8] transition-all duration-700"
              style={{ width: `${avgBar}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-shell px-2 py-2.5">
          <p className="text-[10px] font-semibold text-ink-faint">高出平均</p>
          <p className="mt-0.5 text-sm font-black text-coral">
            {aboveAvg > 0 ? `+${formatMoney(aboveAvg, trip.targetCurrency)}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-shell px-2 py-2.5">
          <p className="text-[10px] font-semibold text-ink-faint">高出 %</p>
          <p className="mt-0.5 text-sm font-black text-coral">{pctAboveAvg > 0 ? `+${pctAboveAvg}%` : "—"}</p>
        </div>
        <div className="rounded-2xl bg-shell px-2 py-2.5">
          <p className="text-[10px] font-semibold text-ink-faint">佔全程</p>
          <p className="mt-0.5 text-sm font-black text-ink">{shareOfTrip}%</p>
        </div>
      </div>

      {topCats.length > 0 && (
        <div className="mt-3 rounded-2xl bg-shell/80 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">當日 Top 分類</p>
          <ul className="mt-2 space-y-1.5">
            {topCats.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-center font-bold text-ink-faint">{i + 1}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{c.label}</span>
                <span className="font-bold text-ink-soft">{formatMoney(c.amount, trip.targetCurrency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {top5.length > 1 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">支出最高 5 日</p>
          <div className="flex items-end justify-between gap-1">
            {top5.map((d, i) => {
              const h = Math.max(16, Math.round((d.amount / maxBar) * 48));
              const isTop = i === 0;
              return (
                <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className={`text-[8px] font-bold ${isTop ? "text-coral" : "text-ink-faint"}`}>
                    {formatMoney(d.amount, trip.targetCurrency).replace(/[^\d.,]/g, "").slice(0, 5)}
                  </span>
                  <div
                    className={`w-full max-w-[2.5rem] rounded-t-lg transition-all duration-500 ${isTop ? "bg-gradient-to-t from-coral to-[#f59e0b]" : "bg-[#cbd5e1]"}`}
                    style={{ height: `${h}px` }}
                  />
                  <span className={`text-[9px] ${isTop ? "font-bold text-coral" : "text-ink-faint"}`}>
                    {formatShortDate(d.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {second && (
        <p className="mt-2 text-center text-[10px] text-ink-faint">
          第二高：{formatShortDate(second.date)} · {formatMoney(second.amount, trip.targetCurrency)}
        </p>
      )}

      <p className="mt-3 text-center text-xs font-semibold text-coral">{insight}</p>
    </div>
  );
}

function WeekOverWeekCompare({ trip, expenses }) {
  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(1);

  const thisWeekExpenses = expenses.filter((e) => inRange(e.date, thisWeek.start, thisWeek.end));
  const lastWeekExpenses = expenses.filter((e) => inRange(e.date, lastWeek.start, lastWeek.end));

  const thisWeekSum = thisWeekExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const lastWeekSum = lastWeekExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const wod = thisWeekSum - lastWeekSum;
  const pctChange = lastWeekSum > 0 ? Math.round((wod / lastWeekSum) * 100) : null;

  const thisWeekDays = new Set(thisWeekExpenses.map((e) => e.date)).size;
  const lastWeekDays = new Set(lastWeekExpenses.map((e) => e.date)).size;
  const thisDailyAvg = thisWeekDays > 0 ? thisWeekSum / thisWeekDays : 0;
  const lastDailyAvg = lastWeekDays > 0 ? lastWeekSum / lastWeekDays : 0;

  const max = Math.max(thisWeekSum, lastWeekSum, 1);
  const thisBar = Math.max(8, Math.round((thisWeekSum / max) * 100));
  const lastBar = Math.max(8, Math.round((lastWeekSum / max) * 100));

  const hasAny = thisWeekSum > 0 || lastWeekSum > 0;

  let insight = "記一筆就會開始週對週比較";
  if (hasAny) {
    if (lastWeekSum === 0 && thisWeekSum > 0) insight = "上週未有記帳，本週係起點";
    else if (wod > 0) insight = pctChange !== null && pctChange >= 20 ? "消費升溫，留意剩餘預算" : "本週比上週使費多";
    else if (wod < 0) insight = pctChange !== null && pctChange <= -20 ? "本週明顯收油，做得好" : "本週比上週慳咗";
    else insight = "兩週使費持平";
  }

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">本週 vs 上週</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            本週 {formatWeekRange(thisWeek)} · 上週 {formatWeekRange(lastWeek)}
          </p>
        </div>
        {hasAny && wod !== 0 && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${wod > 0 ? "bg-coral/15 text-coral" : "bg-jade-soft text-jade-deep"}`}>
            {wod > 0 ? "↑" : "↓"} {pctChange !== null ? `${Math.abs(pctChange)}%` : formatMoney(Math.abs(wod), trip.targetCurrency)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">本週</p>
            <p className="font-display text-sm font-bold text-ink">{formatMoney(thisWeekSum, trip.targetCurrency)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-jade to-[#34d399] transition-all duration-700"
              style={{ width: `${thisBar}%` }}
            />
          </div>
          {thisWeekDays > 0 && (
            <p className="mt-1 text-[10px] text-ink-faint">
              {thisWeekDays} 日有記帳 · 日均 {formatMoney(thisDailyAvg, trip.targetCurrency)}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">上週</p>
            <p className="font-display text-sm font-bold text-ink-faint">{formatMoney(lastWeekSum, trip.targetCurrency)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className="h-full rounded-full bg-[#94a3b8] transition-all duration-700"
              style={{ width: `${lastBar}%` }}
            />
          </div>
          {lastWeekDays > 0 && (
            <p className="mt-1 text-[10px] text-ink-faint">
              {lastWeekDays} 日有記帳 · 日均 {formatMoney(lastDailyAvg, trip.targetCurrency)}
            </p>
          )}
        </div>
      </div>

      <p className={`mt-3 text-center text-xs font-semibold ${wod > 0 ? "text-coral" : wod < 0 ? "text-jade" : "text-ink-faint"}`}>
        {hasAny && wod !== 0
          ? wod > 0
            ? `比上週多 ${formatMoney(wod, trip.targetCurrency)}${pctChange !== null ? `（+${pctChange}%）` : ""}`
            : `比上週少 ${formatMoney(-wod, trip.targetCurrency)}${pctChange !== null ? `（${pctChange}%）` : ""}`
          : insight}
      </p>
    </div>
  );
}

function Sparkline({ values, dateIds, formatValue }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const max = Math.max(...values, 1);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const todayVal = values[values.length - 1] ?? 0;
  const vsAvg = todayVal - avg;
  const w = 280;
  const h = 64;
  const pad = 6;

  const coords = values.map((v, i) => {
    const x = values.length <= 1 ? w / 2 : pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y, v };
  });
  const linePts = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPts = `${pad},${h - pad} ${linePts} ${w - pad},${h - pad}`;
  const avgY = h - pad - (avg / max) * (h - pad * 2);
  const peakIdx = values.indexOf(max);
  const focusIdx = activeIdx ?? values.length - 1;

  function shortLabel(dateId) {
    if (!dateId) return "—";
    const [, m, d] = dateId.split("-");
    return `${Number(m)}/${Number(d)}`;
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-ink">
          {formatValue(coords[focusIdx]?.v ?? 0)}
          <span className="ml-1.5 text-[11px] font-semibold text-ink-faint">
            {focusIdx === values.length - 1 ? "今日" : shortLabel(dateIds[focusIdx])}
          </span>
        </p>
        <p className={`text-[11px] font-semibold ${vsAvg > 0 ? "text-coral" : vsAvg < 0 ? "text-jade" : "text-ink-faint"}`}>
          {vsAvg === 0 ? "同 7 日平均" : vsAvg > 0 ? `高於平均 ${formatValue(vsAvg)}` : `低於平均 ${formatValue(-vsAvg)}`}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full touch-manipulation" role="img" aria-label="近 7 日支出趨勢">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={avgY} x2={w - pad} y2={avgY} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
        <polygon points={areaPts} fill="url(#spark-fill)" />
        <polyline fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={linePts} />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === focusIdx ? 5 : i === peakIdx ? 4 : 3}
            fill={i === focusIdx ? "#0d9488" : i === peakIdx ? "#f97316" : "#fff"}
            stroke={i === focusIdx || i === peakIdx ? (i === peakIdx && i !== focusIdx ? "#f97316" : "#0d9488") : "#0d9488"}
            strokeWidth="2"
            className="cursor-pointer"
            onClick={() => setActiveIdx(i === activeIdx ? null : i)}
          />
        ))}
      </svg>
      <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] text-ink-faint">
        {dateIds.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveIdx(i === activeIdx ? null : i)}
            className={`min-h-8 rounded-lg py-0.5 transition ${i === focusIdx ? "bg-jade-soft font-bold text-jade-deep" : "hover:bg-shell"}`}
          >
            <span className="block">{i === values.length - 1 ? "今" : shortLabel(id)}</span>
            <span className="block truncate text-[8px] opacity-80">{values[i] > 0 ? formatValue(values[i]).replace(/[^\d.,]/g, "").slice(0, 6) : "—"}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-ink-faint">
        虛線 = 7 日平均 {formatValue(avg)} · 橙點 = 最高日
      </p>
    </div>
  );
}

export function DailyOptBanner() {
  const enabled = isFeatureEnabled("daily-opt-banner");
  const last = getLastEnabledFeature();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!last.id || !last.updatedAt) return;
    const key = `expense-opt-dismissed:${last.id}:${last.updatedAt}`;
    setDismissed(localStorage.getItem(key) === "1");
  }, [last.id, last.updatedAt]);

  if (!enabled || !last.id || !last.title || dismissed) return null;
  const meta = getFeatureMeta(last.id);

  return (
    <div className="rounded-3xl border border-amber-300/50 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">✨ 今日自動優化</p>
          <p className="mt-1 text-sm font-bold text-ink">{last.title}</p>
          {meta?.description && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{meta.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            if (last.id && last.updatedAt) {
              localStorage.setItem(`expense-opt-dismissed:${last.id}:${last.updatedAt}`, "1");
            }
            setDismissed(true);
          }}
          className="shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-ink-faint"
          aria-label="關閉"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function PaceVsIdealPanel({ trip, totalSpent, budget, days, elapsedDays, remainingDays }) {
  if (!isFeatureEnabled("pace-vs-ideal") || budget <= 0) return null;

  const idealDaily = budget / Math.max(1, days);
  const actualPace = totalSpent / Math.max(1, elapsedDays);
  const expectedByNow = idealDaily * elapsedDays;
  const delta = totalSpent - expectedByNow;
  const paceRatio = idealDaily > 0 ? actualPace / idealDaily : 0;
  const pacePct = Math.round(paceRatio * 100);
  const maxBar = Math.max(actualPace, idealDaily, 1);
  const actualBar = Math.max(8, Math.round((actualPace / maxBar) * 100));
  const idealBar = Math.max(8, Math.round((idealDaily / maxBar) * 100));

  let statusLabel = "節奏健康";
  let statusClass = "bg-jade-soft text-jade-deep";
  let insight = "消費節奏同預算理想日均一致，繼續保持";
  let insightClass = "text-jade";

  if (paceRatio < 0.85) {
    statusLabel = "慳油中";
    statusClass = "bg-jade-soft text-jade-deep";
    insight = `比理想節奏慳咗 ${formatMoney(-delta, trip.targetCurrency)}，仲有餘力`;
    insightClass = "text-jade";
  } else if (paceRatio > 1.2) {
    statusLabel = "消費偏快";
    statusClass = "bg-coral/15 text-coral";
    insight = `已超前理想 ${formatMoney(delta, trip.targetCurrency)}，剩 ${remainingDays} 日要收油`;
    insightClass = "text-coral";
  } else if (paceRatio > 1.05) {
    statusLabel = "略為超前";
    statusClass = "bg-[#fef3c7] text-[#b45309]";
    insight = `比理想多 ${formatMoney(delta, trip.targetCurrency)}，留意後半段預算`;
    insightClass = "text-[#b45309]";
  }

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">理想日均對比</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            第 {elapsedDays}/{days} 日 · 理想 {formatMoney(idealDaily, trip.targetCurrency)}/日
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>
          {statusLabel} · {pacePct}%
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">實際日均（已過 {elapsedDays} 日）</p>
            <p className={`font-display text-sm font-bold ${paceRatio > 1.05 ? "text-coral" : paceRatio < 0.85 ? "text-jade" : "text-ink"}`}>
              {formatMoney(actualPace, trip.targetCurrency)}
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${paceRatio > 1.05 ? "bg-gradient-to-r from-[#f59e0b] to-coral" : "bg-gradient-to-r from-jade to-[#34d399]"}`}
              style={{ width: `${actualBar}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink-soft">理想日均（全程平均）</p>
            <p className="font-display text-sm font-bold text-ink-faint">{formatMoney(idealDaily, trip.targetCurrency)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#efe9e0]">
            <div
              className="h-full rounded-full bg-[#94a3b8] transition-all duration-700"
              style={{ width: `${idealBar}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-shell px-2 py-2.5">
          <p className="text-[10px] font-semibold text-ink-faint">至今應使</p>
          <p className="mt-0.5 text-sm font-black text-ink">{formatMoney(expectedByNow, trip.targetCurrency)}</p>
        </div>
        <div className="rounded-2xl bg-shell px-2 py-2.5">
          <p className="text-[10px] font-semibold text-ink-faint">實際已使</p>
          <p className={`mt-0.5 text-sm font-black ${delta > 0 ? "text-coral" : delta < 0 ? "text-jade" : "text-ink"}`}>
            {formatMoney(totalSpent, trip.targetCurrency)}
          </p>
        </div>
      </div>

      <p className={`mt-3 text-center text-xs font-semibold ${insightClass}`}>{insight}</p>
    </div>
  );
}

export function ExpenseInsightCards({ trip, expenses, days, totalSpent, budget, elapsedDays = 1, remainingDays }) {
  const todayId = toDateId(new Date());
  const yesterdayId = shiftDateId(todayId, -1);
  const todaySum = sumByDate(expenses, todayId);
  const yesterdaySum = sumByDate(expenses, yesterdayId);
  const delta = todaySum - yesterdaySum;

  const streak = loggingStreak(expenses);
  const biggest = useMemo(
    () => expenses.reduce((best, e) => (!best || Number(e.amount) > Number(best.amount) ? e : best), null),
    [expenses],
  );

  const sparkDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateId = shiftDateId(todayId, i - 6);
      return { dateId, value: sumByDate(expenses, dateId) };
    });
  }, [expenses, todayId]);
  const sparkValues = useMemo(() => sparkDays.map((d) => d.value), [sparkDays]);
  const sparkDateIds = useMemo(() => sparkDays.map((d) => d.dateId), [sparkDays]);

  const cards = [];

  if (isFeatureEnabled("today-vs-yesterday")) {
    cards.push(
      <div key="ty" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">今日 vs 昨日</p>
        <p className="mt-1 font-display text-lg font-bold">{formatMoney(todaySum, trip.targetCurrency)}</p>
        <p className={`text-xs font-semibold ${delta > 0 ? "text-coral" : delta < 0 ? "text-jade" : "text-ink-faint"}`}>
          {delta === 0 ? "同昨日持平" : delta > 0 ? `比昨日多 ${formatMoney(delta, trip.targetCurrency)}` : `比昨日少 ${formatMoney(-delta, trip.targetCurrency)}`}
        </p>
      </div>,
    );
  }

  if (isFeatureEnabled("logging-streak")) {
    cards.push(
      <div key="streak" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">記帳連續日數</p>
        <p className="mt-1 font-display text-lg font-bold">{streak} 日</p>
        <p className="text-xs text-ink-faint">{streak > 0 ? "繼續保持！" : "今日記一筆就開始"}</p>
      </div>,
    );
  }

  if (isFeatureEnabled("biggest-expense") && biggest) {
    cards.push(
      <div key="big" className="rounded-2xl bg-white/85 p-3 shadow-[var(--shadow-soft)]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">單筆最高</p>
        <p className="mt-1 truncate font-display text-lg font-bold">{formatMoney(biggest.amount, trip.targetCurrency)}</p>
        <p className="truncate text-xs text-ink-faint">{biggest.note} · {biggest.date}</p>
      </div>,
    );
  }

  return (
    <>
      {cards.length > 0 && <div className="grid grid-cols-2 gap-2">{cards}</div>}

      <TopSpenderDayPanel trip={trip} expenses={expenses} />

      <PaceVsIdealPanel
        trip={trip}
        totalSpent={totalSpent}
        budget={budget}
        days={days}
        elapsedDays={elapsedDays}
        remainingDays={remainingDays}
      />

      {isFeatureEnabled("week-over-week") && (
        <WeekOverWeekCompare trip={trip} expenses={expenses} />
      )}

      {isFeatureEnabled("seven-day-sparkline") && (
        <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">近 7 日趨勢</p>
            {sparkValues.every((v) => v === 0) && (
              <span className="text-[10px] font-semibold text-ink-faint">記一筆就會顯示走勢</span>
            )}
          </div>
          <Sparkline
            values={sparkValues}
            dateIds={sparkDateIds}
            formatValue={(v) => formatMoney(v, trip.targetCurrency)}
          />
        </div>
      )}
    </>
  );
}

export function CategoryRanking({ catTotals, expenses, showPct, filterCategory, setFilterCategory }) {
  const [focusId, setFocusId] = useState(null);

  const countByCat = useMemo(() => {
    const map = {};
    (expenses || []).forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + 1;
    });
    return map;
  }, [expenses]);

  if (!isFeatureEnabled("category-ranking")) return null;

  const ranked = [...catTotals].filter((c) => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  if (!ranked.length) return null;

  const grandTotal = catTotals.reduce((s, c) => s + c.value, 0) || 1;
  const maxValue = ranked[0]?.value || 1;
  const medals = ["🥇", "🥈", "🥉"];
  const canFilter = isFeatureEnabled("category-filter") && typeof setFilterCategory === "function";
  const topShare = Math.round((ranked[0].value / grandTotal) * 100);

  function handleRowClick(catId) {
    setFocusId((prev) => (prev === catId ? null : catId));
    if (canFilter) {
      setFilterCategory((prev) => (prev === catId ? "all" : catId));
    }
  }

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">分類排行榜（HKD）</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            {ranked[0].label} 佔 {topShare}% · Top {ranked.length}
          </p>
        </div>
        {canFilter && filterCategory !== "all" && (
          <button
            type="button"
            onClick={() => {
              setFilterCategory("all");
              setFocusId(null);
            }}
            className="shrink-0 rounded-full bg-jade-soft px-2.5 py-1 text-[10px] font-bold text-jade-deep"
          >
            清除篩選
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {ranked.map((c, i) => {
          const pct = Math.round((c.value / grandTotal) * 100);
          const barPct = Math.max(6, Math.round((c.value / maxValue) * 100));
          const txCount = countByCat[c.id] || 0;
          const avgPerTx = txCount > 0 ? c.value / txCount : 0;
          const isActive = focusId === c.id || filterCategory === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleRowClick(c.id)}
                className={`w-full rounded-2xl px-2 py-2 text-left transition active:scale-[0.99] ${isActive ? "bg-jade-soft/60 ring-1 ring-jade/20" : "hover:bg-shell/80"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-faint">
                    {i < 3 ? medals[i] : i + 1}
                  </span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{c.label}</span>
                  <span className="text-sm font-bold text-jade-deep">{formatHkd(c.value)}</span>
                  {(showPct || isFeatureEnabled("category-pct-labels")) && (
                    <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-ink-faint">{pct}%</span>
                  )}
                </div>
                <div className="mt-2 ml-7 h-2 overflow-hidden rounded-full bg-[#efe9e0]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barPct}%`,
                      background: `linear-gradient(90deg, ${c.color}cc, ${c.color})`,
                    }}
                  />
                </div>
                {isActive && (
                  <p className="mt-2 ml-7 text-[11px] font-semibold text-ink-soft">
                    {txCount} 筆 · 平均每筆 {formatHkd(avgPerTx)}
                    {canFilter ? " · 已篩選列表" : " · 點擊展開"}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {canFilter && (
        <p className="mt-3 text-center text-[10px] text-ink-faint">點擊分類可篩選下方支出列表</p>
      )}
      {isFeatureEnabled("avg-per-category") && (
        <p className="mt-3 text-[11px] text-ink-faint">提示：排行以本旅程累計計算，日均可按旅程日數自行估算。</p>
      )}
    </div>
  );
}

export function PinnedBudgetAlert({ budgetPct, remaining, currency }) {
  if (!isFeatureEnabled("pinned-budget-alert") || budgetPct < 80) return null;
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-md ${budgetPct >= 100 ? "bg-coral" : "bg-[#b45309]"}`}>
      {budgetPct >= 100
        ? `⚠️ 已超預算！剩餘 ${formatMoney(remaining, currency)}`
        : `⚠️ 已用 ${budgetPct.toFixed(0)}% 預算，剩餘 ${formatMoney(remaining, currency)} — 開始收油`}
    </div>
  );
}

export function FilteredCategorySummary({ trip, expenses, filterCategory, totalSpent }) {
  if (!isFeatureEnabled("category-filter") || filterCategory === "all") return null;

  const cat = EXPENSE_CATEGORIES.find((c) => c.id === filterCategory);
  const filtered = expenses.filter((e) => e.categoryId === filterCategory);
  if (!filtered.length) return null;

  const sum = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const sumHkd = filtered.reduce((s, e) => s + (Number(e.baseAmount) || 0), 0);
  const pct = totalSpent > 0 ? Math.round((sum / totalSpent) * 100) : 0;

  return (
    <div
      className="rounded-2xl border border-jade/20 bg-jade-soft/50 px-4 py-3 shadow-[var(--shadow-soft)]"
      style={{ borderLeftColor: cat?.color || "#0d9488", borderLeftWidth: 4 }}
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: cat?.color || "#64748b" }} />
        <p className="text-sm font-bold text-ink">{cat?.label || filterCategory}</p>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-jade-deep">
          篩選中
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-semibold text-ink-faint">筆數</p>
          <p className="text-sm font-black text-ink">{filtered.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-faint">小計</p>
          <p className="text-sm font-black text-ink">{formatMoney(sum, trip.targetCurrency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-faint">佔總支出</p>
          <p className="text-sm font-black text-jade-deep">{pct}%</p>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-ink-faint">{formatHkd(sumHkd)}</p>
    </div>
  );
}

export function ExpenseListExtras({
  trip,
  expenses,
  filterCategory,
  setFilterCategory,
  search,
  setSearch,
  searchMatchCount = 0,
  searchPoolCount = 0,
  showHkd,
  setShowHkd,
  onDuplicateLast,
}) {
  const showFilter = isFeatureEnabled("category-filter");
  const showSearch = isFeatureEnabled("expense-search");
  const showToggle = isFeatureEnabled("hkd-list-toggle");
  const showDup = isFeatureEnabled("duplicate-last");
  const showExport = isFeatureEnabled("export-csv");

  const countByCat = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.categoryId] = (map[e.categoryId] || 0) + 1;
    });
    return map;
  }, [expenses]);

  if (!showFilter && !showSearch && !showToggle && !showDup && !showExport) return null;

  function exportCsv() {
    const rows = [["date", "category", "note", "amount", "currency", "hkd", "rate"]];
    expenses.forEach((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId);
      rows.push([
        e.date,
        cat?.label || e.categoryId,
        `"${(e.note || "").replace(/"/g, '""')}"`,
        e.amount,
        trip.targetCurrency,
        e.baseAmount,
        e.storedRate,
      ]);
    });
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.city || "trip"}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showExport && (
          <button type="button" onClick={exportCsv} className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink">
            ⬇ 匯出 CSV
          </button>
        )}
        {showDup && expenses.length > 0 && (
          <button type="button" onClick={onDuplicateLast} className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink">
            ⎘ 複製上一筆
          </button>
        )}
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowHkd((v) => !v)}
            className="min-h-10 rounded-2xl border border-jade/15 bg-white px-3 text-xs font-bold text-ink"
          >
            顯示：{showHkd ? "港幣" : trip.targetCurrency}
          </button>
        )}
      </div>
      {showSearch && (
        <div className="space-y-1.5">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint" aria-hidden="true">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋備註、分類或金額…"
              className="h-11 w-full rounded-2xl border border-jade/15 bg-mist pl-9 pr-10 text-sm outline-none ring-jade focus:ring-2"
            />
            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-ink-faint transition active:scale-90"
                aria-label="清除搜尋"
              >
                ✕
              </button>
            )}
          </div>
          {search.trim() && (
            <p className="px-1 text-[11px] font-semibold text-ink-soft">
              {searchMatchCount > 0
                ? `找到 ${searchMatchCount} 筆${searchPoolCount !== searchMatchCount ? `（共 ${searchPoolCount} 筆可搜）` : ""}`
                : `搵唔到「${search.trim()}」— 試分類名或金額`}
            </p>
          )}
        </div>
      )}
      {showFilter && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">分類篩選</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCategory("all")}
              className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${filterCategory === "all" ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              全部
              <span className="ml-1 opacity-70">({expenses.length})</span>
            </button>
            {EXPENSE_CATEGORIES.map((c) => {
              const cnt = countByCat[c.id] || 0;
              if (cnt === 0) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCategory(c.id)}
                  className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${filterCategory === c.id ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                    {c.label}
                    <span className="opacity-70">({cnt})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_AMOUNT_PRESETS = {
  JPY: [
    { n: 500, label: "小食" },
    { n: 1000, label: "午餐" },
    { n: 2000, label: "晚餐" },
    { n: 5000, label: "交通" },
  ],
  THB: [
    { n: 50, label: "小食" },
    { n: 100, label: "午餐" },
    { n: 200, label: "晚餐" },
    { n: 500, label: "購物" },
  ],
  TWD: [
    { n: 100, label: "小食" },
    { n: 200, label: "午餐" },
    { n: 500, label: "晚餐" },
    { n: 1000, label: "購物" },
  ],
  KRW: [
    { n: 5000, label: "小食" },
    { n: 10000, label: "午餐" },
    { n: 20000, label: "晚餐" },
    { n: 50000, label: "購物" },
  ],
  default: [
    { n: 10, label: "小食" },
    { n: 20, label: "午餐" },
    { n: 50, label: "晚餐" },
    { n: 100, label: "購物" },
  ],
};

function AmountChip({ n, label, currency, rate, active, onPick }) {
  const hkdHint = rate > 0 ? formatHkd(n * rate).replace("HK$", "") : null;
  return (
    <button
      type="button"
      onClick={() => onPick(n)}
      className={`flex min-h-11 min-w-[4.5rem] flex-col items-center justify-center rounded-2xl border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${active ? "badge-active border-transparent shadow-sm" : "border-jade/15 bg-mist text-ink-soft"}`}
    >
      <span className="font-display text-sm leading-tight">{formatMoney(n, currency).replace(/\s/g, "")}</span>
      {label && <span className="mt-0.5 text-[9px] font-semibold opacity-80">{label}</span>}
      {hkdHint && !active && <span className="mt-0.5 text-[8px] font-normal opacity-60">≈{hkdHint}</span>}
    </button>
  );
}

export function QuickAddHelpers({ amount, setAmount, note, setNote, currency, expenses = [], rate = 0 }) {
  const chips = isFeatureEnabled("quick-amount-chips");
  const templates = isFeatureEnabled("note-templates");
  const [addMode, setAddMode] = useState(false);

  const presets = QUICK_AMOUNT_PRESETS[currency] || QUICK_AMOUNT_PRESETS.default;
  const notes = ["午餐", "晚餐", "咖啡", "交通", "超市", "手信"];

  const recentAmounts = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (let i = expenses.length - 1; i >= 0 && result.length < 4; i -= 1) {
      const n = Number(expenses[i].amount);
      if (Number.isFinite(n) && n > 0 && !seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }, [expenses]);

  function pickAmount(n) {
    if (addMode) {
      const current = Number(amount) || 0;
      setAmount(String(Math.round((current + n) * 100) / 100));
    } else {
      setAmount(String(n));
    }
  }

  if (!chips && !templates) return null;

  const currentNum = Number(amount) || 0;

  return (
    <div className="space-y-2">
      {chips && (
        <div className="rounded-2xl border border-jade/10 bg-shell/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">快速金額</p>
            <button
              type="button"
              onClick={() => setAddMode((v) => !v)}
              aria-pressed={addMode}
              className={`min-h-8 rounded-xl px-2.5 text-[10px] font-bold transition ${addMode ? "bg-jade text-white" : "bg-white text-ink-soft ring-1 ring-jade/15"}`}
            >
              {addMode ? "＋累加中" : "累加模式"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(({ n, label }) => (
              <AmountChip
                key={`preset-${n}`}
                n={n}
                label={label}
                currency={currency}
                rate={rate}
                active={!addMode && String(amount) === String(n)}
                onPick={pickAmount}
              />
            ))}
          </div>
          {recentAmounts.length > 0 && (
            <>
              <p className="mb-1.5 mt-2.5 text-[10px] font-semibold text-ink-faint">最近用過</p>
              <div className="flex flex-wrap gap-1.5">
                {recentAmounts.map((n) => (
                  <AmountChip
                    key={`recent-${n}`}
                    n={n}
                    label={null}
                    currency={currency}
                    rate={rate}
                    active={!addMode && String(amount) === String(n)}
                    onPick={pickAmount}
                  />
                ))}
              </div>
            </>
          )}
          {addMode && currentNum > 0 && (
            <p className="mt-2 text-center text-[10px] font-semibold text-jade-deep">
              再撳金額會加到 {formatMoney(currentNum, currency)}
            </p>
          )}
        </div>
      )}
      {templates && (
        <div className="flex flex-wrap gap-1.5">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              className={`min-h-9 rounded-2xl border px-3 text-xs font-bold ${note === n ? "badge-active border-transparent" : "border-jade/15 bg-mist text-ink-soft"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyStateTip({ hasExpenses }) {
  if (hasExpenses || !isFeatureEnabled("empty-state-tips")) return null;
  return (
    <li className="rounded-2xl border border-dashed border-jade/20 bg-white/50 px-4 py-6 text-center text-sm text-ink-soft">
      尚未記帳 — 試吓用上方快速記帳，或撳右下角 ＋ 即場記一筆。
    </li>
  );
}
