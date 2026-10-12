// سكريبت إنشاء مراحل شاملة لاختبار جميع ميزات اللعبة
// يشمل: أسئلة بكل التصنيفات، مستويات صعوبة مختلفة، كلمات إضافية، أوضاع متنوعة

import { db } from "../src/lib/db";

// دالة مساعدة لتوليد الحروف المتاحة تلقائياً من الكلمات
function generateLetters(words: string[], extraCount: number = 4): string[] {
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

  // إضافة حروف إضافية للتضليل
  const arabicLetters = "ابتثجدحخدرزسشصضطظعغفقكلمنهوي";
  for (let i = 0; i < extraCount; i++) {
    const random = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];
    if (!letters.includes(random)) {
      letters.push(random);
    }
  }
  // خلط
  return letters.sort(() => Math.random() - 0.5);
}

interface QuestionData {
  text: string;       // الإجابة
  clue: string;       // السؤال/التلميح
  category: string;   // التصنيف
}

interface LevelData {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  gameMode: "quiz" | "crossword";
  reward: number;
  hintCost: number;
  questions: QuestionData[];
  bonusWords: string[];
}

const testLevels: LevelData[] = [
  // ===== المرحلة 1: أسئلة سهلة - تصنيف "من" =====
  {
    title: "العلماء والمخترعون",
    difficulty: "easy",
    gameMode: "quiz",
    reward: 50,
    hintCost: 10,
    questions: [
      { text: "نيوتن", clue: "من العالم الذي اكتشف قانون الجاذبية؟", category: "من" },
      { text: "اديسون", clue: "من المخترع الذي اخترع المصباح الكهربائي؟", category: "من" },
      { text: "الخوارزمي", clue: "من عالم الرياضيات الذي أسس علم الجبر؟", category: "من" },
    ],
    bonusWords: ["علم", "نور"],
  },

  // ===== المرحلة 2: تصنيف "ماذا" - سهل =====
  {
    title: "الأشياء من حولنا",
    difficulty: "easy",
    gameMode: "quiz",
    reward: 50,
    hintCost: 10,
    questions: [
      { text: "شمس", clue: "ماذا يسمى النجم الذي يدور حوله كوكبنا؟", category: "ماذا" },
      { text: "قمر", clue: "ماذا يسمى القمر الصناعي الطبيعي للأرض؟", category: "ماذا" },
      { text: "ماء", clue: "ماذا يسمى السائل الشفاف الذي نشربه؟", category: "ماذا" },
      { text: "هواء", clue: "ماذا يسمى الغاز الذي نتنفسه؟", category: "ماذا" },
    ],
    bonusWords: ["شعر", "هام"],
  },

  // ===== المرحلة 3: تصنيف "أين" - متوسط =====
  {
    title: "الأماكن والبلدان",
    difficulty: "medium",
    gameMode: "quiz",
    reward: 75,
    hintCost: 15,
    questions: [
      { text: "مكة", clue: "أين تقع الكعبة المشرفة؟", category: "أين" },
      { text: "قاهرة", clue: "أين تقع الأهرامات؟", category: "أين" },
      { text: "بغداد", clue: "أين كان يقع بيت الحكمة في العصر العباسي؟", category: "أين" },
      { text: "قرطبة", clue: "أين تقع المسجد الشهير بالزخارف الحمراء؟", category: "أين" },
    ],
    bonusWords: ["مطر", "قهر"],
  },

  // ===== المرحلة 4: تصنيف "متى" - متوسط =====
  {
    title: "التواريخ والأحداث",
    difficulty: "medium",
    gameMode: "quiz",
    reward: 75,
    hintCost: 15,
    questions: [
      { text: "رمضان", clue: "متى يصوم المسلمون شهراً كاملاً؟", category: "متى" },
      { text: "جمعة", clue: "متى يصلي المسلمون صلاة特别的اً في النهار؟", category: "متى" },
      { text: "فجر", clue: "متى يؤذن أول أذان في اليوم؟", category: "متى" },
    ],
    bonusWords: ["رمان", "فار"],
  },

  // ===== المرحلة 5: تصنيف "كم" - متوسط =====
  {
    title: "الأرقام والكميات",
    difficulty: "medium",
    gameMode: "quiz",
    reward: 75,
    hintCost: 15,
    questions: [
      { text: "سبعة", clue: "كم عدد أيام الأسبوع؟", category: "كم" },
      { text: "خمسة", clue: "كم عدد أركان الإسلام؟", category: "كم" },
      { text: "اثنا", clue: "كم عدد ركعتي الفجر؟", category: "كم" },
    ],
    bonusWords: ["سبع", "خمس"],
  },

  // ===== المرحلة 6: تصنيف "أكمل" - صعب =====
  {
    title: "إكمال الجمل والأمثال",
    difficulty: "hard",
    gameMode: "quiz",
    reward: 100,
    hintCost: 20,
    questions: [
      { text: "صبر", clue: "أكمل المثل: ال... مفتاح الفرج", category: "أكمل" },
      { text: "سيف", clue: "أكمل المثل: ال... أصدق الإنبات", category: "أكمل" },
      { text: "علم", clue: "أكمل المثل: اطلبوا ال... من المهد إلى اللحد", category: "أكمل" },
      { text: "صديق", clue: "أكمل المثل: الصديق وقت الضيق", category: "أكمل" },
    ],
    bonusWords: ["صبر", "علي"],
  },

  // ===== المرحلة 7: تصنيف "عرف" - صعب =====
  {
    title: "تعريفات ومفاهيم",
    difficulty: "hard",
    gameMode: "quiz",
    reward: 100,
    hintCost: 20,
    questions: [
      { text: "صحراء", clue: "عرّف: منطقة جافة قليلة الأمطار وممتدة", category: "عرف" },
      { text: "محيط", clue: "عرّف: مساحة مائية شاسعة مالحة", category: "عرف" },
      { text: "بركان", clue: "عرّف: جبل يخرج منه الحمم المنصهرة", category: "عرف" },
    ],
    bonusWords: ["بحر", "نار"],
  },

  // ===== المرحلة 8: تصنيف "ضد" - متوسط =====
  {
    title: "المفردات المتضادة",
    difficulty: "medium",
    gameMode: "quiz",
    reward: 75,
    hintCost: 15,
    questions: [
      { text: "ليل", clue: "ما ضد كلمة نهار؟", category: "ضد" },
      { text: "حزن", clue: "ما ضد كلمة فرح؟", category: "ضد" },
      { text: "ضعف", clue: "ما ضد كلمة قوة؟", category: "ضد" },
      { text: "كذب", clue: "ما ضد كلمة صدق؟", category: "ضد" },
    ],
    bonusWords: ["ليل", "حزن"],
  },

  // ===== المرحلة 9: تصنيف "مرادف" - متوسط =====
  {
    title: "المفردات المترادفة",
    difficulty: "medium",
    gameMode: "quiz",
    reward: 75,
    hintCost: 15,
    questions: [
      { text: "أسد", clue: "ما مرادف كلمة ليث؟", category: "مرادف" },
      { text: "بحر", clue: "ما مرادف كلمة يم؟", category: "مرادف" },
      { text: "سيف", clue: "ما مرادف كلمة حسام؟", category: "مرادف" },
    ],
    bonusWords: ["سيف", "بحر"],
  },

  // ===== المرحلة 10: وضع الشبكة المتقاطعة - سهل =====
  {
    title: "شبكة الكلمات المتقاطعة",
    difficulty: "easy",
    gameMode: "crossword",
    reward: 75,
    hintCost: 10,
    questions: [
      { text: "كتاب", clue: "مصدر المعرفة", category: "" },
      { text: "لون", clue: "صفة الشيء", category: "" },
      { text: "قلم", clue: "أداة الكتابة", category: "" },
      { text: "علم", clue: "معرفة", category: "" },
    ],
    bonusWords: ["كلب", "قال"],
  },
];

async function createTestLevels() {
  console.log("بدء إنشاء المراحل الشاملة...");

  // الحصول على الفصل الأول
  const chapter = await db.chapter.findFirst({ orderBy: { order: "asc" } });
  if (!chapter) {
    console.error("لا يوجد فصل في قاعدة البيانات");
    return;
  }
  console.log(`الفصل: ${chapter.title}`);

  // الحصول على آخر رقم مرحلة
  const lastLevel = await db.level.findFirst({
    where: { chapterId: chapter.id },
    orderBy: { number: "desc" },
  });
  let levelNumber = (lastLevel?.number || 0) + 1;

  let createdCount = 0;

  for (const levelData of testLevels) {
    // توليد الحروف من الإجابات
    const answerWords = levelData.questions.map((q) => q.text);
    const allWords = [...answerWords, ...levelData.bonusWords];
    const availableLetters = generateLetters(answerWords, 5);

    // إنشاء المرحلة
    const level = await db.level.create({
      data: {
        chapterId: chapter.id,
        number: levelNumber++,
        title: levelData.title,
        difficulty: levelData.difficulty,
        gameMode: levelData.gameMode,
        gridSizeRows: levelData.gameMode === "crossword" ? 7 : 5,
        gridSizeCols: levelData.gameMode === "crossword" ? 7 : 5,
        availableLetters: availableLetters.join(","),
        bonusWords: levelData.bonusWords.join(","),
        reward: levelData.reward,
        hintCost: levelData.hintCost,
        status: "published",
        isPublished: true,
        words: {
          create: levelData.questions.map((q, idx) => ({
            text: q.text,
            clue: q.clue,
            category: q.category,
            direction: "across",
            startRow: idx,
            startCol: 0,
            number: idx + 1,
          })),
        },
        // إضافة خلايا للشبكة في وضع crossword
        cells: levelData.gameMode === "crossword" ? {
          create: createCrosswordCells(levelData.questions),
        } : undefined,
      },
      include: {
        words: true,
        cells: true,
      },
    });

    createdCount++;
    console.log(`✓ [${createdCount}/${testLevels.length}] ${level.title} (${level.gameMode}, ${level.difficulty}) - ${levelData.questions.length} سؤال`);
  }

  // إحصائيات نهائية
  const totalLevels = await db.level.count();
  const totalQuestions = await db.word.count();
  const quizLevels = await db.level.count({ where: { gameMode: "quiz" } });
  const crosswordLevels = await db.level.count({ where: { gameMode: "crossword" } });

  console.log("\n" + "=".repeat(60));
  console.log("✅ تم إنشاء المراحل بنجاح!");
  console.log("=".repeat(60));
  console.log(`📊 إحصائيات قاعدة البيانات:`);
  console.log(`   • إجمالي المراحل: ${totalLevels}`);
  console.log(`   • إجمالي الأسئلة: ${totalQuestions}`);
  console.log(`   • مراحل الأسئلة (quiz): ${quizLevels}`);
  console.log(`   • مراحل الشبكة (crossword): ${crosswordLevels}`);
  console.log("=".repeat(60));

  // عرض ملخص التصنيفات
  const categories = await db.word.groupBy({
    by: ["category"],
    _count: { category: true },
  });
  console.log("\n📋 توزيع التصنيفات:");
  for (const cat of categories) {
    const label = cat.category || "(بدون تصنيف)";
    console.log(`   • ${label}: ${cat._count.category} سؤال`);
  }
}

// إنشاء خلايا الشبكة المتقاطعة من الأسئلة
function createCrosswordCells(questions: QuestionData[]) {
  const cells: { row: number; col: number; letter: string; number: number | null }[] = [];
  const cellMap = new Map<string, boolean>();

  questions.forEach((q, wordIdx) => {
    const text = q.text;
    const startRow = wordIdx * 2; // توزيع الكلمات عمودياً
    const startCol = 0;

    for (let i = 0; i < text.length; i++) {
      const row = startRow;
      const col = startCol + i;
      const key = `${row}-${col}`;

      if (!cellMap.has(key)) {
        cells.push({
          row,
          col,
          letter: text[i],
          number: i === 0 ? wordIdx + 1 : null,
        });
        cellMap.set(key, true);
      }
    }
  });

  return cells;
}

createTestLevels()
  .catch((e) => {
    console.error("خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
