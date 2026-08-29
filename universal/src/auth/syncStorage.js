/** Collect / restore Universal trip keys from localStorage for cloud sync. */

const KEY_PREFIXES = ["universal_"];

export function collectSyncPayload() {
  const payload = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!KEY_PREFIXES.some((p) => key.startsWith(p))) continue;
      payload[key] = localStorage.getItem(key);
    }
  } catch {}
  return payload;
}

export function applySyncPayload(payload, { wipeMissing = false } = {}) {
  if (!payload || typeof payload !== "object") return { applied: 0 };
  let applied = 0;
  try {
    const nextKeys = new Set(Object.keys(payload));
    if (wipeMissing) {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!KEY_PREFIXES.some((p) => key.startsWith(p))) continue;
        if (!nextKeys.has(key)) toRemove.push(key);
      }
      toRemove.forEach((key) => localStorage.removeItem(key));
    }
    Object.entries(payload).forEach(([key, value]) => {
      if (!KEY_PREFIXES.some((p) => key.startsWith(p))) return;
      if (typeof value !== "string") return;
      localStorage.setItem(key, value);
      applied += 1;
    });
  } catch {}
  return { applied };
}

export function payloadFingerprint(payload) {
  try {
    return JSON.stringify(payload);
  } catch {
    return "";
  }
}
