/**
 * 🧪 اختبارات وحدة — crypto.ts
 *
 * يغطّي:
 * - roundtrip: encrypt → decrypt = original
 * - IV uniqueness: كل تشفير ينتج ciphertext مختلف حتى لنفس الإدخال
 * - tamper detection: تعديل ciphertext يسبب خطأ فك التشفير
 * - format validation: صيغة خاطئة تُسبب خطأ
 * - missing key: خطأ واضح لو TOTP_ENCRYPTION_KEY غير مُعدّ
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptSecret, decryptSecret, generateEncryptionKey, isEncryptionKeySet } from '@/lib/crypto'

// مفتاح اختبار ثابت (64 hex chars = 32 bytes)
const TEST_KEY = 'a'.repeat(64)

describe('crypto.ts — AES-256-GCM encryption', () => {
  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY
  })

  describe('encryptSecret + decryptSecret roundtrip', () => {
    it('يجب أن يُرجّع النص الأصلي بعد encrypt → decrypt', () => {
      const original = 'JBSWY3DPEHPK3PXP' // TOTP secret مثال
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('يجب أن يعمل مع نصوص عربية', () => {
      const original = 'سر عربي سري جداً'
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('يجب أن يعمل مع نصوص طويلة', () => {
      const original = 'x'.repeat(1000)
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('يجب أن يعمل مع نص فارغ', () => {
      const original = ''
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('يجب أن يعمل مع رموز خاصة', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })
  })

  describe('IV uniqueness (كل تشفير مختلف)', () => {
    it('نفس النص يجب أن يُنتج ciphertexts مختلفة في كل مرة', () => {
      const plain = 'same-secret'

      const enc1 = encryptSecret(plain)
      const enc2 = encryptSecret(plain)
      const enc3 = encryptSecret(plain)

      expect(enc1).not.toBe(enc2)
      expect(enc2).not.toBe(enc3)
      expect(enc1).not.toBe(enc3)
    })

    it('كل ciphertext يجب أن يُفك تشفيره بنجاح', () => {
      const plain = 'my-totp-secret'

      const enc1 = encryptSecret(plain)
      const enc2 = encryptSecret(plain)

      expect(decryptSecret(enc1)).toBe(plain)
      expect(decryptSecret(enc2)).toBe(plain)
    })
  })

  describe('Tamper detection (كشف التلاعب)', () => {
    it('تعديل ciphertext يجب أن يُسبب خطأ', () => {
      const encrypted = encryptSecret('original-secret')

      const parts = encrypted.split(':')
      const tamperedCiphertext = tamperedCharAt(parts[2], 0)
      const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`

      expect(() => decryptSecret(tampered)).toThrow()
    })

    it('تعديل authTag يجب أن يُسبب خطأ', () => {
      const encrypted = encryptSecret('original-secret')

      const parts = encrypted.split(':')
      const tamperedTag = tamperedCharAt(parts[1], 0)
      const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`

      expect(() => decryptSecret(tampered)).toThrow()
    })

    it('تعديل IV يجب أن يُسبب خطأ', () => {
      const encrypted = encryptSecret('original-secret')

      const parts = encrypted.split(':')
      const tamperedIv = tamperedCharAt(parts[0], 0)
      const tampered = `${tamperedIv}:${parts[1]}:${parts[2]}`

      expect(() => decryptSecret(tampered)).toThrow()
    })
  })

  describe('Format validation', () => {
    it('صيغة خاطئة (بدون :) يجب أن تُسبب خطأ', () => {
      const invalid = 'justastringwithnocolon'
      expect(() => decryptSecret(invalid)).toThrow('Invalid encrypted format')
    })

    it('صيغة بجزئين فقط يجب أن تُسبب خطأ', () => {
      const invalid = 'part1:part2'
      expect(() => decryptSecret(invalid)).toThrow('Invalid encrypted format')
    })

    it('صيغة بأربعة أجزاء يجب أن تُسبب خطأ', () => {
      const invalid = 'a:b:c:d'
      expect(() => decryptSecret(invalid)).toThrow('Invalid encrypted format')
    })
  })

  describe('Missing key validation', () => {
    it('بدون TOTP_ENCRYPTION_KEY يجب أن يُسبب خطأ واضح', () => {
      delete process.env.TOTP_ENCRYPTION_KEY

      expect(() => encryptSecret('test')).toThrow('TOTP_ENCRYPTION_KEY is not set')
      expect(() => decryptSecret('a:b:c')).toThrow('TOTP_ENCRYPTION_KEY is not set')
    })

    it('مفتاح قصير (أقل من 64 حرف) يجب أن يُسبب خطأ', () => {
      process.env.TOTP_ENCRYPTION_KEY = 'short'

      expect(() => encryptSecret('test')).toThrow(/64 hex characters/)
    })

    it('مفتاح بصيغة غير hex يجب أن يُسبب خطأ', () => {
      process.env.TOTP_ENCRYPTION_KEY = 'g'.repeat(64) // g ليس hex

      expect(() => encryptSecret('test')).toThrow(/64 hex characters/)
    })
  })

  describe('Key utilities', () => {
    it('generateEncryptionKey يجب أن يُنتج مفتاح 64 hex chars', () => {
      const key = generateEncryptionKey()
      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[0-9a-f]+$/i)
    })

    it('generateEncryptionKey يجب أن يُنتج مفاتيح مختلفة', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()
      expect(key1).not.toBe(key2)
    })

    it('isEncryptionKeySet يجب أن يُرجّع true عند وجود مفتاح صحيح', () => {
      process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
      expect(isEncryptionKeySet()).toBe(true)
    })

    it('isEncryptionKeySet يجب أن يُرجّع false بدون مفتاح', () => {
      delete process.env.TOTP_ENCRYPTION_KEY
      expect(isEncryptionKeySet()).toBe(false)
    })

    it('isEncryptionKeySet يجب أن يُرجّع false لمفتاح خاطئ', () => {
      process.env.TOTP_ENCRYPTION_KEY = 'invalid'
      expect(isEncryptionKeySet()).toBe(false)
    })
  })
})

// Helper: تغيير أول حرف في نص hex
function tamperedCharAt(hex: string, index: number): string {
  const chars = hex.split('')
  const original = chars[index]
  const replacement = original === '0' ? '1' : '0'
  chars[index] = replacement
  return chars.join('')
}
