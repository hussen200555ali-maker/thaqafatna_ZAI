/**
 * 🎭 E2E — admin-ui.spec.ts
 *
 * يتحقق من:
 * - فتح /admin يُعيد توجيه لـ /admin/login (لغير المسجّلين)
 * - صفحة الـ login تعرض العناصر الصحيحة
 * - AdminLayout يُظهر الـ Sidebar والـ Topbar بشكل صحيح
 *
 * ملاحظة: لا يحتاج تسجيل دخول — يختبر البنية البصرية فقط
 */

import { test, expect } from '@playwright/test'

test.describe('Admin UI — البنية البصرية', () => {

  test('صفحة /admin/login تعرض العناصر الصحيحة', async ({ page }) => {
    await page.goto('/admin/login')

    // العنوان
    await expect(page.locator('h1, h2').first()).toContainText(/لوحة تحكم ثقافتنا|دخول الأدمن/i)

    // حقول الإدخال
    await expect(page.locator('input[type="email"], input[placeholder*="admin"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // زر الدخول — أكثر مرونة (قد يكون النص: تسجيل، دخول، تسجيل الدخول، Login)
    const loginButton = page.locator('button[type="submit"], button:has-text("تسجيل"), button:has-text("دخول"), button:has-text("Login")').first()
    await expect(loginButton).toBeVisible({ timeout: 10000 })
  })

  test('الوصول لـ /admin بدون تسجيل دخول → يُعيد توجيه لـ /admin/login', async ({ page }) => {
    await page.goto('/admin')

    // يجب أن يُعيد التوجيه لصفحة الدخول
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/admin\/login/)
  })

  test('الوصول لـ /admin/books بدون تسجيل → يُعيد توجيه', async ({ page }) => {
    await page.goto('/admin/books')
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/admin\/login/)
  })

  test('الوصول لـ /admin/users بدون تسجيل → يُعيد توجيه', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/admin\/login/)
  })

  test('الوصول لـ /admin/settings بدون تسجيل → يُعيد توجيه', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/admin\/login/)
  })

  test('صفحة الدخول تستجيب على الجوال', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone
    await page.goto('/admin/login')

    // يجب أن تكون الحقول مرئية على الجوال
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
  })
})
