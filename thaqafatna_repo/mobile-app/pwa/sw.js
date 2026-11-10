const CACHE = 'thaqafatna-v1';
const ASSETS = ['./', './index.html', './manifest.json'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Network-first for API calls, cache-first for assets
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if (res && res.ok && (req.destination === 'document' || req.destination === 'script' || req.destination === 'style')) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
