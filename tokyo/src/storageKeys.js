/** Stable localStorage keys — never bump versions; migrate legacy instead. */
export const STORAGE_KEYS = {
  expenses: "tokyo-expenses",
  itinerary: "tokyo-itinerary",
  checklist: "tokyo-checklist",
  cafeLog: "tokyo-cafe-log",
  rate: "tokyo-rate",
  budget: "tokyo-budget",
  tab: "tokyo-tab",
};

/** Older keys from prior deploys — read once, copy into stable keys. */
export const LEGACY_KEYS = {
  expenses: [
    "tokyo-companion:expenses-v2",
    "tokyo-companion:expenses",
    "tokyo-companion:expense",
  ],
  itinerary: [
    "tokyo-companion:week",
    "tokyo-companion:day",
    "tokyo-companion:itinerary",
  ],
  checklist: [
    "tokyo-companion:checklist-v2",
    "tokyo-companion:checklist",
  ],
  cafeLog: [
    "tokyo-companion:cafes-v2",
    "tokyo-companion:cafes",
    "tokyo-companion:cafe-log",
  ],
  rate: ["tokyo-companion:rate-v2", "tokyo-companion:rate"],
  budget: ["tokyo-companion:budget"],
  tab: ["tokyo-companion:tab"],
};
