/**
 * GET /api/admin/dashboard — Sprint 4
 * إحصائيات حقيقية من قاعدة البيانات
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !['admin','librarian','assistant'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [totalBooks, publishedBooks, totalUsers, pendingReviews, newMessages, totalDownloads, criticalLogs, recentActivity] = await Promise.all([
    db.book.count(),
    db.book.count({ where: { status: 'published' } }),
    db.user.count(),
    db.bookReview.count({ where: { status: 'pending' } }),
    db.contactMessage.count({ where: { status: 'new' } }),
    db.book.aggregate({ _sum: { downloads: true } }),
    db.auditLog.count({ where: { severity: 'critical' } }),
    db.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
  ])

  return NextResponse.json({
    stats: {
      totalBooks, publishedBooks, totalUsers, pendingReviews,
      newMessages, totalDownloads: totalDownloads._sum.downloads || 0, criticalLogs,
    },
    recentActivity: recentActivity.map(log => ({
      action: log.action,
      entityType: log.entityType,
      severity: log.severity,
      userName: log.user?.name || 'النظام',
      time: log.createdAt,
    })),
  })
}
