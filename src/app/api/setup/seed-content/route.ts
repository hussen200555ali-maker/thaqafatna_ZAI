/**
 * 📚 POST /api/setup/seed-content — مؤقت لتشغيل seed-demo-content على الإنتاج
 *
 * ⚠️ احذف هذا الـ endpoint بعد الاستخدام!
 *
 * Usage:
 *   curl -X POST "https://thaqafatna-qr.vercel.app/api/setup/seed-content?secret=AUTH_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SETUP_SECRET = process.env.AUTH_SECRET || 'test'

// 10 كتب تجريبية
const demoBooks = [
  { title: 'مقدمة ابن خلدون', author: 'عبد الرحمن بن خلدون', description: 'من أعظم الكتب في علم العمران البشري، ألّفه ابن خلدون في القرن الرابع عشر وقدّم فيه نظرة فلسفية عميقة في نشأة الدول وسقوطها.', categoryName: 'التاريخ والتراث', categoryIcon: '📜', categoryColor: 'linear-gradient(135deg, #f59e0b, #b45309)', difficulty: 'hard', pages: 412, readingTimeMin: 65, keywords: 'تاريخ, اجتماع, فلسفة, عمران', isFeatured: true, status: 'published' },
  { title: 'البلاء والتبين', author: 'الجاحظ', description: 'من كتب الأدب العربي الكلاسيكية، يتناول فيه الجاحظ مواضيع متنوعة بأسلوبه الساخر العميق.', categoryName: 'الأدب العربي', categoryIcon: '📖', categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', difficulty: 'medium', pages: 280, readingTimeMin: 45, keywords: 'أدب, بلاغة, كلاسيكيات', isFeatured: true, status: 'published' },
  { title: 'رياض الصالحين', author: 'الإمام النووي', description: 'مجموعة من الأحاديث النبوية الشريفة، مرتّبة حسب الموضوعات، من أهم المراجع الدينية.', categoryName: 'الكتب الدينية', categoryIcon: '🕌', categoryColor: 'linear-gradient(135deg, #10b981, #047857)', difficulty: 'easy', pages: 650, readingTimeMin: 120, keywords: 'دين, أحاديث, إسلام', isFeatured: true, status: 'published' },
  { title: 'الأغاني', author: 'أبو الفرج الأصفهاني', description: 'موسوعة أدبية ضخمة جمع فيها المؤلف أخبار العرب وأشعارهم وأنسابهم وأيامهم.', categoryName: 'الأدب العربي', categoryIcon: '📖', categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', difficulty: 'hard', pages: 1200, readingTimeMin: 200, keywords: 'أدب, شعر, تاريخ, موسيقى', isFeatured: false, status: 'published' },
  { title: 'مقامات الحريري', author: 'الحريري البصري', description: 'مجموعة من المقامات الأدبية البديعة، تُعد من روائع النثر العربي.', categoryName: 'الأدب العربي', categoryIcon: '📖', categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', difficulty: 'medium', pages: 320, readingTimeMin: 50, keywords: 'مقامات, أدب, بلاغة', isFeatured: false, status: 'published' },
  { title: 'العقد الفريد', author: 'ابن عبد ربه الأندلسي', description: 'موسوعة أدبية تاريخية، جمع فيها المؤلف من كل فن غرره ومن كل علم جوهره.', categoryName: 'الأدب العربي', categoryIcon: '📖', categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', difficulty: 'medium', pages: 540, readingTimeMin: 80, keywords: 'أدب, تاريخ, أنساب', isFeatured: false, status: 'published' },
  { title: 'تاريخ الطبري', author: 'محمد بن جرير الطبري', description: 'من أهم كتب التاريخ الإسلامي، يغطي تاريخ الأمم من بداية الخلق حتى عصر المؤلف.', categoryName: 'التاريخ والتراث', categoryIcon: '📜', categoryColor: 'linear-gradient(135deg, #f59e0b, #b45309)', difficulty: 'hard', pages: 1500, readingTimeMin: 250, keywords: 'تاريخ, إسلام, خلافة', isFeatured: false, status: 'published' },
  { title: 'البخلاء', author: 'الجاحظ', description: 'كتاب طريف يصف البخلاء وأخبارهم بأسلوب ساخر ممتع.', categoryName: 'الأدب العربي', categoryIcon: '📖', categoryColor: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', difficulty: 'easy', pages: 180, readingTimeMin: 30, keywords: 'أدب, سخريه, أخلاق', isFeatured: true, status: 'published' },
  { title: 'كليلة ودمنة', author: 'ابن المقفع', description: 'كتاب حكم وأمثال على ألسنة الحيوانات، من أهم كتب الأدب التربوي.', categoryName: 'أدب الأطفال', categoryIcon: '🧸', categoryColor: 'linear-gradient(135deg, #f97316, #9a3412)', difficulty: 'easy', pages: 220, readingTimeMin: 35, keywords: 'حكم, أمثال, تربية, قصص', isFeatured: true, status: 'published' },
  { title: 'فقة السيرة النبوية', author: 'محمد الغزالي', description: 'كتاب يقدم السيرة النبوية بأسلوب معاصر، يستخلص الدروس والعبر من حياة الرسول.', categoryName: 'الكتب الدينية', categoryIcon: '🕌', categoryColor: 'linear-gradient(135deg, #10b981, #047857)', difficulty: 'medium', pages: 380, readingTimeMin: 60, keywords: 'سيرة, دين, إسلام, نبوي', isFeatured: false, status: 'draft' },
]

// 5 مراجعات معلّقة (1 مشبوهة)
const demoReviews = [
  { bookTitle: 'مقدمة ابن خلدون', rating: 5, review: 'كتاب غيّر نظرتي للتاريخ تمامًا. ابن خلدون ليس مجرد مؤرخ، بل فيلسوف اجتماعي سبق عصره بقرون. قراءتي لهذا الكتاب كانت رحلة فكرية عميقة.', isSuspicious: false },
  { bookTitle: 'رياض الصالحين', rating: 5, review: 'كتاب رائع جدًا! اشترِ منصتك من bestdeals.com لزيادة المبيعات! رابط: suspicious-link.com', isSuspicious: true },
  { bookTitle: 'البلاء والتبين', rating: 4, review: 'قراءة ممتعة لكن بعض الفصول معقدة وتحتاج تركيزًا عاليًا. أنصح المبتدئين بقراءة الفصول الأولى فقط.', isSuspicious: false },
  { bookTitle: 'مقامات الحريري', rating: 5, review: 'من روائع الأدب العربي، الأسلوب بديع والمعاني عميقة. أنصح به لكل مهتم باللغة العربية.', isSuspicious: false },
  { bookTitle: 'كليلة ودمنة', rating: 4, review: 'كتاب جميل للأطفال والكبار على حد سواء. القصص تحمل حكمًا عميقة بأسلوب مبسط.', isSuspicious: false },
]

// 3 رسائل تواصل
const demoMessages = [
  { name: 'أحمد المصري', email: 'ahmed@example.com', bookTitle: 'كتاب السيرة الذاتية لأبي حيان التوحيدي', message: 'السلام عليكم، أود اقتراح إضافة كتاب «المقابسات» لأبي حيان التوحيدي. وهو من أهم كتب الأدب العربي الكلاسيكي.' },
  { name: 'فاطمة الزهراء', email: 'fatima@example.com', bookTitle: null, message: 'شكرًا على هذه المنصة الرائعة. لدي ملاحظة بسيطة: البحث عن الكتب يحتاج تحسين في دقة النتائج عند البحث بكلمات عربية.' },
  { name: 'خالد العتيبي', email: 'khalid@example.com', bookTitle: 'كتاب في الفقه الإسلامي', message: 'أرغب في رفع كتابي «مختصر أحكام الطهارة» على المنصة. كيف يمكنني ذلك؟ وهل هناك شروط معينة؟' },
]

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret

  if (providedSecret !== SETUP_SECRET) {
    return NextResponse.json(
      { error: 'غير مصرّح. أضف ?secret=AUTH_SECRET' },
      { status: 401 }
    )
  }

  try {
    const stats = { categories: 0, books: 0, reviews: 0, messages: 0 }

    // 1. التصنيفات + الكتب
    const categoriesMap = new Map<string, number>()
    const booksMap = new Map<string, number>()

    for (const book of demoBooks) {
      // تصنيف
      if (!categoriesMap.has(book.categoryName)) {
        const existing = await db.bookCategory.findFirst({ where: { name: book.categoryName } })
        let categoryId: number
        if (existing) {
          categoryId = existing.id
        } else {
          const cat = await db.bookCategory.create({
            data: {
              name: book.categoryName,
              icon: book.categoryIcon,
              color: book.categoryColor,
              slug: book.categoryName.replace(/\s+/g, '-').toLowerCase(),
              isPublished: true,
            },
          })
          categoryId = cat.id
          stats.categories++
        }
        categoriesMap.set(book.categoryName, categoryId)
      }

      // كتاب
      const categoryId = categoriesMap.get(book.categoryName)!
      if (!booksMap.has(book.title)) {
        const existing = await db.book.findFirst({ where: { title: book.title } })
        let bookId: number
        if (existing) {
          await db.book.update({
            where: { id: existing.id },
            data: {
              author: book.author, description: book.description, categoryId,
              difficulty: book.difficulty, pages: book.pages, readingTimeMin: book.readingTimeMin,
              keywords: JSON.stringify(book.keywords.split(',').map((k) => k.trim())),
              isFeatured: book.isFeatured, status: book.status as any,
              isPublished: book.status === 'published',
            },
          })
          bookId = existing.id
        } else {
          const created = await db.book.create({
            data: {
              title: book.title, author: book.author, description: book.description, categoryId,
              difficulty: book.difficulty, pages: book.pages, readingTimeMin: book.readingTimeMin,
              language: 'ar',
              keywords: JSON.stringify(book.keywords.split(',').map((k) => k.trim())),
              isFeatured: book.isFeatured, isPremium: false, status: book.status as any,
              isPublished: book.status === 'published',
              views: Math.floor(Math.random() * 5000) + 500,
              downloads: Math.floor(Math.random() * 1500) + 100,
              ratingAvg: 3.5 + Math.random() * 1.5,
              ratingCount: Math.floor(Math.random() * 500) + 50,
            },
          })
          bookId = created.id
          stats.books++
        }
        booksMap.set(book.title, bookId)
      }
    }

    // 2. المراجعات
    const readerRole = await db.role.findUnique({ where: { name: 'reader' } })
    let reviewUsers: any[] = []
    if (readerRole) {
      reviewUsers = await db.user.findMany({
        where: { userRoles: { some: { roleId: readerRole.id } } },
        take: 5,
      })
    }
    if (reviewUsers.length === 0) {
      reviewUsers = await db.user.findMany({ take: 1 })
    }

    if (reviewUsers.length > 0) {
      for (let i = 0; i < demoReviews.length; i++) {
        const review = demoReviews[i]
        const bookId = booksMap.get(review.bookTitle)
        const userId = reviewUsers[i % reviewUsers.length].id

        if (!bookId) continue

        const existing = await db.bookReview.findFirst({ where: { userId, bookId } })
        if (existing) continue

        await db.bookReview.create({
          data: {
            userId, bookId, rating: review.rating, review: review.review,
            status: 'pending', likes: Math.floor(Math.random() * 20),
          },
        })
        stats.reviews++
      }
    }

    // 3. رسائل التواصل
    for (const msg of demoMessages) {
      const existing = await db.contactMessage.findFirst({
        where: { email: msg.email, message: msg.message },
      })
      if (existing) continue

      await db.contactMessage.create({
        data: {
          name: msg.name, email: msg.email, bookTitle: msg.bookTitle,
          message: msg.message, status: 'new',
        },
      })
      stats.messages++
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المحتوى التجريبي بنجاح',
      stats: {
        newCategories: stats.categories,
        newBooks: stats.books,
        newReviews: stats.reviews,
        newMessages: stats.messages,
        suspiciousReviews: demoReviews.filter((r) => r.isSuspicious).length,
      },
      totals: {
        categories: await db.bookCategory.count(),
        books: await db.book.count(),
        pendingReviews: await db.bookReview.count({ where: { status: 'pending' } }),
        newMessages: await db.contactMessage.count({ where: { status: 'new' } }),
      },
      warning: '⚠️ احذف /api/setup/seed-content بعد UAT!',
      nextSteps: [
        '1. ادخل /admin/login بحساب admin@thaqafatna.com / Admin123!',
        '2. راجع /admin/reviews (5 مراجعات بانتظار)',
        '3. راجع /admin/messages (3 رسائل جديدة)',
        '4. راجع /admin/books (10 كتب)',
      ],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'فشل', details: error.message || String(error) },
      { status: 500 }
    )
  }
}
