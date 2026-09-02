/** Stable, trip-agnostic registry keys + dynamic per-trip namespacing. */
export const REGISTRY_KEYS = {
  trips: "universal_trips",
  active: "universal_active_trip",
  personal: "universal_personal",
  appMode: "universal_app_mode",
  activeTab: "universal_active_tab",
  expenseUi: "universal_expense_ui",
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
};
