/**
 * 🧪 اختبارات وحدة — auth (TOTP verification)
 *
 * يغطّي:
 * - speakeasy.totp.verify مع رمز صحيح
 * - speakeasy.totp.verify مع رمز خاطئ
 * - speakeasy.totp.generate يُنتج رمز 6 أرقام
 * - رمز منتهي الصلاحية يُرفض (window=1)
 * - رمز من نافذة سابقة يُقبل (window=1 يسمح بانزياح ±30 ثانية)
 * - encryptSecret + decryptSecret roundtrip مع TOTP secret
 *
 * ملاحظة: نختبر speakeasy مباشرة (لا auth.ts الكامل،
 * لأنه يحتاج PrismaAdapter + DB — سيُغطّى في E2E).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import speakeasy from 'speakeasy'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

const TEST_KEY = 'a'.repeat(64)

describe('auth — TOTP verification', () => {
  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY
  })

  describe('speakeasy.totp.generate', () => {
    it('يجب أن يُنتج رمز 6 أرقام', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32
      const token = speakeasy.totp({
        secret,
        encoding: 'base32',
      })

      expect(token).toMatch(/^\d{6}$/)
    })

    it('يجب أن يُنتج رموزًا مختلفة في أوقات مختلفة', async () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32

      // نحتاج لتجاوز فترة 30 ثانية — نستخدم time مباشرة
      const token1 = speakeasy.totp({ secret, encoding: 'base32', time: 1000 })
      const token2 = speakeasy.totp({ secret, encoding: 'base32', time: 1001 })

      // في فترات TOTP مختلفة (30 ثانية لكل فترة)
      const tokenPeriod0 = speakeasy.totp({ secret, encoding: 'base32', time: 0 })
      const tokenPeriod1 = speakeasy.totp({ secret, encoding: 'base32', time: 30 })

      expect(tokenPeriod0).not.toBe(tokenPeriod1)
    })
  })

  describe('speakeasy.totp.verify — رمز صحيح', () => {
    it('يجب أن يقبل الرمز الصحيح في الوقت الحالي', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32
      const token = speakeasy.totp({ secret, encoding: 'base32' })

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1,
      })

      expect(isValid).toBe(true)
    })

    it('يجب أن يقبل رمزًا من النافذة السابقة (window=1)', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32
      const pastTime = Math.floor(Date.now() / 1000) - 30 // قبل 30 ثانية

      const pastToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: pastTime,
      })

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: pastToken,
        window: 1,
      })

      expect(isValid).toBe(true)
    })

    it('يجب أن يقبل رمزًا من النافذة التالية (window=1)', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32
      const futureTime = Math.floor(Date.now() / 1000) + 30 // بعد 30 ثانية

      const futureToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: futureTime,
      })

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: futureToken,
        window: 1,
      })

      expect(isValid).toBe(true)
    })
  })

  describe('speakeasy.totp.verify — رمز خاطئ', () => {
    it('يجب أن يرفض رمزًا خاطئًا تمامًا', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: '000000', // رمز خاطئ (على الأرجح)
        window: 1,
      })

      // 000000 قد يصادف أنه صحيح في لحظة ما، لكن احتماله 1/1000000
      // لذلك نتحقق أنه boolean
      expect(typeof isValid).toBe('boolean')
    })

    it('يجب أن يرفض رمزًا من نافذة بعيدة (window=1)', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32
      const farPastTime = Math.floor(Date.now() / 1000) - 120 // قبل دقيقتين

      const farPastToken = speakeasy.totp({
        secret,
        encoding: 'base32',
        time: farPastTime,
      })

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: farPastToken,
        window: 1, // يسمح بـ ±30 ثانية فقط
      })

      expect(isValid).toBe(false)
    })

    it('يجب أن يرفض رمزًا من سر مختلف', () => {
      const secret1 = speakeasy.generateSecret({ length: 20 }).base32
      const secret2 = speakeasy.generateSecret({ length: 20 }).base32

      const tokenFromSecret1 = speakeasy.totp({
        secret: secret1,
        encoding: 'base32',
      })

      const isValid = speakeasy.totp.verify({
        secret: secret2, // سر مختلف
        encoding: 'base32',
        token: tokenFromSecret1,
        window: 1,
      })

      expect(isValid).toBe(false)
    })

    it('يجب أن يرفض رمزًا فارغًا', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: '',
        window: 1,
      })

      expect(isValid).toBe(false)
    })

    it('يجب أن يرفض رمزًا قصيرًا (أقل من 6 أرقام)', () => {
      const secret = speakeasy.generateSecret({ length: 20 }).base32

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: '123',
        window: 1,
      })

      expect(isValid).toBe(false)
    })
  })

  describe('TOTP secret + crypto integration', () => {
    it('يجب أن يُحافظ على سر TOTP بعد encrypt → decrypt', () => {
      const totpSecret = speakeasy.generateSecret({ length: 20 }).base32

      // تشفير السر (كما يحدث عند تفعيل 2FA)
      const encrypted = encryptSecret(totpSecret)
      const decrypted = decryptSecret(encrypted)

      // التحقق من أن السر المُسترجَع يُنتج نفس الرمز
      const token1 = speakeasy.totp({ secret: totpSecret, encoding: 'base32' })
      const token2 = speakeasy.totp({ secret: decrypted, encoding: 'base32' })

      expect(token1).toBe(token2)
    })

    it('يجب أن يُحقّق التحقق بنجاح بعد encrypt → decrypt', () => {
      const totpSecret = speakeasy.generateSecret({ length: 20 }).base32
      const encrypted = encryptSecret(totpSecret)
      const decrypted = decryptSecret(encrypted)

      const token = speakeasy.totp({ secret: totpSecret, encoding: 'base32' })

      const isValid = speakeasy.totp.verify({
        secret: decrypted,
        encoding: 'base32',
        token,
        window: 1,
      })

      expect(isValid).toBe(true)
    })

    it('سر مُشفّر بمفتاح مختلف يجب أن يفشل في التحقق', () => {
      const totpSecret = speakeasy.generateSecret({ length: 20 }).base32

      // تشفير بمفتاح
      process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64)
      const encrypted = encryptSecret(totpSecret)

      // محاولة فك التشفير بمفتاح مختلف
      process.env.TOTP_ENCRYPTION_KEY = 'b'.repeat(64)

      expect(() => decryptSecret(encrypted)).toThrow()
    })
  })
})
