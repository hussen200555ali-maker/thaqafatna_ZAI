import { PrismaClient } from '@prisma/client'

/**
 * تهيئة PrismaClient مع دعم البيئات المختلفة:
 *
 * - PostgreSQL (Vercel / Neon / Supabase):
 *   يستخدم DATABASE_URL مباشرة (مثل: postgresql://...)
 *
 * - SQLite على بيئة Serverless (Space-Z / Alibaba FC):
 *   ينسخ DB من المسار للقراءة فقط (/app/db/custom.db) إلى /tmp (القابل للكتابة)
 *
 * - SQLite محلياً (تطوير):
 *   يستخدم المسار الأصلي مباشرة
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
