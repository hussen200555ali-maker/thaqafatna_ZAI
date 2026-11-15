# تطبيق ثقافتنا - WebView Android

تطبيق Android مبسّط يحمّل موقع ثقافتنا المباشر `https://thaqafatna-qr.vercel.app/` داخل WebView.

## المميزات
- خفيف جداً (APK ~3 MB)
- اسم التطبيق: ثقافتنا (عربي)
- دعم RTL كامل
- تخزين مؤقت ذكي (يعمل offline عند فقدان الشبكة)
- لا يحتاج Flutter SDK أو NDK

## البناء
```bash
export ANDROID_HOME=/path/to/android-sdk
export JAVA_HOME=/path/to/jdk17
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

## الإصدار
- versionCode: 2
- versionName: 2.0.1
- minSdk: 24 (Android 7.0+)
- targetSdk: 34 (Android 14)
