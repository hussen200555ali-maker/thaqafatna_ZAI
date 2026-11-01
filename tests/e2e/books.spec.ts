/**
 * 🎭 E2E — books.spec.ts
 *
 * يتحقق من:
 * - صفحة /library تعرض الكتب
 * - /api/books يُرجّع قائمة صحيحة
 * - صفحة تفاصيل الكتاب تعمل
 * - صفحة التصنيفات تعمل
 */

import { test, expect } from '@playwright/test'

test.describe('Books — الاستعراض العام', () => {

  test('صفحة /library تحمّل بنجاح', async ({ page }) => {
    const response = await page.goto('/library')
    expect(response?.status()).toBe(200)
  })

  test('صفحة /library تعرض محتوى', async ({ page }) => {
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)
  })

  test('/api/books يُرجّع JSON صالح', async ({ request }) => {
    const response = await request.get('/api/books?limit=10')

    expect(response.status()).toBe(200)
    const data = await response.json()

    expect(data).toHaveProperty('books')
    expect(Array.isArray(data.books)).toBe(true)
  })

  test('الكتب لها الحقول الأساسية', async ({ request }) => {
    const response = await request.get('/api/books?limit=5')
    const data = await response.json()

    if (data.books && data.books.length > 0) {
      const book = data.books[0]
      expect(book).toHaveProperty('id')
      expect(book).toHaveProperty('title')
      expect(book).toHaveProperty('author')
    }
  })
})

test.describe('Books — تفاصيل كتاب', () => {

  test('صفحة /library/[bookId] تعمل لأول كتاب', async ({ page, request }) => {
    const booksRes = await request.get('/api/books?limit=1')
    const booksData = await booksRes.json()

    if (!booksData.books || booksData.books.length === 0) {
      test.skip()
      return
    }

    const bookId = booksData.books[0].id
    const response = await page.goto(`/library/${bookId}`)
    expect(response?.status()).toBe(200)
  })

  test('/api/books/[id] يُرجّع تفاصيل', async ({ request }) => {
    const booksRes = await request.get('/api/books?limit=1')
    const booksData = await booksRes.json()

    if (!booksData.books || booksData.books.length === 0) {
      test.skip()
      return
    }

    const bookId = booksData.books[0].id
    const response = await request.get(`/api/books/${bookId}`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('book')
  })
})

test.describe('Books — التصنيفات', () => {

  test('/api/book-categories يُرجّع التصنيفات', async ({ request }) => {
    const response = await request.get('/api/book-categories')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('categories')
    expect(Array.isArray(data.categories)).toBe(true)
  })

  test('صفحة /library/categories تعمل', async ({ page }) => {
    const response = await page.goto('/library/categories')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Books — المؤلفون', () => {

  test('صفحة /library/authors تعمل', async ({ page }) => {
    const response = await page.goto('/library/authors')
    expect(response?.status()).toBe(200)
  })
})
