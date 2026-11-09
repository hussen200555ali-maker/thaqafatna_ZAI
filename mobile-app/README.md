# 📱 تطبيق ثقافتنا - Android

تطبيق Android أصلي لتطبيق "ثقافتنا" يتكامل مع الـ Backend الموجود على `https://thaqafatna-qr.vercel.app`.

## 📦 المحتويات

| المسار | الوصف |
|--------|------|
| `pwa/` | تطبيق PWA كامل (HTML + CSS + JS) |
| `pwa/index.html` | التطبيق الكامل بكل الشاشات الـ 8 |
| `pwa/manifest.json` | PWA manifest |
| `pwa/sw.js` | Service Worker للعمل دون اتصال |
| `android/` | مشروع Android (Capacitor) |
| `capacitor.config.ts` | إعدادات Capacitor |

## 🎨 الشاشات (8 شاشات)

1. **Onboarding** — 3 شرائح تعريفية
2. **Home** — إحصائيات + كتب مميزة + فصول لعبة + تحدي يومي
3. **Library** — قائمة كتب + بحث + فلترة بالتصنيف
4. **BookDetail** — غلاف + معلومات + فهرس فصول
5. **BookReader** — قارئ نص مع تكبير خط + تنقل بين الفصول
6. **Game** — قائمة فصول ومراحل اللعبة
7. **Leaderboard** — Podium لأول 3 + قائمة المتصدرين
8. **Profile** — مستوى + شارات + إحصائيات + إعدادات

## 🔌 APIs المتكاملة

- `GET /api/books` — قائمة الكتب
- `GET /api/books/:id` — تفاصيل كتاب
- `GET /api/books/:id/chapters` — فصول الكتاب
- `GET /api/books/:id/chapters/:order` — محتوى فصل
- `POST /api/books/:id/progress` — تحديث تقدّم القراءة
- `POST /api/books/:id/bookmark` — إشارة مرجعية
- `GET /api/chapters` — فصول اللعبة
- `GET /api/levels?chapterId=N` — مراحل فصل
- `GET /api/leaderboard?period=weekly` — المتصدرون

## 🛠️ البناء

```bash
# 1. نسخ ملفات الويب
cd mobile-app
npx cap copy android

# 2. بناء APK
cd android
./gradlew assembleDebug

# APK سيكون في:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 المتطلبات

- JDK 21
- Android SDK (Platform 36, Build-Tools 36)
- Node.js 20+
- Capacitor CLI

## 🎨 التصميم

- **الألوان:** بنفسجي (#9333EA) + أزرق (#2563EB) + ذهبي (#F59E0B)
- **الخلفية:** أسود داكن (#0C0A09)
- **الخطوط:** Cairo (عناوين) + Tajawal (نصوص)
- **الاتجاه:** RTL كامل
