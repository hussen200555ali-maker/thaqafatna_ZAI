import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, message } = body
  if (!name || !email || !message) return NextResponse.json({ error: 'الحقول مطلوبة' }, { status: 400 })
  const msg = await db.contactMessage.create({ data: { name, email, message, status: 'new' } })
  return NextResponse.json({ success: true, id: msg.id })
}
