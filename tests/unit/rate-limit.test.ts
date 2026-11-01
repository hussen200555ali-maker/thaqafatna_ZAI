/**
 * 🧪 اختبارات وحدة — rate-limit.ts
 *
 * يغطّي:
 * - getIdentifier: x-forwarded-for (متعدد IPs)
 * - getIdentifier: x-real-ip fallback
 * - getIdentifier: unknown (لا headers)
 * - getIdentifier: أول IP فقط من قائمة forwarded
 * - rateLimit: عند عدم وجود Redis → success=true (dev mode)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getIdentifier, rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Helper: إنشاء request mock
function createMockRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/test', {
    headers: new Headers(headers),
  })
}

describe('rate-limit.ts — Upstash Rate Limiting', () => {
  describe('getIdentifier — استخراج المعرّف', () => {
    it('يجب أن يستخدم x-forwarded-for لو موجود', () => {
      const request = createMockRequest({
        'x-forwarded-for': '188.45.12.3',
      })
      expect(getIdentifier(request)).toBe('ip:188.45.12.3')
    })

    it('يجب أن يستخدم أول IP فقط من قائمة forwarded (Vercel multi-proxy)', () => {
      const request = createMockRequest({
        'x-forwarded-for': '188.45.12.3, 10.0.0.1, 192.168.1.1',
      })
      expect(getIdentifier(request)).toBe('ip:188.45.12.3')
    })

    it('يجب أن يتجاهل المسافات حول IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  188.45.12.3  , 10.0.0.1',
      })
      expect(getIdentifier(request)).toBe('ip:188.45.12.3')
    })

    it('يجب أن يستخدم x-real-ip كـ fallback', () => {
      const request = createMockRequest({
        'x-real-ip': '91.221.45.67',
      })
      expect(getIdentifier(request)).toBe('ip:91.221.45.67')
    })

    it('يجب أن يُفضّل x-forwarded-for على x-real-ip', () => {
      const request = createMockRequest({
        'x-forwarded-for': '188.45.12.3',
        'x-real-ip': '91.221.45.67',
      })
      expect(getIdentifier(request)).toBe('ip:188.45.12.3')
    })

    it('يجب أن يُرجّع "ip:unknown" بدون أي headers', () => {
      const request = createMockRequest()
      expect(getIdentifier(request)).toBe('ip:unknown')
    })

    it('يجب أن يُرجّع "ip:unknown" مع forwarded فارغ', () => {
      const request = createMockRequest({
        'x-forwarded-for': '',
      })
      expect(getIdentifier(request)).toBe('ip:unknown')
    })

    it('يجب أن يُرجّع "ip:unknown" مع forwarded يحتوي فقط على مسافات', () => {
      const request = createMockRequest({
        'x-forwarded-for': '   ,  ',
      })
      expect(getIdentifier(request)).toBe('ip:unknown')
    })
  })

  describe('rateLimit — السلوك بدون Redis (dev mode)', () => {
    beforeEach(() => {
      // محاكاة عدم وجود env vars
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
    })

    it('يجب أن يُرجّع success=true بدون Redis (dev mode)', async () => {
      const request = createMockRequest({ 'x-forwarded-for': '1.2.3.4' })
      const result = await rateLimit(request as any, { limit: 3, window: '15m' })

      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
      expect(result.remaining).toBe(3)
    })

    it('يجب أن يُرجّع قيمة reset مستقبلية', async () => {
      const request = createMockRequest()
      const before = Date.now()
      const result = await rateLimit(request as any, { limit: 3, window: '15m' })
      const after = Date.now()

      expect(result.reset).toBeGreaterThan(before)
      expect(result.reset).toBeLessThanOrEqual(after + 910000) // ~15 min
    })
  })

  describe('RATE_LIMITS — الإعدادات المسبقة', () => {
    it('adminLogin: 3 محاولات / 15 دقيقة', () => {
      expect(RATE_LIMITS.adminLogin.limit).toBe(3)
      expect(RATE_LIMITS.adminLogin.window).toBe('15m')
      expect(RATE_LIMITS.adminLogin.identifier).toBe('admin-login')
    })

    it('bookDownload: 10 محاولات / ساعة', () => {
      expect(RATE_LIMITS.bookDownload.limit).toBe(10)
      expect(RATE_LIMITS.bookDownload.window).toBe('1h')
    })

    it('reviewSubmit: 5 محاولات / ساعة', () => {
      expect(RATE_LIMITS.reviewSubmit.limit).toBe(5)
      expect(RATE_LIMITS.reviewSubmit.window).toBe('1h')
    })

    it('search: 60 محاولة / دقيقة', () => {
      expect(RATE_LIMITS.search.limit).toBe(60)
      expect(RATE_LIMITS.search.window).toBe('1m')
    })

    it('adminActions: 100 محاولة / ساعة', () => {
      expect(RATE_LIMITS.adminActions.limit).toBe(100)
      expect(RATE_LIMITS.adminActions.window).toBe('1h')
    })

    it('كل الحدود لها identifier فريد', () => {
      const identifiers = Object.values(RATE_LIMITS).map(l => l.identifier)
      const unique = new Set(identifiers)
      expect(unique.size).toBe(identifiers.length)
    })
  })
})
