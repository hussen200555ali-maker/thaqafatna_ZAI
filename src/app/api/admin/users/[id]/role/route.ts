import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: targetUserId } = await params
  const { roleName } = await request.json()

  if (!roleName) {
    return NextResponse.json({ error: 'الدور مطلوب' }, { status: 400 })
  }

  const role = await db.role.findUnique({ where: { name: roleName } })
  if (!role) {
    return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 })
  }

  // A.5: منع الأدمن من خفض دوره (Lockout Prevention)
  if (targetUserId === session.user.id && roleName !== 'admin') {
    return NextResponse.json(
      { error: 'لا يمكنك خفض دورك كأدمن' },
      { status: 400 }
    )
  }

  // A.5: منع خفض آخر أدمن في النظام
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { userRoles: { include: { role: true } } },
  })

  if (targetUser) {
    const isTargetAdmin = targetUser.userRoles.some(
      (ur) => ur.role.name === 'admin'
    )

    if (isTargetAdmin && roleName !== 'admin') {
      const adminCount = await db.userRole.count({
        where: { role: { name: 'admin' } },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'لا يمكن خفض آخر أدمن في النظام' },
          { status: 400 }
        )
      }
    }
  }

  // تنفيذ التغيير
  await db.userRole.deleteMany({ where: { userId: targetUserId } })
  await db.userRole.create({
    data: { userId: targetUserId, roleId: role.id, assignedBy: session.user.id },
  })

  await logAction({
    userId: session.user.id,
    action: 'ROLE_CHANGE',
    entityType: 'User',
    entityId: targetUserId,
    severity: 'warning',
    changes: { newRole: roleName },
  })

  return NextResponse.json({ success: true, role: roleName })
}
