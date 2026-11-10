/**
 * 🛡️ RBAC — Role-Based Access Control
 *
 * منطق التحقق من الصلاحيات:
 * - reader: تصفّح + تنزيل + تقييم
 * - assistant: reader + رفع PDF/أغلفة
 * - librarian: assistant + إدارة الكتب + النشر + التصنيفات + اعتدال المراجعات
 * - admin: كل شيء (incl. إدارة المستخدمين + الأدوار + السجل + الحذف)
 *
 * استخدام:
 *   import { requireRole, hasPermission } from '@/lib/rbac'
 *   const session = await auth()
 *   await requireRole(session, 'librarian') // يُرجّع 403 لو غير مسموح
 *
 * أو للتحقق البسيط:
 *   if (hasPermission(session?.user?.role, 'books.create')) { ... }
 */

export type Role = 'reader' | 'assistant' | 'librarian' | 'admin'

// هرمية الأدوار: كل دور يرث صلاحيات السابق
const ROLE_HIERARCHY: Record<Role, number> = {
  reader: 1,
  assistant: 2,
  librarian: 3,
  admin: 4,
}

// صلاحيات كل دور (إجمالية، ليست هرمية)
const PERMISSIONS: Record<Role, string[]> = {
  reader: [
    'library.browse',
    'books.download',
    'reviews.create',
    'bookmarks.create',
    'profile.update',
  ],
  assistant: [
    'library.browse',
    'books.download',
    'reviews.create',
    'bookmarks.create',
    'profile.update',
    'books.upload',
  ],
  librarian: [
    'library.browse',
    'books.download',
    'reviews.create',
    'bookmarks.create',
    'profile.update',
    'books.upload',
    'books.create',
    'books.update',
    'books.publish',
    'books.delete',
    'categories.manage',
    'reviews.moderate',
  ],
  admin: ['*'], // كل الصلاحيات
}

interface SessionLike {
  user?: {
    id?: string
    role?: string
    roles?: string[]
  }
}

/**
 * التحقق من أن المستخدم لديه دور معيّن على الأقل
 *
 * @param session الجلسة (من auth())
 * @param requiredRole الحد الأدنى المطلوب
 * @returns true لو مسموح، false لو لا
 */
export function hasRole(session: SessionLike | null, requiredRole: Role): boolean {
  if (!session?.user?.role) return false

  const userRole = session.user.role as Role
  if (!(userRole in ROLE_HIERARCHY)) return false
  if (!(requiredRole in ROLE_HIERARCHY)) return false

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * التحقق من صلاحية معيّنة
 *
 * @param role دور المستخدم
 * @param permission الصلاحية المطلوبة (مثل 'books.create')
 * @returns true لو مسموح
 */
export function hasPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false
  if (!(role in PERMISSIONS)) return false

  const perms = PERMISSIONS[role as Role]
  // admin لديه '*'
  if (perms.includes('*')) return true
  // صلاحية محددة
  return perms.includes(permission)
}

/**
 * الحصول على كل صلاحيات دور معيّن
 */
export function getPermissions(role: string): string[] {
  if (!(role in PERMISSIONS)) return []
  return PERMISSIONS[role as Role]
}

/**
 * التحقق من أن مستخدم يحاول تعديل دوره الخاص (منع lockout)
 *
 * مثال: أدمن يحاول خفض دوره إلى reader — يجب رفض ذلك
 *
 * @param session جلسة المستخدم الحالي
 * @param targetUserId معرّف المستخدم المستهدف
 * @param newRole الدور الجديد المطلوب
 * @returns { allowed: boolean, reason?: string }
 */
export function canChangeRole(
  session: SessionLike | null,
  targetUserId: string | undefined,
  newRole: string
): { allowed: boolean; reason?: string } {
  // 1. يجب أن يكون مسجّل دخول
  if (!session?.user?.id) {
    return { allowed: false, reason: 'غير مسجّل' }
  }

  // 2. admin فقط يمكنه تغيير الأدوار
  if (session.user.role !== 'admin') {
    return { allowed: false, reason: 'يتطلب صلاحيات مدير' }
  }

  // 3. منع الأدمن من خفض دوره الخاص (lockout prevention — A.5)
  if (session.user.id === targetUserId && session.user.role !== newRole) {
    // حالة خاصة: أدمن يحاول خفض دوره
    if (ROLE_HIERARCHY[newRole as Role] < ROLE_HIERARCHY[session.user.role as Role]) {
      return {
        allowed: false,
        reason: 'لا يمكن للأدمن خفض دوره الخاص (منع القفل)',
      }
    }
  }

  return { allowed: true }
}

/**
 * throws خطأ لو غير مسموح — للاستخدام في route handlers
 *
 * مثال:
 *   const session = await auth()
 *   requireRole(session, 'librarian') // يرمي 403 لو لا
 */
export function requireRole(session: SessionLike | null, requiredRole: Role): void {
  if (!hasRole(session, requiredRole)) {
    const err = new Error(`يتطلب دور ${requiredRole} على الأقل`)
    ;(err as any).statusCode = 403
    throw err
  }
}
