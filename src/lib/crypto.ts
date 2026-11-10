/**
 * 🔐 تشفير AES-256-GCM للأسرار الحساسة (مثل TOTP secrets)
 *
 * لماذا التشفير على مستوى التطبيق؟
 * - سر TOTP يُستخدم لتوليد رموز 2FA — أي من يملكه يستطيع تجاوز 2FA نهائيًا.
 * - كلمات المرور مُشفّرة بـ bcrypt (آمنة حتى لو سُرّقت DB).
 * - لكن سر TOTP يحتاج أن يكون قابلًا للاسترجاع (لتوليد/التحقق من الرموز).
 * - لذلك نُشفّره بـ AES-256-GCM بمفتاح من متغير بيئة (TOTP_ENCRYPTION_KEY).
 * - عند تسريب DB: المهاجم يرى الـ ciphertext فقط، ويحتاج TOTP_ENCRYPTION_KEY من env.
 *
 * المتطلبات:
 * - TOTP_ENCRYPTION_KEY: مفتاح بصيغة hex بطول 64 حرف (32 bytes)
 * - يُولّد مرة واحدة: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * الاستخدام:
 *   import { encryptSecret, decryptSecret } from '@/lib/crypto';
 *
 *   // عند تفعيل 2FA:
 *   const encrypted = encryptSecret(totpSecret);
 *   await db.user.update({ where: { id }, data: { twoFactorSecret: encrypted } });
 *
 *   // عند التحقق من الرمز:
 *   const user = await db.user.findUnique({ where: { id } });
 *   const totpSecret = decryptSecret(user.twoFactorSecret!);
 *   const isValid = speakeasy.totp.verify({ secret: totpSecret, token: userInput });
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM standard
const KEY_LENGTH = 32 // 256 bits

/**
 * الحصول على مفتاح التشفير من متغير البيئة
 * @throws لو لم يكن موجودًا أو كان قصيرًا
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOTP_ENCRYPTION_KEY

  if (!keyHex) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY is not set. Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
      'Then add it to .env and Vercel env vars.'
    )
  }

  if (keyHex.length !== 64 || !/^[0-9a-f]+$/i.test(keyHex)) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      `Got ${keyHex.length} characters.`
    )
  }

  return Buffer.from(keyHex, 'hex')
}

/**
 * تشفير نص بـ AES-256-GCM
 * @param plain النص المراد تشفيره (سر TOTP)
 * @returns نص مشفّر بصيغة "iv:authTag:ciphertext" (hex)
 */
export function encryptSecret(plain: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // الصيغة: iv (24 hex) : authTag (32 hex) : ciphertext (variable hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * فك تشفير نص مشفّر بـ AES-256-GCM
 * @param encrypted النص المشفّر بصيغة "iv:authTag:ciphertext"
 * @returns النص الأصلي
 * @throws لو فشل فك التشفير (مفتاح خاطئ أو بيانات تالفة)
 */
export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey()

  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected "iv:authTag:ciphertext".')
  }

  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * توليد مفتاح تشفير جديد (لاستخدامه في الإعداد الأولي)
 * يُستخدم فقط في الـ CLI، ليس في الـ production code
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * التحقق من أن مفتاح التشفير مُعدّ بشكل صحيح
 * يُستخدم عند بدء التطبيق للتأكد من عدم وجود أخطاء صامتة
 */
export function isEncryptionKeySet(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}

/**
 * تدوير مفتاح التشفير (Key Rotation)
 * يُستخدم دوريًا (مرة كل سنة) لتعزيز الأمان
 * @param oldEncrypted البيانات المشفّرة بالمفتاح القديم
 * @param newKey المفتاح الجديد (hex)
 * @returns البيانات المشفّرة بالمفتاح الجديد
 */
export function rotateEncryptionKey(oldEncrypted: string, newKeyHex: string): string {
  // 1. فك التشفير بالمفتاح القديم
  const plain = decryptSecret(oldEncrypted)

  // 2. التشفير بالمفتاح الجديد (مباشرة بدون المرور بـ env)
  const newKey = Buffer.from(newKeyHex, 'hex')
  if (newKey.length !== KEY_LENGTH) {
    throw new Error('New key must be 32 bytes (64 hex characters).')
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, newKey, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}
