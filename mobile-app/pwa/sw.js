const CACHE_NAME = 'thaqafatna-v1';
const API_BASE = 'https://thaqafatna-qr.vercel.app';

// ملفات للتخزين المؤقت عند التثبيت
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Cache: Network First للـ API، Cache First للأصول
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // تجاهل non-GET
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // API requests — Network First
  if (url.origin === API_BASE) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // نفس الموقع — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        return response;
      });
    })
  );
});
