/**
 * POST /api/admin/2fa/setup
 *
 * يُنشئ سر TOTP جديد ويُشفّره بـ AES-256-GCM قبل حفظه في DB.
 * يُرجع QR code URI للمستخدم لمسحه في Google Authenticator.
 *
 * ⚠️ SPRINT 1 STUB: هذا ملف هيكلي لإثبات أن crypto.ts موصول فعليًا.
 *    سيُكمل في Sprint 1 مع:
 *    - NextAuth session check
 *    - Rate limiting
 *    - Audit logging
 *    - QR code image generation
 *
 * الاستخدام الحالي (إثبات الربط):
 *   import { encryptSecret, decryptSecret } from '@/lib/crypto'
 *   const encrypted = encryptSecret(totpSecret)
 *   await db.user.update({ where: { id }, data: { twoFactorSecret: encrypted } })
 *   // لاحقًا، عند التحقق:
 *   const decrypted = decryptSecret(user.twoFactorSecret!)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { encryptSecret } from '@/lib/crypto'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  // TODO Sprint 1: استبدل بـ getServerSession(authOptions)
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. توليد سر TOTP عشوائي (20 bytes = 32 base32 chars)
  const totpSecret = crypto.randomBytes(20).toString('base32')

  // 2. 🔐 تشفير السر بـ AES-256-GCM قبل الحفظ
  //    هذا هو الربط الفعلي بين crypto.ts و 2FA
  const encryptedSecret = encryptSecret(totpSecret)

  // 3. حفظ السر المُشفّر في DB (وليس plaintext!)
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret, // مشفّر ✅
      twoFactorEnabled: false, // لن يُفعّل حتى يتحقق من رمز صحيح
    },
  })

  // 4. توليد QR URI للمستخدم
  //    صيغة otpauth:// التي يدعمها Google Authenticator
  const issuer = 'ثقافتنا'
  const label = encodeURIComponent(`${issuer}:${userId}`)
  const otpauthUri = `otpauth://totp/${label}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

  // TODO Sprint 1: توليد QR code image وإرجاعها كـ data URL
  // const qrImage = await QRCode.toDataURL(otpauthUri)

  return NextResponse.json({
    otpauthUri,
    secret: totpSecret, // يُرجع للعرض مرة واحدة فقط (للإدخال اليدوي)
    message: 'امسح QR code في Google Authenticator، ثم تحقق من الرمز في /verify',
  })
}
