import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { db } from '@/lib/db'

/**
 * POST /api/admin/books/[id]/upload-cover
 * رفع صورة غلاف لكتاب معيّن
 *
 * Headers: x-admin-key
 * Body: multipart/form-data
 *   - file: صورة (jpg, png, webp) حتى 5 ميجابايت
 */

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ADMIN_KEY = process.env.ADMIN_KEY || 'thaqafatna-admin-2026'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bookId = parseInt(id, 10)

    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'معرّف الكتاب غير صالح' }, { status: 400 })
    }

    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 })
    }

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return NextResponse.json({ error: 'الكتاب غير موجود' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 })
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF. المُستلم: ${file.type}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return NextResponse.json(
        { error: `حجم الصورة ${sizeMB} MB يتجاوز الحد الأقصى 5 MB` },
        { status: 400 }
      )
    }

    // حذف الصورة القديمة إن وجدت (فقط إذا كانت Vercel Blob URL)
    if (book.coverImage && book.coverImage.includes('vercel-blob.com')) {
      try {
        await del(book.coverImage)
      } catch (e) {
        console.warn('Failed to delete old cover:', e)
      }
    }

    // رفع الصورة
    const safeFileName = file.name.replace(/[^\w\u0600-\u06FF.-]/g, '_')
    const blobPath = `books/${bookId}/cover/${Date.now()}-${safeFileName}`

    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    })

    // تحديث الكتاب
    await db.book.update({
      where: { id: bookId },
      data: {
        coverImage: blob.url,
        coverImageFileName: file.name,
        coverImageSize: file.size,
        uploadedAt: new Date(),
      },
    })

    console.log(`✅ Cover image uploaded for book ${bookId}: ${blob.url}`)

    return NextResponse.json({
      success: true,
      coverImageUrl: blob.url,
      coverImageFileName: file.name,
      coverImageSize: file.size,
    })
  } catch (error: any) {
    console.error('Upload cover error:', error)
    return NextResponse.json(
      { error: 'فشل رفع الصورة', details: error.message },
      { status: 500 }
    )
  }
}

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

    if (book.coverImage && book.coverImage.includes('vercel-blob.com')) {
      await del(book.coverImage)
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        coverImage: '',
        coverImageFileName: '',
        coverImageSize: 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete cover error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
