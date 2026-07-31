const CACHE_NAME = 'gaozhi-cache-v4';
const CORE_ASSETS = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './sounds/click1.mp3',
  './sounds/click2.mp3',
  './sounds/click3.mp3',
  './sounds/click4.mp3',
  './sounds/click5.mp3',
  './sounds/click6.mp3',
  './sounds/click7.mp3',
  './sounds/click8.mp3',
  './sounds/click9.mp3',
  './sounds/click10.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// index.html (and navigation requests) use network-first: always try to fetch the
// latest version first, and only fall back to the cached copy when offline. This is
// what makes future updates show up immediately instead of getting stuck on an old
// cached version.
function isAppShellRequest(req, url){
  return req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  if(isAppShellRequest(req, url)){
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first is fine since they rarely change.
  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
