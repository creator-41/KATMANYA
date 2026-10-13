const CACHE_NAME = "katmanya-shell-v63";
const BASE = self.registration.scope;
const CORE_ASSETS = [
  "./",
  "./site-experience.js?v=1",
  "./site-preferences.js?v=1",
  "./gizlilik.html",
  "./kullanim-kosullari.html",
  "./cerezler.html",
  "./iletisim.html",
  "./site-pages.css",
  "./tesekkurler.html",
  "./index.html",
  "./manifest.webmanifest?v=katmanya-2",
  "./styles.css?v=110",
  "./desk-set.js?v=1",
  "./vendor/qrcodegen.js?v=1",
  "./story-card.js?v=2",
  "./vendor/mp4-muxer.js?v=1",
  "./story-video.js?v=3",
  "./sketch-studio.js?v=22",
  "./photo-relief.js?v=1",
  "./photo-studio.js?v=1",
  "./puzzle-model.js?v=1",
  "./puzzle-studio.js?v=3",
  "./angle-model.js?v=1",
  "./angle-studio.js?v=2",
  "./maze-model.js?v=1",
  "./maze-studio.js?v=1",
  "./voice-model.js?v=1",
  "./voice-studio.js?v=2",
  "./lamp-model.js?v=1",
  "./lamp-studio.js?v=1",
  "./phone-model.js?v=1",
  "./phone-studio.js?v=1",
  "./message-ring-model.js?v=1",
  "./message-ring-studio.js?v=1",
  "./capsule-model.js?v=1",
  "./capsule-studio.js?v=1",
  "./gear-model.js?v=1",
  "./gear-studio.js?v=1",
  "./shadow-model.js?v=1",
  "./shadow-studio.js?v=1",
  "./dragon-model.js?v=1",
  "./dragon-studio.js?v=1",
  "./flower-model.js?v=1",
  "./flower-studio.js?v=1",
  "./cube-model.js?v=2",
  "./cube-studio.js?v=1",
  "./penalty-model.js?v=1",
  "./penalty-studio.js?v=1",
  "./marble-model.js?v=1",
  "./marble-studio.js?v=1",
  "./wave-model.js?v=1",
  "./wave-studio.js?v=1",
  "./squeeze-model.js?v=1",
  "./squeeze-studio.js?v=1",
  "./slide-model.js?v=1",
  "./slide-studio.js?v=2",
  "./workshop.js?v=3",
  "./gift-finder.js?v=1",
  "./assets/workshop/sketch.webp",
  "./assets/workshop/photo.webp",
  "./assets/workshop/puzzle.webp",
  "./assets/workshop/angle.webp",
  "./assets/workshop/maze.webp",
  "./assets/workshop/voice.webp",
  "./assets/workshop/lamp.webp",
  "./assets/workshop/phone.webp",
  "./assets/workshop/ring.webp",
  "./assets/workshop/capsule.webp",
  "./assets/workshop/gear.webp",
  "./assets/workshop/shadow.webp",
  "./assets/workshop/dragon.webp",
  "./assets/workshop/flower.webp",
  "./assets/workshop/cube.webp",
  "./assets/workshop/penalty.webp",
  "./assets/workshop/marble.webp",
  "./assets/workshop/wave.webp",
  "./assets/workshop/squeeze.webp",
  "./assets/workshop/slide.webp",

  "./main.js?v=45",
  "./chatbot.js?v=20",
  "./assets/chat-notification.wav",
  "./assets/desk-set.webp",
  "./assets/desk-nameplate.webp",
  "./assets/dual-controller-stand.webp",
  "./assets/bulk-production.webp",
  "./assets/katmanya-logo-green-v3.webp",
  "./assets/katmanya-logo-green-v3-128.webp",
  "./assets/katmanya-logo-green-v3-256.webp",
  "./assets/katmanya-green-v3-32.png",
  "./assets/katmanya-green-v3-192.png",
  "./assets/katmanya-green-v3-180.png",
  "./assets/katmanya-green-v3-512.png"
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

