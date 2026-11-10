// محاكاة بيئة Serverless للتأكد من أن منطق نسخ DB يعمل
process.env.SPACE_Z_DEPLOYMENT = 'true'
process.env.DATABASE_URL = 'file:/app/db/custom.db'
// محاكاة عدم وجود المسار الأصلي (لأن /app/db/custom.db في Serverless)
// لا نحذف الملف الحقيقي، فقط نتحقق من المنطق

const fs = require('fs')
const path = require('path')

console.log('=== اختبار منطق نسخ DB في بيئة Serverless ===')
console.log('SPACE_Z_DEPLOYMENT:', process.env.SPACE_Z_DEPLOYMENT)
console.log('DATABASE_URL:', process.env.DATABASE_URL)

// تحقق من المنطق في db.ts (نسخته هنا لل اختبار)
function resolveDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL
  if (!envUrl) return 'file:/tmp/custom.db'

  if (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://') || envUrl.startsWith('mysql://')) {
    return envUrl
  }

  if (envUrl.startsWith('file:')) {
    const sourcePath = envUrl.replace('file:', '')
    const isServerless = process.env.SPACE_Z_DEPLOYMENT === 'true'

    if (isServerless) {
      const tmpDbPath = '/tmp/custom.db'
      try {
        // محاكاة: المسار الأصلي قد لا يكون موجوداً في Serverless الحقيقي
        // لكن هنا محلياً موجود، فلنستخدمه كمصدر
        if (fs.existsSync(sourcePath)) {
          if (!fs.existsSync(tmpDbPath)) {
            fs.copyFileSync(sourcePath, tmpDbPath)
            console.log(`✅ DB copied from ${sourcePath} to ${tmpDbPath}`)
          }
          fs.chmodSync(tmpDbPath, 0o666)
          return `file:${tmpDbPath}`
        } else {
          console.log(`⚠️ Source DB not found: ${sourcePath}`)
          return `file:${tmpDbPath}`
        }
      } catch (err) {
        console.error('❌ Failed:', err.message)
        return envUrl
      }
    }
    return envUrl
  }
  return envUrl
}

const resolvedUrl = resolveDatabaseUrl()
console.log('\n=== النتيجة ===')
console.log('Resolved URL:', resolvedUrl)

// تحقق من إمكانية الكتابة في /tmp
const testFile = '/tmp/test_write.txt'
try {
  fs.writeFileSync(testFile, 'test')
  fs.unlinkSync(testFile)
  console.log('✅ /tmp is writable')
} catch (e) {
  console.log('❌ /tmp not writable:', e.message)
}

// تحقق من حجم DB المنسوخ
if (fs.existsSync('/tmp/custom.db')) {
  const stats = fs.statSync('/tmp/custom.db')
  console.log(`✅ /tmp/custom.db exists (${stats.size} bytes)`)
}

// الآن اختبر PrismaClient مع المسار الجديد
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  datasources: { db: { url: resolvedUrl } },
  log: ['error'],
})

;(async () => {
  try {
    const bookCount = await prisma.book.count()
    const chapterCount = await prisma.bookChapter.count()
    console.log(`\n=== Prisma يعمل بنجاح! ===`)
    console.log(`📚 الكتب: ${bookCount}`)
    console.log(`📄 الفصول: ${chapterCount}`)
    
    // اختبار الكتابة (INSERT)
    console.log('\n=== اختبار الكتابة ===')
    try {
      const newUser = await prisma.user.create({
        data: {
          id: 'test-serverless-' + Date.now(),
          name: 'Test Serverless',
          coins: 0,
          level: 1,
          streak: 0,
        }
      })
      console.log(`✅ INSERT نجح: User created with id ${newUser.id}`)
      // تنظيف
      await prisma.user.delete({ where: { id: newUser.id } })
      console.log('✅ DELETE نجح (تنظيف)')
    } catch (writeErr) {
      console.log(`❌ INSERT فشل: ${writeErr.message}`)
    }
    
    await prisma.$disconnect()
  } catch (e) {
    console.error('❌ Prisma failed:', e.message)
    process.exit(1)
  }
})()
