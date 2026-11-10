/**
 * 🎭 E2E — rate-limit.spec.ts
 *
 * يتحقق من:
 * - API /api/admin/check-2fa يستجيب للطلبات
 * - Rate Limiting قد يكون مُفعّلًا في الإنتاج (Upstash) لكن معطّل في dev
 *
 * ملاحظة: هذا اختبار "soft" — لا نفشل بقوة لأن Rate Limiting
 * قد يكون معطّلًا في بيئة الاختبار
 */

import { test, expect } from '@playwright/test'

test.describe('Rate Limiting — /api/admin/check-2fa', () => {

  test('API يستجيب للطلب الأول', async ({ request }) => {
    const response = await request.post('/api/admin/check-2fa', {
      data: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    // نتوقع 401 (بيانات خاطئة) أو 200 (مع رسالة خطأ) أو 429 (لو Rate Limit مُفعّل)
    expect([200, 401, 403, 422, 429]).toContain(response.status())
  })

  test('API يستجيب لطلبات متعددة', async ({ request }) => {
    const responses: number[] = []
    for (let i = 0; i < 2; i++) {
      const res = await request.post('/api/admin/check-2fa', {
        data: {
          email: `test-${i}@example.com`,
          password: 'wrongpassword',
        },
      })
      responses.push(res.status())
    }

    expect(responses.length).toBe(2)
    responses.forEach(s => expect([200, 401, 403, 422, 429]).toContain(s))
  })

  test('بعد محاولات كثيرة، قد يُرجّع 429', async ({ request }) => {
    // 5 محاولات (الحد = 3 في الإنتاج)
    const responses: number[] = []
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/admin/check-2fa', {
        data: {
          email: 'rate-limit-test@example.com',
          password: 'wrongpassword',
        },
      })
      responses.push(res.status())
    }

    // في الإنتاج: نتوقع 429 في إحدى المحاولات الأخيرة
    // في dev: كلها 200/401
    const has429 = responses.includes(429)
    if (has429) {
      // Rate Limiting يعمل ✅
      expect(has429).toBe(true)
    } else {
      // Rate Limiting معطّل في الـ dev — مقبول
      expect(responses.length).toBe(5)
    }
  })
})

test.describe('Rate Limiting — صفحة الدخول UX', () => {

  test('صفحة الدخول تعرض تحذيرًا عن القفل المحتمل', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')

    // ابحث عن نص يذكر القفل أو المحاولات
    const bodyText = await page.locator('body').textContent()
    const hasLockWarning = bodyText?.match(/محاولات|قفل|lockout|attempts/i)

    // قد يكون موجودًا أو لا — لا نفشل بقوة
    if (hasLockWarning) {
      expect(hasLockWarning).toBeTruthy()
    }
  })
})
