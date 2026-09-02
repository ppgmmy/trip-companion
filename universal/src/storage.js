/** Stable, trip-agnostic registry keys + dynamic per-trip namespacing. */
export const REGISTRY_KEYS = {
  trips: "universal_trips",
  active: "universal_active_trip",
  personal: "universal_personal",
  personalUi: "universal_personal_ui",
  dailyTodos: "universal_daily_todos",
  sharedTodos: "universal_shared_todos",
  appMode: "universal_app_mode",
  activeTab: "universal_active_tab",
  tripTabs: "universal_trip_tabs",
  expenseUi: "universal_expense_ui",
  appHints: "universal_app_hints",
};

/** Per-trip data namespace — isolated so code updates never wipe another trip. */
export function tripKey(tripId, section) {
  return `universal_trip_${tripId}_${section}`;
}

export const TRIP_SECTIONS = {
  itinerary: "itinerary",
  expenses: "expenses",
  checklist: "checklist",
  spots: "spots",
  rate: "rate",
  feedback: "feedback",
  adapt: "adapt",
  personal: "personal",
  itineraryUi: "itinerary_ui",
};
