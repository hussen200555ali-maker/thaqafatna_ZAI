/**
 * 📚 seed-demo-content.ts — توليد محتوى تجريبي لاختبار UAT
 *
 * التشغيل:
 *   npx tsx scripts/seed-demo-content.ts
 *
 * المُولّد:
 *   - 10 كتب تجريبية (مع تصنيفاتها)
 *   - 5 مراجعات معلّقة (status: pending)
 *   - 3 رسائل تواصل (status: new)
 *
 * آمن: يتخطّى العناصر الموجودة (idempotent)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============== 1. الكتب التجريبية ==============

interface DemoBook {
  title: string
  author: string
  description: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  difficulty: string
  pages: number
  readingTimeMin: number
  keywords: string
  isFeatured: boolean
  status: 'published' | 'draft'
}

const demoBooks: DemoBook[] = [
  {
    title: 'مقدمة ابن خلدون',
    author: 'عبد الرحمن بن خلدون',
    description: 'من أعظم الكتب التي وُضعت في علم العمران البشري، ألّفه ابن خلدون في القرن الرابع عشر وقدّم فيه نظرة فلسفية عميقة في نشأة الدول وسقوطها.',
    categoryName: 'التاريخ والتراث',
    categoryIcon: '📜',
    categoryColor: 'linear-gradient(135deg, #f59e0b, #b45309)',
    difficulty: 'hard',
    pages: 412,
    readingTimeMin: 65,
    keywords: 'تاريخ, اجتماع, فلسفة, عمران',
    isFeatured: true,
    status: 'published',
  },
  {
    title: 'البلاء والتبين',
    author: 'الجاحظ',
    description: 'من كتب الأدب العربي الكلاسيكية، يتناول فيه الجاحظ مواضيع متنوعة بأسلوبه الساخر العميق.',
    categoryName: 'الأدب العربي',
    categoryIcon: '📖',
    categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    difficulty: 'medium',
    pages: 280,
    readingTimeMin: 45,
    keywords: 'أدب, بلاغة, كلاسيكيات',
    isFeatured: true,
    status: 'published',
  },
  {
    title: 'رياض الصالحين',
    author: 'الإمام النووي',
    description: 'مجموعة من الأحاديث النبوية الشريفة، مرتّبة حسب الموضوعات، من أهم المراجع الدينية.',
    categoryName: 'الكتب الدينية',
    categoryIcon: '🕌',
    categoryColor: 'linear-gradient(135deg, #10b981, #047857)',
    difficulty: 'easy',
    pages: 650,
    readingTimeMin: 120,
    keywords: 'دين, أحاديث, إسلام',
    isFeatured: true,
    status: 'published',
  },
  {
    title: 'الأغاني',
    author: 'أبو الفرج الأصفهاني',
    description: 'موسوعة أدبية ضخمة جمع فيها المؤلف أخبار العرب وأشعارهم وأنسابهم وأيامهم.',
    categoryName: 'الأدب العربي',
    categoryIcon: '📖',
    categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    difficulty: 'hard',
    pages: 1200,
    readingTimeMin: 200,
    keywords: 'أدب, شعر, تاريخ, موسيقى',
    isFeatured: false,
    status: 'published',
  },
  {
    title: 'مقامات الحريري',
    author: 'الحريري البصري',
    description: 'مجموعة من المقامات الأدبية البديعة، تُعد من روائع النثر العربي.',
    categoryName: 'الأدب العربي',
    categoryIcon: '📖',
    categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    difficulty: 'medium',
    pages: 320,
    readingTimeMin: 50,
    keywords: 'مقامات, أدب, بلاغة',
    isFeatured: false,
    status: 'published',
  },
  {
    title: 'العقد الفريد',
    author: 'ابن عبد ربه الأندلسي',
    description: 'موسوعة أدبية تاريخية، جمع فيها المؤلف من كل فن غرره ومن كل علم جوهره.',
    categoryName: 'الأدب العربي',
    categoryIcon: '📖',
    categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    difficulty: 'medium',
    pages: 540,
    readingTimeMin: 80,
    keywords: 'أدب, تاريخ, أنساب',
    isFeatured: false,
    status: 'published',
  },
  {
    title: 'تاريخ الطبري',
    author: 'محمد بن جرير الطبري',
    description: 'من أهم كتب التاريخ الإسلامي، يغطي تاريخ الأمم من بداية الخلق حتى عصر المؤلف.',
    categoryName: 'التاريخ والتراث',
    categoryIcon: '📜',
    categoryColor: 'linear-gradient(135deg, #f59e0b, #b45309)',
    difficulty: 'hard',
    pages: 1500,
    readingTimeMin: 250,
    keywords: 'تاريخ, إسلام, خلافة',
    isFeatured: false,
    status: 'published',
  },
  {
    title: 'البخلاء',
    author: 'الجاحظ',
    description: 'كتاب طريف يصف البخلاء وأخبارهم بأسلوب ساخر ممتع.',
    categoryName: 'الأدب العربي',
    categoryIcon: '📖',
    categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    difficulty: 'easy',
    pages: 180,
    readingTimeMin: 30,
    keywords: 'أدب, سخريه, أخلاق',
    isFeatured: true,
    status: 'published',
  },
  {
    title: 'كليلة ودمنة',
    author: 'ابن المقفع',
    description: 'كتاب حكم وأمثال على ألسنة الحيوانات، من أهم كتب الأدب التربوي.',
    categoryName: 'أدب الأطفال',
    categoryIcon: '🧸',
    categoryColor: 'linear-gradient(135deg, #f97316, #9a3412)',
    difficulty: 'easy',
    pages: 220,
    readingTimeMin: 35,
    keywords: 'حكم, أمثال, تربية, قصص',
    isFeatured: true,
    status: 'published',
  },
  {
    title: 'فقة السيرة النبوية',
    author: 'محمد الغزالي',
    description: 'كتاب يقدم السيرة النبوية بأسلوب معاصر، يستخلص الدروس والعبر من حياة الرسول.',
    categoryName: 'الكتب الدينية',
    categoryIcon: '🕌',
    categoryColor: 'linear-gradient(135deg, #10b981, #047857)',
    difficulty: 'medium',
    pages: 380,
    readingTimeMin: 60,
    keywords: 'سيرة, دين, إسلام, نبوي',
    isFeatured: false,
    status: 'draft', // مسودة لاختبار صفحة الكتب
  },
]

// ============== 2. المراجعات المعلّقة ==============

interface DemoReview {
  bookTitle: string
  rating: number
  review: string
  isSuspicious?: boolean
}

const demoReviews: DemoReview[] = [
  {
    bookTitle: 'مقدمة ابن خلدون',
    rating: 5,
    review: 'كتاب غيّر نظرتي للتاريخ تمامًا. ابن خلدون ليس مجرد مؤرخ، بل فيلسوف اجتماعي سبق عصره بقرون. قراءتي لهذا الكتاب كانت رحلة فكرية عميقة.',
  },
  {
    bookTitle: 'رياض الصالحين',
    rating: 5,
    review: 'كتاب رائع جدًا! اشترِ منصتك من bestdeals.com لزيادة المبيعات! رابط: suspicious-link.com',
    isSuspicious: true,
  },
  {
    bookTitle: 'البلاء والتبين',
    rating: 4,
    review: 'قراءة ممتعة لكن بعض الفصول معقدة وتحتاج تركيزًا عاليًا. أنصح المبتدئين بقراءة الفصول الأولى فقط.',
  },
  {
    bookTitle: 'مقامات الحريري',
    rating: 5,
    review: 'من روائع الأدب العربي، الأسلوب بديع والمعاني عميقة. أنصح به لكل مهتم باللغة العربية.',
  },
  {
    bookTitle: 'كليلة ودمنة',
    rating: 4,
    review: 'كتاب جميل للأطفال والكبار على حد سواء. القصص تحمل حكمًا عميقة بأسلوب مبسط.',
  },
]

// ============== 3. رسائل التواصل ==============

interface DemoMessage {
  name: string
  email: string
  bookTitle?: string
  message: string
}

const demoMessages: DemoMessage[] = [
  {
    name: 'أحمد المصري',
    email: 'ahmed@example.com',
    bookTitle: 'كتاب السيرة الذاتية لأبي حيان التوحيدي',
    message: 'السلام عليكم، أود اقتراح إضافة كتاب «المقابسات» لأبي حيان التوحيدي. وهو من أهم كتب الأدب العربي الكلاسيكي.',
  },
  {
    name: 'فاطمة الزهراء',
    email: 'fatima@example.com',
    message: 'شكرًا على هذه المنصة الرائعة. لدي ملاحظة بسيطة: البحث عن الكتب يحتاج تحسين في دقة النتائج عند البحث بكلمات عربية.',
  },
  {
    name: 'خالد العتيبي',
    email: 'khalid@example.com',
    bookTitle: 'كتاب في الفقه الإسلامي',
    message: 'أرغب في رفع كتابي «مختصر أحكام الطهارة» على المنصة. كيف يمكنني ذلك؟ وهل هناك شروط معينة؟',
  },
]

// ============== Main ==============

async function main() {
  console.log('📚 بدء توليد المحتوى التجريبي...\n')

  // ===== 1. التصنيات =====
  console.log('📂 1. إنشاء/تحديث التصنيفات...')
  const categoriesMap = new Map<string, number>()

  for (const book of demoBooks) {
    if (categoriesMap.has(book.categoryName)) continue

    const existing = await prisma.bookCategory.findFirst({
      where: { name: book.categoryName },
    })

    let categoryId: number
    if (existing) {
      categoryId = existing.id
      console.log(`   ✅ تصنيف موجود: ${book.categoryName} (#${categoryId})`)
    } else {
      const cat = await prisma.bookCategory.create({
        data: {
          name: book.categoryName,
          icon: book.categoryIcon,
          color: book.categoryColor,
          slug: book.categoryName.replace(/\s+/g, '-').toLowerCase(),
          isPublished: true,
        },
      })
      categoryId = cat.id
      console.log(`   ✅ تصنيف جديد: ${book.categoryName} (#${categoryId})`)
    }
    categoriesMap.set(book.categoryName, categoryId)
  }

  // ===== 2. الكتب =====
  console.log('\n📚 2. إنشاء/تحديث الكتب...')
  const booksMap = new Map<string, number>()

  for (const book of demoBooks) {
    if (booksMap.has(book.title)) continue

    const categoryId = categoriesMap.get(book.categoryName)!
    const existing = await prisma.book.findFirst({
      where: { title: book.title },
    })

    let bookId: number
    if (existing) {
      // تحديث
      await prisma.book.update({
        where: { id: existing.id },
        data: {
          author: book.author,
          description: book.description,
          categoryId,
          difficulty: book.difficulty,
          pages: book.pages,
          readingTimeMin: book.readingTimeMin,
          keywords: JSON.stringify(book.keywords.split(',').map((k) => k.trim())),
          isFeatured: book.isFeatured,
          status: book.status,
          isPublished: book.status === 'published',
        },
      })
      bookId = existing.id
      console.log(`   ✅ تحديث: ${book.title}`)
    } else {
      const created = await prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          description: book.description,
          categoryId,
          difficulty: book.difficulty,
          pages: book.pages,
          readingTimeMin: book.readingTimeMin,
          language: 'ar',
          keywords: JSON.stringify(book.keywords.split(',').map((k) => k.trim())),
          isFeatured: book.isFeatured,
          isPremium: false,
          status: book.status,
          isPublished: book.status === 'published',
          views: Math.floor(Math.random() * 5000) + 500,
          downloads: Math.floor(Math.random() * 1500) + 100,
          ratingAvg: 3.5 + Math.random() * 1.5,
          ratingCount: Math.floor(Math.random() * 500) + 50,
        },
      })
      bookId = created.id
      console.log(`   ✅ كتاب جديد: ${book.title} (#${bookId})`)
    }
    booksMap.set(book.title, bookId)
  }

  // ===== 3. المراجعات =====
  console.log('\n⭐ 3. إنشاء/تحديث المراجعات المعلّقة...')

  // جلب مستخدمين موجودين (readers)
  const readerRole = await prisma.role.findUnique({ where: { name: 'reader' } })
  const users = readerRole
    ? await prisma.user.findMany({
        where: { userRoles: { some: { roleId: readerRole.id } } },
        take: 5,
      })
    : []

  // لو لا يوجد قرّاء، نستخدم أول مستخدم
  let reviewUsers = users
  if (reviewUsers.length === 0) {
    reviewUsers = await prisma.user.findMany({ take: 1 })
  }

  if (reviewUsers.length === 0) {
    console.log('   ⚠️ لا يوجد مستخدمون. شغّل scripts/seed-test-users.ts أولاً.')
  } else {
    for (let i = 0; i < demoReviews.length; i++) {
      const review = demoReviews[i]
      const bookId = booksMap.get(review.bookTitle)
      const userId = reviewUsers[i % reviewUsers.length].id

      if (!bookId) {
        console.log(`   ⚠️ كتاب غير موجود: ${review.bookTitle}`)
        continue
      }

      // التحقق من عدم وجود مراجعة مكررة
      const existing = await prisma.bookReview.findFirst({
        where: { userId, bookId },
      })
      if (existing) {
        console.log(`   ⚠️ مراجعة موجودة لـ ${review.bookTitle}`)
        continue
      }

      await prisma.bookReview.create({
        data: {
          userId,
          bookId,
          rating: review.rating,
          review: review.review,
          status: 'pending',
          likes: Math.floor(Math.random() * 20),
        },
      })
      const tag = review.isSuspicious ? ' ⚠️ (مشبوهة)' : ''
      console.log(`   ✅ مراجعة لـ "${review.bookTitle}"${tag}`)
    }
  }

  // ===== 4. رسائل التواصل =====
  console.log('\n📧 4. إنشاء رسائل التواصل...')

  for (let i = 0; i < demoMessages.length; i++) {
    const msg = demoMessages[i]

    const existing = await prisma.contactMessage.findFirst({
      where: { email: msg.email, message: msg.message },
    })
    if (existing) {
      console.log(`   ⚠️ رسالة موجودة من ${msg.name}`)
      continue
    }

    await prisma.contactMessage.create({
      data: {
        name: msg.name,
        email: msg.email,
        bookTitle: msg.bookTitle || null,
        message: msg.message,
        status: 'new',
      },
    })
    console.log(`   ✅ رسالة من ${msg.name}`)
  }

  // ===== ملخص =====
  console.log('\n═══════════════════════════════════════════════════')
  console.log('🎉 اكتمل توليد المحتوى التجريبي!\n')
  console.log(`   📚 كتب: ${demoBooks.length}`)
  console.log(`   ⭐ مراجعات معلّقة: ${demoReviews.length} (1 مشبوهة)`)
  console.log(`   📧 رسائل تواصل: ${demoMessages.length}`)
  console.log('═══════════════════════════════════════════════════')
  console.log('\n📝 الخطوات التالية:')
  console.log('   1. سجّل دخول كأدمن: admin@thaqafatna.com / Admin123!')
  console.log('   2. راجع المراجعات المعلّقة في /admin/reviews')
  console.log('   3. راجع رسائل التواصل في /admin/messages')
  console.log('   4. اقرأ UAT_SCENARIOS.md لتسجيل ملاحظاتك')
}

main()
  .catch((err) => {
    console.error('❌ خطأ:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
