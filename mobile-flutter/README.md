# ثقافتنا - تطبيق Flutter الاحترافي

<div dir="rtl">

تطبيق أندرويد احترافي لمنصة "ثقافتنا" الثقافية العربية، مبني بـ **Flutter** مع بنية **Clean Architecture** وهوية تراثية عربية أصيلة.

## 🎯 الميزات الكاملة (15 شاشة)

### 🎮 الألعاب الثقافية
- كلمات متقاطعة تفاعلية مع شبكة ذكية
- ألغاز متنوعة + نظام نقاط وشارات
- تحديات يومية مع مكافآت
- متصدرين (يومي/أسبوعي/شهري)

### 📚 مكتبة الكتب
- تصفّح وبحث وفلاتر متعددة
- قارئ PDF مدمج مع تحكم بالخط والوضع الليلي
- إشارات مرجعية + تتبع التقدم
- مشاركة الكتب

### 🤖 المساعد الذكي
- محادثة تفاعلية للأسئلة الثقافية
- اقتراحات أسئلة سريعة
- دعم Markdown
- تاريخ محلي للمحادثة

### 🗺️ خريطة المعرفة
- عرض المجالات والمهارات
- مستوى الإتقان لكل مهارة
- إحصائيات تقدّم مرئية

### 🔔 الإشعارات والمزامنة
- إشعارات push (Firebase FCM)
- إشعارات محلية
- كاش محلي للعمل offline
- مزامنة تلقائية

## 🎨 الهوية البصرية التراثية

| العنصر | القيمة |
|--------|---------|
| النمط | تراثي عربي احترافي |
| اللون الأساسي | `#0F4C5C` (أزرق تراثي) |
| اللون المميز | `#E36414` (برتقالي) |
| الخلفية | `#FDF0D5` (كريمي) |
| الخط الأساسي | Cairo (عناوين) + Tajawal (نصوص) |

## 🏗️ البنية المعمارية

```
lib/
├── core/                    # النواة المشتركة
│   ├── theme/              # نظام التصميم (Colors, Theme, Fonts)
│   ├── network/            # طبقة الشبكة (DioClient, ApiEndpoints)
│   ├── errors/             # معالجة الأخطاء
│   ├── utils/              # أدوات مساعدة (extensions, validators)
│   └── widgets/           # Widgets مشتركة (Loading, Empty, Error, Cards)
├── features/               # الميزات (كل ميزة مستقلة)
│   ├── splash/             # شاشة البداية
│   ├── onboarding/         # 3 شرائح تعريفية
│   ├── home/               # الشاشة الرئيسية
│   ├── game/               # الألعاب + تفاصيل المرحلة (كلمات متقاطعة)
│   ├── library/            # المكتبة + تفاصيل الكتاب + القارئ
│   ├── ai_tutor/           # المساعد الذكي
│   ├── knowledge_map/      # خريطة المعرفة
│   ├── leaderboard/        # المتصدرين
│   ├── notifications/      # الإشعارات
│   ├── profile/            # الملف الشخصي
│   ├── settings/           # الإعدادات
│   ├── daily_challenge/    # التحدّي اليومي
│   ├── auth/               # تسجيل الدخول
│   └── main/               # Bottom Navigation
├── models/                 # نماذج البيانات (fromJson/toJson/copyWith)
├── services/               # ApiService + StorageService + NotificationService
├── app/                    # App + Providers (Riverpod)
└── main.dart              # نقطة البداية
```

## 🛠️ التقنيات المستخدمة

| الفئة | التقنية |
|------|---------|
| Framework | Flutter 3.x |
| State Management | Riverpod 2.5 |
| Network | Dio 5.5 |
| Local Storage | Hive + SharedPreferences |
| Routing | GoRouter 14 |
| Notifications | Firebase Messaging + Local Notifications |
| PDF Reader | Syncfusion Flutter PDF Viewer |
| Images | CachedNetworkImage + Shimmer |
| Animations | flutter_animate |
| Fonts | Google Fonts (Cairo + Tajawal) |

## 🚀 البناء والتشغيل

### المتطلبات
- Flutter 3.x أو أحدث
- Dart 3.x
- Android Studio / VS Code
- Java 17

### التشغيل محليًا
```bash
cd mobile-flutter
flutter pub get
flutter run
```

### بناء APK (Release)
```bash
flutter build apk --release
```

### بناء AAB (للمتجر)
```bash
flutter build appbundle --release
```

### بناء عبر GitHub Actions
ادفع الكود إلى GitHub على فرع `main` أو `feat/flutter-app`، وسيتم بناء APK تلقائيًا. حمّله من قسم **Artifacts**.

## 🔧 الإعدادات

| الإعداد | القيمة |
|---------|--------|
| API URL | `https://thaqafatna-qr.vercel.app/api` |
| التوقيع | debug keystore افتراضي |
| RTL | مفعّل تلقائيًا (عربي 100%) |
| Offline | مفعّل عبر Hive caching |
| Push Notifications | مفعّل عبر FCM |

## 📦 الإصدار

- **الإصدار**: 2.0.0
- **التاريخ**: 2026-11-11
- **المنصة**: Flutter (Android + iOS)
- **حجم الكود**: 31 ملف Dart

## 📝 ملاحظات

- التطبيق متكامل بالكامل مع API الموجود على Vercel
- يعمل offline عبر كاش Hive
- يدعم الوضع الليلي والنهاري
- هوية عربية تراثية أصيلة

</div>
