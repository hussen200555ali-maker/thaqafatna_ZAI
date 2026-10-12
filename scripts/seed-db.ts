// سكريبت زرع بيانات أولية في قاعدة البيانات
import { db } from "../src/lib/db";

async function main() {
  console.log("بدء زرع البيانات الأولية...");

  // 1. إنشاء الفصول
  const chapters = [
    {
      title: "البدايات",
      description: "مراحل تعريفية بكلمات سهلة ومألوفة",
      icon: "🌟",
      color: "oklch(0.78 0.13 80)",
      unlockAt: 0,
      order: 1,
      isPublished: true,
    },
    {
      title: "الطبيعة",
      description: "كلمات من عالم النباتات والحيوانات",
      icon: "🌿",
      color: "oklch(0.60 0.09 195)",
      unlockAt: 4,
      order: 2,
      isPublished: true,
    },
    {
      title: "التراث",
      description: "كلمات من التراث والثقافة العربية",
      icon: "📜",
      color: "oklch(0.65 0.18 30)",
      unlockAt: 8,
      order: 3,
      isPublished: true,
    },
  ];

  const createdChapters: { id: number }[] = [];
  for (const chapter of chapters) {
    const created = await db.chapter.create({ data: chapter });
    createdChapters.push(created);
    console.log(`✓ تم إنشاء فصل: ${chapter.title}`);
  }

  // 2. إنشاء المراحل للفصل الأول
  const chapterId = createdChapters[0].id;

  const level1 = await db.level.create({
    data: {
      chapterId,
      number: 1,
      title: "أول كلمة",
      difficulty: "easy",
      gridSizeRows: 5,
      gridSizeCols: 5,
      availableLetters: "ك,ت,ا,ب,ل,و,ن,ر,م,ق",
      bonusWords: "كلب,قال",
      reward: 50,
      hintCost: 10,
      status: "published",
      isPublished: true,
      words: {
        create: [
          { text: "كتاب", clue: "مصدر المعرفة", direction: "across", startRow: 2, startCol: 0, number: 1 },
          { text: "لون", clue: "صفة الشيء", direction: "down", startRow: 0, startCol: 2, number: 2 },
        ],
      },
      cells: {
        create: [
          { row: 0, col: 2, letter: "ل", number: 2 },
          { row: 1, col: 2, letter: "و" },
          { row: 2, col: 0, letter: "ك", number: 1 },
          { row: 2, col: 1, letter: "ت" },
          { row: 2, col: 2, letter: "ا" },
          { row: 2, col: 3, letter: "ب" },
          { row: 2, col: 4, letter: "" },
          { row: 3, col: 2, letter: "ن" },
        ],
      },
    },
  });
  console.log("✓ تم إنشاء المرحلة 1: أول كلمة");

  const level2 = await db.level.create({
    data: {
      chapterId,
      number: 2,
      title: "البيت",
      difficulty: "easy",
      gridSizeRows: 5,
      gridSizeCols: 5,
      availableLetters: "ب,ي,ت,م,ر,ج,ل,ث,ع,د",
      bonusWords: "بر,ترب",
      reward: 50,
      hintCost: 10,
      status: "published",
      isPublished: true,
      words: {
        create: [
          { text: "بيت", clue: "مسكن الإنسان", direction: "across", startRow: 0, startCol: 0, number: 1 },
          { text: "تمر", clue: "ثمرة النخيل", direction: "down", startRow: 0, startCol: 2, number: 2 },
          { text: "رجل", clue: "ذكر بالغ", direction: "across", startRow: 2, startCol: 1, number: 3 },
        ],
      },
      cells: {
        create: [
          { row: 0, col: 0, letter: "ب", number: 1 },
          { row: 0, col: 1, letter: "ي" },
          { row: 0, col: 2, letter: "ت", number: 2 },
          { row: 1, col: 2, letter: "م" },
          { row: 2, col: 1, letter: "ر", number: 3 },
          { row: 2, col: 2, letter: "ر" },
          { row: 2, col: 3, letter: "ج" },
          { row: 2, col: 4, letter: "ل" },
        ],
      },
    },
  });
  console.log("✓ تم إنشاء المرحلة 2: البيت");

  const level3 = await db.level.create({
    data: {
      chapterId,
      number: 3,
      title: "القمر",
      difficulty: "easy",
      gridSizeRows: 5,
      gridSizeCols: 5,
      availableLetters: "ش,م,س,ق,ر,ب,ح,ل,ت,ن",
      bonusWords: "شر,شبر",
      reward: 50,
      hintCost: 10,
      status: "published",
      isPublished: true,
      words: {
        create: [
          { text: "شمس", clue: "نجم النهار", direction: "across", startRow: 0, startCol: 1, number: 1 },
          { text: "قمر", clue: "نجم الليل", direction: "down", startRow: 0, startCol: 2, number: 2 },
          { text: "بحر", clue: "مياه واسعة", direction: "across", startRow: 2, startCol: 0, number: 3 },
        ],
      },
      cells: {
        create: [
          { row: 0, col: 1, letter: "ش", number: 1 },
          { row: 0, col: 2, letter: "ق", number: 2 },
          { row: 1, col: 2, letter: "م" },
          { row: 2, col: 0, letter: "ب", number: 3 },
          { row: 2, col: 1, letter: "ح" },
          { row: 2, col: 2, letter: "ر" },
          { row: 3, col: 2, letter: "ر" },
        ],
      },
    },
  });
  console.log("✓ تم إنشاء المرحلة 3: القمر");

  // 3. إنشاء مستخدم تجريبي
  const demoUser = await db.user.create({
    data: {
      id: "demo-user",
      role: "player",
      coins: 150,
    },
  });
  console.log("✓ تم إنشاء المستخدم التجريبي");

  console.log("\n✅ تم زرع البيانات الأولية بنجاح!");
  console.log(`   - ${chapters.length} فصول`);
  console.log(`   - 3 مراحل منشورة`);
  console.log(`   - 1 مستخدم تجريبي`);
}

main()
  .catch((e) => {
    console.error("خطأ في زرع البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
