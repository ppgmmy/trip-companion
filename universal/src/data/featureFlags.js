import enabledJson from "./enabledExpenseFeatures.json";
import { EXPENSE_DAILY_BACKLOG } from "./expenseDailyBacklog";

const enabledState = enabledJson;
const enabledSet = new Set(enabledState.enabled || []);

export function isFeatureEnabled(id) {
  return enabledSet.has(id);
}

export function getEnabledFeatureIds() {
  return [...(enabledState.enabled || [])];
}

export function getLastEnabledFeature() {
  const id = enabledState.lastFeatureId ?? null;
  const fromBacklog = EXPENSE_DAILY_BACKLOG.find((f) => f.id === id);
  return {
    id,
    title: enabledState.lastTitle ?? fromBacklog?.title ?? null,
    updatedAt: enabledState.updatedAt ?? null,
  };
}

export function getFeatureMeta(id) {
  return EXPENSE_DAILY_BACKLOG.find((f) => f.id === id) ?? null;
}
