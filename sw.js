const CACHE_NAME = 'gaozhi-cache-v5';
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

// index.html（以及導覽請求）完全不快取，純粹直接向網路要最新版本。
// 這犧牲了「離線時能看到殼」的能力，換取「更新永遠不會卡在舊版本」——
// 手機瀏覽器沒有方便的手動清快取入口，這個風險換算下來不值得冒。
function isAppShellRequest(req, url){
  return req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  if(isAppShellRequest(req, url)){
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // 靜態資源（圖示、音效、manifest）變動機率低，用 cache-first 沒問題，
  // 也讓離線時至少這些小檔案還能用。
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
