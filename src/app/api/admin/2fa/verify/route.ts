/**
 * POST /api/admin/2fa/verify — Sprint 1 (speakeasy حقيقي)
 *
 * يتحقق من رمز TOTP الذي أدخله المستخدم.
 * يفك تشفير السر المخزّن بـ AES-256-GCM قبل التحقق.
 *
 * التحفظات المطبّقة:
 * - runtime = 'nodejs'
 * - speakeasy.totp.verify مع window: 1 (30 ثانية انحراف)
 * - decryptSecret من src/lib/crypto.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import { decryptSecret } from '@/lib/crypto'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export const runtime = 'nodejs' // إلزامي

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { token } = body as { token: string }

  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return NextResponse.json(
      { error: 'الرمز يجب أن يكون 6 أرقام' },
      { status: 400 }
    )
  }

  // 1. جلب المستخدم مع السر المُشفّر
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: 'لم يُفعّل 2FA بعد. شغّله من /setup أولًا' },
      { status: 400 }
    )
  }

  // 2. 🔐 فك تشفير السر
  const totpSecret = decryptSecret(user.twoFactorSecret)

  // 3. التحقق من الرمز بـ speakeasy الحقيقي (window: 1)
  const isValid = speakeasy.totp.verify({
    secret: totpSecret,
    encoding: 'base32',
    token,
    window: 1, // 30 ثانية انحراف مسموح
  })

  if (!isValid) {
    // تسجيل المحاولة الفاشلة (severity: critical)
    await logAction({
      userId,
      action: '2FA_VERIFY_FAILED',
      entityType: 'User',
      entityId: userId,
      severity: 'critical',
      changes: { token: '***' },
    })

    return NextResponse.json(
      { error: 'رمز غير صحيح' },
      { status: 400 }
    )
  }

  // 4. تفعيل 2FA نهائيًا
  await db.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  })

  // 5. تسجيل التفعيل
  await logAction({
    userId,
    action: '2FA_ENABLED',
    entityType: 'User',
    entityId: userId,
    severity: 'warning',
    changes: { twoFactorEnabled: true },
  })

  return NextResponse.json({
    success: true,
    message: 'تم تفعيل 2FA بنجاح',
  })
}

/**
 * اختبار وحدة (يُشغّل في Day 2):
 *
 * import speakeasy from 'speakeasy'
 * const secret = speakeasy.generateSecret({ length: 20 })
 * const token = speakeasy.totp({ secret: secret.base32, encoding: 'base32' })
 * const isValid = speakeasy.totp.verify({
 *   secret: secret.base32,
 *   encoding: 'base32',
 *   token,
 *   window: 1,
 * })
 * expect(isValid).toBe(true)
 */
