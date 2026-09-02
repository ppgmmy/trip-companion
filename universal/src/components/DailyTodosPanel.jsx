import { useMemo, useState } from "react";
import { dailyTodosMonthStats, toDateId, uid } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

function SectionCard({ title, hint, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-jade/10 bg-mist/40 px-3 py-2">
        <p className="text-xs font-bold text-ink">{title}</p>
        {hint && <p className="text-[10px] text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DailyTodosPanel() {
  const todayId = toDateId(new Date());
  const [title, setTitle] = useState("");
  const [store, setStore] = useLocalStorage(
    REGISTRY_KEYS.dailyTodos,
    { templates: [], log: {} },
    {
      migrate: (v) => {
        const base = v && typeof v === "object" ? v : {};
        return {
          templates: Array.isArray(base.templates) ? base.templates : [],
          log: base.log && typeof base.log === "object" ? base.log : {},
        };
      },
    },
  );

  const templates = store.templates || [];
  const log = store.log || {};
  const todayDone = useMemo(() => new Set(Array.isArray(log[todayId]) ? log[todayId] : []), [log, todayId]);
  const stats = useMemo(() => dailyTodosMonthStats(templates, log, todayId), [templates, log, todayId]);

  function addTemplate(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setStore((prev) => ({
      ...prev,
      templates: [...(prev.templates || []), { id: uid("daily"), title: trimmed, createdAt: Date.now() }],
    }));
    setTitle("");
  }

  function removeTemplate(id) {
    setStore((prev) => ({
      templates: (prev.templates || []).filter((item) => item.id !== id),
      log: Object.fromEntries(
        Object.entries(prev.log || {}).map(([dateId, ids]) => [dateId, ids.filter((x) => x !== id)]),
      ),
    }));
  }

  function toggleToday(id) {
    setStore((prev) => {
      const current = new Set(Array.isArray(prev.log?.[todayId]) ? prev.log[todayId] : []);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      return {
        ...prev,
        log: { ...(prev.log || {}), [todayId]: [...current] },
      };
    });
  }

  const todayAllDone = templates.length > 0 && templates.every((item) => todayDone.has(item.id));

  return (
    <div className="space-y-3">
      <SectionCard title="今月完成紀錄" hint={`${stats.monthLabel} · 每日全部打勾算 1 日`}>
        <div className="flex items-center gap-4 p-4">
          <div
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#0d9488 ${stats.pct * 3.6}deg, #e7efed ${stats.pct * 3.6}deg)`,
            }}
          >
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <span className="font-display text-lg font-bold text-jade-deep">{stats.pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {stats.perfectDays} / {stats.eligibleDays} 日全完成
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              追蹤你每日都要做嘅習慣。一日內全部項目打勾，就計入完成日。
            </p>
            {todayAllDone && (
              <p className="mt-1.5 text-[11px] font-bold text-jade-deep">今日已全部完成 🎉</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="今日每日待辦" hint="打勾只記今日 · 聽日重新計">
        <div className="space-y-2 p-3">
          {templates.length === 0 ? (
            <p className="py-2 text-center text-xs text-ink-faint">未設定每日項目 · 下面加入</p>
          ) : (
            templates.map((item) => {
              const done = todayDone.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    done ? "border-jade/20 bg-jade-soft/40" : "border-jade/15 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleToday(item.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                      done ? "border-jade bg-jade text-white" : "border-jade/30 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleToday(item.id)}
                    className={`min-w-0 flex-1 text-left text-sm font-bold ${done ? "text-ink-faint line-through" : "text-ink"}`}
                  >
                    {item.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTemplate(item.id)}
                    className="shrink-0 rounded p-1 text-ink-faint active:scale-90"
                    aria-label="刪除"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      <SectionCard title="管理每日項目" hint="呢啲會每日重複出現">
        <form onSubmit={addTemplate} className="flex gap-1.5 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：拉筋、覆盤、飲夠水…"
            className="h-10 min-w-0 flex-1 rounded-xl border border-jade/15 bg-mist px-3 text-sm outline-none ring-jade focus:ring-2"
          />
          <button type="submit" className="h-10 shrink-0 rounded-xl bg-jade px-4 text-xs font-bold text-white">
            加入
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
