/**
 * 🔍 اختبار تكامل للـ Trigger — Sprint 1 Day 1
 *
 * يتحقق من:
 * 1. إنشاء كتاب draft → isPublished=false
 * 2. تحديث status='published' → isPublished=true (Trigger)
 * 3. محاولة isPublished=false مباشرة → يبقى true (Trigger يمنع)
 *
 * التشغيل:
 *   npx tsx scripts/verify-trigger.ts
 *
 * متطلب: DATABASE_URL يشير إلى Neon PostgreSQL (لا SQLite)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 اختبار تكامل للـ Trigger...\n')

  // جلب تصنيف للاختبار
  const category = await prisma.bookCategory.findFirst()
  if (!category) {
    console.error('❌ لا يوجد تصنيف في قاعدة البيانات. أنشئ واحدًا أولًا.')
    process.exit(1)
  }

  // 1. إنشاء كتاب draft
  console.log('1️⃣ إنشاء كتاب draft...')
  const draft = await prisma.book.create({
    data: {
      title: 'Test Trigger Draft',
      author: 'Test',
      status: 'draft',
      categoryId: category.id,
    },
    select: { id: true, status: true, isPublished: true },
  })
  console.log('   status:', draft.status, '| isPublished:', draft.isPublished)

  if (draft.isPublished !== false) {
    console.error('❌ FAIL: draft يجب أن يكون isPublished=false')
    await prisma.book.delete({ where: { id: draft.id } })
    process.exit(1)
  }
  console.log('   ✅ PASS: draft.isPublished = false\n')

  // 2. نشر الكتاب (تغيير status فقط)
  console.log('2️⃣ نشر الكتاب (status → published)...')
  await prisma.book.update({
    where: { id: draft.id },
    data: { status: 'published' },
  })
  const published = await prisma.book.findUnique({
    where: { id: draft.id },
    select: { status: true, isPublished: true },
  })
  console.log('   status:', published?.status, '| isPublished:', published?.isPublished)

  if (published?.isPublished !== true) {
    console.error('❌ FAIL: published يجب أن يكون isPublished=true')
    await prisma.book.delete({ where: { id: draft.id } })
    process.exit(1)
  }
  console.log('   ✅ PASS: published.isPublished = true (Trigger زامنه)\n')

  // 3. محاولة كتابة مباشرة (يجب أن يُتجاوزها الـ Trigger)
  console.log('3️⃣ محاولة isPublished=false مباشرة...')
  await prisma.book.update({
    where: { id: draft.id },
    data: { isPublished: false },
  })
  const stillPublished = await prisma.book.findUnique({
    where: { id: draft.id },
    select: { status: true, isPublished: true },
  })
  console.log('   status:', stillPublished?.status, '| isPublished:', stillPublished?.isPublished)

  if (stillPublished?.isPublished !== true) {
    console.error('❌ FAIL: الـ Trigger يجب أن يمنع الكتابة المباشرة')
    await prisma.book.delete({ where: { id: draft.id } })
    process.exit(1)
  }
  console.log('   ✅ PASS: Trigger منع الكتابة المباشرة\n')

  // 4. أرشفة الكتاب
  console.log('4️⃣ أرشفة الكتاب (status → archived)...')
  await prisma.book.update({
    where: { id: draft.id },
    data: { status: 'archived' },
  })
  const archived = await prisma.book.findUnique({
    where: { id: draft.id },
    select: { status: true, isPublished: true },
  })
  console.log('   status:', archived?.status, '| isPublished:', archived?.isPublished)

  if (archived?.isPublished !== false) {
    console.error('❌ FAIL: archived يجب أن يكون isPublished=false')
    await prisma.book.delete({ where: { id: draft.id } })
    process.exit(1)
  }
  console.log('   ✅ PASS: archived.isPublished = false\n')

  // التنظيف
  await prisma.book.delete({ where: { id: draft.id } })

  console.log('═══════════════════════════════════════════')
  console.log('🎉 كل اختبارات الـ Trigger نجحت!')
  console.log('═══════════════════════════════════════════')
  console.log('✅ draft → isPublished=false')
  console.log('✅ published → isPublished=true (تلقائيًا)')
  console.log('✅ الكتابة المباشرة → مُتجاوزة')
  console.log('✅ archived → isPublished=false')
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
