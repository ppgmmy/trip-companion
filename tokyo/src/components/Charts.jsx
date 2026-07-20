export function DoughnutChart({ segments, size = 180, thickness = 22 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1eef2"
            strokeWidth={thickness}
          />
          {segments.map((seg) => {
            const length = (seg.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const el = (
              <circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              >
                <title>{`${seg.label}: ${Math.round((seg.value / total) * 100)}%`}</title>
              </circle>
            );
            offset += length;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">分類</p>
          <p className="font-display text-lg font-bold text-ink">
            {segments.filter((s) => s.value > 0).length}
          </p>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <li key={seg.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                {seg.label}
              </span>
              <span className="text-ink-soft">
                {pct}% · HK${" "}
                {seg.value.toLocaleString("en-HK", { maximumFractionDigits: 0 })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BarChart({ bars, maxValue, unit = "hkd" }) {
  const max = maxValue || Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {bars.map((bar) => {
        const h = Math.max(4, Math.round((bar.value / max) * 120));
        const label =
          bar.value > 0
            ? unit === "hkd"
              ? `HK$${Math.round(bar.value)}`
              : `¥${Math.round(bar.value / 1000)}k`
            : "—";
        return (
          <div key={bar.id} className="flex flex-1 flex-col items-center justify-end gap-1">
            <p className="text-[9px] font-semibold text-ink-faint">{label}</p>
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-rose-brand to-[#fb7185] transition-all duration-500"
              style={{ height: `${h}px` }}
              title={`${bar.label}: ${label}`}
            />
            <span className="text-[10px] font-bold text-ink-soft">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}
