import { useMemo } from "react";
import BottomNav from "./components/BottomNav";
import CafeLogTab from "./components/CafeLogTab";
import ChecklistTab from "./components/ChecklistTab";
import ExpenseTab from "./components/ExpenseTab";
import ItineraryTab from "./components/ItineraryTab";
import {
  CHECKLIST,
  DEFAULT_BUDGET_JPY,
  DEFAULT_RATE,
  ITINERARY,
  hydrateExpenses,
} from "./data";
import { useExchangeRate } from "./hooks/useExchangeRate";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { LEGACY_KEYS, STORAGE_KEYS } from "./storageKeys";

function emptyChecklist() {
  const next = {};
  CHECKLIST.forEach((group) => {
    group.items.forEach((item) => {
      next[item.id] = false;
    });
  });
  return next;
}

/** Merge saved checklist into current schema without resetting checked items. */
function hydrateChecklist(saved) {
  const base = emptyChecklist();
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return base;
  Object.keys(base).forEach((id) => {
    if (typeof saved[id] === "boolean") base[id] = saved[id];
  });
  return base;
}

function normalizeRate(saved) {
  if (saved && typeof saved === "object" && typeof saved.hkdPerJpy === "number" && saved.hkdPerJpy > 0) {
    return {
      hkdPerJpy: saved.hkdPerJpy,
      source: saved.source || "cached",
      lastUpdated: saved.lastUpdated ?? null,
    };
  }
  if (typeof saved === "number" && saved > 0) {
    return { hkdPerJpy: saved, source: "fallback", lastUpdated: null };
  }
  return { hkdPerJpy: DEFAULT_RATE, source: "fallback", lastUpdated: null };
}

function hydrateCafes(saved) {
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((c) => c && typeof c === "object")
    .map((c) => ({
      id: c.id || `cafe-${c.createdAt || Date.now()}`,
      name: typeof c.name === "string" ? c.name : "未命名咖啡店",
      area: typeof c.area === "string" ? c.area : "",
      rating: Number(c.rating) || 0,
      tags: Array.isArray(c.tags) ? c.tags.filter((t) => typeof t === "string") : [],
      createdAt: Number(c.createdAt) || Date.now(),
    }));
}

function defaultItineraryState() {
  return { week: 1, dayId: ITINERARY[0]?.id || "d1" };
}

function sanitizeItineraryState(value) {
  const fallback = defaultItineraryState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const week = Number(value.week);
  const dayId = typeof value.dayId === "string" ? value.dayId : fallback.dayId;
  return {
    week: week >= 1 && week <= 5 ? week : 1,
    dayId: ITINERARY.some((d) => d.id === dayId) ? dayId : fallback.dayId,
  };
}

/**
 * Prefer tokyo-itinerary. If missing, assemble from legacy week/day keys.
 * Only writes defaults when no stable key and no legacy data exist.
 */
function loadItineraryState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.itinerary);
    if (raw !== null) {
      try {
        return sanitizeItineraryState(JSON.parse(raw));
      } catch {
        console.warn("[tokyo-companion] corrupt tokyo-itinerary; keeping raw, memory fallback");
        return defaultItineraryState();
      }
    }

    const legacyWeekRaw = localStorage.getItem("tokyo-companion:week");
    const legacyDayRaw = localStorage.getItem("tokyo-companion:day");
    if (legacyWeekRaw !== null || legacyDayRaw !== null) {
      const fallback = defaultItineraryState();
      let week = fallback.week;
      let dayId = fallback.dayId;
      try {
        if (legacyWeekRaw !== null) {
          const w = Number(JSON.parse(legacyWeekRaw));
          if (w >= 1 && w <= 5) week = w;
        }
      } catch {
        /* keep default */
      }
      try {
        if (legacyDayRaw !== null) {
          const d = JSON.parse(legacyDayRaw);
          if (typeof d === "string" && ITINERARY.some((x) => x.id === d)) dayId = d;
        }
      } catch {
        /* keep default */
      }
      const migrated = { week, dayId };
      localStorage.setItem(STORAGE_KEYS.itinerary, JSON.stringify(migrated));
      return migrated;
    }

    const fresh = defaultItineraryState();
    localStorage.setItem(STORAGE_KEYS.itinerary, JSON.stringify(fresh));
    return fresh;
  } catch {
    return defaultItineraryState();
  }
}

function useNormalizedExpenses() {
  const [raw, setRaw] = useLocalStorage(STORAGE_KEYS.expenses, [], {
    legacyKeys: LEGACY_KEYS.expenses,
    migrate: (value) => hydrateExpenses(value, DEFAULT_RATE),
  });

  const expenses = hydrateExpenses(raw, DEFAULT_RATE);

  function setExpenses(updater) {
    setRaw((prev) => {
      const base = hydrateExpenses(prev, DEFAULT_RATE);
      const next = typeof updater === "function" ? updater(base) : updater;
      return hydrateExpenses(next, DEFAULT_RATE);
    });
  }

  return [expenses, setExpenses];
}

function useItineraryState() {
  // initialValue already performs strict null-check + legacy migration + one-time seed.
  const [state, setState] = useLocalStorage(STORAGE_KEYS.itinerary, loadItineraryState, {
    migrate: sanitizeItineraryState,
  });

  const week = state?.week ?? 1;
  const dayId = state?.dayId ?? defaultItineraryState().dayId;

  function setWeek(next) {
    setState((prev) => ({
      ...sanitizeItineraryState(prev),
      week: typeof next === "function" ? next(prev?.week ?? 1) : next,
    }));
  }

  function setDayId(next) {
    setState((prev) => ({
      ...sanitizeItineraryState(prev),
      dayId: typeof next === "function" ? next(prev?.dayId) : next,
    }));
  }

  return { week, dayId, setWeek, setDayId };
}

export default function App() {
  const [tab, setTab] = useLocalStorage(STORAGE_KEYS.tab, "itinerary", {
    legacyKeys: LEGACY_KEYS.tab,
  });
  const { week, dayId, setWeek, setDayId } = useItineraryState();
  const [checked, setChecked] = useLocalStorage(STORAGE_KEYS.checklist, emptyChecklist, {
    legacyKeys: LEGACY_KEYS.checklist,
    migrate: hydrateChecklist,
  });
  const [cafes, setCafes] = useLocalStorage(STORAGE_KEYS.cafeLog, [], {
    legacyKeys: LEGACY_KEYS.cafeLog,
    migrate: hydrateCafes,
  });
  const [expenses, setExpenses] = useNormalizedExpenses();
  const [rateState, setRateState] = useLocalStorage(STORAGE_KEYS.rate, () => normalizeRate(null), {
    legacyKeys: LEGACY_KEYS.rate,
    migrate: normalizeRate,
  });
  const [budget, setBudget] = useLocalStorage(STORAGE_KEYS.budget, DEFAULT_BUDGET_JPY, {
    legacyKeys: LEGACY_KEYS.budget,
    migrate: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BUDGET_JPY;
    },
  });

  const { status: fxStatus, refresh, applyManual } = useExchangeRate(rateState, setRateState);

  const panel = useMemo(() => {
    switch (tab) {
      case "checklist":
        return <ChecklistTab checked={checked} setChecked={setChecked} />;
      case "cafelog":
        return <CafeLogTab cafes={cafes} setCafes={setCafes} />;
      case "expense":
        return (
          <ExpenseTab
            expenses={expenses}
            setExpenses={setExpenses}
            rateState={rateState}
            budget={budget}
            setBudget={setBudget}
            fxStatus={fxStatus}
            onRefreshRate={refresh}
            onApplyManualRate={applyManual}
          />
        );
      default:
        return (
          <ItineraryTab dayId={dayId} setDayId={setDayId} week={week} setWeek={setWeek} />
        );
    }
  }, [
    tab,
    checked,
    cafes,
    expenses,
    rateState,
    budget,
    dayId,
    week,
    fxStatus,
    setChecked,
    setCafes,
    setExpenses,
    setBudget,
    setDayId,
    setWeek,
    refresh,
    applyManual,
  ]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-travel" />
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-rose-soft/80 blur-3xl" />
      <div className="pointer-events-none absolute top-48 -left-20 h-56 w-56 rounded-full bg-teal-soft/70 blur-3xl" />

      <header className="safe-top px-5 pt-5 pb-3">
        <div className="mx-auto max-w-lg">
          <a
            href="../"
            className="inline-flex min-h-9 items-center text-xs font-semibold text-rose-deep"
          >
            ← 全部行程
          </a>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-brand">
            Trip Companion · Tokyo
          </p>
          <h1 className="mt-1 font-display text-[1.85rem] font-extrabold leading-tight text-ink">
            東京行程 Companion
          </h1>
          <p className="mt-1 text-sm text-ink-soft">原宿 · 澀谷 · 8/7 – 9/6 長住</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))]">
        {panel}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
