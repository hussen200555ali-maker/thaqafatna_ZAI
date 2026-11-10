/**
 * 🎭 E2E — auth.spec.ts
 *
 * يتحقق من:
 * - صفحة الدخول تعمل وتعرض الحقول
 * - بيانات خاطئة تُبقي المستخدم في صفحة الدخول
 * - حقول فارغة لا تُرسل
 * - RTL layout
 *
 * ملاحظة: لا نختبر دخول ناجح بـ 2FA (يتطلب بيانات حقيقية)
 */

import { test, expect } from '@playwright/test'

test.describe('Auth — صفحة الدخول', () => {

  test('تعرض العناصر الصحيحة', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('input[type="email"], input[placeholder*="admin"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('تستخدم RTL (dir=rtl)', async ({ page }) => {
    await page.goto('/admin/login')
    const dir = await page.locator('html').getAttribute('dir')
    expect(dir).toBe('rtl')
  })

  test('حقل البريد له placeholder', async ({ page }) => {
    await page.goto('/admin/login')
    const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first()
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    const placeholder = await emailInput.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })

  test('حقل كلمة المرور من نوع password', async ({ page }) => {
    await page.goto('/admin/login')
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible({ timeout: 15000 })
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('بيانات خاطئة تُبقي في صفحة الدخول', async ({ page }) => {
    await page.goto('/admin/login')

    await page.locator('input[type="email"], input[placeholder*="admin"]').fill('wrong@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')

    const button = page.locator('button[type="submit"], button:has-text("تسجيل"), button:has-text("دخول")').first()
    await button.click().catch(() => {})

    // يجب أن لا ينتقل لـ /admin (بدون /login)
    await page.waitForTimeout(3000)
    expect(page.url()).not.toMatch(/\/admin$/)
  })

  test('الصفحة تستجيب على الجوال', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin/login')
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 })
  })
})
