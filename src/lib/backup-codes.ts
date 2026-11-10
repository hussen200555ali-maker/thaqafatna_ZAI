/**
 * 🔑 Backup Codes — Sprint 5 A.2
 *
 * 10 رموز احتياطية لكل أدمن، تُستخدم عند فقدان الجهاز.
 * - مشفّرة بـ bcrypt (مثل كلمات المرور)
 * - تُستهلك مرة واحدة (usedAt = timestamp عند الاستخدام)
 * - تُعرض للمستخدم مرة واحدة فقط عند التوليد
 * - تُخزّن في جدول BackupCode (وليس AuditLog كما في النسخة السابقة)
 *
 * الاستخدام:
 *   import { generateBackupCodes, saveBackupCodes, verifyBackupCode, countRemainingBackupCodes } from '@/lib/backup-codes'
 *   const codes = generateBackupCodes()              // 10 رموز نصية
 *   await saveBackupCodes(userId, codes)             // حفظ bcrypt hashes في DB
 *   const isValid = await verifyBackupCode(userId, userInputCode)  // تحقق + استهلاك
 *   const remaining = await countRemainingBackupCodes(userId)     // عدّ المتبقية
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'

const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LENGTH = 8 // 8 أحرف alphanumeric

/**
 * توليد 10 رموز احتياطية بصيغة XXXX-XXXX (سهلة القراءة)
 *
 * يستخدم chars:
 * - لا O, I, 0, 1 (حروف ملتبسة)
 * - أحرف كبيرة + أرقام فقط
 *
 * @returns مصفوفة من 10 رموز نصية فريدة
 */
export function generateBackupCodes(): string[] {
  // chars مسموحة: A-Z بدون I,O + 2-9 (لا حروف ملتبسة)
  // ABCDEFGH JKLMN PQRSTUVWXYZ 23456789
  //         ^^^^ ^^^^^ ^^^^^^^
  //         (لا I) (لا O)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 31 chars (بدون 0,1,I,O)
  const codes: string[] = []
  const seen = new Set<string>()

  while (codes.length < BACKUP_CODE_COUNT) {
    const part1 = Array.from(crypto.randomBytes(BACKUP_CODE_LENGTH / 2))
      .map((b) => chars[b % chars.length])
      .join('')
    const part2 = Array.from(crypto.randomBytes(BACKUP_CODE_LENGTH / 2))
      .map((b) => chars[b % chars.length])
      .join('')
    const code = `${part1}-${part2}`

    // تجنّب التكرار (نادر جدًا لكن ممكن)
    if (!seen.has(code)) {
      seen.add(code)
      codes.push(code)
    }
  }

  return codes
}

/**
 * تشفير رموز احتياطية بـ bcrypt
 *
 * @param codes الرموز النصية (10 رموز)
 * @returns رموز مشفّرة (hashes) — آمنة للتخزين في DB
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const saltRounds = 12 // نفس قوة كلمات المرور
  return Promise.all(codes.map((code) => bcrypt.hash(code, saltRounds)))
}

/**
 * حفظ الرموز المُشفّرة في DB (جدول BackupCode)
 *
 * - يحذف الرموز القديمة أولًا (لا يمكن الاحتفاظ بأكثر من 10)
 * - يُنشئ 10 سجلات جديدة (codeHash لكل واحد)
 * - يُسجّل الحدث في AuditLog
 *
 * @param userId معرّف المستخدم
 * @param codes الرموز النصية (سيتم تشفيرها قبل الحفظ)
 * @returns الرموز النصية (لعرضها مرة واحدة على المستخدم)
 */
export async function saveBackupCodes(
  userId: string,
  codes: string[]
): Promise<string[]> {
  // 1. حذف الرموز القديمة (إن وُجدت)
  await db.backupCode.deleteMany({
    where: { userId },
  })

  // 2. تشفير الرموز
  const hashes = await hashBackupCodes(codes)

  // 3. حفظ في DB (10 سجلات)
  await db.backupCode.createMany({
    data: hashes.map((codeHash) => ({
      userId,
      codeHash,
    })),
  })

  // 4. تسجيل الحدث في AuditLog
  await logAction({
    userId,
    action: 'BACKUP_CODES_GENERATED',
    entityType: 'User',
    entityId: userId,
    severity: 'warning',
    changes: { count: codes.length },
  })

  return codes
}

/**
 * التحقق من رمز احتياطي
 *
 * - يبحث في كل رموز المستخدم غير المستهلكة
 * - يستخدم bcrypt.compare (constant-time)
 * - عند النجاح: يضع usedAt = now (يستهلك الرمز)
 * - يُسجّل الاستهلاك في AuditLog (severity: critical)
 *
 * @param userId معرّف المستخدم
 * @param inputCode الرمز الذي أدخله المستخدم
 * @returns true لو الرمز صحيح وغير مستهلك، false خلاف ذلك
 */
export async function verifyBackupCode(
  userId: string,
  inputCode: string
): Promise<boolean> {
  // جلب كل الرموز غير المستهلكة للمستخدم
  const unusedCodes = await db.backupCode.findMany({
    where: {
      userId,
      usedAt: null,
    },
    select: {
      id: true,
      codeHash: true,
    },
  })

  if (unusedCodes.length === 0) {
    return false
  }

  // قارن الرمز مع كل hash (constant-time comparison)
  for (const backupCode of unusedCodes) {
    const isValid = await bcrypt.compare(inputCode, backupCode.codeHash)
    if (isValid) {
      // استهلاك الرمز: ضع usedAt = now
      await db.backupCode.update({
        where: { id: backupCode.id },
        data: { usedAt: new Date() },
      })

      // سجّل الاستهلاك (critical لأنه تجاوز 2FA)
      await logAction({
        userId,
        action: 'BACKUP_CODE_USED',
        entityType: 'User',
        entityId: userId,
        severity: 'critical',
        changes: { backupCodeId: backupCode.id },
      })

      return true
    }
  }

  return false
}

/**
 * عدّ الرموز المتبقية (غير المستهلكة)
 *
 * @param userId معرّف المستخدم
 * @returns عدد الرموز المتبقية (0-10)
 */
export async function countRemainingBackupCodes(userId: string): Promise<number> {
  return db.backupCode.count({
    where: {
      userId,
      usedAt: null,
    },
  })
}

/**
 * توليد + حفظ الرموز في خطوة واحدة
 *
 * @param userId معرّف المستخدم
 * @returns الرموز النصية (لعرضها مرة واحدة)
 */
export async function generateAndSaveBackupCodes(
  userId: string
): Promise<string[]> {
  const codes = generateBackupCodes()
  await saveBackupCodes(userId, codes)
  return codes
}
