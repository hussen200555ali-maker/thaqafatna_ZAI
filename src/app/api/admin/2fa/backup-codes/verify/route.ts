/**
 * POST /api/admin/2fa/backup-codes/verify
 *
 * يتحقق من رمز احتياطي ويستهلكه (يضع usedAt):
 * - يبحث في كل رموز المستخدم غير المستهلكة
 * - يستخدم bcrypt.compare (constant-time)
 * - عند النجاح: يضع usedAt = now + يسجّل الحدث (critical severity)
 * - عند الفشل: لا يكشف أي معلومات (constant response)
 *
 * الأمان:
 * - يتطلب جلسة مسجّلة (admin/librarian/assistant)
 * - لا يكشف عدد الرموز المتبقية عند الفشل (anti-enumeration)
 *
 * Body:
 *   { "code": "ABCD-EFGH" }
 *
 * Response (نجاح):
 *   {
 *     success: true,
 *     remaining: 9,
 *     message: "تم استهلاك الرمز. يمكنك استخدامه مرة واحدة فقط."
 *   }
 *
 * Response (فشل):
 *   {
 *     success: false,
 *     error: "رمز غير صحيح أو مستهلك"
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyBackupCode, countRemainingBackupCodes } from '@/lib/backup-codes'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من الجلسة
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مسجّل الدخول' },
        { status: 401 }
      )
    }

    const role = session.user.role
    if (!['admin', 'librarian', 'assistant'].includes(role || '')) {
      return NextResponse.json(
        { error: 'يتطلب صلاحيات إدارية' },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // 2. استخراج الرمز من الـ body
    const body = await request.json()
    const code = body?.code?.trim()?.toUpperCase()

    if (!code) {
      return NextResponse.json(
        { error: 'الرمز مطلوب' },
        { status: 400 }
      )
    }

    // 3. التحقق من صيغة الرمز (XXXX-XXXX)
    // chars مسموحة: A-Z بدون I,O + 2-9 (لا حروف ملتبسة)
    if (!/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code)) {
      return NextResponse.json(
        { error: 'صيغة الرمز غير صحيحة (يجب أن تكون XXXX-XXXX)' },
        { status: 400 }
      )
    }

    // 4. التحقق من الرمز (يستهلكه عند النجاح)
    const isValid = await verifyBackupCode(userId, code)

    if (!isValid) {
      // لا نكشف ما إذا كان الرمز موجودًا أم لا (anti-enumeration)
      return NextResponse.json(
        { success: false, error: 'رمز غير صحيح أو مستهلك' },
        { status: 400 }
      )
    }

    // 5. نجاح — عدّ المتبقية
    const remaining = await countRemainingBackupCodes(userId)

    return NextResponse.json({
      success: true,
      remaining,
      message: 'تم استهلاك الرمز. يمكنك استخدامه مرة واحدة فقط.',
    })
  } catch (error: any) {
    console.error('Verify backup code error:', error)
    return NextResponse.json(
      { error: 'فشل التحقق من الرمز' },
      { status: 500 }
    )
  }
}
