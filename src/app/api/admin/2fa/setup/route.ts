/**
 * POST /api/admin/2fa/setup — Sprint 1 (speakeasy حقيقي)
 *
 * يُنشئ سر TOTP جديد ويُشفّره بـ AES-256-GCM قبل حفظه في DB.
 * يُرجع QR code URI للمستخدم لمسحه في Google Authenticator.
 *
 * التحفظات المطبّقة:
 * - runtime = 'nodejs' (Prisma يحتاج Node.js)
 * - speakeasy حقيقي (لا stub)
 * - encryptSecret من src/lib/crypto.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import { encryptSecret } from '@/lib/crypto'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export const runtime = 'nodejs' // إلزامي

export async function POST(request: NextRequest) {
  // التحقق من الجلسة
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // 1. توليد سر TOTP (20 bytes = 32 base32 chars)
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `ثقافتنا:${userId}`,
    issuer: 'ثقافتنا',
  })

  // 2. 🔐 تشفير السر بـ AES-256-GCM
  const encryptedSecret = encryptSecret(secret.base32)

  // 3. حفظ السر المُشفّر (لا يُفعّل حتى يتحقق من رمز صحيح)
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: false,
    },
  })

  // 4. توليد QR URI
  const otpauthUri = secret.otpauth_url

  // 5. تسجيل العملية في AuditLog
  await logAction({
    userId,
    action: '2FA_SETUP',
    entityType: 'User',
    entityId: userId,
    severity: 'warning',
    changes: { twoFactorEnabled: false, setup: true },
  })

  return NextResponse.json({
    otpauthUri,
    secret: secret.base32, // يُرجع للعرض مرة واحدة فقط
    message: 'امسح QR code في Google Authenticator، ثم تحقق من الرمز في /verify',
  })
}
