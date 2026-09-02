/* Trip Companion SW v10 — pass-through only.
 * Older versions cached HTML / mishandled Vercel 308 redirects and broke
 * mobile PWA loads (redirect loop → blank / 載入唔到).
 * This worker exists solely to replace broken registrations and wipe caches.
 */
const CACHE_PREFIX = "trip-companion-";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX) || k.startsWith("trip-companion"))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Do not intercept fetches — let the browser talk to the network directly.
