import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/books/my-library?userId=xxx
 * جلب مكتبة المستخدم الشخصية:
 * - الكتب التي أضافها للمفضلة (bookmarks)
 * - الكتب التي بدأ قراءتها (reading progress)
 * - الكتب التي أكملها
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, coins: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 1. الكتب المفضلة (Bookmarks)
    const bookmarks = await db.userBookmark.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            category: true,
            _count: { select: { chapters: true, reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. تقدّم القراءة
    const readingProgress = await db.userReadingProgress.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            category: true,
            _count: { select: { chapters: true, reviews: true } },
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
    })

    // 3. الكتب المكتملة (تمت قراءة 90%+ من الفصول)
    const completedBooks = readingProgress.filter((rp) => {
      const completed = (() => {
        try {
          const arr = JSON.parse(rp.completedChapters || '[]')
          return Array.isArray(arr) ? arr.length : 0
        } catch {
          return 0
        }
      })()
      const total = rp.book._count?.chapters || 1
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      return rate >= 90
    })

    // 4. الكتب قيد القراءة (بدأت لكن لم تكمل)
    const inProgressBooks = readingProgress.filter((rp) => {
      const completed = (() => {
        try {
          const arr = JSON.parse(rp.completedChapters || '[]')
          return Array.isArray(arr) ? arr.length : 0
        } catch {
          return 0
        }
      })()
      const total = rp.book._count?.chapters || 1
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      return rate < 90
    })

    // 5. التقييمات التي قام بها المستخدم
    const userReviews = await db.bookReview.findMany({
      where: { userId },
      include: {
        book: {
          select: { id: true, title: true, author: true, coverImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 6. الشهادات التي حصل عليها
    const certificates = await db.userCertificate.findMany({
      where: { userId },
      include: {
        book: {
          select: { id: true, title: true, author: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    })

    // إحصائيات شاملة
    const stats = {
      totalBookmarks: bookmarks.length,
      totalReading: inProgressBooks.length,
      totalCompleted: completedBooks.length,
      totalReviews: userReviews.length,
      totalCertificates: certificates.length,
      totalReadingMinutes: readingProgress.reduce((sum, rp) => sum + (rp.timeSpentSec || 0) / 60, 0),
    }

    return NextResponse.json({
      user,
      stats,
      bookmarks: bookmarks.map((b) => ({
        ...b,
        book: {
          ...b.book,
          keywords: (() => {
            try {
              const k = JSON.parse(b.book.keywords || '[]')
              return Array.isArray(k) ? k : []
            } catch {
              return []
            }
          })(),
        },
      })),
      inProgress: inProgressBooks.map((rp) => ({
        ...rp,
        book: {
          ...rp.book,
          keywords: (() => {
            try {
              const k = JSON.parse(rp.book.keywords || '[]')
              return Array.isArray(k) ? k : []
            } catch {
              return []
            }
          })(),
        },
      })),
      completed: completedBooks.map((rp) => ({
        ...rp,
        book: {
          ...rp.book,
          keywords: (() => {
            try {
              const k = JSON.parse(rp.book.keywords || '[]')
              return Array.isArray(k) ? k : []
            } catch {
              return []
            }
          })(),
        },
      })),
      reviews: userReviews,
      certificates,
    })
  } catch (error) {
    console.error('Error fetching my library:', error)
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}
