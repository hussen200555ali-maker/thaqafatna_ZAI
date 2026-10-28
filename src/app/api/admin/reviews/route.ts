import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !['admin','librarian'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const where = status === 'all' ? {} : { status: status as any }
  const reviews = await db.bookReview.findMany({ where, include: { user: { select: { id: true, name: true } }, book: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ reviews, total: reviews.length })
}
