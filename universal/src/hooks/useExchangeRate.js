import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_CURRENCY, RATE_TTL_MS } from "../data";

/**
 * Dynamic multi-currency engine.
 * Fetches ${BASE} rate for the active trip's targetCurrency from open.er-api.com.
 * Falls back to cached rate when offline; never blocks UI.
 */
export function useExchangeRate(trip, rateState, setRateState) {
  const [status, setStatus] = useState("idle"); // idle | loading | live | cached | fallback
  const tripRef = useRef(trip);
  tripRef.current = trip;

  const sync = useCallback(
    async ({ force = false } = {}) => {
      const t = tripRef.current;
      if (!t) return;
      const lastUpdated = rateState?.lastUpdated || 0;
      const fresh = rateState?.source === "live" && lastUpdated && Date.now() - lastUpdated < RATE_TTL_MS;
      if (!force && fresh) {
        setStatus("live");
        return;
      }
      if (!force && rateState?.source === "manual" && lastUpdated && Date.now() - lastUpdated < RATE_TTL_MS) {
        setStatus("cached");
        return;
      }
      setStatus("loading");
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${t.targetCurrency}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const base = data?.rates?.[BASE_CURRENCY];
        if (typeof base !== "number" || base <= 0) throw new Error(`Missing ${BASE_CURRENCY}`);
        setRateState({ rate: base, source: "live", lastUpdated: Date.now(), currency: t.targetCurrency });
        setStatus("live");
      } catch {
        if (rateState?.rate) setStatus("cached");
        else setStatus("fallback");
      }
    },
    [rateState, setRateState]
  );

  useEffect(() => {
    sync();
    const id = setInterval(() => sync(), RATE_TTL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // re-sync when trip currency changes
  }, [trip?.targetCurrency, sync]);

  async function refresh() {
    await sync({ force: true });
  }

  function applyManual(perUnitBase) {
    const rate = Number(perUnitBase);
    if (!Number.isFinite(rate) || rate <= 0) return;
    setRateState({ rate, source: "manual", lastUpdated: Date.now(), currency: trip?.targetCurrency });
    setStatus("cached");
  }

  return { status, refresh, applyManual };
}
