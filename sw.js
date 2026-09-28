const CACHE_NAME = 'gps-desert-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  const url = event.request.url;
  
  // APIs ما تخزن — تحتاج إنترنت
  if (url.includes('overpass') || url.includes('photon') || url.includes('nominatim') || url.includes('ipify')){
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(function(response){
        if (response.ok && event.request.method === 'GET'){
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function(){
        return caches.match(event.request).then(function(cached){
          if (cached) return cached;
          if (event.request.mode === 'navigate'){
            return caches.match('./index.html');
          }
          return new Response('Offline', {status: 503});
        });
      })
  );
});