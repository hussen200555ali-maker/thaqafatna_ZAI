import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/books/by-author?name=xxx
 * جلب كل كتب مؤلف معيّن
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorName = searchParams.get('name')

    if (!authorName) {
      return NextResponse.json({ error: 'اسم المؤلف مطلوب' }, { status: 400 })
    }

    // جلب كل كتب المؤلف
    const books = await db.book.findMany({
      where: {
        author: {
          contains: authorName,
          mode: 'insensitive',
        },
        isPublished: true,
      },
      include: {
        category: true,
        _count: { select: { chapters: true, reviews: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { views: 'desc' }],
    })

    if (books.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على كتب لهذا المؤلف' }, { status: 404 })
    }

    // إحصائيات المؤلف
    const stats = {
      totalBooks: books.length,
      totalViews: books.reduce((sum, b) => sum + b.views, 0),
      totalDownloads: books.reduce((sum, b) => sum + b.downloads, 0),
      avgRating: books.length > 0 ? books.reduce((sum, b) => sum + b.ratingAvg, 0) / books.length : 0,
      featuredBooks: books.filter(b => b.isFeatured).length,
    }

    return NextResponse.json({
      author: {
        name: authorName,
        ...stats,
      },
      books: books.map(b => ({
        ...b,
        keywords: (() => {
          try {
            const k = JSON.parse(b.keywords || '[]')
            return Array.isArray(k) ? k : []
          } catch {
            return []
          }
        })(),
      })),
    })
  } catch (error) {
    console.error('Error fetching author books:', error)
    return NextResponse.json({ error: 'Failed to fetch author books' }, { status: 500 })
  }
}
