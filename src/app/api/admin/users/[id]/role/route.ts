import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
export const runtime = 'nodejs'
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: userId } = await params
  const { roleName } = await request.json()
  const role = await db.role.findUnique({ where: { name: roleName } })
  if (!role) return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 })
  await db.userRole.deleteMany({ where: { userId } })
  await db.userRole.create({ data: { userId, roleId: role.id, assignedBy: session.user.id } })
  await logAction({ userId: session.user.id, action: 'ROLE_CHANGE', entityType: 'User', entityId: userId, severity: 'critical', changes: { newRole: roleName } })
  return NextResponse.json({ success: true })
}
