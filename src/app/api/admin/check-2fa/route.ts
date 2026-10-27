/**
 * POST /api/admin/check-2fa — Sprint 1 Day 2
 *
 * يتحقق من البريد + كلمة المرور، ويُحدد هل 2FA مطلوب.
 * لا يُنشئ جلسة — فقط يُرجع حالة للمساعدة في نموذج خطوتين.
 *
 * Rate Limiting: 3 محاولات / 15 دقيقة (نفس /admin/login)
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // 🔒 Rate Limiting (3 محاولات / 15 دقيقة)
  const rlResult = await rateLimit(request, RATE_LIMITS.adminLogin)
  if (!rlResult.success) {
    return NextResponse.json(
      {
        locked: true,
        lockoutMinutes: 15,
        message: 'تم تجاوز عدد المحاولات المسموحة',
      },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { email, password } = body as { email: string; password: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
  }

  // جلب المستخدم
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      twoFactorEnabled: true,
      userRoles: { include: { role: true } },
    },
  })

  // لو المستخدم غير موجود → أرجع خطأ عام (لا تكشف أن الإيميل غير موجود)
  if (!user || !user.passwordHash) {
    // سجّل المحاولة الفاشلة
    await logAction({
      userId: null,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: email,
      severity: 'warning',
      changes: { reason: 'user_not_found' },
    })
    return NextResponse.json({ requiresTwoFactor: false, error: 'بيانات غير صحيحة' })
  }

  // التحقق من كلمة المرور
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    await logAction({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      severity: 'warning',
      changes: { reason: 'invalid_password' },
    })
    return NextResponse.json({ requiresTwoFactor: false, error: 'بيانات غير صحيحة' })
  }

  // كلمة المرور صحيحة! تحقق هل 2FA مطلوب؟
  const hasAdminRole = user.userRoles.some(
    (ur) => ['admin', 'librarian', 'assistant'].includes(ur.role.name)
  )

  if (hasAdminRole && user.twoFactorEnabled) {
    // 2FA مطلوب
    return NextResponse.json({ requiresTwoFactor: true })
  }

  if (hasAdminRole && !user.twoFactorEnabled) {
    // أدمن لم يُفعّل 2FA — يجب أن يُفعّله
    return NextResponse.json({
      requiresTwoFactor: false,
      needs2FASetup: true,
      message: 'يجب تفعيل 2FA قبل الدخول',
    })
  }

  // مستخدم عادي (reader) — لا 2FA مطلوب
  return NextResponse.json({ requiresTwoFactor: false })
}
