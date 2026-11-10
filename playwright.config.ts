import { defineConfig, devices } from '@playwright/test'

/**
 * 🎭 Playwright Configuration
 *
 * تشغيل:
 *   npx playwright test              ← كل الاختبارات
 *   npx playwright test --headed    ← مع متصفح مرئي
 *   npx playwright test tests/e2e/auth.spec.ts  ← ملف محدد
 *   npx playwright show-report      ← عرض التقرير
 *
 * ملاحظة: الاختبارات تتطلب dev server على localhost:3000
 * أو يمكن توجيهها للإنتاج عبر PLAYWRIGHT_BASE_URL env
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // تسلسلي لتجنب تعارض Rate Limiting
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  // Base URL: افتراضيًا localhost:3000 (dev)
  // يمكن توجيهه للإنتاج عبر: PLAYWRIGHT_BASE_URL=https://thaqafatna-qr.vercel.app
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // تشغيل dev server تلقائيًا فقط لو لم يُحدد PLAYWRIGHT_BASE_URL
  // وعند تشغيل dev server، نمرر متغيرات بيئة اختبار
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      AUTH_SECRET: 'test-secret-for-e2e-only-DO-NOT-USE-IN-PROD-32b!',
      AUTH_URL: 'http://localhost:3000',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
      TOTP_ENCRYPTION_KEY: 'a'.repeat(64),
      ADMIN_KEY: 'thaqafatna-admin-2026',
    } as Record<string, string>,
  },
})
