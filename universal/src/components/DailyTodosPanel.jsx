import { useEffect, useMemo, useState } from "react";
import { dailyTodosMonthStats, toDateId, uid } from "../data";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { REGISTRY_KEYS } from "../storage";

const SEED_KEY = "universal_daily_habits_seed_v1";

/** 用戶真實每日事項（由行程總覽截圖） */
const HABIT_SEED = [
  { id: "daily-habit-read", title: "睇書 1 chapter" },
  { id: "daily-habit-japanese", title: "學日文 1堂" },
  { id: "daily-habit-bible", title: "聖經1章 + 靈修" },
  { id: "daily-habit-drums", title: "練鼓 5 mins" },
  { id: "daily-habit-exercise", title: "做運動 -> 手 x 2，腳 x 6" },
  { id: "daily-habit-boss", title: "錄1場暴暴打boss" },
  { id: "daily-habit-osaka", title: "大阪plan行程" },
  { id: "daily-habit-foodpanda", title: "foodpanda" },
  { id: "daily-habit-job", title: "apply長工1份" },
  { id: "daily-habit-prayer", title: "晨禱" },
];

const EXERCISE_ID = "daily-habit-exercise";

function SectionCard({ title, hint, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-jade/15 bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-jade/10 bg-mist/40 px-2.5 py-1.5">
        <p className="text-[11px] font-bold text-ink">{title}</p>
        {hint && <p className="text-[9px] leading-tight text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/->/g, "→")
    .replace(/→/g, "->");
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

  // 一次性種入每日習慣；今日慶祝：做運動已完成
  useEffect(() => {
    try {
      if (localStorage.getItem(SEED_KEY) === "1") return;
      localStorage.setItem(SEED_KEY, "1");
    } catch {
      return;
    }
    setStore((prev) => {
      const templates = Array.isArray(prev.templates) ? [...prev.templates] : [];
      const existingTitles = new Set(templates.map((t) => normalizeTitle(t.title)));
      const existingIds = new Set(templates.map((t) => t.id));
      const now = Date.now();
      HABIT_SEED.forEach((habit, index) => {
        if (existingIds.has(habit.id) || existingTitles.has(normalizeTitle(habit.title))) return;
        templates.push({
          id: habit.id,
          title: habit.title,
          createdAt: now + index,
        });
        existingTitles.add(normalizeTitle(habit.title));
        existingIds.add(habit.id);
      });

      const log = { ...(prev.log || {}) };
      const todaySet = new Set(Array.isArray(log[todayId]) ? log[todayId] : []);
      // 搵做運動項目（seed id 或標題匹配）
      const exercise =
        templates.find((t) => t.id === EXERCISE_ID) ||
        templates.find((t) => normalizeTitle(t.title).includes(normalizeTitle("做運動")));
      if (exercise) todaySet.add(exercise.id);
      log[todayId] = [...todaySet];

      return { templates, log };
    });
  }, [setStore, todayId]);

  const templates = store.templates || [];
  const log = store.log || {};
  const todayDone = useMemo(() => new Set(Array.isArray(log[todayId]) ? log[todayId] : []), [log, todayId]);
  const stats = useMemo(() => dailyTodosMonthStats(templates, log, todayId), [templates, log, todayId]);

  const exerciseDoneToday = useMemo(() => {
    const exercise =
      templates.find((t) => t.id === EXERCISE_ID) ||
      templates.find((t) => normalizeTitle(t.title).includes(normalizeTitle("做運動")));
    return Boolean(exercise && todayDone.has(exercise.id));
  }, [templates, todayDone]);

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
  const doneCount = templates.filter((item) => todayDone.has(item.id)).length;

  return (
    <div className="space-y-2">
      {exerciseDoneToday && (
        <div className="rounded-xl border border-coral/25 bg-gradient-to-r from-coral-soft/50 to-amber-50 px-2.5 py-2 text-center shadow-[var(--shadow-soft)]">
          <p className="text-[13px] font-extrabold text-coral">今日做咗運動！！🎉💪</p>
          <p className="text-[10px] font-bold text-ink-soft">超值得慶祝 · 繼續保持呢個勢頭</p>
        </div>
      )}

      <SectionCard title="今月完成紀錄" hint={`${stats.monthLabel} · 全日打勾算 1 日`}>
        <div className="flex items-center gap-3 p-2.5">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#0d9488 ${stats.pct * 3.6}deg, #e7efed ${stats.pct * 3.6}deg)`,
            }}
          >
            <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <span className="font-display text-sm font-bold text-jade-deep">{stats.pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">
              {stats.perfectDays} / {stats.eligibleDays} 日全完成
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-ink-soft">
              今日 {doneCount}/{templates.length || 0} · 一日全部打勾就計入完成日
            </p>
            {todayAllDone && (
              <p className="mt-1 text-[10px] font-bold text-jade-deep">今日已全部完成 🎉</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="今日每日待辦" hint="打勾只記今日 · 聽日重新計">
        <div className="space-y-1 p-2">
          {templates.length === 0 ? (
            <p className="py-1 text-center text-[11px] text-ink-faint">未設定每日項目 · 下面加入</p>
          ) : (
            templates.map((item) => {
              const done = todayDone.has(item.id);
              const isExercise = item.id === EXERCISE_ID || normalizeTitle(item.title).includes(normalizeTitle("做運動"));
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${
                    done
                      ? isExercise
                        ? "border-coral/30 bg-coral-soft/40"
                        : "border-jade/20 bg-jade-soft/40"
                      : "border-jade/15 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleToday(item.id)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
                      done
                        ? isExercise
                          ? "border-coral bg-coral text-white"
                          : "border-jade bg-jade text-white"
                        : "border-jade/30 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleToday(item.id)}
                    className={`min-w-0 flex-1 text-left text-[13px] font-bold ${done ? "text-ink-faint line-through" : "text-ink"}`}
                  >
                    {item.title}
                    {done && isExercise ? " 💪" : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTemplate(item.id)}
                    className="shrink-0 rounded p-0.5 text-ink-faint active:scale-90"
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
        <form onSubmit={addTemplate} className="flex gap-1 p-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：拉筋、覆盤、飲夠水…"
            className="h-8 min-w-0 flex-1 rounded-lg border border-jade/15 bg-mist px-2.5 text-[13px] outline-none ring-jade focus:ring-2"
          />
          <button type="submit" className="h-8 shrink-0 rounded-lg bg-jade px-3 text-[11px] font-bold text-white">
            加入
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
