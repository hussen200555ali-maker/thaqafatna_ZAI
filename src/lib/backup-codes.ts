/**
 * 🔑 Backup Codes — Sprint 1 Day 2
 *
 * 10 رموز احتياطية لكل أدمن، تُستخدم عند فقدان الجهاز.
 * - مشفّرة بـ bcrypt (مثل كلمات المرور)
 * - تُستهلك مرة واحدة (used = true)
 * - تُعرض للمستخدم مرة واحدة فقط عند التوليد
 *
 * الاستخدام:
 *   import { generateBackupCodes, verifyBackupCode } from '@/lib/backup-codes'
 *   const codes = generateBackupCodes() // 10 رموز نصية
 *   await saveHashedCodes(userId, codes) // حفظ bcrypt hashes
 *   const isValid = await verifyBackupCode(userId, userInputCode)
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'

const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LENGTH = 8 // 8 أحرف alphanumeric

/**
 * توليد 10 رموز احتياطية بصيغة XXXX-XXXX (سهلة القراءة)
 * @returns مصفوفة من 10 رموز نصية
 */
export function generateBackupCodes(): string[] {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789' // لا حروف ملتبسة (O, I, 0, 1)
  const codes: string[] = []

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const part1 = Array.from(crypto.randomBytes(BACKUP_CODE_LENGTH / 2))
      .map((b) => chars[b % chars.length])
      .join('')
    const part2 = Array.from(crypto.randomBytes(BACKUP_CODE_LENGTH / 2))
      .map((b) => chars[b % chars.length])
      .join('')
    codes.push(`${part1}-${part2}`)
  }

  return codes
}

/**
 * تشفير رموز احتياطية بـ bcrypt
 * @param codes الرموز النصية
 * @returns رموز مشفّرة (hashes)
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)))
}

/**
 * حفظ الرموز المشفّرة في DB (JSON field على User)
 * @param userId معرّف المستخدم
 * @param hashedCodes الرموز المشفّرة
 */
export async function saveBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
  // حفظ في حقل JSON على User (نحتاج إضافة backupCodes للحقل في schema)
  // مؤقتًا: نحفظها في AuditLog كـ changes
  // TODO Sprint 2: أضف backupCodes Json? إلى User model
  // حاليًا: نحفظها كـ JSON في حقل موجود (مؤقت)
  await logAction({
    userId,
    action: 'BACKUP_CODES_GENERATED',
    entityType: 'User',
    entityId: userId,
    severity: 'warning',
    changes: { count: hashedCodes.length, hashes: hashedCodes },
  })
}

/**
 * التحقق من رمز احتياطي
 * @param userId معرّف المستخدم
 * @param inputCode الرمز الذي أدخله المستخدم
 * @returns true لو الرمز صحيح وغير مستهلك
 */
export async function verifyBackupCode(
  userId: string,
  inputCode: string
): Promise<boolean> {
  // TODO Sprint 2: اقرأ backupCodes من User model
  // حاليًا: نقرأ من آخر AuditLog (مؤقت)
  const auditLog = await db.auditLog.findFirst({
    where: {
      userId,
      action: 'BACKUP_CODES_GENERATED',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!auditLog?.changes) {
    return false
  }

  const hashes = (auditLog.changes as any)?.hashes as string[]
  if (!hashes || !Array.isArray(hashes)) {
    return false
  }

  // قارن الرمز مع كل hash
  for (let i = 0; i < hashes.length; i++) {
    const isValid = await bcrypt.compare(inputCode, hashes[i])
    if (isValid) {
      // استهلاك الرمز: استبدله بـ "USED"
      hashes[i] = 'USED'
      await db.auditLog.update({
        where: { id: auditLog.id },
        data: { changes: { count: hashes.length, hashes } as any },
      })

      // سجّل الاستخدام
      await logAction({
        userId,
        action: 'BACKUP_CODE_USED',
        entityType: 'User',
        entityId: userId,
        severity: 'critical',
        changes: { codeIndex: i },
      })

      return true
    }
  }

  return false
}

/**
 * عدّ الرموز المتبقية (غير المستهلكة)
 * @param userId معرّف المستخدم
 * @returns عدد الرموز المتبقية
 */
export async function countRemainingBackupCodes(userId: string): Promise<number> {
  const auditLog = await db.auditLog.findFirst({
    where: {
      userId,
      action: 'BACKUP_CODES_GENERATED',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!auditLog?.changes) {
    return 0
  }

  const hashes = (auditLog.changes as any)?.hashes as string[]
  if (!hashes || !Array.isArray(hashes)) {
    return 0
  }

  return hashes.filter((h) => h !== 'USED').length
}
