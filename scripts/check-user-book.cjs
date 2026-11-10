const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const books = await prisma.book.findMany({
    where: { 
      OR: [
        { pdfUrl: { not: '' } },
        { contentType: 'pdf' }
      ]
    },
    select: { id: true, title: true, pdfUrl: true, contentType: true, pdfFileName: true, pdfSize: true },
    take: 10
  });
  console.log('📚 الكتب التي لها PDF:');
  books.forEach(b => {
    console.log(`  ID: ${b.id} | "${b.title}" | contentType: ${b.contentType} | pdfUrl: ${b.pdfUrl ? 'YES' : 'NO'}`);
  });
  
  // كل الكتب
  const allBooks = await prisma.book.findMany({
    select: { id: true, title: true, contentType: true, pdfUrl: true, isPublished: true },
    take: 30,
    orderBy: { id: 'asc' }
  });
  console.log(`\n📚 كل الكتب (${allBooks.length}):`);
  allBooks.forEach(b => {
    console.log(`  ID ${b.id}: "${b.title.substring(0, 50)}" | ${b.contentType} | pdf: ${b.pdfUrl ? '✓' : '✗'} | published: ${b.isPublished}`);
  });
  
  await prisma.$disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
