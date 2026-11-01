/**
 * 👥 seed-test-users.ts — توليد 4 حسابات تجريبية لاختبار UAT
 *
 * التشغيل:
 *   npx tsx scripts/seed-test-users.ts
 *
 * آمن: يمكن تشغيله عدة مرات (idempotent) — يحدّث كلمات المرور لو موجودة
 *
 * الحسابات (كلها بكلمة مرور موحّدة للسهولة):
 *   admin@thaqafatna.com      / Admin123!  (دور: admin)
 *   librarian@thaqafatna.com  / Admin123!  (دور: librarian)
 *   assistant@thaqafatna.com  / Admin123!  (دور: assistant)
 *   reader@thaqafatna.com     / Admin123!  (دور: reader)
 *
 * ⚠️ للاختبار فقط — لا تستخدم في الإنتاج!
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Admin123!'

interface TestUser {
  email: string
  name: string
  role: 'admin' | 'librarian' | 'assistant' | 'reader'
  image?: string
}

const testUsers: TestUser[] = [
  {
    email: 'admin@thaqafatna.com',
    name: 'مدير النظام',
    role: 'admin',
  },
  {
    email: 'librarian@thaqafatna.com',
    name: 'أمين المكتبة',
    role: 'librarian',
  },
  {
    email: 'assistant@thaqafatna.com',
    name: 'مساعد المحتوى',
    role: 'assistant',
  },
  {
    email: 'reader@thaqafatna.com',
    name: 'قارئ تجريبي',
    role: 'reader',
  },
]

async function main() {
  console.log('👥 بدء توليد حسابات الاختبار...\n')
  console.log(`🔑 كلمة المرور لكل الحسابات: ${DEFAULT_PASSWORD}\n`)

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  for (const testUser of testUsers) {
    // 1. التحقق من وجود الدور
    const role = await prisma.role.findUnique({
      where: { name: testUser.role },
    })

    if (!role) {
      console.error(`❌ دور "${testUser.role}" غير موجود. شغّل migration 0003 أولاً.`)
      continue
    }

    // 2. البحث عن المستخدم أو إنشائه
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { userRoles: { include: { role: true } } },
    })

    if (existing) {
      // تحديث كلمة المرور + التأكد من الدور
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: testUser.name,
          passwordHash,
          lastLoginAt: null,
        },
      })

      // التأكد من دور المستخدم
      const hasRole = existing.userRoles.some((ur) => ur.role.name === testUser.role)
      if (!hasRole) {
        // حذف الأدوار القديمة وإضافة الصحيح
        await prisma.userRole.deleteMany({ where: { userId: existing.id } })
        await prisma.userRole.create({
          data: {
            userId: existing.id,
            roleId: role.id,
            assignedBy: 'seed-test-users',
          },
        })
      }

      console.log(`✅ تم تحديث: ${testUser.email} (${testUser.role})`)
    } else {
      // إنشاء مستخدم جديد
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          passwordHash,
          userRoles: {
            create: [
              {
                roleId: role.id,
                assignedBy: 'seed-test-users',
              },
            ],
          },
        },
      })

      console.log(`✅ تم إنشاء: ${testUser.email} (${testUser.role}) — ID: ${user.id}`)
    }
  }

  // طباعة ملخص نهائي
  console.log('\n═══════════════════════════════════════════════════')
  console.log('🎉 اكتمل توليد حسابات الاختبار!\n')
  console.log('📋 بيانات الدخول للاختبار (UAT):')
  console.log('═══════════════════════════════════════════════════')
  testUsers.forEach((u) => {
    console.log(`   ${u.role.padEnd(10)} | ${u.email} | ${DEFAULT_PASSWORD}`)
  })
  console.log('═══════════════════════════════════════════════════')
  console.log(`\n⚠️  للاختبار فقط — احذف هذه الحسابات قبل الإنتاج!`)
  console.log(`\n📝 صفحة الدخول: /admin/login`)
  console.log(`   للأدمن: استخدم البريد + كلمة المرور + 2FA`)
  console.log(`   للقراء: يمكن الدخول عبر GitHub OAuth أيضاً`)
}

main()
  .catch((err) => {
    console.error('❌ خطأ:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
