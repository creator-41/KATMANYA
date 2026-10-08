const CACHE_NAME = "sarp-shell-v28";
const BASE = self.registration.scope;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles.css?v=62",
  "./main.js?v=35",
  "./chatbot.js?v=18",
  "./assets/chat-notification.wav",
  "./assets/desk-set.webp",
  "./assets/desk-nameplate.webp",
  "./assets/dual-controller-stand.webp",
  "./assets/bulk-production.webp",
  "./assets/sarp-logo.svg",
  "./assets/sarp-mark.svg",
  "./assets/sarp-192.png",
  "./assets/sarp-180.png",
  "./assets/sarp-512.png"
].map(path => new URL(path, BASE).href);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => (key.startsWith("fav-baski-shell-") || key.startsWith("sarp-shell-")) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(new URL("./index.html", BASE))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
