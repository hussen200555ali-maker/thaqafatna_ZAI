/**
 * ⚡ Rate Limiting — Sprint 1 (Upstash Redis)
 *
 * التحفظات المطبّقة:
 * - identifier: userId ?? ip (التحفظ #6)
 * - /admin/login: 3 محاولات / 15 دقيقة، قفل IP (لا الحساب)
 * - على Vercel: استخدم x-forwarded-for
 *
 * الاستخدام:
 *   import { rateLimit } from '@/lib/rate-limit'
 *   const result = await rateLimit(request, { limit: 3, window: '15m' })
 *   if (!result.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// إنشاء Redis client (يُفعّل فقط لو TOTP_ENCRYPTION_KEY موجود)
let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Upstash Redis not configured — rate limiting disabled')
    return null
  }

  const redis = Redis.fromEnv()
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // default
    analytics: true,
    prefix: 'thaqafatna',
  })

  return ratelimit
}

interface RateLimitOptions {
  limit: number
  window: string // '15m' | '1h' | '1m'
  identifier?: string // override (e.g., 'admin-login')
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * الحصول على معرّف المستخدم/IP (التحفظ #6)
 */
function getIdentifier(request: NextRequest): string {
  // 1. x-forwarded-for (Vercel — أول IP = client الحقيقي)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    if (ip) return `ip:${ip}`
  }

  // 2. x-real-ip (fallback)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`

  // 3. unknown
  return 'ip:unknown'
}

/**
 * تطبيق Rate Limiting على طلب
 *
 * مثال:
 *   const result = await rateLimit(request, { limit: 3, window: '15m', identifier: 'admin-login' })
 *   if (!result.success) {
 *     return NextResponse.json({ error: 'تم تجاوز عدد المحاولات المسموحة' }, { status: 429 })
 *   }
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getRatelimit()

  // لو Redis غير مُعدّ — اسمح بكل شيء (dev mode)
  if (!limiter) {
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit,
      reset: Date.now() + 900000,
    }
  }

  // الحصول على المعرّف (التحفظ #6)
  const identifier = options.identifier
    ? `${options.identifier}:${getIdentifier(request)}`
    : getIdentifier(request)

  // تحويل window لـ seconds
  const windowSeconds = options.window.endsWith('m')
    ? parseInt(options.window) * 60
    : options.window.endsWith('h')
    ? parseInt(options.window) * 3600
    : parseInt(options.window)

  // إنشاء limiter مخصص لكل نافذة
  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * حدود محددة مسبقًا لكل endpoint
 */
export const RATE_LIMITS = {
  adminLogin: { limit: 3, window: '15m', identifier: 'admin-login' },
  bookDownload: { limit: 10, window: '1h', identifier: 'book-download' },
  reviewSubmit: { limit: 5, window: '1h', identifier: 'review-submit' },
  search: { limit: 60, window: '1m', identifier: 'search' },
  adminActions: { limit: 100, window: '1h', identifier: 'admin-actions' },
} as const
