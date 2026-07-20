import { useCallback, useRef, useState } from "react";

function resolveInitial(initialValue) {
  return typeof initialValue === "function" ? initialValue() : initialValue;
}

function tryParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: null };
  }
}

/**
 * Strict conditional read:
 * - If `key` already exists → parse & return (never overwrite with defaults).
 * - If missing → try legacy keys once, then migrate into `key`.
 * - If still missing → brand-new user only: write defaults once.
 * - Corrupt JSON → in-memory fallback; do NOT wipe the stored string.
 */
export function readLocalStorage(key, initialValue, { legacyKeys = [], migrate } = {}) {
  const apply = (value) => (typeof migrate === "function" ? migrate(value) : value);

  try {
    const existing = localStorage.getItem(key);
    if (existing !== null) {
      const parsed = tryParse(existing);
      if (parsed.ok) return apply(parsed.value);
      console.warn(`[tokyo-companion] corrupt localStorage for "${key}"; keeping raw, using memory fallback`);
      return apply(resolveInitial(initialValue));
    }

    for (const legacy of legacyKeys) {
      if (!legacy || legacy === key) continue;
      const raw = localStorage.getItem(legacy);
      if (raw === null) continue;
      const parsed = tryParse(raw);
      if (!parsed.ok) continue;
      const migrated = apply(parsed.value);
      try {
        localStorage.setItem(key, JSON.stringify(migrated));
      } catch (err) {
        console.warn("[tokyo-companion] migrate write failed", err);
      }
      return migrated;
    }

    // Brand-new user — only case where defaults are written.
    // If initialValue already seeded the key (e.g. custom itinerary loader), re-read it
    // instead of blindly overwriting.
    const fresh = apply(resolveInitial(initialValue));
    try {
      const seeded = localStorage.getItem(key);
      if (seeded !== null) {
        const parsed = tryParse(seeded);
        if (parsed.ok) return apply(parsed.value);
        return fresh;
      }
      localStorage.setItem(key, JSON.stringify(fresh));
    } catch (err) {
      console.warn("[tokyo-companion] initial write failed", err);
    }
    return fresh;
  } catch {
    return apply(resolveInitial(initialValue));
  }
}

/**
 * Persist only when the setter runs — never blind setItem on mount/refresh.
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [value, setValue] = useState(() =>
    readLocalStorage(key, initialValue, optionsRef.current)
  );

  const keyRef = useRef(key);

  const setAndPersist = useCallback((updater) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(next));
      } catch (err) {
        console.warn("[tokyo-companion] localStorage write failed", err);
      }
      return next;
    });
  }, []);

  return [value, setAndPersist];
}
