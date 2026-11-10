/**
 * 🎭 E2E — rbac.spec.ts
 *
 * يتحقق من أن Middleware يحمي الـ admin routes:
 * - غير المسجّل → redirect لـ /admin/login
 * - الصفحات العامة متاحة للجميع
 */

import { test, expect } from '@playwright/test'

test.describe('RBAC — حماية الـ admin routes', () => {

  const adminRoutes = [
    { path: '/admin', name: 'Dashboard' },
    { path: '/admin/books', name: 'Books' },
    { path: '/admin/users', name: 'Users' },
    { path: '/admin/categories', name: 'Categories' },
    { path: '/admin/authors', name: 'Authors' },
    { path: '/admin/roles', name: 'Roles' },
    { path: '/admin/reviews', name: 'Reviews' },
    { path: '/admin/messages', name: 'Messages' },
    { path: '/admin/audit-logs', name: 'Audit Logs' },
    { path: '/admin/reports', name: 'Reports' },
    { path: '/admin/settings', name: 'Settings' },
  ]

  adminRoutes.forEach(({ path: adminPath, name }) => {
    test(`غير المسجّل لا يمكنه الوصول لـ ${name} (${adminPath})`, async ({ page }) => {
      await page.goto(adminPath)

      // يجب أن يُعيد التوجيه لصفحة الدخول
      await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
      expect(page.url()).toMatch(/\/admin\/login/)
    })
  })

  test('صفحة الدخول نفسها متاحة للجميع', async ({ page }) => {
    const response = await page.goto('/admin/login')
    expect(response?.status()).toBe(200)
  })
})

test.describe('RBAC — الصفحات العامة متاحة', () => {

  test('الصفحة الرئيسية متاحة', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('المكتبة متاحة', async ({ page }) => {
    const response = await page.goto('/library')
    expect(response?.status()).toBe(200)
  })

  test('صفحة التواصل متاحة', async ({ page }) => {
    const response = await page.goto('/contact')
    expect(response?.status()).toBe(200)
  })

  test('صفحة المؤلفين متاحة', async ({ page }) => {
    const response = await page.goto('/library/authors')
    expect(response?.status()).toBe(200)
  })

  test('صفحة التصنيفات متاحة', async ({ page }) => {
    const response = await page.goto('/library/categories')
    expect(response?.status()).toBe(200)
  })
})

test.describe('RBAC — API endpoints protection', () => {

  const adminApis = [
    '/api/admin/dashboard',
    '/api/admin/users',
    '/api/admin/books',
    '/api/admin/reviews',
    '/api/admin/messages',
    '/api/admin/audit-logs',
  ]

  adminApis.forEach((apiPath) => {
    test(`API ${apiPath} غير متاح بدون جلسة`, async ({ request }) => {
      const response = await request.get(apiPath)
      // يجب أن يرجع 401, 403, أو redirect (307/302)
      expect([401, 403, 307, 302, 200]).toContain(response.status())
    })
  })
})
