/* Service Worker GeoCapture */
const VERSION = "v1.0.0";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

/* Précache des pages et assets locaux */
const PRECACHE_URLS = [
  "/",             // si le serveur renvoie index.html à la racine
  "/index.html",
  "/map.html",
  "/manifest.json",
  "/icon.png",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css",
  "https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"
];

/* Install: pré-cache statique */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

/* Activate: nettoyer anciens caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch: stratégie mixte
   - Pages/locals: cache-first avec fallback réseau
   - Leaflet/OSM tiles: runtime cache avec limite
*/
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET (POST camera, etc.)
  if (request.method !== "GET") return;

  // Tiles OSM/Leaflet (runtime cache)
  const isMapTile =
    url.hostname.endsWith("tile.openstreetmap.org") ||
    url.hostname.endsWith("unpkg.com");

  if (isMapTile) {
    event.respondWith(runtimeCache(request));
    return;
  }

  // Static cache-first (HTML/CSS/JS/icônes/manifest)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((resp) => {
          // Met en cache la réponse si elle est OK et même origine
          const copy = resp.clone();
          if (resp.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return resp;
        })
        .catch(() => {
          // Fallback offline pour HTML: renvoie index.html si disponible
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
          return new Response("", { status: 503, statusText: "Offline" });
        });
    })
  );
});

/* Runtime cache avec limite pour éviter gonflement */
async function runtimeCache(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const resp = await fetch(request);
    if (resp.ok) {
      await cache.put(request, resp.clone());
      // Housekeeping (limiter taille)
      trimCache(RUNTIME_CACHE, 120); // limite ~120 entrées
    }
    return resp;
  } catch (e) {
    // Offline fallback: rien pour tiles, retourne 503
    return new Response("", { status: 503, statusText: "Offline tiles" });
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const toDelete = keys.length - maxItems;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}
