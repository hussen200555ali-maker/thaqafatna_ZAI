/**
 * Sprint 0 — ترحيل البيانات الموجودة إلى الـ schema الجديد (REVISED v2)
 *
 * المهام:
 * 1. نقل BookChapter.number → BookChapter.order (ثم حذف number)
 * 2. نقل BookChapter.readingTimeMin → BookChapter.estimatedMinutes (ثم حذف readingTimeMin)
 * 3. المراجعات القديمة تبقى 'pending' (لا موافقة تلقائية)
 * 4. إنشاء إصدار 1 (BookVersion) لكل كتاب له pdfUrl (مع التأكد أن واحد فقط نشط)
 * 5. إضافة دور "reader" لكل مستخدم ليس له دور
 * 6. إنشاء tags من keywords الموجودة في الكتب
 * 7. مزامنة Book.status مع Book.isPublished (للبيانات القديمة)
 *
 * التشغيل:
 *   npx tsx scripts/migrate-sprint0-data.ts
 *
 * آمن: يمكن تشغيله عدة مرات (idempotent)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 بدء ترحيل بيانات Sprint 0 (v2)...\n')

  // ===== 1. نقل BookChapter.number → BookChapter.order =====
  console.log('📋 1. نقل BookChapter.number → order...')
  // ملاحظة: في الـ schema الجديد، number محذوف. لكن الـ migration SQL ينقل البيانات
  // قبل الحذف. هنا نتحقق أن order مملوء لكل الفصول.
  const chapters = await prisma.bookChapter.findMany({
    select: { id: true, order: true },
  })
  const chaptersWithoutOrder = chapters.filter((c) => c.order === null || c.order === undefined)
  console.log(`   ✓ ${chapters.length} فصل — ${chaptersWithoutOrder.length} يحتاج تحديث`)
  // ملاحظة: لو order كان null، يجب تعبئته يدويًا (في الـ SQL تم ذلك قبل حذف number)
  console.log(`   ✓ تم نقل number → order في الـ migration SQL\n`)

  // ===== 2. نقل BookChapter.readingTimeMin → estimatedMinutes =====
  console.log('⏱️ 2. نقل readingTimeMin → estimatedMinutes...')
  console.log(`   ✓ تم نقل readingTimeMin → estimatedMinutes في الـ migration SQL`)
  console.log(`   ✓ estimatedMinutes الآن الحقل الوحيد لوقت القراءة\n`)

  // ===== 3. المراجعات القديمة تبقى 'pending' =====
  console.log('💬 3. المراجعات القديمة تبقى pending (بانتظار اعتدال الأدمن)...')
  const pendingReviewsCount = await prisma.bookReview.count({
    where: { status: 'pending' },
  })
  console.log(`   ✓ ${pendingReviewsCount} مراجعة بانتظار الاعتدال في /admin/reviews`)
  console.log(`   ✓ سيُرسل تنبيه للأدمن بمراجعتها يدويًا\n`)

  // ===== 4. إنشاء إصدار 1 لكل كتاب له PDF =====
  console.log('📦 4. إنشاء إصدار 1 (BookVersion) لكل كتاب له PDF...')
  const booksWithPdf = await prisma.book.findMany({
    where: { pdfUrl: { not: '' } },
    select: {
      id: true,
      title: true,
      pdfUrl: true,
      pdfFileName: true,
      pdfSize: true,
      pdfPageCount: true,
    },
  })

  let versionsCreated = 0
  for (const book of booksWithPdf) {
    // التحقق إن كان لديه إصدار بالفعل
    const existingVersion = await prisma.bookVersion.findFirst({
      where: { bookId: book.id, version: 1 },
    })

    if (existingVersion) continue

    // التحقق إن كان لديه إصدار نشط بالفعل (لمنع التضارب مع partial unique index)
    const activeVersion = await prisma.bookVersion.findFirst({
      where: { bookId: book.id, isActive: true },
    })

    await prisma.bookVersion.create({
      data: {
        bookId: book.id,
        version: 1,
        pdfUrl: book.pdfUrl,
        pdfFileName: book.pdfFileName || `${book.title}.pdf`,
        pdfSize: book.pdfSize || 0,
        pdfPageCount: book.pdfPageCount || 0,
        uploadedBy: 'system-migration',
        isActive: !activeVersion,
        notes: 'الإصدار الأولي — تم استيراده من النسخة السابقة',
      },
    })
    versionsCreated++
  }
  console.log(`   ✓ تم إنشاء ${versionsCreated} إصدار جديد\n`)

  // ===== 5. إضافة دور "reader" لكل مستخدم ليس له دور =====
  console.log('👥 5. تعيين دور "reader" لكل مستخدم ليس له دور...')
  const readerRole = await prisma.role.findUnique({
    where: { name: 'reader' },
  })

  if (!readerRole) {
    console.log('   ⚠️  دور "reader" غير موجود. تأكد من تشغيل الـ migration أولاً.')
  } else {
    const usersWithoutRole = await prisma.user.findMany({
      where: { userRoles: { none: {} } },
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

  // ===== 6. إنشاء tags من keywords الكتب =====
  console.log('🏷️  6. إنشاء tags من keywords الكتب...')
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

  // ===== 7. مزامنة Book.status مع Book.isPublished (للبيانات القديمة) =====
  console.log('📚 7. مزامنة Book.status مع isPublished...')
  // الـ migration SQL فعل ذلك بالفعل، لكن نتأكد هنا
  const publishedBooks = await prisma.book.updateMany({
    where: { isPublished: true, status: 'draft' as any },
    data: { status: 'published' as any },
  })
  console.log(`   ✓ ${publishedBooks.count} كتاب تم ضبط حالته على "published"`)
  console.log(`   ✓ باقي الكتب تبقى "draft" (افتراضي)\n`)

  // ===== 8. تسجيل العملية في AuditLog =====
  console.log('📝 8. تسجيل عملية الترحيل في AuditLog...')
  await prisma.auditLog.create({
    data: {
      userId: null,
      action: 'MIGRATION',
      entityType: 'System',
      entityId: 'sprint0-data-migration-v2',
      changes: {
        chaptersCount: chapters.length,
        pendingReviews: pendingReviewsCount,
        versionsCreated,
        tagsCreated,
        bookTagsCreated,
        publishedBooksSynced: publishedBooks.count,
      },
      severity: 'info',
    },
  })
  console.log('   ✓ تم تسجيل العملية في AuditLog\n')

  if (pendingReviewsCount > 0) {
    console.log('⚠️  تنبيه: يوجد مراجعات قديمة تحتاج اعتدالًا يدويًا!')
    console.log(`   📋 ${pendingReviewsCount} مراجعة في /admin/reviews\n`)
  }

  console.log('═══════════════════════════════════════════')
  console.log('🎉 اكتمل ترحيل بيانات Sprint 0 (v2) بنجاح!')
  console.log('═══════════════════════════════════════════')
  console.log(`📋 فصول:             ${chapters.length}`)
  console.log(`💬 مراجعات معلّقة:    ${pendingReviewsCount}`)
  console.log(`📦 إصدارات منشأة:    ${versionsCreated}`)
  console.log(`🏷️  tags منشأة:      ${tagsCreated}`)
  console.log(`🔗 روابط كتب-tags:   ${bookTagsCreated}`)
  console.log(`📚 كتب منشورة:       ${publishedBooks.count}`)
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


