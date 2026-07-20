import { useEffect, useState } from "react";
import { DEFAULT_RATE, RATE_TTL_MS } from "../data";

/**
 * Sync JPY→HKD from open.er-api.com every 24h.
 * Falls back to cached / default 100 JPY = 5.1 HKD when offline.
 */
export function useExchangeRate(rateState, setRateState) {
  const [status, setStatus] = useState("idle"); // idle | loading | live | cached | fallback

  useEffect(() => {
    let cancelled = false;

    async function sync({ force = false } = {}) {
      const lastUpdated = rateState?.lastUpdated || 0;
      const fresh =
        rateState?.source === "live" &&
        lastUpdated &&
        Date.now() - lastUpdated < RATE_TTL_MS;

      if (!force && fresh) {
        if (!cancelled) setStatus("live");
        return;
      }

      if (!force && rateState?.source === "manual" && lastUpdated && Date.now() - lastUpdated < RATE_TTL_MS) {
        if (!cancelled) setStatus("cached");
        return;
      }

      if (!cancelled) setStatus("loading");

      try {
        const res = await fetch("https://open.er-api.com/v6/latest/JPY");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const hkd = data?.rates?.HKD;
        if (typeof hkd !== "number" || hkd <= 0) throw new Error("Missing HKD");
        if (cancelled) return;
        setRateState({
          hkdPerJpy: hkd,
          source: "live",
          lastUpdated: Date.now(),
        });
        setStatus("live");
      } catch {
        if (cancelled) return;
        if (rateState?.hkdPerJpy) {
          setStatus("cached");
        } else {
          setRateState({
            hkdPerJpy: DEFAULT_RATE,
            source: "fallback",
            lastUpdated: Date.now(),
          });
          setStatus("fallback");
        }
      }
    }

    sync();
    const id = setInterval(() => sync(), RATE_TTL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // intentionally only run on mount / when setters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRateState]);

  async function refresh() {
    setStatus("loading");
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/JPY");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hkd = data?.rates?.HKD;
      if (typeof hkd !== "number" || hkd <= 0) throw new Error("Missing HKD");
      setRateState({
        hkdPerJpy: hkd,
        source: "live",
        lastUpdated: Date.now(),
      });
      setStatus("live");
    } catch {
      setStatus(rateState?.hkdPerJpy ? "cached" : "fallback");
    }
  }

  function applyManual(per100Hkd) {
    const hkdPerJpy = per100Hkd / 100;
    setRateState({
      hkdPerJpy,
      source: "manual",
      lastUpdated: Date.now(),
    });
    setStatus("cached");
  }

  return { status, refresh, applyManual };
}
