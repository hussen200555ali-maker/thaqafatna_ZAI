// إنشاء محتوى تجريبي لكل نوع لغز من الأنواع الـ 12
import { db } from "../src/lib/db";

function generateLetters(words: string[], extraCount: number = 6): string[] {
  const letterCount = new Map<string, number>();
  for (const word of words) {
    for (const letter of word) {
      letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }
  }
  const letters: string[] = [];
  letterCount.forEach((count, letter) => {
    for (let i = 0; i < count; i++) letters.push(letter);
  });
  const arabicLetters = "ابتثجدحخدرزسشصضطظعغفقكلمنهوي";
  for (let i = 0; i < extraCount; i++) {
    const random = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];
    if (!letters.includes(random)) letters.push(random);
  }
  return letters.sort(() => Math.random() - 0.5);
}

const demoLevels = [
  // 1. إيموجي
  {
    title: "ألغاز الإيموجي",
    puzzleType: "emoji",
    difficulty: "easy",
    reward: 75,
    questions: [
      { text: "قطة", clue: "ما الحيوان في الإيموجي؟", emojis: "🐱" },
      { text: "شمس", clue: "ما هذا؟", emojis: "☀️" },
      { text: "كتاب", clue: "ما هذا الشيء؟", emojis: "📚" },
      { text: "قلب", clue: "ما هذا؟", emojis: "❤️" },
    ],
  },
  // 2. حروف مبعثرة
  {
    title: "ترتيب الحروف",
    puzzleType: "scrambled",
    difficulty: "easy",
    reward: 75,
    questions: [
      { text: "بحر", clue: "رتب الحروف لتكوين كلمة", sequence: "حبر" },
      { text: "جبل", clue: "رتب الحروف", sequence: "لجب" },
      { text: "علم", clue: "رتب الحروف", sequence: "معل" },
    ],
  },
  // 3. فراغات
  {
    title: "أكمل الفراغ",
    puzzleType: "fillblank",
    difficulty: "medium",
    reward: 100,
    questions: [
      { text: "محمد", clue: "ذهب ___ إلى السوق", fillBlanks: "ذهب ___ إلى السوق" },
      { text: "العلم", clue: "___ نور", fillBlanks: "___ نور" },
      { text: "كتاب", clue: "خير جليس ___", fillBlanks: "خير جليس ___" },
    ],
  },
  // 4. توصيل وربط
  {
    title: "صل الكلمات",
    puzzleType: "matching",
    difficulty: "medium",
    reward: 100,
    questions: [
      { text: "أسد", clue: "صل كل كلمة بمرادفها", matchPairs: "أسد|ليث,بحر|يم,سيف|حسام,علم|معرفة" },
    ],
  },
  // 5. اختيار من متعدد
  {
    title: "اختر الإجابة الصحيحة",
    puzzleType: "multiple",
    difficulty: "easy",
    reward: 75,
    questions: [
      { text: "الرياض", clue: "ما عاصمة المملكة العربية السعودية؟", options: "الرياض|القاهرة|بغداد|دمشق", correctOption: 0 },
      { text: "نيل", clue: "ما أطول نهر في العالم؟", options: "نيل|فرات|أمازون|دجلة", correctOption: 0 },
      { text: "خمسة", clue: "كم عدد أركان الإسلام؟", options: "ثلاثة|أربعة|خمسة|ستة", correctOption: 2 },
    ],
  },
  // 6. لغز منطقي
  {
    title: "ألغاز ذهنية",
    puzzleType: "logic",
    difficulty: "hard",
    reward: 125,
    questions: [
      { text: "ثمانية", clue: "ما الرقم التالي: ٢، ٤، ٦، ...؟", sequence: "٢,٤,٦,٨" },
      { text: "ثلاثة", clue: "إذا كان لدينا ٥ تفاحات وأكلنا ٢، كم تبقى؟", logicData: '{"type":"math","a":5,"b":2,"op":"subtract"}' },
    ],
  },
  // 7. تلميحات متدرجة
  {
    title: "خمّن بكلمات",
    puzzleType: "progressive",
    difficulty: "medium",
    reward: 100,
    questions: [
      { text: "هرم", clue: "شيء ضخم بُني في مصر قديماً", category: "تلميحات متدرجة" },
      { text: "نخلة", clue: "شجرة عربية مشهورة", category: "تلميحات متدرجة" },
    ],
  },
  // 8. مرحلة البوس المختلطة
  {
    title: "تحدي البوس",
    puzzleType: "mixed",
    difficulty: "hard",
    reward: 150,
    questions: [
      { text: "صحراء", clue: "منطقة جافة قليلة الأمطار", category: "مختلط" },
      { text: "بحر", clue: "مساحة مائية شاسعة", emojis: "🌊", category: "مختلط" },
      { text: "جبل", clue: "رتب الحروف", sequence: "لجب", category: "مختلط" },
    ],
  },
];

async function createDemoContent() {
  console.log("🎮 إنشاء محتوى تجريبي لكل نوع لغز...\n");

  const chapter = await db.chapter.findFirst({ orderBy: { order: "asc" } });
  if (!chapter) {
    console.error("لا يوجد فصل");
    return;
  }

  const lastLevel = await db.level.findFirst({
    where: { chapterId: chapter.id },
    orderBy: { number: "desc" },
  });
  let levelNumber = (lastLevel?.number || 0) + 1;

  for (const levelData of demoLevels) {
    // فحص إذا كانت موجودة
    const existing = await db.level.findFirst({
      where: { chapterId: chapter.id, title: levelData.title },
    });
    if (existing) {
      console.log(`⏭️  موجودة: ${levelData.title}`);
      continue;
    }

    const answerWords = levelData.questions.map((q: any) => q.text);
    const availableLetters = generateLetters(answerWords, 6);

    const level = await db.level.create({
      data: {
        chapterId: chapter.id,
        number: levelNumber++,
        title: levelData.title,
        difficulty: levelData.difficulty,
        gameMode: levelData.puzzleType === "crossword" ? "crossword" : "quiz",
        puzzleType: levelData.puzzleType,
        gridSizeRows: 5,
        gridSizeCols: 5,
        availableLetters: availableLetters.join(","),
        reward: levelData.reward,
        hintCost: 15,
        status: "published",
        isPublished: true,
        words: {
          create: levelData.questions.map((q: any, idx: number) => ({
            text: q.text,
            clue: q.clue,
            category: q.category || "",
            emojis: q.emojis || "",
            options: q.options || "",
            correctOption: q.correctOption || 0,
            matchPairs: q.matchPairs || "",
            fillBlanks: q.fillBlanks || "",
            logicData: q.logicData || "",
            sequence: q.sequence || "",
            direction: "across",
            startRow: idx,
            startCol: 0,
            number: idx + 1,
          })),
        },
      },
    });

    console.log(`✅ [${levelData.puzzleType}] ${levelData.title} - ${levelData.questions.length} سؤال`);
  }

  const totalLevels = await db.level.count();
  const totalQuestions = await db.word.count();
  console.log(`\n📊 الإجمالي: ${totalLevels} مرحلة، ${totalQuestions} سؤال`);
}

createDemoContent()
  .catch((e) => { console.error("خطأ:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
