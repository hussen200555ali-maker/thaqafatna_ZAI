const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const total = await prisma.book.count();
  const chapters = await prisma.bookChapter.count();
  const cats = await prisma.bookCategory.count();
  console.log(`📚 الكتب: ${total}`);
  console.log(`📄 الفصول: ${chapters}`);
  console.log(`📂 التصنيفات: ${cats}`);
  await prisma.$disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
