import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/audit'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const where: any = {}
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
  const [users, total] = await Promise.all([
    db.user.findMany({ where, select: { id: true, name: true, email: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true, userRoles: { include: { role: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
    db.user.count({ where })
  ])
  return NextResponse.json({ users, total })
}
