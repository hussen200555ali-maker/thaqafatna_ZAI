/**
 * POST /api/contact — Sprint 5
 * نموذج التواصل العام (بدون مصادقة)
 * Sprint 5: تعقيم المدخلات (A.3) + Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeText, sanitizeEmail, sanitizeUrl } from '@/lib/sanitize'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Rate Limiting: 3 رسائل / ساعة لكل IP
  const rlResult = await rateLimit(request, {
    limit: 3,
    window: '1h',
    identifier: 'contact-form',
  })
  if (!rlResult.success) {
    return NextResponse.json(
      { error: 'لقد أرسلت عددًا كبيرًا من الرسائل. حاول مرة أخرى لاحقًا.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { name, email, bookTitle, message, fileUrl } = body

  // التحقق من الحقول المطلوبة
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'الاسم والبريد والرسالة مطلوبة' },
      { status: 400 }
    )
  }

  // A.3: تعقيم المدخلات (منع XSS)
  const cleanName = sanitizeText(String(name))
  const cleanEmail = sanitizeEmail(String(email))
  const cleanBookTitle = bookTitle ? sanitizeText(String(bookTitle)) : null
  const cleanMessage = sanitizeText(String(message))
  const cleanFileUrl = fileUrl ? sanitizeUrl(String(fileUrl)) : null

  if (!cleanEmail) {
    return NextResponse.json(
      { error: 'البريد الإلكتروني غير صحيح' },
      { status: 400 }
    )
  }

  if (cleanMessage.length < 10) {
    return NextResponse.json(
      { error: 'الرسالة قصيرة جدًا (10 أحرف على الأقل)' },
      { status: 400 }
    )
  }

  // الحصول على IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : null

  // حفظ الرسالة
  const contactMessage = await db.contactMessage.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      bookTitle: cleanBookTitle,
      message: cleanMessage,
      fileUrl: cleanFileUrl,
      status: 'new',
      ipAddress: ip,
    },
  })

  return NextResponse.json({
    success: true,
    id: contactMessage.id,
    message: 'تم استلام رسالتك بنجاح. سنتواصل معك خلال 48 ساعة.',
  })
}
