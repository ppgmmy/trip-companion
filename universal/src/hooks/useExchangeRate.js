import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_CURRENCY, RATE_TTL_MS } from "../data";

const STALE_CHECK_MS = 30 * 60 * 1000;

function isRateFresh(rateState, currency) {
  const lastUpdated = rateState?.lastUpdated || 0;
  if (!lastUpdated) return false;
  if (rateState?.currency && currency && rateState.currency !== currency) return false;
  if (Date.now() - lastUpdated >= RATE_TTL_MS) return false;
  return rateState.source === "live" || rateState.source === "manual";
}

/**
 * Dynamic multi-currency engine.
 * Fetches ${BASE} rate for the active trip's targetCurrency from open.er-api.com.
 * Auto-refreshes every 12h; falls back to cached rate when offline.
 */
export function useExchangeRate(trip, rateState, setRateState) {
  const [status, setStatus] = useState("idle"); // idle | loading | live | cached | fallback
  const tripRef = useRef(trip);
  const rateRef = useRef(rateState);
  tripRef.current = trip;
  rateRef.current = rateState;

  const sync = useCallback(
    async ({ force = false } = {}) => {
      const t = tripRef.current;
      const rs = rateRef.current;
      if (!t) return;

      const currency = t.targetCurrency;
      const fresh = !force && isRateFresh(rs, currency);
      if (fresh) {
        setStatus(rs?.source === "manual" ? "cached" : "live");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const base = data?.rates?.[BASE_CURRENCY];
        if (typeof base !== "number" || base <= 0) throw new Error(`Missing ${BASE_CURRENCY}`);
        setRateState({ rate: base, source: "live", lastUpdated: Date.now(), currency });
        setStatus("live");
      } catch {
        if (rs?.rate) setStatus("cached");
        else setStatus("fallback");
      }
    },
    [setRateState],
  );

  useEffect(() => {
    sync();
    const id = setInterval(() => sync(), STALE_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [trip?.id, trip?.targetCurrency, sync]);

  async function refresh() {
    await sync({ force: true });
  }

  return { status, refresh };
}
