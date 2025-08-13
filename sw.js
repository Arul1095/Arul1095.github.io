// Simple offline-first shell for your GitHub Pages site under /Suja/
const CACHE_NAME = "mhm-v2";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./dashboard.html",
  // third-party you use:
  "https://cdn.jsdelivr.net/npm/chart.js"
];
const API_HOST_PART = "script.google.com/macros"; // your Google Apps Script host

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For your Apps Script API: network-first (don’t cache POSTs)
  if (url.host.includes(API_HOST_PART)) {
    if (request.method !== "GET") return; // let the browser do POST normally
    event.respondWith(
      fetch(request).catch(() => caches.match(request)) // fallback if offline
    );
    return;
  }

  // For same-origin static files: cache-first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(resp => {
          // Optionally cache new static files
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return resp;
        })
      )
    );
    return;
  }

  // For other GETs (like CDN): try cache, then network
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
