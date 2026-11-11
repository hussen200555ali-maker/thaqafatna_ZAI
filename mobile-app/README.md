# 📱 تطبيق ثقافتنا للهواتف الذكية

تطبيق Android عربي ثقافي يجمع بين **لعبة الكلمات المتقاطعة** و **مكتبة قراءة رقمية** في تجربة مستخدم واحدة.

## ✨ المميزات

- 🎮 **لعبة الكلمات** — شبكة متقاطعة + ألغاز متنوعة + تحديات يومية + نقاط ومكافآت
- 📚 **قراءة الكتب** — مكتبة رقمية + قارئ PDF + تتبّع التقدّم + إشارات مرجعية
- 👤 **الملف الشخصي** — مستويات + شارات + سجل نشاط + إحصائيات
- 🏆 **المتصدرون** — لوحة متصدّرين أسبوعية/شهرية/كل الأوقات
- 📴 **الوضع دون اتصال** — قراءة + ألغاز + مزامنة تلقائية

## 🚀 طريقة التشغيل

### المتطلبات
- Node.js 20+
- Android Studio (لبناء APK)
- أو تطبيق **Expo Go** على هاتفك (للتجربة السريعة)

### التشغيل السريع (Expo Go)
```bash
cd mobile-app
npm install --legacy-peer-deps
npx expo start
# امسح QR code بتطبيق Expo Go على هاتفك
```

### بناء APK نهائي عبر GitHub Actions
1. ادفع تعديلاتك لفرع `feat/mobile-app-v2`
2. سيبدأ GitHub Actions تلقائيًا ببناء APK
3. انتظر ~15-20 دقيقة
4. نزّل APK من قسم **Artifacts** في صفحة الـ workflow

### بناء محلي عبر EAS
```bash
npm install -g eas-cli
eas login
eas build:android --profile preview
```

## 🔗 الواجهة الخلفية (Backend)

التطبيق متكامل مع موقع ثقافتنا الحالي:
- **الرابط:** https://thaqafatna-qr.vercel.app
- **التقنية:** Next.js 16 + PostgreSQL + Prisma
- **المصادقة:** NextAuth v5

### APIs المستخدمة
- `/api/books` — قائمة الكتب
- `/api/books/[id]` — تفاصيل كتاب
- `/api/books/[id]/chapters` — فصول الكتاب
- `/api/books/[id]/progress` — تتبّع التقدّم
- `/api/books/[id]/bookmark` — الإشارات المرجعية
- `/api/chapters` — فصول اللعبة
- `/api/levels` — مراحل اللعبة
- `/api/leaderboard` — المتصدرون

## 📁 هيكل المشروع

```
mobile-app/
├── App.tsx                      # نقطة الدخول
├── index.js                     # تسجيل التطبيق
├── app.json                     # إعدادات Expo
├── eas.json                     # إعدادات البناء
├── package.json                 # التبعيات
├── .github/workflows/           # GitHub Actions
│   └── build-android.yml        # بناء APK تلقائيًا
└── src/
    ├── theme/theme.ts           # 🎨 الثيم والألوان
    ├── services/api.ts          # 🔌 تكامل Backend كامل
    ├── components/index.tsx     # 🧩 مكونات UI مشتركة
    ├── navigation/AppNavigator.tsx  # 🧭 التنقّل
    └── screens/                 # 📱 الشاشات
        ├── OnboardingScreen.tsx     # شاشة الترحيب
        ├── HomeScreen.tsx           # الصفحة الرئيسية
        ├── LibraryScreen.tsx        # المكتبة
        ├── BookDetailScreen.tsx     # تفاصيل الكتاب
        ├── BookReaderScreen.tsx     # القارئ
        ├── GameScreen.tsx           # اللعبة
        ├── LeaderboardScreen.tsx    # المتصدرون
        └── ProfileScreen.tsx        # الملف الشخصي
```

## 🎨 الهوية البصرية

- **الألوان الأساسية:** بنفسجي #9333EA + أزرق #2563EB + ذهبي #F59E0B
- **الخطوط:** Cairo للعناوين + Tajawal للنصوص
- **الوضع:** Dark Theme افتراضي
- **الاتجاه:** RTL كامل (عربي)

## 📦 النشر على Google Play

```bash
# بناء App Bundle للنشر
eas build:android --profile production

# رفع لـ Google Play
eas submit:android --track internal
```

## 🔧 التقنيات

- **React Native** 0.76
- **Expo** SDK 52
- **React Navigation** 7
- **expo-secure-store** — تخزين آمن
- **expo-notifications** — الإشعارات
- **API:** تكامل REST مع Next.js Backend

## 📄 الترخيص

© 2026 ثقافتنا. جميع الحقوق محفوظة.
