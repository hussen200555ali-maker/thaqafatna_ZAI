import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'

/**
 * POST /api/admin/books/[id]/upload-pdf
 * رفع ملف PDF لكتاب معيّن
 *
 * Headers:
 *   - x-admin-key: مفتاح الإدارة (للحماية البسيطة)
 *
 * Body: multipart/form-data
 *   - file: ملف PDF (حتى 50 ميجابايت)
 *
 * Response:
 *   {
 *     success: true,
 *     pdfUrl: "https://...",
 *     pdfSize: 1234567,
 *     pdfFileName: "book.pdf"
 *   }
 */

const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME = ['application/pdf']
const ADMIN_KEY = process.env.ADMIN_KEY || 'thaqafatna-admin-2026'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bookId = parseInt(id, 10)

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'معرّف الكتاب غير صالح' },
        { status: 400 }
      )
    }

    // التحقق من مفتاح الإدارة
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'غير مصرّح. مفتاح الإدارة مطلوب.' },
        { status: 401 }
      )
    }

    // التحقق من وجود الكتاب
    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return NextResponse.json(
        { error: 'الكتاب غير موجود' },
        { status: 404 }
      )
    }

    // استخراج الملف من الطلب
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرسال ملف' },
        { status: 400 }
      )
    }

    // التحقق من نوع الملف
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `نوع الملف غير مدعوم. يجب أن يكون PDF. المُستلم: ${file.type}` },
        { status: 400 }
      )
    }

    // التحقق من حجم الملف
    if (file.size > MAX_PDF_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      const maxMB = MAX_PDF_SIZE / (1024 * 1024)
      return NextResponse.json(
        { error: `حجم الملف ${sizeMB} MB يتجاوز الحد الأقصى ${maxMB} MB` },
        { status: 400 }
      )
    }

    // حذف الـ PDF القديم إن وجد
    if (book.pdfUrl) {
      try {
        const { del } = await import('@vercel/blob')
        await del(book.pdfUrl)
        console.log(`🗑️ Deleted old PDF: ${book.pdfUrl}`)
      } catch (e) {
        console.warn('Failed to delete old PDF:', e)
      }
    }

    // رفع الملف إلى Vercel Blob
    const safeFileName = file.name.replace(/[^\w\u0600-\u06FF.-]/g, '_')
    const blobPath = `books/${bookId}/pdf/${Date.now()}-${safeFileName}`

    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf',
    })

    // محاولة استخراج عدد الصفحات (بسيطة - من حجم الملف تقريبًا)
    const estimatedPages = Math.max(1, Math.floor(file.size / 3000)) // ~3KB per page average

    // تحديث الكتاب في قاعدة البيانات
    await db.book.update({
      where: { id: bookId },
      data: {
        pdfUrl: blob.url,
        pdfFileName: file.name,
        pdfSize: file.size,
        pdfPageCount: estimatedPages,
        contentType: 'pdf',
        uploadedAt: new Date(),
        // تحديث عدد الصفحات الرسمي إن كان صفرًا
        pages: book.pages || estimatedPages,
      },
    })

    console.log(`✅ PDF uploaded for book ${bookId}: ${blob.url}`)

    return NextResponse.json({
      success: true,
      pdfUrl: blob.url,
      pdfSize: file.size,
      pdfFileName: file.name,
      pdfPageCount: estimatedPages,
      downloadUrl: blob.downloadUrl,
    })
  } catch (error: any) {
    console.error('Upload PDF error:', error)
    return NextResponse.json(
      {
        error: 'فشل رفع الملف',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/books/[id]/upload-pdf
 * حذف ملف PDF لكتاب معيّن
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bookId = parseInt(id, 10)

    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 })
    }

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 })
    }

    if (book.pdfUrl) {
      const { del } = await import('@vercel/blob')
      await del(book.pdfUrl)
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        pdfUrl: '',
        pdfFileName: '',
        pdfSize: 0,
        pdfPageCount: 0,
        contentType: book.audioUrl ? 'audio' : 'text',
        uploadedAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete PDF error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
