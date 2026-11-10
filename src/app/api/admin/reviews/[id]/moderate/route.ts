/**
 * POST /api/admin/reviews/[id]/moderate — Sprint 1
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !['admin', 'librarian'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const reviewId = parseInt(id)
  const body = await request.json()
  const { action, reason } = body as { action: 'approve' | 'reject'; reason?: string }

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'إجراء غير صحيح' }, { status: 400 })
  }

  const review = await db.bookReview.findUnique({
    where: { id: reviewId },
    select: { id: true, bookId: true, userId: true, status: true, rating: true },
  })

  if (!review) {
    return NextResponse.json({ error: 'المراجعة غير موجودة' }, { status: 404 })
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  await db.bookReview.update({
    where: { id: reviewId },
    data: {
      status: newStatus,
      rejectionReason: action === 'reject' ? (reason || null) : null,
      moderatedBy: session.user.id,
      moderatedAt: new Date(),
    },
  })

  if (action === 'approve') {
    const approvedReviews = await db.bookReview.findMany({
      where: { bookId: review.bookId, status: 'approved' },
      select: { rating: true },
    })
    const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    await db.book.update({
      where: { id: review.bookId },
      data: { ratingAvg: avg, ratingCount: approvedReviews.length },
    })
  }

  await logAction({
    userId: session.user.id,
    action: 'REVIEW_MODERATED',
    entityType: 'Review',
    entityId: String(reviewId),
    severity: 'info',
    changes: { from: review.status, to: newStatus, reason },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
