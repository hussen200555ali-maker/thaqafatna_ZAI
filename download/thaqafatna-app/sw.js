/* ============================================================
   ثقافتنا - Service Worker
   يعمل دون اتصال + تخزين مؤقت ذكي + مزامنة في الخلفية
   ============================================================ */

const SW_VERSION = 'v1.0.0';
const STATIC_CACHE = `thaqafatna-static-${SW_VERSION}`;
const API_CACHE = `thaqafatna-api-${SW_VERSION}`;
const IMAGE_CACHE = `thaqafatna-images-${SW_VERSION}`;

// الأصول الأساسية للتخزين المسبق
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;800&display=swap',
];

// API endpoints التي يمكن تخزينها مؤقتاً
const API_BASE = 'https://thaqafatna-qr.vercel.app/api/';
const CACHEABLE_API_PATHS = [
  '/api/books',
  '/api/chapters',
  '/api/leaderboard',
];

/* ============================================================
   1) التثبيت: تخزين مسبق للأصول الأساسية
   ============================================================ */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // نحاول تخزين كل الأصول، لكن لا نفشل التثبيت إذا فشل أحدها
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { mode: 'no-cors' }));
          } catch (err) {
            console.warn('[SW] فشل تخزين الأصل:', url, err.message);
          }
        })
      );
      console.log('[SW] تم تثبيت Service Worker بنجاح', SW_VERSION);
    })()
  );
});

/* ============================================================
   2) التفعيل: تنظيف الكاش القديم + الاستحواذ الفوري
   ============================================================ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              ![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(key)
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      console.log('[SW] تم تفعيل Service Worker', SW_VERSION);
    })()
  );
});

/* ============================================================
   3) جلب الموارد: استراتيجيات متعددة حسب النوع
   ============================================================ */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // تجاهل الطلبات غير GET (POST, PUT, DELETE...)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 3.1 - طلبات التنقل (HTML): Network-First مع fallback للكاش
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, STATIC_CACHE, './index.html'));
    return;
  }

  // 3.2 - طلبات API: Network-First مع كاش مؤقت
  if (url.origin === 'https://thaqafatna-qr.vercel.app' && url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p));
    if (isCacheable) {
      event.respondWith(networkFirst(req, API_CACHE, null, 300)); // TTL: 5 دقائق
    } else {
      event.respondWith(fetch(req).catch(() => cachedResponse(req, API_CACHE)));
    }
    return;
  }

  // 3.3 - الصور: Cache-First مع تحديث في الخلفية
  if (req.destination === 'image' || /\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, IMAGE_CACHE));
    return;
  }

  // 3.4 - الخطوط والأنماط: Cache-First مع fallback
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // 3.5 - الأصول المحلية (JS/CSS/أيقونات): Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // 3.6 - الافتراضي: محاولة الشبكة ثم الكاش
  event.respondWith(fetch(req).catch(() => cachedResponse(req)));
});

/* ============================================================
   استراتيجيات الكاش
   ============================================================ */

// Network-First: جرب الشبكة، عند الفشل استخدم الكاش
async function networkFirst(req, cacheName, fallbackUrl, ttlSeconds = 0) {
  const cache = await caches.open(cacheName);
  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.ok) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // محاولة الكاش
    const cached = await cache.match(req);
    if (cached) {
      // تحقق من صلاحية الكاش (TTL)
      if (ttlSeconds > 0) {
        const dateHeader = cached.headers.get('date');
        if (dateHeader) {
          const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
          if (age > ttlSeconds) {
            // الكاش منتهي الصلاحية - نعيده مع محاولة تحديث في الخلفية
            refreshInBackground(req, cacheName);
          }
        }
      }
      return cached;
    }
    // fallback للصفحة الرئيسية في طلبات التنقل
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    // صفحة خطأ بسيطة
    return new Response(
      offlinePage(),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

// Cache-First: جرب الكاش أولاً، ثم الشبكة
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // تحديث في الخلفية
    refreshInBackground(req, cacheName);
    return cached;
  }
  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.ok) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // لا يوجد كاش ولا شبكة - رد فارغ
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

async function cachedResponse(req, cacheName) {
  if (!cacheName) return null;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || Response.error();
}

// تحديث الكاش في الخلفية
async function refreshInBackground(req, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const freshRes = await fetch(req);
    if (freshRes && freshRes.ok) {
      await cache.put(req, freshRes);
    }
  } catch (err) {
    // فشل التحديث في الخلفية - تجاهل
  }
}

/* ============================================================
   4) الرسائل من الصفحة (تحديث، مسح الكاش)
   ============================================================ */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEARED' });
        }
      })()
    );
  } else if (data.type === 'GET_VERSION') {
    if (event.source) {
      event.source.postMessage({ type: 'VERSION', version: SW_VERSION });
    }
  }
});

/* ============================================================
   صفحة عدم الاتصال
   ============================================================ */
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ثقافتنا - غير متصل</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Tajawal','Cairo',system-ui,sans-serif; }
  body { background:#0c0a09; color:#F5F5F4; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; text-align:center; }
  .card { max-width:380px; padding:32px 24px; background:#1C1917; border:1px solid #292524; border-radius:24px; box-shadow:0 20px 60px rgba(0,0,0,.5); }
  .icon { width:96px; height:96px; margin:0 auto 16px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#9333EA,#2563EB); border-radius:50%; font-size:48px; }
  h1 { font-size:22px; font-weight:800; color:#F5F5F4; margin-bottom:8px; }
  p { font-size:15px; line-height:1.6; color:#A8A29E; margin-bottom:20px; }
  button { background:#9333EA; color:#fff; border:none; padding:12px 28px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:.2s; }
  button:hover { background:#7E22CE; transform:translateY(-1px); }
</style></head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>أنت غير متصل بالإنترنت</h1>
    <p>يبدو أن الاتصال بالإنترنت غير متاح حالياً. ستعود المحتوى بمجرد استعادة الاتصال.</p>
    <button onclick="window.location.reload()">إعادة المحاولة</button>
  </div>
</body></html>`;
}
