import { useCallback, useEffect, useRef, useState } from "react";

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
 * Strict conditional read: never overwrite existing user data.
 * - Existing key → parse & return.
 * - Else legacy keys → migrate into canonical key.
 * - Else brand-new → write defaults once.
 */
export function readLocalStorage(key, initialValue, { legacyKeys = [], migrate } = {}) {
  const apply = (value) => (typeof migrate === "function" ? migrate(value) : value);
  try {
    const existing = localStorage.getItem(key);
    if (existing !== null) {
      const parsed = tryParse(existing);
      if (parsed.ok) return apply(parsed.value);
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
      } catch {}
      return migrated;
    }
    const fresh = apply(resolveInitial(initialValue));
    try {
      localStorage.setItem(key, JSON.stringify(fresh));
    } catch {}
    return fresh;
  } catch {
    return apply(resolveInitial(initialValue));
  }
}

export function useLocalStorage(key, initialValue, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const keyRef = useRef(key);
  keyRef.current = key;
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  const [value, setValue] = useState(() => readLocalStorage(keyRef.current, initialRef.current, optionsRef.current));

  // 切換旅程時 key 會變——必須重新讀取新 key 嘅資料，
  // 否則上一個旅程嘅 state 會留低，寫入時就會污染新旅程嘅 storage。
  useEffect(() => {
    setValue(readLocalStorage(key, initialRef.current, optionsRef.current));
  }, [key]);

  const setAndPersist = useCallback((updater) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return [value, setAndPersist];
}
