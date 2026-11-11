import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thaqafatna.app',
  appName: 'ثقافتنا',
  webDir: 'pwa',
  // تحميل الموقع المباشر عبر WebView بدلاً من الملفات المحلية
  // هذا يضمن أن يعرض التطبيق نفس محتوى المتصفح دائمًا
  server: {
    url: 'https://thaqafatna-qr.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
