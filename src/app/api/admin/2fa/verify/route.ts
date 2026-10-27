/**
 * POST /api/admin/2fa/verify
 *
 * يتحقق من رمز TOTP الذي أدخله المستخدم.
 * يفك تشفير السر المخزّن بـ AES-256-GCM قبل التحقق.
 *
 * ⚠️ SPRINT 1 STUB: هذا ملف هيكلي لإثبات أن crypto.ts موصول فعليًا.
 */

import { NextRequest, NextResponse } from 'next/server'
import { decryptSecret } from '@/lib/crypto'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { token } = body as { token: string }

  if (!token || token.length !== 6) {
    return NextResponse.json({ error: 'الرمز يجب أن يكون 6 أرقام' }, { status: 400 })
  }

  // 1. جلب المستخدم مع السر المُشفّر
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ error: 'لم يُفعّل 2FA بعد. شغّله من /setup أولًا' }, { status: 400 })
  }

  // 2. 🔐 فك تشفير السر (هذا هو الربط الفعلي بين crypto.ts و 2FA)
  const totpSecret = decryptSecret(user.twoFactorSecret)

  // 3. التحقق من الرمز
  // TODO Sprint 1: استخدم speakeasy.totp.verify({ secret: totpSecret, token, encoding: 'base32' })
  const isValid = verifyTOTP(totpSecret, token)

  if (!isValid) {
    // TODO Sprint 1: سجّل المحاولة الفاشلة في AuditLog (severity: critical)
    return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 400 })
  }

  // 4. تفعيل 2FA نهائيًا
  await db.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  })

  // TODO Sprint 1: سجّل التفعيل في AuditLog (severity: warning)
  return NextResponse.json({ success: true, message: 'تم تفعيل 2FA بنجاح' })
}

/**
 * تحقق TOTP مبسّط (Sprint 1 سيستخدم مكتبة speakeasy)
 * @param secret السر (base32) بعد فك التشفير
 * @param token الرمز الذي أدخله المستخدم
 */
function verifyTOTP(secret: string, token: string): boolean {
  // TODO Sprint 1: استبدل بـ speakeasy.totp.verify
  // هذا stub بسيط للتأكد من الربط فقط
  return token.length === 6 && /^\d{6}$/.test(token)
}
