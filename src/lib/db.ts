import { PrismaClient } from '@prisma/client'

/**
 * حل مشكلة قاعدة البيانات في بيئة Serverless (read-only filesystem)
 *
 * المشكلة:
 *   - في بيئات Serverless مثل Space-Z / Vercel / Alibaba FC، نظام الملفات للقراءة فقط
 *   - Prisma + SQLite يحتاج للكتابة بجانب ملف الـ DB (WAL files، journal)
 *   - هذا يسبب خطأ "operation not permitted" وفشل الخادم
 *
 * الحل:
 *   1. إذا كان DATABASE_URL يشير إلى مسار للقراءة فقط (/app/db/)، ننسخه إلى /tmp
 *   2. /tmp هو المجلد الوحيد القابل للكتابة في معظم بيئات Serverless
 *   3. نُحدّث DATABASE_URL ديناميكياً قبل تهيئة PrismaClient
 *
 * مميزات الحل:
 *   - يعمل محلياً (يستخدم المسار الأصلي)
 *   - يعمل في Serverless (يستخدم /tmp)
 *   - يدعم PostgreSQL إذا تم تمرير DATABASE_URL خارجي
 */

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL

  // إذا لم يكن هناك DATABASE_URL، نستخدم الافتراضي
  if (!envUrl) {
    console.warn('⚠️ DATABASE_URL not set, using default')
    return 'file:/tmp/custom.db'
  }

  // إذا كان PostgreSQL أو MySQL (يبدأ بـ postgresql:// أو mysql://)، نُرجعه كما هو
  if (
    envUrl.startsWith('postgresql://') ||
    envUrl.startsWith('postgres://') ||
    envUrl.startsWith('mysql://')
  ) {
    return envUrl
  }

  // إذا كان SQLite (يبدأ بـ file:)
  if (envUrl.startsWith('file:')) {
    const sourcePath = envUrl.replace('file:', '')
    const isServerless =
      // علامات بيئة Serverless
      process.env.SPACE_Z_DEPLOYMENT === 'true' ||
      !!process.env.FC_FUNCTION_NAME || // Alibaba FC
      !!process.env.VERCEL || // Vercel
      !!process.env.AWS_LAMBDA_FUNCTION_NAME || // AWS Lambda
      !require('fs').existsSync('/home/z/my-project/db') // مسار التطوير غير موجود

    // في بيئة Serverless، انسخ DB إلى /tmp
    if (isServerless) {
      const fs = require('fs')
      const tmpDbPath = '/tmp/custom.db'

      try {
        // إذا لم يكن الملف موجوداً في /tmp، انسخه من المصدر
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, tmpDbPath)
          console.log(`📦 DB copied to writable location: ${tmpDbPath}`)
        }
        // تأكد من أن الملف قابل للكتابة
        if (fs.existsSync(tmpDbPath)) {
          fs.chmodSync(tmpDbPath, 0o666)
        }
        return `file:${tmpDbPath}`
      } catch (err) {
        console.error('❌ Failed to copy DB to /tmp:', err)
        // ارجع للمسار الأصلي كحل أخير
        return envUrl
      }
    }

    // محلياً (تطوير)، استخدم المسار الأصلي
    return envUrl
  }

  // أي حالة أخرى
  return envUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// حل DATABASE_URL مرة واحدة فقط
const resolvedUrl = resolveDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
