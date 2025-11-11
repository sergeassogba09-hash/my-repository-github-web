// sw.js
const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./save.html",
  "./guide.html",
  "./index.css",
  "./manifest.json",
  "./offline.html",
  // libs
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js",
  // icons
  "./icon1.png",
  "./icon2.png",
  "./icon1.png",
  "./icon2.png"
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for others, fallback offline
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Handle navigation requests (HTML)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match("./offline.html");
        })
    );
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // For CDN resources (Leaflet), stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
