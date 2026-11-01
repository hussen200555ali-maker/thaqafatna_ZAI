/**
 * 🧪 اختبارات وحدة — backup-codes.ts (Sprint 5 A.2)
 *
 * يغطّي:
 * - generateBackupCodes: يُنتج 10 رموز بصيغة XXXX-XXXX
 * - generateBackupCodes: رموز فريدة (لا تكرار)
 * - generateBackupCodes: يستخدم chars آمنة (لا 0, 1, I, O)
 * - hashBackupCodes: يُنتج bcrypt hashes مختلفة عن الأصل
 * - hashBackupCodes: hashes مختلفة لنفس الإدخال (salt عشوائي)
 *
 * ملاحظة: verifyBackupCode و saveBackupCode تحتاجان DB،
 * لذلك تُغطّى في اختبارات integration لاحقًا (أو E2E).
 * هنا نختبر المنطق النقي (pure functions).
 */

import { describe, it, expect } from 'vitest'
import {
  generateBackupCodes,
  hashBackupCodes,
} from '@/lib/backup-codes'

describe('backup-codes.ts — توليد الرموز الاحتياطية', () => {

  describe('generateBackupCodes', () => {
    it('يجب أن يُرجّع 10 رموز', () => {
      const codes = generateBackupCodes()
      expect(codes).toHaveLength(10)
    })

    it('كل رمز يجب أن يكون بصيغة XXXX-XXXX (9 أحرف)', () => {
      const codes = generateBackupCodes()
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
      })
    })

    it('كل رمز يجب أن يحتوي على "-" واحد فقط', () => {
      const codes = generateBackupCodes()
      codes.forEach((code) => {
        const dashCount = (code.match(/-/g) || []).length
        expect(dashCount).toBe(1)
      })
    })

    it('الرموز يجب أن تكون فريدة (لا تكرار)', () => {
      const codes = generateBackupCodes()
      const unique = new Set(codes)
      expect(unique.size).toBe(codes.length)
    })

    it('استدعاءات متعددة يجب أن تُنتج رموزًا مختلفة', () => {
      const codes1 = generateBackupCodes()
      const codes2 = generateBackupCodes()
      // على الأقل 9 من 10 يجب أن تكون مختلفة
      const common = codes1.filter((c) => codes2.includes(c))
      expect(common.length).toBeLessThan(2)
    })

    it('الرموز لا تحتوي على حروف ملتبسة (0, 1, I, O)', () => {
      const codes = generateBackupCodes()
      const forbidden = ['0', '1', 'I', 'O']
      // اختبر 10 دفعات للتأكد من التغطية
      for (let run = 0; run < 10; run++) {
        const moreCodes = generateBackupCodes()
        codes.push(...moreCodes)
      }
      codes.forEach((code) => {
        forbidden.forEach((char) => {
          expect(code).not.toContain(char)
        })
      })
    })

    it('الرموز تحتوي فقط على chars مسموحة (A-Z بدون I,O + 2-9)', () => {
      const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789-'
      // اختبر 20 دفعة للتأكد
      const allCodes: string[] = []
      for (let run = 0; run < 20; run++) {
        allCodes.push(...generateBackupCodes())
      }
      allCodes.forEach((code) => {
        for (const char of code) {
          expect(allowedChars).toContain(char)
        }
      })
    })

    it('كل رمز طوله 9 أحرف (4 + dash + 4)', () => {
      const codes = generateBackupCodes()
      codes.forEach((code) => {
        expect(code).toHaveLength(9)
      })
    })
  })

  describe('hashBackupCodes', () => {
    it('يجب أن يُرجّع 10 hashes لـ 10 رموز', async () => {
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)
      expect(hashes).toHaveLength(10)
    })

    it('كل hash يجب أن يكون نصًا طويلاً (bcrypt ~60 chars)', async () => {
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)
      hashes.forEach((hash) => {
        expect(hash).toMatch(/^\$2[aby]?\$/)
        expect(hash.length).toBeGreaterThan(50)
      })
    })

    it('hashes يجب أن تكون مختلفة عن الرموز الأصلية', async () => {
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)
      codes.forEach((code, i) => {
        expect(hashes[i]).not.toBe(code)
        expect(hashes[i]).not.toContain(code)
      })
    })

    it('نفس الرمز يجب أن يُنتج hashes مختلفة (salt عشوائي)', async () => {
      const code = 'SAME-CODE'
      const hashes = await hashBackupCodes([code, code, code])
      const unique = new Set(hashes)
      expect(unique.size).toBe(3) // كل hash مختلف بسبب الـ salt
    })

    it('hash صحيح يجب أن يُحقّق مع bcrypt.compare', async () => {
      const bcrypt = (await import('bcryptjs')).default
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)

      // تحقق من أول رمز
      const isValid = await bcrypt.compare(codes[0], hashes[0])
      expect(isValid).toBe(true)

      // تحقق من آخر رمز
      const isValidLast = await bcrypt.compare(codes[9], hashes[9])
      expect(isValidLast).toBe(true)
    })

    it('رمز خاطئ يجب أن لا يُحقّق مع hash مختلف', async () => {
      const bcrypt = (await import('bcryptjs')).default
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)

      // رمز 0 مع hash 5 (يجب أن يكون خاطئ عادةً)
      const isValid = await bcrypt.compare(codes[0], hashes[5])
      expect(isValid).toBe(false)
    })

    it('hash فارغ يجب أن لا يُحقّق مع أي رمز', async () => {
      const bcrypt = (await import('bcryptjs')).default
      const codes = generateBackupCodes()
      const hashes = await hashBackupCodes(codes)

      const isValid = await bcrypt.compare('', hashes[0])
      expect(isValid).toBe(false)
    })
  })

  describe('Backup Code format validation (لاستخدام في verify)', () => {
    // regex: A-Z بدون I,O + 2-9 (لا حروف ملتبسة)
    const validRegex = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/

    it('رمز صحيح يجب أن يطابق regex', () => {
      const validCodes = ['ABCD-EFGH', 'WXYZ-2345', 'JKLM-NPQR']
      validCodes.forEach((code) => {
        expect(code).toMatch(validRegex)
      })
    })

    it('رمز خاطئ يجب أن لا يطابق regex', () => {
      const invalidCodes = [
        'abcd-efgh',     // أحرف صغيرة
        'ABCDEFGH',      // بدون dash
        'ABC-DEFGH',     // جزء أول قصير
        'ABCD-EFG',      // جزء ثاني قصير
        'AB1D-EFGH',     // يحتوي على 1
        'AB0D-EFGH',     // يحتوي على 0
        'ABID-EFGH',     // يحتوي على I (محظور)
        'ABOD-EFGH',     // يحتوي على O (محظور)
        'ABCD-EFGHI',    // جزء ثاني طويل
        'ABCDE-FGHI',    // جزء أول طويل
        '',              // فارغ
        'ABCD-EFGH-',    // dash إضافي
      ]
      invalidCodes.forEach((code) => {
        expect(code).not.toMatch(validRegex)
      })
    })

    it('اكتشاف Backup Code عبر الطول والـ dash', () => {
      const isBackupCodeFormat = (token: string) =>
        token.includes('-') && token.length === 9

      const validBackupCodes = ['ABCD-EFGH', 'WXYZ-2345']
      const validTOTPCodes = ['123456', '987654']

      validBackupCodes.forEach((code) => {
        expect(isBackupCodeFormat(code)).toBe(true)
      })
      validTOTPCodes.forEach((code) => {
        expect(isBackupCodeFormat(code)).toBe(false)
      })
    })
  })
})
