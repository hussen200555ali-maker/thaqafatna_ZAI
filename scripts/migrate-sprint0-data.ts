/**
 * Sprint 0 — ترحيل البيانات الموجودة إلى الـ schema الجديد (REVISED)
 *
 * المهام:
 * 1. تعبئة BookChapter.order من BookChapter.number
 * 2. المراجعات القديمة تبقى 'pending' (لا موافقة تلقائية) — يراجعها الأدمن يدويًا
 * 3. إنشاء إصدار 1 (BookVersion) لكل كتاب له pdfUrl (مع التأكد أن واحد فقط نشط)
 * 4. إضافة دور "reader" لكل مستخدم ليس له دور
 * 5. إنشاء tags من keywords الموجودة في الكتب
 *
 * التشغيل:
 *   npx tsx scripts/migrate-sprint0-data.ts
 *
 * آمن: يمكن تشغيله عدة مرات (idempotent)
 *
 * REVISION NOTE (after senior review):
 *   - Reviews stay as 'pending' (not auto-approved)
 *   - Admin will be alerted to moderate them in /admin/reviews
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

  // ===== 2. المراجعات القديمة تبقى 'pending' (لا موافقة تلقائية) =====
  // SECURITY FIX: المراجعات القديمة لم تُراجع، فلا توافق عليها تلقائيًا.
  // سيقوم الأدمن بمراجعتها يدويًا في /admin/reviews
  console.log('💬 2. المراجعات القديمة تبقى pending (بانتظار اعتدال الأدمن)...')
  const pendingReviewsCount = await prisma.bookReview.count({
    where: { status: 'pending' as any },
  })
  console.log(`   ✓ ${pendingReviewsCount} مراجعة بانتظار الاعتدال في /admin/reviews`)
  console.log(`   ✓ سيُرسل تنبيه للأدمن بمراجعتها يدويًا\n`)

  // ===== 3. إنشاء إصدار 1 لكل كتاب له PDF (مع ضمان نشاط واحد فقط) =====
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

    // التحقق إن كان لديه إصدار نشط بالفعل (لمنع التضارب)
    const activeVersion = await prisma.bookVersion.findFirst({
      where: { bookId: book.id, isActive: true },
    })

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
        isActive: !activeVersion, // نشط فقط إن لم يكن هناك إصدار نشط
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

  // ===== 6. تسجيل العملية في AuditLog (severity: info) =====
  console.log('📝 6. تسجيل عملية الترحيل في AuditLog...')
  await prisma.auditLog.create({
    data: {
      userId: null, // من النظام
      action: 'MIGRATION',
      entityType: 'System',
      entityId: 'sprint0-data-migration',
      changes: {
        chaptersUpdated: chaptersWithoutOrder.length,
        pendingReviews: pendingReviewsCount,
        versionsCreated,
        tagsCreated,
        bookTagsCreated,
      },
      severity: 'info',
    },
  })
  console.log('   ✓ تم تسجيل العملية في AuditLog\n')

  // ===== 7. تنبيه الأدمن بمراجعة المراجعات المعلّقة =====
  if (pendingReviewsCount > 0) {
    console.log('⚠️  7. تنبيه: يوجد مراجعات قديمة تحتاج اعتدالًا يدويًا!')
    console.log(`   📋 ${pendingReviewsCount} مراجعة في /admin/reviews`)
    console.log('   💡 الأدمن يجب أن يراجعها قبل أن تصبح ظاهرة للجمهور\n')
  }

  console.log('═══════════════════════════════════════════')
  console.log('🎉 اكتمل ترحيل بيانات Sprint 0 بنجاح!')
  console.log('═══════════════════════════════════════════')
  console.log(`📋 فصول محدثة:       ${chaptersWithoutOrder.length}`)
  console.log(`💬 مراجعات معلّقة:    ${pendingReviewsCount} (تحتاج اعتدالًا يدويًا)`)
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

