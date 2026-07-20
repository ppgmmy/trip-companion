(() => {
  "use strict";

  /*
   * One release accidentally stored Taipei data under `tokyo-*` keys.
   * Now that both companions share one origin, move that identifiable Taipei
   * payload before either child app starts. Never overwrite a `taipei-*` key.
   */
  const pairs = [
    ["tokyo-expenses", "taipei-expenses"],
    ["tokyo-itinerary", "taipei-itinerary"],
    ["tokyo-checklist", "taipei-checklist"],
    ["tokyo-cafe-log", "taipei-cafe-log"],
    ["tokyo-fx-rate", "taipei-fx-rate"],
    ["tokyo-budget", "taipei-budget"],
    ["tokyo-active-tab", "taipei-active-tab"],
    ["tokyo-active-week", "taipei-active-week"],
    ["tokyo-active-day", "taipei-active-day"],
  ];

  function parse(raw) {
    try {
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isLegacyTaipeiPayload() {
    const itinerary = parse(localStorage.getItem("tokyo-itinerary"));
    if (Array.isArray(itinerary?.days)) return true;

    const expenses = parse(localStorage.getItem("tokyo-expenses"));
    if (
      Array.isArray(expenses) &&
      expenses.some(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          ("twd" in entry || "amountTwd" in entry)
      )
    ) {
      return true;
    }

    const rate = parse(localStorage.getItem("tokyo-fx-rate"));
    return Boolean(
      rate &&
        typeof rate === "object" &&
        ("hkdPerTwd" in rate || "twdToHkd" in rate)
    );
  }

  try {
    if (!isLegacyTaipeiPayload()) return;

    for (const [source, target] of pairs) {
      const raw = localStorage.getItem(source);
      if (raw === null) continue;

      let safelyCopied = localStorage.getItem(target) !== null;
      if (!safelyCopied) {
        try {
          localStorage.setItem(target, raw);
          safelyCopied = localStorage.getItem(target) === raw;
        } catch {
          safelyCopied = false;
        }
      }

      if (!safelyCopied) continue;

      // Keep a recovery copy, then free the Tokyo namespace for Tokyo data.
      const backupKey = `taipei-migration-backup:${source}`;
      try {
        if (localStorage.getItem(backupKey) === null) {
          localStorage.setItem(backupKey, raw);
        }
        localStorage.removeItem(source);
      } catch {
        // The canonical Taipei copy already exists; leave source untouched if
        // storage access fails so no data is lost.
      }
    }

    localStorage.setItem("taipei-storage-migration-v1", String(Date.now()));
  } catch {
    // Storage can be unavailable in private/restricted browsing. Child apps
    // already handle that case with in-memory fallbacks.
  }
})();
