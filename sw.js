const CACHE = "gps-desert-v3";
const TILE_CACHE = "gps-tiles-v3";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(["./", "./index.html", "./manifest.json", "./icon.png"])
  ));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes("cartocdn") || url.hostname.includes("arcgisonline")){
    e.respondWith(
      caches.open(TILE_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const resp = await fetch(e.request);
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        } catch(err){
          return new Response("", {status: 503});
        }
      })
    );
    return;
  }

  if (url.hostname.includes("nominatim") || url.hostname.includes("overpass") || url.hostname.includes("open-meteo")){
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});