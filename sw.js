const CACHE_NAME = "katmanya-shell-v34";
const BASE = self.registration.scope;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=katmanya-1",
  "./styles.css?v=84",
  "./desk-set.js?v=1",
  "./vendor/qrcodegen.js?v=1",
  "./story-card.js?v=1",
  "./vendor/mp4-muxer.js?v=1",
  "./story-video.js?v=2",
  "./sketch-studio.js?v=21",
  "./photo-relief.js?v=1",
  "./photo-studio.js?v=1",
  "./puzzle-model.js?v=1",
  "./puzzle-studio.js?v=2",
  "./angle-model.js?v=1",
  "./angle-studio.js?v=2",
  "./main.js?v=44",
  "./chatbot.js?v=19",
  "./assets/chat-notification.wav",
  "./assets/desk-set.webp",
  "./assets/desk-nameplate.webp",
  "./assets/dual-controller-stand.webp",
  "./assets/bulk-production.webp",
  "./assets/katmanya-logo.svg",
  "./assets/katmanya-icon.svg",
  "./assets/katmanya-mark.svg",
  "./assets/katmanya-192.png",
  "./assets/katmanya-180.png",
  "./assets/katmanya-512.png"
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
    await Promise.all(keys.filter(key => key.startsWith("katmanya-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)));
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

