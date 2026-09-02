import { useEffect, useMemo, useRef, useState } from "react";
import { REGISTRY_KEYS, tripKey, TRIP_SECTIONS } from "./storage";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRate } from "./hooks/useExchangeRate";
import { uid, toDateId, normalizeExpensePayer, personalTodoStartDate } from "./data";
import TripSwitcher from "./components/TripSwitcher";
import TripForm from "./components/TripForm";
import BottomNav from "./components/BottomNav";
import ModeRail from "./components/ModeRail";
import NavQuickHint from "./components/NavQuickHint";
import ItineraryTab from "./components/ItineraryTab";
import ChecklistTab from "./components/ChecklistTab";
import SpotsTab from "./components/SpotsTab";
import ExpenseTab from "./components/ExpenseTab";
import PersonalTab from "./components/PersonalTab";
import DailyIntel from "./components/DailyIntel";
import DailyEvolution from "./components/DailyEvolution";
import ToolkitTab from "./components/ToolkitTab";
import FeedbackModal from "./components/FeedbackModal";
import QuickAddExpense from "./components/QuickAddExpense";

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-jade text-3xl text-white shadow-[var(--shadow-soft)]">
        🌍
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">全球萬能旅行 Companion</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        一次支援全世界任何城市——建立旅程後，行程、記帳、足跡、清單都會依該旅程獨立儲存，永不互相覆蓋。
      </p>
      <div className="mt-6 w-full max-w-md rounded-3xl border border-jade/15 bg-white p-5 text-left shadow-[var(--shadow-soft)] sm:max-w-2xl">
        <TripForm heading="建立第一個旅程" onCreate={onCreate} />
      </div>
    </div>
  );
}

export default function App() {
  const [trips, setTrips] = useLocalStorage(REGISTRY_KEYS.trips, [], { migrate: (v) => (Array.isArray(v) ? v : []) });
  const [activeId, setActiveId] = useLocalStorage(REGISTRY_KEYS.active, null, { migrate: (v) => (typeof v === "string" ? v : null) });
  const [activeTab, setActiveTab] = useLocalStorage(REGISTRY_KEYS.activeTab, "expenses", {
    migrate: (v) => (["itinerary", "checklist", "spots", "expenses", "tools"].includes(v) ? v : "expenses"),
  });
  const [tripTabs, setTripTabs] = useLocalStorage(REGISTRY_KEYS.tripTabs, {}, {
    migrate: (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {}),
  });
  const [appMode, setAppMode] = useLocalStorage(REGISTRY_KEYS.appMode, "travel", {
    migrate: (v) => (v === "personal" ? "personal" : "travel"),
  });
  const [expandedTool, setExpandedTool] = useState(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [personalAddTick, setPersonalAddTick] = useState(0);
  const [expensePanelRequest, setExpensePanelRequest] = useState(null);
  const prevTripIdRef = useRef(null);

  // PWA 捷徑（長撳 App 圖示 → 快速記帳）會帶 ?quick=add 入嚟
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quick") === "add") {
      setQuickAdd(true);
      setAppMode("travel");
      setActiveTab("expenses");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function openTool(toolId) {
    setExpandedTool(toolId);
    setAppMode("travel");
    setActiveTab("tools");
  }

  const activeTrip = useMemo(() => trips.find((t) => t.id === activeId) || trips[0] || null, [trips, activeId]);
  const tripId = activeTrip?.id;

  useEffect(() => {
    if (activeTrip && activeTrip.id !== activeId) setActiveId(activeTrip.id);
  }, [activeTrip, activeId, setActiveId]);

  const [itinerary, setItinerary] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.itinerary) : "universal_disabled", {}, {
    migrate: (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {}),
  });
  const [expenses, setExpenses] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.expenses) : "universal_disabled", [], {
    migrate: (v) => (Array.isArray(v) ? v.map(normalizeExpensePayer) : []),
  });
  const [checklist, setChecklist] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.checklist) : "universal_disabled", {}, {
    migrate: (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {}),
  });
  const [spots, setSpots] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.spots) : "universal_disabled", [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });
  const [feedback, setFeedback] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.feedback) : "universal_disabled", [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });
  const [personal, setPersonal] = useLocalStorage(REGISTRY_KEYS.personal, [], {
    migrate: (v) => (Array.isArray(v) ? v : []),
  });
  const [rateState, setRateState] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.rate) : "universal_disabled", null, {
    migrate: (v) => (v && typeof v === "object" ? v : null),
  });
  const [weatherAdapt, setWeatherAdapt] = useLocalStorage(
    tripId ? tripKey(tripId, TRIP_SECTIONS.adapt) : "universal_disabled",
    false,
    { migrate: (v) => v === true || v === "true" || v === 1 },
  );

  const { status: fxStatus, refresh: refreshRate } = useExchangeRate(activeTrip, rateState, setRateState);

  const personalPending = useMemo(() => {
    const todayId = toDateId(new Date());
    return personal.filter((item) => {
      if (item.done) return false;
      if (item.kind === "event") return item.date === todayId;
      return personalTodoStartDate(item) <= todayId;
    }).length;
  }, [personal]);

  const todayId = toDateId(new Date());
  const tripSpendSummary = useMemo(() => {
    if (!activeTrip?.budget) return null;
    const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const pct = Math.min(999, Math.round((total / activeTrip.budget) * 100));
    return { total, pct };
  }, [activeTrip, expenses]);

  const expenseNavBadge = useMemo(() => {
    if (!activeTrip) return 0;
    const inTrip = todayId >= activeTrip.startDate && todayId <= activeTrip.endDate;
    if (!inTrip) return 0;
    const todayCount = expenses.filter((e) => e.date === todayId).length;
    if (todayCount === 0) return -1;
    return todayCount;
  }, [activeTrip, expenses, todayId]);

  // 每個旅程記住上次開嘅分頁
  useEffect(() => {
    if (!tripId) return;
    if (prevTripIdRef.current && prevTripIdRef.current !== tripId) {
      const saved = tripTabs[tripId];
      if (saved && saved !== activeTab) setActiveTab(saved);
    }
    prevTripIdRef.current = tripId;
  }, [tripId, tripTabs, activeTab, setActiveTab]);

  useEffect(() => {
    if (!tripId || !activeTab) return;
    setTripTabs((prev) => (prev[tripId] === activeTab ? prev : { ...prev, [tripId]: activeTab }));
  }, [tripId, activeTab, setTripTabs]);

  // 將舊版「每旅程 personal」資料合併到全域個人儲存（一次性）
  useEffect(() => {
    if (personal.length > 0) return;
    try {
      const merged = [];
      const seen = new Set();
      trips.forEach((trip) => {
        const raw = localStorage.getItem(tripKey(trip.id, TRIP_SECTIONS.personal));
        if (!raw) return;
        const items = JSON.parse(raw);
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          if (!item?.id || seen.has(item.id)) return;
          seen.add(item.id);
          merged.push(item);
        });
      });
      if (merged.length > 0) setPersonal(merged);
    } catch {}
  }, [personal.length, setPersonal, trips]);

  // 舊版「現金」付款人（cash-pool）寫入 storage 後持久化為 ppg + 現金
  useEffect(() => {
    if (!tripId) return;
    const key = tripKey(tripId, TRIP_SECTIONS.expenses);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.some((e) => e.payer === "cash-pool" || e.payer === "cash")) return;
      setExpenses(parsed.map(normalizeExpensePayer));
    } catch {}
  }, [tripId, setExpenses]);

  function createTrip(trip) {
    setTrips((prev) => [...prev, trip]);
    setActiveId(trip.id);
  }

  function updateTrip(trip) {
    setTrips((prev) => prev.map((t) => (t.id === trip.id ? trip : t)));
  }

  function deleteTrip(id) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`universal_trip_${id}_`))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  function switchTrip(id) {
    if (tripId && activeTab) {
      setTripTabs((prev) => ({ ...prev, [tripId]: activeTab }));
    }
    setActiveId(id);
    const saved = tripTabs[id];
    if (saved) setActiveTab(saved);
  }

  function openExpenses(panel = "ledger") {
    setAppMode("travel");
    setActiveTab("expenses");
    setExpensePanelRequest(panel);
  }

  return (
    <div className="bg-travel min-h-dvh w-full overflow-x-hidden">
      <main className="safe-top mx-auto w-full max-w-lg box-border px-4 pb-32">
        {activeTrip && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-end">
              <ModeRail mode={appMode} onModeChange={setAppMode} personalPending={personalPending} />
            </div>
            <TripSwitcher
              variant="banner"
              trips={trips}
              activeId={activeTrip?.id}
              onSwitch={switchTrip}
              onCreate={createTrip}
              onUpdate={updateTrip}
              onDelete={deleteTrip}
              spendSummary={tripSpendSummary}
              targetCurrency={activeTrip?.targetCurrency}
            />
          </div>
        )}
        {!activeTrip ? (
          <EmptyState onCreate={createTrip} />
        ) : (
          <div className="tab-panel space-y-4">
            {appMode === "personal" ? (
              <PersonalTab personal={personal} setPersonal={setPersonal} focusAddTick={personalAddTick} />
            ) : (
              <>
                {activeTab === "itinerary" && (
                  <>
                    <DailyIntel
                      trip={activeTrip}
                      expenses={expenses}
                      personal={personal}
                      adapt={weatherAdapt}
                      setAdapt={setWeatherAdapt}
                      onOpenPersonal={() => setAppMode("personal")}
                      onOpenExpenses={() => openExpenses("overview")}
                    />
                    <DailyEvolution trip={activeTrip} onOpenTool={openTool} />
                    <ItineraryTab trip={activeTrip} itinerary={itinerary} setItinerary={setItinerary} />
                  </>
                )}
                {activeTab === "checklist" && <ChecklistTab checked={checklist} setChecked={setChecklist} adapt={weatherAdapt} />}
                {activeTab === "spots" && <SpotsTab trip={activeTrip} spots={spots} setSpots={setSpots} adapt={weatherAdapt} />}
                {activeTab === "expenses" && (
                  <ExpenseTab
                    trip={activeTrip}
                    expenses={expenses}
                    setExpenses={setExpenses}
                    rateState={rateState}
                    fxStatus={fxStatus}
                    onRefreshRate={refreshRate}
                    initialPanel={expensePanelRequest}
                    onInitialPanelApplied={() => setExpensePanelRequest(null)}
                  />
                )}
                {activeTab === "tools" && (
                  <ToolkitTab trip={activeTrip} spots={spots} expenses={expenses} rateState={rateState} expandedTool={expandedTool} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {activeTrip && appMode === "personal" && (
        <nav className="fixed inset-x-0 bottom-0 z-40 w-full safe-bottom" aria-label="個人模式捷徑">
          <div className="mx-auto flex max-w-lg gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={() => setAppMode("travel")}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-jade/15 bg-white/85 text-sm font-bold text-ink shadow-[var(--shadow-nav)] backdrop-blur"
            >
              返回旅行
            </button>
            <button
              type="button"
              onClick={() => setPersonalAddTick((n) => n + 1)}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-jade text-sm font-bold text-white shadow-[var(--shadow-soft)]"
            >
              ＋ 快速新增
            </button>
          </div>
        </nav>
      )}
      {activeTrip && appMode === "travel" && (
        <>
          <NavQuickHint />
          <BottomNav
            travelActive={activeTab}
            onTravelSelect={setActiveTab}
            expenseBadge={expenseNavBadge}
            onLongPressExpenses={() => {
              setActiveTab("expenses");
              setQuickAdd(true);
            }}
          />
        </>
      )}
      {activeTrip && appMode === "travel" && (
        <button
          type="button"
          onClick={() => setQuickAdd(true)}
          aria-label="快速記帳"
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-jade text-2xl text-white shadow-[var(--shadow-soft)] transition active:scale-90"
        >
          ⚡
        </button>
      )}
      {activeTrip && quickAdd && (
        <QuickAddExpense
          trip={activeTrip}
          rate={rateState?.rate || 0}
          expenses={expenses}
          onSave={(entry) => setExpenses((prev) => [...prev, entry])}
          onClose={() => setQuickAdd(false)}
        />
      )}
      {activeTrip && <FeedbackModal trip={activeTrip} feedback={feedback} setFeedback={setFeedback} />}
    </div>
  );
}
