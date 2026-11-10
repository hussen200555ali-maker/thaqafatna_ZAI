import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !['admin','librarian'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ messages, total: messages.length })
}
