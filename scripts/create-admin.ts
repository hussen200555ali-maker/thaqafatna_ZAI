/**
 * 👑 إنشاء حساب أدمن — يُستخدم مرة واحدة فقط
 *
 * التشغيل:
 *   npx tsx scripts/create-admin.ts
 *
 * المخرجات: يطبع بيانات الدخول (email + password)
 * ثم يُنصح بتغيير كلمة المرور من /admin/settings
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

// إعدادات الأدمن — عدّلها حسب رغبتك
const ADMIN_EMAIL = 'admin@thaqafatna.com'
const ADMIN_NAME = 'hussen200555ali-maker' // اسم المستخدم للدخول
const ADMIN_PASSWORD = crypto.randomBytes(8).toString('hex') // كلمة مرور عشوائية قوية

async function main() {
  console.log('👑 بدء إنشاء حساب الأدمن...\n')

  // 1. التحقق من وجود دور 'admin' في جدول Role
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  if (!adminRole) {
    console.error('❌ دور "admin" غير موجود في قاعدة البيانات.')
    console.error('   تأكد من تشغيل migration 0003 أولاً: npx prisma migrate deploy')
    process.exit(1)
  }
  console.log(`✅ دور "admin" موجود (id: ${adminRole.id})`)

  // 2. التحقق إن كان الأدمن موجودًا بالفعل
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { userRoles: { include: { role: true } } },
  })

  if (existing) {
    console.log(`\n⚠️  المستخدم ${ADMIN_EMAIL} موجود بالفعل.`)
    console.log(`   الأدوار الحالية: ${existing.userRoles.map((ur) => ur.role.name).join(', ')}`)

    // لو ليس لديه دور admin، أضفه
    const hasAdmin = existing.userRoles.some((ur) => ur.role.name === 'admin')
    if (!hasAdmin) {
      await prisma.userRole.create({
        data: {
          userId: existing.id,
          roleId: adminRole.id,
          assignedBy: 'system-bootstrap',
        },
      })
      console.log(`✅ تمت إضافة دور "admin" للمستخدم الموجود.`)
    } else {
      console.log(`✅ المستخدم لديه دور admin بالفعل.`)
    }

    // تحديث كلمة المرور
    const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: newHash,
        lastLoginAt: new Date(),
      },
    })
    console.log(`\n🔑 كلمة المرور الجديدة: ${ADMIN_PASSWORD}`)
  } else {
    // 3. إنشاء مستخدم أدمن جديد
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        lastLoginAt: new Date(),
        userRoles: {
          create: [
            {
              roleId: adminRole.id,
              assignedBy: 'system-bootstrap',
            },
          ],
        },
      },
      include: { userRoles: { include: { role: true } } },
    })

    console.log(`\n✅ تم إنشاء حساب الأدمن بنجاح!`)
    console.log(`   User ID: ${admin.id}`)
    console.log(`   الأدوار: ${admin.userRoles.map((ur) => ur.role.name).join(', ')}`)
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('👑 بيانات دخول الأدمن (احفظها بأمان):')
  console.log('═══════════════════════════════════════════')
  console.log(`   📧 البريد:     ${ADMIN_EMAIL}`)
  console.log(`   👤 اسم المستخدم: ${ADMIN_NAME}`)
  console.log(`   🔑 كلمة المرور: ${ADMIN_PASSWORD}`)
  console.log('═══════════════════════════════════════════')
  console.log('\n⚠️  أعد تشغيل السكربت لتوليد كلمة مرور جديدة.')
  console.log('🔐 بعد أول دخول، فعّل 2FA من /admin/settings')
  console.log('')
}

main()
  .catch((err) => {
    console.error('❌ خطأ:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
