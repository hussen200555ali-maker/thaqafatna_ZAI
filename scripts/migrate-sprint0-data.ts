/**
 * Sprint 0 — ترحيل البيانات الموجودة إلى الـ schema الجديد
 *
 * المهام:
 * 1. تعبئة BookChapter.order من BookChapter.number
 * 2. اعتبار كل BookReview الموجود حاليًا "approved" (لأنها كانت تُعرض مباشرة)
 * 3. إنشاء إصدار 1 (BookVersion) لكل كتاب له pdfUrl
 * 4. إضافة دور "reader" لكل مستخدم ليس له دور
 * 5. إنشاء tags من keywords الموجودة في الكتب
 *
 * التشغيل:
 *   npx tsx scripts/migrate-sprint0-data.ts
 *
 * آمن: يمكن تشغيله عدة مرات (idempotent)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 بدء ترحيل بيانات Sprint 0...\n')

  // ===== 1. تعبئة BookChapter.order =====
  console.log('📋 1. تعبئة BookChapter.order من number...')
  const chaptersWithoutOrder = await prisma.bookChapter.findMany({
    where: { order: undefined as any },
    select: { id: true, number: true },
  })

  for (const chapter of chaptersWithoutOrder) {
    await prisma.bookChapter.update({
      where: { id: chapter.id },
      data: { order: chapter.number },
    })
  }
  console.log(`   ✓ تم تحديث ${chaptersWithoutOrder.length} فصل\n`)

  // ===== 2. اعتبار كل المراجعات الموجودة "approved" =====
  console.log('💬 2. تحديث حالة المراجعات الموجودة إلى "approved"...')
  const pendingReviews = await prisma.bookReview.updateMany({
    where: { status: 'pending' as any }, // قبل الترحيل، قد لا يكون الحقل موجودًا
    data: { status: 'approved' },
  })
  console.log(`   ✓ تم تحديث ${pendingReviews.count} مراجعة إلى "approved"\n`)

  // ===== 3. إنشاء إصدار 1 لكل كتاب له PDF =====
  console.log('📦 3. إنشاء إصدار 1 (BookVersion) لكل كتاب له PDF...')
  const booksWithPdf = await prisma.book.findMany({
    where: { pdfUrl: { not: '' } },
    select: {
      id: true,
      title: true,
      pdfUrl: true,
      pdfFileName: true,
      pdfSize: true,
      pdfPageCount: true,
      uploadedAt: true,
    },
  })

  let versionsCreated = 0
  for (const book of booksWithPdf) {
    // التحقق إن كان لديه إصدار بالفعل
    const existingVersion = await prisma.bookVersion.findFirst({
      where: { bookId: book.id, version: 1 },
    })

    if (existingVersion) continue

    // إنشاء إصدار 1
    await prisma.bookVersion.create({
      data: {
        bookId: book.id,
        version: 1,
        pdfUrl: book.pdfUrl,
        pdfFileName: book.pdfFileName || `${book.title}.pdf`,
        pdfSize: book.pdfSize || 0,
        pdfPageCount: book.pdfPageCount || 0,
        uploadedBy: 'system-migration', // معرّف وهمي للنظام
        isActive: true,
        notes: 'الإصدار الأولي — تم استيراده من النسخة السابقة',
      },
    })
    versionsCreated++
  }
  console.log(`   ✓ تم إنشاء ${versionsCreated} إصدار جديد\n`)

  // ===== 4. إضافة دور "reader" لكل مستخدم ليس له دور =====
  console.log('👥 4. تعيين دور "reader" لكل مستخدم ليس له دور...')
  const readerRole = await prisma.role.findUnique({
    where: { name: 'reader' },
  })

  if (!readerRole) {
    console.log('   ⚠️  دور "reader" غير موجود. تأكد من تشغيل الـ migration أولاً.')
  } else {
    const usersWithoutRole = await prisma.user.findMany({
      where: {
        userRoles: { none: {} },
      },
      select: { id: true },
    })

    for (const user of usersWithoutRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: readerRole.id,
          assignedBy: 'system-migration',
        },
      })
    }
    console.log(`   ✓ تم تعيين دور "reader" لـ ${usersWithoutRole.length} مستخدم\n`)
  }

  // ===== 5. إنشاء tags من keywords الكتب =====
  console.log('🏷️  5. إنشاء tags من keywords الكتب...')
  const books = await prisma.book.findMany({
    select: { id: true, keywords: true },
  })

  let tagsCreated = 0
  let bookTagsCreated = 0

  for (const book of books) {
    let keywords: string[] = []
    try {
      const parsed = JSON.parse(book.keywords || '[]')
      if (Array.isArray(parsed)) keywords = parsed
    } catch {
      // تجاهل
    }

    for (const kw of keywords) {
      const trimmed = kw.trim()
      if (!trimmed) continue

      // إنشاء الـ tag إن لم يكن موجودًا
      const slug = trimmed
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FF\w-]/g, '')
        .toLowerCase()

      let tag = await prisma.tag.findUnique({ where: { slug } })
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: trimmed, slug },
        })
        tagsCreated++
      }

      // ربط الكتاب بالـ tag
      const existing = await prisma.bookTag.findUnique({
        where: { bookId_tagId: { bookId: book.id, tagId: tag.id } },
      })
      if (!existing) {
        await prisma.bookTag.create({
          data: { bookId: book.id, tagId: tag.id },
        })
        bookTagsCreated++
      }
    }
  }
  console.log(`   ✓ تم إنشاء ${tagsCreated} tag جديد و ${bookTagsCreated} ربط كتاب-tag\n`)

  // ===== 6. تسجيل العملية في AuditLog =====
  console.log('📝 6. تسجيل عملية الترحيل في AuditLog...')
  await prisma.auditLog.create({
    data: {
      userId: null, // من النظام
      action: 'MIGRATION',
      entityType: 'System',
      entityId: 'sprint0-data-migration',
      changes: {
        chaptersUpdated: chaptersWithoutOrder.length,
        reviewsApproved: pendingReviews.count,
        versionsCreated,
        tagsCreated,
        bookTagsCreated,
      },
      severity: 'info',
    },
  })
  console.log('   ✓ تم تسجيل العملية في AuditLog\n')

  console.log('═══════════════════════════════════════════')
  console.log('🎉 اكتمل ترحيل بيانات Sprint 0 بنجاح!')
  console.log('═══════════════════════════════════════════')
  console.log(`📋 فصول محدثة:       ${chaptersWithoutOrder.length}`)
  console.log(`💬 مراجعات موافق عليها: ${pendingReviews.count}`)
  console.log(`📦 إصدارات منشأة:    ${versionsCreated}`)
  console.log(`🏷️  tags منشأة:      ${tagsCreated}`)
  console.log(`🔗 روابط كتب-tags:   ${bookTagsCreated}`)
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ خطأ في الترحيل:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
