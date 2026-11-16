/* Service Worker — تطبيق ثقافتنا للموبايل (/m)
 * - يتيح تثبيت التطبيق كـ PWA
 * - يخزّن app shell و الكتب المميزة للعمل offline
 * - استراتيجية: stale-while-revalidate للمحتوى، cache-first للأصول الثابتة
 */

const CACHE_VERSION = 'thaqafatna-m-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// ملفات الـ app shell الأساسية
const SHELL_URLS = [
  '/m',
  '/m/',
  '/m-manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
]

// تثبيت: خزّن الـ shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  )
})

// تفعيل: احذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('thaqafatna-m-') && !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// fetch: استراتيجية ذكية
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // تجاهل طلبات Vercel analytics و hot-reload
  if (url.pathname.includes('_next/webpack-hmr') || url.hostname.includes('vercel.live')) return

  // API: network-first (البيانات الطازجة)، مع fallback للكاش
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone))
          }
          return res
        })
        .catch(() => caches.match(req).then((r) => r || new Response('[]', { headers: { 'Content-Type': 'application/json' } })))
    )
    return
  }

  // مستندات/navigation: network-first مع fallback للكاش (للعمل offline)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/m')))
    )
    return
  }

  // أصول ثابتة و صور: stale-while-revalidate
  if (url.pathname.startsWith('/_next/') || url.pathname.match(/\.(png|jpe?g|svg|webp|woff2?|css|js)$/i)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone()
              caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // افتراضي: جرب الشبكة ثم الكاش
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  )
})
