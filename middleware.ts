/**
 * Middleware — حماية /admin/* + CORS headers للـ API
 *
 * ⚠️ التحفظ #4: لا تستدعِ Prisma في middleware.ts (يعمل على Edge)
 *    استخدم auth() فقط (يقرأ cookie — لا DB)
 *
 * 🆕 Sprint 5 fix: استورد auth من auth.config.ts (Edge-safe)
 *
 * 🆕 CORS fix: إضافة CORS headers لكل /api/* responses
 *    لتسمح للتطبيق (PWA/Capacitor) بالاتصال بالـ API
 */

import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth.config' // ← Edge-safe version

// إضافة CORS headers لأي استجابة
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export async function middleware(request: NextRequest) {
  // ===== 1) CORS: معالجة طلبات OPTIONS preflight =====
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new NextResponse(null, { status: 204 }))
  }

  // ===== 2) إضافة CORS headers لكل استجابات /api/* =====
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  if (isApiRoute) {
    const response = NextResponse.next()
    return addCorsHeaders(response)
  }

  // ===== 3) حماية /admin/* =====
  const session = await auth()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (isLoginPage) {
    if (session?.user?.role && ['admin', 'librarian', 'assistant'].includes(session.user.role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  if (isAdminRoute) {
    if (!session?.user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const allowedRoles = ['admin', 'librarian', 'assistant']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden — صلاحيات غير كافية' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  // حماية /admin/* + إضافة CORS لكل /api/*
  matcher: ['/admin/:path*', '/api/:path*'],
}
