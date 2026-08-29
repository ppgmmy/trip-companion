export function DoughnutChart({ segments, size = 180, thickness = 22, centerLabel = "分類", centerValue, formatValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const visible = segments.filter((s) => s.value > 0);
  const centerText = centerValue ?? String(visible.length);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef3f1" strokeWidth={thickness} />
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{centerLabel}</p>
          <p className="mt-0.5 max-w-[6.5rem] truncate font-display text-base font-bold text-ink">{centerText}</p>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {visible.length === 0 ? (
          <li className="text-sm text-ink-faint">未有分類數據</li>
        ) : (
          visible
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((seg) => {
              const pct = Math.round((seg.value / total) * 100);
              return (
                <li key={seg.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
                    <span className="truncate">{seg.label}</span>
                  </span>
                  <span className="shrink-0 text-ink-soft">{pct}% · {formatValue ? formatValue(seg.value) : seg.value}</span>
                </li>
              );
            })
        )}
      </ul>
    </div>
  );
}

export function BarChart({ bars, formatLabel }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {bars.map((bar) => {
        const h = Math.max(4, Math.round((bar.value / max) * 120));
        return (
          <div key={bar.id} className="flex flex-1 flex-col items-center justify-end gap-1">
            <p className="text-[9px] font-semibold text-ink-faint">{bar.value > 0 && formatLabel ? formatLabel(bar.value) : "—"}</p>
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-jade to-[#2dd4bf] transition-all duration-500"
              style={{ height: `${h}px` }}
              title={`${bar.label}: ${bar.value}`}
            />
            <span className="text-[10px] font-bold text-ink-soft">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}
