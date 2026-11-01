/**
 * 🔑 POST /api/setup/seed-users — مؤقت لتشغيل seed-test-users على الإنتاج
 *
 * ⚠️ احذف هذا الـ endpoint بعد الاستخدام!
 *
 * Usage:
 *   curl -X POST https://thaqafatna-qr.vercel.app/api/setup/seed-users
 *   أو افتح في المتصفح (GET)
 *
 * يتطلب: AUTH_SECRET في headers للتحقق
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SETUP_SECRET = process.env.AUTH_SECRET || 'test'

const DEFAULT_PASSWORD = 'Admin123!'

const testUsers = [
  { email: 'admin@thaqafatna.com', name: 'مدير النظام', role: 'admin' },
  { email: 'librarian@thaqafatna.com', name: 'أمين المكتبة', role: 'librarian' },
  { email: 'assistant@thaqafatna.com', name: 'مساعد المحتوى', role: 'assistant' },
  { email: 'reader@thaqafatna.com', name: 'قارئ تجريبي', role: 'reader' },
] as const

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  // التحقق من secret
  const authHeader = request.headers.get('authorization')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret

  if (providedSecret !== SETUP_SECRET) {
    return NextResponse.json(
      { error: 'غير مصرّح. أضف ?secret=AUTH_SECRET أو Authorization: Bearer AUTH_SECRET' },
      { status: 401 }
    )
  }

  try {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    const results: Array<{ email: string; role: string; action: string; id?: string }> = []

    for (const testUser of testUsers) {
      const role = await db.role.findUnique({ where: { name: testUser.role } })
      if (!role) {
        results.push({ email: testUser.email, role: testUser.role, action: `❌ role ${testUser.role} not found` })
        continue
      }

      const existing = await db.user.findUnique({
        where: { email: testUser.email },
        include: { userRoles: { include: { role: true } } },
      })

      if (existing) {
        await db.user.update({
          where: { id: existing.id },
          data: { name: testUser.name, passwordHash },
        })

        const hasRole = existing.userRoles.some((ur) => ur.role.name === testUser.role)
        if (!hasRole) {
          await db.userRole.deleteMany({ where: { userId: existing.id } })
          await db.userRole.create({
            data: { userId: existing.id, roleId: role.id, assignedBy: 'seed-endpoint' },
          })
        }

        results.push({ email: testUser.email, role: testUser.role, action: 'updated', id: existing.id })
      } else {
        const user = await db.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            passwordHash,
            userRoles: {
              create: [{ roleId: role.id, assignedBy: 'seed-endpoint' }],
            },
          },
        })
        results.push({ email: testUser.email, role: testUser.role, action: 'created', id: user.id })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء 4 حسابات اختبار',
      credentials: {
        admin: { email: 'admin@thaqafatna.com', password: DEFAULT_PASSWORD, note: 'يحتاج 2FA' },
        librarian: { email: 'librarian@thaqafatna.com', password: DEFAULT_PASSWORD, note: 'يحتاج 2FA' },
        assistant: { email: 'assistant@thaqafatna.com', password: DEFAULT_PASSWORD, note: 'يحتاج 2FA' },
        reader: { email: 'reader@thaqafatna.com', password: DEFAULT_PASSWORD, note: 'لا يحتاج 2FA' },
      },
      results,
      warning: '⚠️ احذف /api/setup/seed-users و /api/setup/seed-content بعد UAT!',
      loginUrl: 'https://thaqafatna-qr.vercel.app/admin/login',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'فشل', details: error.message || String(error) },
      { status: 500 }
    )
  }
}
