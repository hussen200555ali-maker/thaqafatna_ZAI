/**
 * NextAuth Route Handler — Sprint 1
 *
 * ⚠️ التحفظ #1: PrismaAdapter لا يعمل على Edge runtime
 *    الحل: export const runtime = 'nodejs'
 *    بدونها: `Cannot find module 'fs'` في الإنتاج فقط
 */

import { handlers } from '@/lib/auth'

export const runtime = 'nodejs' // إلزامي — Prisma يحتاج Node.js APIs

export const { GET, POST } = handlers
