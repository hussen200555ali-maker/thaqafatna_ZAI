import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/books/[id]/download
 * زيادة عدّاد التنزيلات وإعادة توجيه لرابط الـ PDF المباشر
 *
 * المتطلبات:
 *   - userId في query parameter (للتحقق من تسجيل الدخول)
 *   - مثال: /api/books/1/download?userId=user-abc
 *
 * الاستجابة:
 *   - 302 Redirect إلى رابط الـ PDF على Vercel Blob
 *   - أو 401 إذا لم يُمرّر userId
 *   - أو 404 إذا لم يوجد الكتاب أو الـ PDF
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bookId = parseInt(id, 10)

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'معرّف الكتاب غير صالح' }, { status: 400 })
    }

    // التحقق من تسجيل الدخول (userId مطلوب)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || userId.trim().length < 3) {
      return NextResponse.json(
        {
          error: 'يجب تسجيل الدخول لتنزيل الكتاب',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: 'المستخدم غير موجود. سجّل دخولك.',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    // التحقق من وجود الكتاب وملف الـ PDF
    const book = await db.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        pdfUrl: true,
        pdfFileName: true,
        pdfSize: true,
        isPublished: true,
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 })
    }

    if (!book.isPublished) {
      return NextResponse.json({ error: 'الكتاب غير منشور' }, { status: 403 })
    }

    if (!book.pdfUrl) {
      return NextResponse.json(
        { error: 'لا يوجد ملف PDF لهذا الكتاب' },
        { status: 404 }
      )
    }

    // زيادة عدّاد التنزيلات
    await db.book.update({
      where: { id: bookId },
      data: { downloads: { increment: 1 } },
    })

    // تسجيل الحدث (اختياري)
    console.log(`📥 Book ${bookId} downloaded by user ${userId} (${user.name})`)

    // إعادة توجيه لرابط التنزيل المباشر
    // Vercel Blob URLs support ?download=true to force download
    const downloadUrl = book.pdfUrl.includes('?')
      ? `${book.pdfUrl}&download=1`
      : `${book.pdfUrl}?download=1`

    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Download-Filename': encodeURIComponent(book.pdfFileName || `${book.title}.pdf`),
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'فشل التنزيل', details: error.message },
      { status: 500 }
    )
  }
}
