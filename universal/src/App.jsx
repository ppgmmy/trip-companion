import { useEffect, useMemo, useState } from "react";
import { REGISTRY_KEYS, tripKey, TRIP_SECTIONS } from "./storage";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRate } from "./hooks/useExchangeRate";
import { uid } from "./data";
import TripSwitcher from "./components/TripSwitcher";
import TripForm from "./components/TripForm";
import BottomNav from "./components/BottomNav";
import ItineraryTab from "./components/ItineraryTab";
import ChecklistTab from "./components/ChecklistTab";
import SpotsTab from "./components/SpotsTab";
import ExpenseTab from "./components/ExpenseTab";
import DailyIntel from "./components/DailyIntel";
import DailyEvolution from "./components/DailyEvolution";
import ToolkitTab from "./components/ToolkitTab";
import FeedbackModal from "./components/FeedbackModal";

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
  const [activeTab, setActiveTab] = useState("itinerary");
  const [expandedTool, setExpandedTool] = useState(null);

  function openTool(toolId) {
    setExpandedTool(toolId);
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
  const [rateState, setRateState] = useLocalStorage(tripId ? tripKey(tripId, TRIP_SECTIONS.rate) : "universal_disabled", null, {
    migrate: (v) => (v && typeof v === "object" ? v : null),
  });

  const { status: fxStatus, refresh: refreshRate, applyManual: applyManualRate } = useExchangeRate(activeTrip, rateState, setRateState);

  function createTrip(trip) {
    setTrips((prev) => [...prev, trip]);
    setActiveId(trip.id);
  }

  function switchTrip(id) {
    setActiveId(id);
  }

  return (
    <div className="bg-travel min-h-dvh">
      <header className="safe-top sticky top-0 z-20 border-b border-jade/10 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 pb-3">
          <TripSwitcher trips={trips} activeId={activeTrip?.id} onSwitch={switchTrip} onCreate={createTrip} />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-32 pt-4">
        {!activeTrip ? (
          <EmptyState onCreate={createTrip} />
        ) : (
          <div className="tab-panel space-y-4">
            {activeTab === "itinerary" && (
              <>
                <DailyIntel trip={activeTrip} expenses={expenses} />
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
          </div>
        )}
      </main>

      {activeTrip && <BottomNav active={activeTab} onSelect={setActiveTab} />}
      {activeTrip && <FeedbackModal trip={activeTrip} feedback={feedback} setFeedback={setFeedback} />}
    </div>
  );
}
