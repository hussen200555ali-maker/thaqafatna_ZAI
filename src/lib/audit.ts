/**
 * 🔍 Audit Log Utility — Sprint 1
 *
 * التحفظات المطبّقة:
 * - async via waitUntil (لا يحجب الـ request)
 * - retention: 90 يومًا للـ info، سنة للـ critical
 * - severity as enum (منع القيم الشاذة)
 *
 * الاستخدام:
 *   import { logAction } from '@/lib/audit'
 *   await logAction({ userId, action: 'CREATE', entityType: 'Book', entityId: '1', severity: 'info' })
 */

import { db } from '@/lib/db'
import type { AuditSeverity } from '@prisma/client'

interface LogParams {
  userId: string | null
  action: string // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | DOWNLOAD | ROLE_CHANGE | PUBLISH
  entityType: string // Book | User | Category | Chapter | Role | Review | Tag | ContactMessage
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  severity?: AuditSeverity // default: info
}

/**
 * تسجيل عملية في AuditLog (غير متزامن — لا يحجب الـ request)
 *
 * يستخدم waitUntil من Vercel لتنفيذ العملية في الخلفية.
 * لو فشل التسجيل، لا يؤثر على تجربة المستخدم.
 */
export async function logAction(params: LogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        changes: params.changes ? (params.changes as any) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        severity: params.severity || 'info',
      },
    })
  } catch (error) {
    // silent fail — audit logs shouldn't break UX
    console.error('Audit log failed:', error)
  }
}

/**
 * تنظيف السجلات القديمة (يُشغّل يوميًا عبر Vercel Cron)
 * - info: 90 يومًا
 * - warning: 180 يومًا
 * - critical: سنة كاملة
 */
export async function cleanupOldAuditLogs(): Promise<void> {
  const now = new Date()

  // info: 90 يومًا
  const infoCutoff = new Date(now)
  infoCutoff.setDate(infoCutoff.getDate() - 90)

  // warning: 180 يومًا
  const warningCutoff = new Date(now)
  warningCutoff.setDate(warningCutoff.getDate() - 180)

  // critical: سنة كاملة
  const criticalCutoff = new Date(now)
  criticalCutoff.setFullYear(criticalCutoff.getFullYear() - 1)

  // حذف السجلات القديمة (الاحتفاظ بالـ critical أطول)
  await db.auditLog.deleteMany({
    where: {
      AND: [
        { severity: 'info' },
        { createdAt: { lt: infoCutoff } },
      ],
    },
  })

  await db.auditLog.deleteMany({
    where: {
      AND: [
        { severity: 'warning' },
        { createdAt: { lt: warningCutoff } },
      ],
    },
  })

  await db.auditLog.deleteMany({
    where: {
      AND: [
        { severity: 'critical' },
        { createdAt: { lt: criticalCutoff } },
      ],
    },
  })

  console.log('✅ Audit log cleanup completed')
}
