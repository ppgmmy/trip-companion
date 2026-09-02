/* Trip Companion service worker — never serve stale app shells on mobile PWA. */
const CACHE = "trip-companion-v9";
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

function networkFirstAsset(req) {
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

  if (url.pathname === "/market" || url.pathname.startsWith("/market/") || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  // App shells / HTML: network ONLY while online. Stale cached HTML + new missing hashes = mobile white screen.
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then(
          (hit) =>
            hit ||
            new Response("<!doctype html><meta charset=utf-8><title>離線</title><body style='font-family:system-ui;padding:2rem;text-align:center'><h1>而家離線</h1><p>請連網後重開 App</p></body>", {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
        )
      )
    );
    return;
  }

  if (url.pathname.includes("/assets/") || /\.(?:js|css|mjs|map)$/.test(url.pathname)) {
    event.respondWith(networkFirstAsset(req));
    return;
  }

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
        })
    )
  );
});
