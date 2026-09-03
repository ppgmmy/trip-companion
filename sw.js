/* Trip Companion SW v11 — self-destruct.
 * Previous workers broke mobile PWAs (Vercel 308 redirect loops).
 * This worker clears old caches and unregisters itself. Do not re-add fetch handlers.
 */
const CACHE_PREFIX = "trip-companion";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.includes(CACHE_PREFIX) || k.startsWith("trip-companion"))
            .map((k) => caches.delete(k)),
        );
      } catch (e) {}
      try {
        await self.registration.unregister();
      } catch (e) {}
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => {
          try {
            c.navigate(c.url);
          } catch (e) {}
        });
      } catch (e) {}
    })(),
  );
});
