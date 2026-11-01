/**
 * 🧪 اختبارات وحدة — rbac.ts (Role-Based Access Control)
 *
 * يغطّي:
 * - hasRole: مصفوفة الأدوار (reader < assistant < librarian < admin)
 * - hasPermission: صلاحيات كل دور
 * - canChangeRole: منع الأدمن من خفض دوره (lockout prevention — A.5)
 * - requireRole: يرمي خطأ 403 لو غير مسموح
 * - getPermissions: قائمة صلاحيات كل دور
 */

import { describe, it, expect } from 'vitest'
import {
  hasRole,
  hasPermission,
  canChangeRole,
  requireRole,
  getPermissions,
  type Role,
} from '@/lib/rbac'

describe('rbac.ts — Role-Based Access Control', () => {
  describe('hasRole — هرمية الأدوار', () => {
    const cases: Array<{ user: Role; required: Role; expected: boolean; desc: string }> = [
      // reader
      { user: 'reader', required: 'reader', expected: true, desc: 'reader يطلب reader' },
      { user: 'reader', required: 'assistant', expected: false, desc: 'reader يطلب assistant (مرفوض)' },
      { user: 'reader', required: 'librarian', expected: false, desc: 'reader يطلب librarian (مرفوض)' },
      { user: 'reader', required: 'admin', expected: false, desc: 'reader يطلب admin (مرفوض)' },

      // assistant
      { user: 'assistant', required: 'reader', expected: true, desc: 'assistant يطلب reader' },
      { user: 'assistant', required: 'assistant', expected: true, desc: 'assistant يطلب assistant' },
      { user: 'assistant', required: 'librarian', expected: false, desc: 'assistant يطلب librarian (مرفوض)' },
      { user: 'assistant', required: 'admin', expected: false, desc: 'assistant يطلب admin (مرفوض)' },

      // librarian
      { user: 'librarian', required: 'reader', expected: true, desc: 'librarian يطلب reader' },
      { user: 'librarian', required: 'assistant', expected: true, desc: 'librarian يطلب assistant' },
      { user: 'librarian', required: 'librarian', expected: true, desc: 'librarian يطلب librarian' },
      { user: 'librarian', required: 'admin', expected: false, desc: 'librarian يطلب admin (مرفوض)' },

      // admin
      { user: 'admin', required: 'reader', expected: true, desc: 'admin يطلب reader' },
      { user: 'admin', required: 'assistant', expected: true, desc: 'admin يطلب assistant' },
      { user: 'admin', required: 'librarian', expected: true, desc: 'admin يطلب librarian' },
      { user: 'admin', required: 'admin', expected: true, desc: 'admin يطلب admin' },
    ]

    cases.forEach(({ user, required, expected, desc }) => {
      it(`${desc} → ${expected ? 'مسموح' : 'مرفوض'}`, () => {
        const session = { user: { id: 'u1', role: user } }
        expect(hasRole(session, required)).toBe(expected)
      })
    })

    it('بدون جلسة → false', () => {
      expect(hasRole(null, 'reader')).toBe(false)
    })

    it('بدون user في الجلسة → false', () => {
      expect(hasRole({}, 'reader')).toBe(false)
    })

    it('بدون role → false', () => {
      expect(hasRole({ user: { id: 'u1' } }, 'reader')).toBe(false)
    })

    it('role غير معروف → false', () => {
      expect(hasRole({ user: { id: 'u1', role: 'superuser' } }, 'reader')).toBe(false)
    })

    it('required role غير معروف → false', () => {
      expect(hasRole({ user: { id: 'u1', role: 'admin' } }, 'superuser' as Role)).toBe(false)
    })
  })

  describe('hasPermission — صلاحيات محددة', () => {
    describe('reader permissions', () => {
      const readerPerms = ['library.browse', 'books.download', 'reviews.create', 'bookmarks.create', 'profile.update']

      readerPerms.forEach(perm => {
        it(`reader لديه ${perm}`, () => {
          expect(hasPermission('reader', perm)).toBe(true)
        })
      })

      it('reader لا يملك books.upload', () => {
        expect(hasPermission('reader', 'books.upload')).toBe(false)
      })

      it('reader لا يملك books.create', () => {
        expect(hasPermission('reader', 'books.create')).toBe(false)
      })

      it('reader لا يملك users.manage', () => {
        expect(hasPermission('reader', 'users.manage')).toBe(false)
      })
    })

    describe('assistant permissions', () => {
      it('assistant يملك books.upload (ميزة إضافية)', () => {
        expect(hasPermission('assistant', 'books.upload')).toBe(true)
      })

      it('assistant لا يملك books.create (للأمين فقط)', () => {
        expect(hasPermission('assistant', 'books.create')).toBe(false)
      })
    })

    describe('librarian permissions', () => {
      const librarianPerms = ['books.create', 'books.update', 'books.publish', 'books.delete', 'categories.manage', 'reviews.moderate']

      librarianPerms.forEach(perm => {
        it(`librarian يملك ${perm}`, () => {
          expect(hasPermission('librarian', perm)).toBe(true)
        })
      })
    })

    describe('admin permissions', () => {
      it('admin يملك أي صلاحية (wildcard)', () => {
        expect(hasPermission('admin', 'anything.does.not.exist')).toBe(true)
        expect(hasPermission('admin', 'users.manage')).toBe(true)
        expect(hasPermission('admin', 'system.shutdown')).toBe(true)
      })
    })

    describe('حالات حدية', () => {
      it('role undefined → false', () => {
        expect(hasPermission(undefined, 'library.browse')).toBe(false)
      })

      it('role غير معروف → false', () => {
        expect(hasPermission('superuser', 'library.browse')).toBe(false)
      })
    })
  })

  describe('canChangeRole — منع lockout (A.5)', () => {
    it('admin يمكنه رفع دور مستخدم آخر', () => {
      const adminSession = { user: { id: 'admin1', role: 'admin' } }
      const result = canChangeRole(adminSession, 'user2', 'librarian')
      expect(result.allowed).toBe(true)
    })

    it('admin يمكنه خفض دور مستخدم آخر', () => {
      const adminSession = { user: { id: 'admin1', role: 'admin' } }
      const result = canChangeRole(adminSession, 'user2', 'reader')
      expect(result.allowed).toBe(true)
    })

    it('admin لا يمكنه خفض دوره الخاص إلى librarian (lockout)', () => {
      const adminSession = { user: { id: 'admin1', role: 'admin' } }
      const result = canChangeRole(adminSession, 'admin1', 'librarian')
      expect(result.allowed).toBe(false)
      expect(result.reason).toMatch(/خفض دوره/)
    })

    it('admin لا يمكنه خفض دوره الخاص إلى reader (lockout)', () => {
      const adminSession = { user: { id: 'admin1', role: 'admin' } }
      const result = canChangeRole(adminSession, 'admin1', 'reader')
      expect(result.allowed).toBe(false)
      expect(result.reason).toMatch(/خفض دوره/)
    })

    it('admin يمكنه تعديل دوره الخاص لنفس الدور (لا تغيير)', () => {
      const adminSession = { user: { id: 'admin1', role: 'admin' } }
      const result = canChangeRole(adminSession, 'admin1', 'admin')
      expect(result.allowed).toBe(true)
    })

    it('librarian لا يمكنه تغيير أدوار (يتطلب admin)', () => {
      const librarianSession = { user: { id: 'lib1', role: 'librarian' } }
      const result = canChangeRole(librarianSession, 'user2', 'reader')
      expect(result.allowed).toBe(false)
      expect(result.reason).toMatch(/مدير/)
    })

    it('reader لا يمكنه تغيير أدوار', () => {
      const readerSession = { user: { id: 'r1', role: 'reader' } }
      const result = canChangeRole(readerSession, 'user2', 'reader')
      expect(result.allowed).toBe(false)
    })

    it('بدون جلسة → غير مسموح', () => {
      const result = canChangeRole(null, 'user2', 'reader')
      expect(result.allowed).toBe(false)
      expect(result.reason).toMatch(/مسجّل/)
    })
  })

  describe('requireRole — يرمي خطأ لو غير مسموح', () => {
    it('يرمي خطأ 403 لو role غير كافٍ', () => {
      const readerSession = { user: { id: 'r1', role: 'reader' } }
      expect(() => requireRole(readerSession, 'admin')).toThrow()
    })

    it('لا يرمي خطأ لو role كافٍ', () => {
      const adminSession = { user: { id: 'a1', role: 'admin' } }
      expect(() => requireRole(adminSession, 'reader')).not.toThrow()
    })

    it('يرمي خطأ بدون جلسة', () => {
      expect(() => requireRole(null, 'reader')).toThrow()
    })

    it('الخطأ يحتوي statusCode=403', () => {
      const readerSession = { user: { id: 'r1', role: 'reader' } }
      try {
        requireRole(readerSession, 'admin')
        expect.fail('يجب أن يرمي خطأ')
      } catch (err: any) {
        expect(err.statusCode).toBe(403)
      }
    })

    it('رسالة الخطأ تذكر الدور المطلوب', () => {
      const readerSession = { user: { id: 'r1', role: 'reader' } }
      try {
        requireRole(readerSession, 'librarian')
        expect.fail('يجب أن يرمي خطأ')
      } catch (err: any) {
        expect(err.message).toMatch(/librarian/)
      }
    })
  })

  describe('getPermissions — قائمة الصلاحيات', () => {
    it('reader لديه 5 صلاحيات', () => {
      const perms = getPermissions('reader')
      expect(perms).toHaveLength(5)
      expect(perms).toContain('library.browse')
      expect(perms).toContain('books.download')
    })

    it('assistant لديه 6 صلاحيات (reader + books.upload)', () => {
      const perms = getPermissions('assistant')
      expect(perms).toHaveLength(6)
      expect(perms).toContain('books.upload')
    })

    it('librarian لديه 12 صلاحية', () => {
      const perms = getPermissions('librarian')
      expect(perms).toHaveLength(12)
    })

    it('admin لديه wildcard فقط', () => {
      const perms = getPermissions('admin')
      expect(perms).toEqual(['*'])
    })

    it('role غير معروف → []', () => {
      expect(getPermissions('unknown')).toEqual([])
    })
  })
})
