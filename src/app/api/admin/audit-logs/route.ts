import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const logs = await db.auditLog.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ logs, total: logs.length })
}
