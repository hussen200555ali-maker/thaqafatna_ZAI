// اختبار نهائي للتأكد من أن Prisma يعمل في /tmp
process.env.SPACE_Z_DEPLOYMENT = 'true'
process.env.DATABASE_URL = 'file:/app/db/custom.db'

// قبل كل شيء، نحاكي بيئة Serverless بمسار غير موجود:
// في Serverless الحقيقي، /app/db/custom.db موجود لكنه للقراءة فقط.
// لكن منطقنا ينسخه إلى /tmp. لنختبر أن الكتابة في /tmp تعمل بعد النسخ.

const fs = require('fs')

// محاكاة: إنشاء ملف مصدر وهمي (لأن المسار الأصلي غير موجود فعلياً في بيئة الاختبار)
// لكن في الحقيقة، في Serverless المنشور، المصدر موجود في /app/db/custom.db
// سنستخدم المسار الحقيقي محلياً للاختبار
const realSource = '/home/z/my-project/db/custom.db'
const tmpDbPath = '/tmp/custom.db'

// حذف القديم إن وجد لإعادة الاختبار
if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath)

// نسخ DB إلى /tmp (محاكاة منطق db.ts)
if (fs.existsSync(realSource)) {
  fs.copyFileSync(realSource, tmpDbPath)
  fs.chmodSync(tmpDbPath, 0o666)
  console.log(`✅ Step 1: DB copied to ${tmpDbPath} (${fs.statSync(tmpDbPath).size} bytes)`)
}

// الآن Prisma يجب أن يكتب بنجاح في /tmp
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${tmpDbPath}` } },
  log: ['error'],
})

;(async () => {
  console.log('\n=== Step 2: اختبار القراءة ===')
  const books = await prisma.book.count()
  const chapters = await prisma.bookChapter.count()
  console.log(`✅ قراءة: ${books} كتاب، ${chapters} فصل`)

  console.log('\n=== Step 3: اختبار الكتابة (INSERT + UPDATE + DELETE) ===')
  const userId = 'test-write-' + Date.now()
  const created = await prisma.user.create({
    data: { id: userId, name: 'Test Serverless Write', coins: 50 }
  })
  console.log(`✅ INSERT: user ${created.id} created with ${created.coins} coins`)

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coins: 100 }
  })
  console.log(`✅ UPDATE: user coins updated to ${updated.coins}`)

  await prisma.user.delete({ where: { id: userId } })
  console.log(`✅ DELETE: user deleted`)

  console.log('\n=== ✅ جميع الاختبارات نجحت ===')
  console.log('الحل يعمل بشكل صحيح في /tmp - عمليات القراءة والكتابة تعمل')
  await prisma.$disconnect()
})().catch(e => {
  console.error('❌ فشل:', e.message)
  process.exit(1)
})
