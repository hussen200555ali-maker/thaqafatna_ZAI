import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export const runtime = 'nodejs'
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !['admin','librarian','assistant'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const versions = await db.bookVersion.findMany({ where: { bookId: parseInt(id) }, include: { uploader: { select: { name: true } } }, orderBy: { version: 'desc' } })
  return NextResponse.json({ versions })
}
