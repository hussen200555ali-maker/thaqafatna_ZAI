/**
 * POST /api/admin/2fa/backup-codes/generate
 *
 * يولّد 10 رموز احتياطية للمستخدم الحالي:
 * - يحذف الرموز القديمة (لا يمكن الاحتفاظ بأكثر من 10)
 * - يُنشئ 10 سجلات BackupCode مع bcrypt hashes
 * - يُسجّل الحدث في AuditLog (warning severity)
 * - يُرجّع الرموز النصية (لعرضها مرة واحدة فقط!)
 *
 * الأمان:
 * - يتطلب جلسة مسجّلة (admin/librarian/assistant)
 * - يستخدم auth() من NextAuth للتحقق
 * - لا يُرجّع hashes أبدًا — فقط الرموز النصية مرة واحدة
 *
 * Response:
 *   {
 *     success: true,
 *     codes: ["ABCD-EFGH", ...],  // 10 رموز
 *     count: 10,
 *     warning: "احفظ هذه الرموز في مكان آمن — لن تظهر مرة أخرى"
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateAndSaveBackupCodes, countRemainingBackupCodes } from '@/lib/backup-codes'
import { logAction } from '@/lib/audit'

export const runtime = 'nodejs' // bcrypt + Prisma يحتاجان Node.js

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

    // 2. التحقق من الدور (admin/librarian/assistant فقط)
    const role = session.user.role
    if (!['admin', 'librarian', 'assistant'].includes(role || '')) {
      return NextResponse.json(
        { error: 'يتطلب صلاحيات إدارية' },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // 3. توليد + حفظ الرموز
    const codes = await generateAndSaveBackupCodes(userId)

    // 4. عدّ الرموز المتبقية (للعرض في UI)
    const remaining = await countRemainingBackupCodes(userId)

    // 5. تسجيل الحدث (مرة أخرى بشكل صريح للتأكيد)
    await logAction({
      userId,
      action: 'BACKUP_CODES_GENERATED',
      entityType: 'User',
      entityId: userId,
      severity: 'warning',
      changes: { count: codes.length, remaining },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    })

    // 6. الرد (الرموز تُرجع مرة واحدة فقط!)
    return NextResponse.json({
      success: true,
      codes, // 10 رموز نصية بصيغة XXXX-XXXX
      count: codes.length,
      remaining,
      warning: 'احفظ هذه الرموز في مكان آمن — لن تظهر مرة أخرى. كل رمز يُستخدم مرة واحدة.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Generate backup codes error:', error)
    return NextResponse.json(
      {
        error: 'فشل توليد الرموز الاحتياطية',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/2fa/backup-codes/generate
 *
 * يُرجّع عدد الرموز المتبقية (دون كشف الرموز نفسها)
 */
export async function GET(request: NextRequest) {
  try {
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

    const remaining = await countRemainingBackupCodes(session.user.id)

    return NextResponse.json({
      remaining,
      total: 10,
      used: 10 - remaining,
    })
  } catch (error: any) {
    console.error('Get backup codes status error:', error)
    return NextResponse.json(
      { error: 'فشل جلب حالة الرموز' },
      { status: 500 }
    )
  }
}
