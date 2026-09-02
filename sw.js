/* Trip Companion service worker — network-first pages; avoid stale hashed assets. */
const CACHE = "trip-companion-v8";
const CORE = ["/manifest.webmanifest", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(req));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Stock dashboard is proxied; never cache it.
  if (url.pathname === "/market" || url.pathname.startsWith("/market/")) {
    event.respondWith(fetch(req));
    return;
  }

  // Never cache API / auth endpoints.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML / navigations: always prefer network so new Vite hashes land.
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Hashed Vite bundles: network-first (old hashes 404 after deploy → white screen if cache-first stale HTML).
  if (
    url.pathname.includes("/assets/") ||
    /\.(?:js|css|mjs|map)$/.test(url.pathname)
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Other static (icons, fonts under same origin): cache-first with network fill.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => hit)
    )
  );
});
