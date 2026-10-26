import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/books/authors
 * جلب قائمة بكل المؤلفين مع إحصائياتهم
 */
export async function GET() {
  try {
    // جلب كل الكتب المنشورة
    const books = await db.book.findMany({
      where: { isPublished: true },
      select: {
        author: true,
        views: true,
        downloads: true,
        ratingAvg: true,
        isFeatured: true,
      },
    })

    // تجميع حسب المؤلف
    const authorMap = new Map<string, {
      name: string
      booksCount: number
      totalViews: number
      totalDownloads: number
      totalRating: number
      ratingCount: number
      featuredCount: number
    }>()

    books.forEach((book) => {
      const author = book.author.trim()
      if (!author) return

      const existing = authorMap.get(author) || {
        name: author,
        booksCount: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalRating: 0,
        ratingCount: 0,
        featuredCount: 0,
      }

      existing.booksCount++
      existing.totalViews += book.views
      existing.totalDownloads += book.downloads
      if (book.ratingAvg > 0) {
        existing.totalRating += book.ratingAvg
        existing.ratingCount++
      }
      if (book.isFeatured) existing.featuredCount++

      authorMap.set(author, existing)
    })

    // تحويل لقائمة مرتبة
    const authors = Array.from(authorMap.values())
      .map((a) => ({
        ...a,
        avgRating: a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0,
      }))
      .sort((a, b) => b.totalViews - a.totalViews) // الأكثر مشاهدة أولاً

    return NextResponse.json({ authors })
  } catch (error) {
    console.error('Error fetching authors:', error)
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 })
  }
}
