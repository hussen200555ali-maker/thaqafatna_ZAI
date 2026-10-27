/**
 * 🚚 ترحيل المستخدمين الحاليين إلى NextAuth — Sprint 1 Day 1
 *
 * المهام:
 * 1. لكل مستخدم بلا email → أنشئ email مؤقت
 * 2. لكل مستخدم بلا passwordHash → أنشئ كلمة مرور مؤقتة
 * 3. إضافة دور 'reader' لكل مستخدم بلا دور
 * 4. طباعة قائمة بكلمات المرور المؤقتة (للأدمن)
 *
 * التشغيل:
 *   npx tsx scripts/migrate-users-to-auth.ts
 *
 * آمن: يمكن تشغيله عدة مرات (idempotent)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🚚 بدء ترحيل المستخدمين إلى NextAuth...\n')

  // جلب دور reader
  const readerRole = await prisma.role.findUnique({ where: { name: 'reader' } })
  if (!readerRole) {
    console.error('❌ دور "reader" غير موجود. شغّل migration 0003 أولًا.')
    process.exit(1)
  }

  // جلب كل المستخدمين
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      userRoles: { include: { role: true } },
    },
  })

  console.log(`📋 عدد المستخدمين: ${users.length}\n`)

  const tempPasswords: Array<{ userId: string; name: string | null; email: string; tempPassword: string }> = []

  for (const user of users) {
    let updated = false

    // 1. إضافة email مؤقت إن لم يوجد
    if (!user.email) {
      const tempEmail = `${user.id}@migration.thaqafatna.local`
      await prisma.user.update({
        where: { id: user.id },
        data: { email: tempEmail },
      })
      console.log(`   📧 ${user.name || user.id}: email مؤقت = ${tempEmail}`)
      updated = true
    }

    // 2. إضافة passwordHash مؤقت إن لم يوجد
    if (!user.passwordHash) {
      const tempPassword = crypto.randomBytes(8).toString('hex')
      const hash = await bcrypt.hash(tempPassword, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      })
      tempPasswords.push({
        userId: user.id,
        name: user.name,
        email: user.email || `${user.id}@migration.thaqafatna.local`,
        tempPassword,
      })
      console.log(`   🔑 ${user.name || user.id}: كلمة مرور مؤقتة أُنشئت`)
      updated = true
    }

    // 3. إضافة دور 'reader' إن لم يوجد
    if (user.userRoles.length === 0) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: readerRole.id,
          assignedBy: 'system-migration',
        },
      })
      console.log(`   👤 ${user.name || user.id}: دور 'reader' مُسنَد`)
      updated = true
    }

    if (!updated) {
      console.log(`   ✅ ${user.name || user.id}: لا يحتاج تحديث`)
    }
  }

  // طباعة كلمات المرور المؤقتة
  if (tempPasswords.length > 0) {
    console.log('\n═══════════════════════════════════════════')
    console.log('🔑 كلمات المرور المؤقتة (احفظها بأمان ثم احذف هذا السجل):')
    console.log('═══════════════════════════════════════════')
    for (const tp of tempPasswords) {
      console.log(`   ${tp.name || tp.userId} | ${tp.email} | ${tp.tempPassword}`)
    }
    console.log('═══════════════════════════════════════════')
    console.log('⚠️  أرسل هذه البيانات للمستخدمين أو الأدمن، ثم احذف هذا السجل.')
    console.log('═══════════════════════════════════════════\n')
  }

  console.log('═══════════════════════════════════════════')
  console.log('🎉 اكتمل ترحيل المستخدمين!')
  console.log('═══════════════════════════════════════════')
  console.log(`📋 إجمالي المستخدمين: ${users.length}`)
  console.log(`🔑 كلمات مرور مؤقتة: ${tempPasswords.length}`)
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
