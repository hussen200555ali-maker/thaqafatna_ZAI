/**
 * 🔐 مؤقت: إنشاء حساب أدمن — اُحذف بعد الاستخدام!
 *
 * التشغيل:
 *   curl https://thaqafatna-qr.vercel.app/api/setup/admin
 *   أو افتح الرابط في المتصفح
 *
 * ⚠️ بعد الحصول على البيانات، احذف هذا الملف وأعِد النشر!
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'admin@thaqafatna.com'
const ADMIN_NAME = 'hussen200555ali-maker'
const ADMIN_PASSWORD = crypto.randomBytes(8).toString('hex')

export async function GET() {
  // حماية بسيطة: يتطلب secret في URL
  // مثال: /api/setup/admin?secret= SETUP_SECRET_HERE
  // const secret = new URL(request.url).searchParams.get('secret')
  // if (secret !== process.env.SETUP_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    // 1. التحقق من وجود دور 'admin'
    const adminRole = await db.role.findUnique({ where: { name: 'admin' } })
    if (!adminRole) {
      return NextResponse.json({
        error: 'admin role not found — run migration 0003 first',
      }, { status: 500 })
    }

    // 2. التحقق من المستخدم الموجود
    const existing = await db.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: { userRoles: { include: { role: true } } },
    })

    let userId: string
    let action: string

    if (existing) {
      userId = existing.id
      action = 'updated'

      // إضافة دور admin لو ليس لديه
      const hasAdmin = existing.userRoles.some((ur) => ur.role.name === 'admin')
      if (!hasAdmin) {
        await db.userRole.create({
          data: {
            userId: existing.id,
            roleId: adminRole.id,
            assignedBy: 'system-bootstrap',
          },
        })
      }

      // تحديث كلمة المرور
      const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
      await db.user.update({
        where: { id: existing.id },
        data: { passwordHash: newHash },
      })
    } else {
      // 3. إنشاء مستخدم أدمن جديد
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
      const admin = await db.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          passwordHash,
          userRoles: {
            create: [
              {
                roleId: adminRole.id,
                assignedBy: 'system-bootstrap',
              },
            ],
          },
        },
      })
      userId = admin.id
      action = 'created'
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      credentials: {
        email: ADMIN_EMAIL,
        username: ADMIN_NAME,
        password: ADMIN_PASSWORD, // ⚠️ اُحذف هذا الـ endpoint بعد الحفظ!
      },
      warning: 'احفظ البيانات الآن ثم احذف /api/setup/admin لمنع الوصول غير المصرّح',
      nextSteps: [
        '1. سجّل الدخول من /admin/login',
        '2. فعّل 2FA من /admin/settings',
        '3. احذف src/app/api/setup/admin/route.ts',
        '4. أعد النشر',
      ],
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
