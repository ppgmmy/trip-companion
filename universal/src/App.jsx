import { useEffect, useMemo, useState } from "react";
import { REGISTRY_KEYS, tripKey, TRIP_SECTIONS } from "./storage";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRate } from "./hooks/useExchangeRate";
import { uid } from "./data";
import TripSwitcher from "./components/TripSwitcher";
import TripForm from "./components/TripForm";
import BottomNav from "./components/BottomNav";
import ModeRail from "./components/ModeRail";
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
  const [activeTab, setActiveTab] = useState("expenses");
  const [appMode, setAppMode] = useState("travel");
  const [expandedTool, setExpandedTool] = useState(null);
  const [quickAdd, setQuickAdd] = useState(false);

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
    migrate: (v) => (Array.isArray(v) ? v : []),
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

  const { status: fxStatus, refresh: refreshRate, applyManual: applyManualRate } = useExchangeRate(activeTrip, rateState, setRateState);

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
    setActiveId(id);
  }

  return (
    <div className="bg-travel flex min-h-dvh w-full overflow-x-hidden">
      {activeTrip && <ModeRail mode={appMode} onModeChange={setAppMode} />}
      <div className="min-w-0 flex-1">
      <main className="safe-top mx-auto w-full max-w-lg box-border px-4 pb-32">
        {activeTrip && (
          <div className="mb-4">
            <TripSwitcher variant="banner" trips={trips} activeId={activeTrip?.id} onSwitch={switchTrip} onCreate={createTrip} onUpdate={updateTrip} onDelete={deleteTrip} />
          </div>
        )}
        {!activeTrip ? (
          <EmptyState onCreate={createTrip} />
        ) : (
          <div className="tab-panel space-y-4">
            {appMode === "personal" ? (
              <PersonalTab personal={personal} setPersonal={setPersonal} />
            ) : (
              <>
                {activeTab === "itinerary" && (
                  <>
                    <DailyIntel trip={activeTrip} expenses={expenses} personal={personal} />
                    <DailyEvolution trip={activeTrip} onOpenTool={openTool} />
                    <ItineraryTab trip={activeTrip} itinerary={itinerary} setItinerary={setItinerary} />
                  </>
                )}
                {activeTab === "checklist" && <ChecklistTab checked={checklist} setChecked={setChecklist} />}
                {activeTab === "spots" && <SpotsTab trip={activeTrip} spots={spots} setSpots={setSpots} />}
                {activeTab === "expenses" && (
                  <ExpenseTab
                    trip={activeTrip}
                    expenses={expenses}
                    setExpenses={setExpenses}
                    rateState={rateState}
                    fxStatus={fxStatus}
                    onRefreshRate={refreshRate}
                    onApplyManualRate={applyManualRate}
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

      {activeTrip && appMode === "travel" && (
        <BottomNav
          travelActive={activeTab}
          onTravelSelect={setActiveTab}
          onLongPressExpenses={() => {
            setActiveTab("expenses");
            setQuickAdd(true);
          }}
        />
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
    </div>
  );
}
