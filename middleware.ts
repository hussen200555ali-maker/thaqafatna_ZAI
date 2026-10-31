/**
 * Middleware — حماية /admin/* (Sprint 1 + Sprint 5 fix)
 *
 * ⚠️ التحفظ #4: لا تستدعِ Prisma في middleware.ts (يعمل على Edge)
 *    استخدم auth() فقط (يقرأ cookie — لا DB)
 *
 * 🆕 Sprint 5 fix: استورد auth من auth.config.ts (Edge-safe)
 *    وليس من auth.ts (الذي يسحب bcrypt + crypto + Prisma).
 *    هذا يقلل حجم Edge Function من 1.04 MB إلى ~310 KB.
 *
 * matcher: ['/admin/:path*'] — لا تحمّله على كل المسارات
 */

import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth.config' // ← Edge-safe version

export async function middleware(request: NextRequest) {
  // auth() يقرأ JWT من cookie — لا يحتاج DB
  const session = await auth()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // لو صفحة الدخول — لا نحميها (لكن نوجّه لو مسجّل بالفعل)
  if (isLoginPage) {
    if (session?.user?.role && ['admin', 'librarian', 'assistant'].includes(session.user.role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // لو مسار إداري — تحقق من الدور
  if (isAdminRoute) {
    if (!session?.user) {
      // غير مسجّل → صفحة الدخول
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const allowedRoles = ['admin', 'librarian', 'assistant']
    if (!allowedRoles.includes(session.user.role)) {
      // دور غير مسموح → 403
      return NextResponse.json(
        { error: 'Forbidden — صلاحيات غير كافية' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  // حماية كل /admin/* ما عدا /admin/login
  matcher: ['/admin/:path*'],
}
