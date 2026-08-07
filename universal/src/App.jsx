import { useEffect, useMemo, useState } from "react";
import { REGISTRY_KEYS, tripKey, TRIP_SECTIONS } from "./storage";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useExchangeRate } from "./hooks/useExchangeRate";
import { uid } from "./data";
import TripSwitcher from "./components/TripSwitcher";
import BottomNav from "./components/BottomNav";
import ItineraryTab from "./components/ItineraryTab";
import ChecklistTab from "./components/ChecklistTab";
import SpotsTab from "./components/SpotsTab";
import ExpenseTab from "./components/ExpenseTab";
import DailyIntel from "./components/DailyIntel";
import DailyEvolution from "./components/DailyEvolution";
import FeedbackModal from "./components/FeedbackModal";

function EmptyState({ onCreateClick }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-jade text-4xl text-white shadow-[var(--shadow-soft)]">
        🌍
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink">全球萬能旅行 Companion</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        一次支援全世界任何城市——建立旅程後，行程、記帳、足跡、清單都會依該旅程獨立儲存，永不互相覆蓋。
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 min-h-12 rounded-2xl bg-jade px-6 font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]"
      >
        ➕ 建立第一個旅程
      </button>
    </div>
  );
}

export default function App() {
  const [trips, setTrips] = useLocalStorage(REGISTRY_KEYS.trips, [], { migrate: (v) => (Array.isArray(v) ? v : []) });
  const [activeId, setActiveId] = useLocalStorage(REGISTRY_KEYS.active, null, { migrate: (v) => (typeof v === "string" ? v : null) });
  const [activeTab, setActiveTab] = useState("itinerary");

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
          <EmptyState onCreateClick={() => {}} />
        ) : (
          <div className="tab-panel space-y-4">
            {activeTab === "itinerary" && (
              <>
                <DailyIntel trip={activeTrip} expenses={expenses} />
                <DailyEvolution trip={activeTrip} />
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
          </div>
        )}
      </main>

      {activeTrip && <BottomNav active={activeTab} onSelect={setActiveTab} />}
      {activeTrip && <FeedbackModal trip={activeTrip} feedback={feedback} setFeedback={setFeedback} />}
    </div>
  );
}
