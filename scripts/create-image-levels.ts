// إنشاء مراحل بألغاز الصور (image + images4)
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
    if (!letters.includes(random)) {
      letters.push(random);
    }
  }
  return letters.sort(() => Math.random() - 0.5);
}

const imageLevels = [
  // ===== مرحلة 1: ألغاز بصورة واحدة (image) =====
  {
    title: "تخمّن الصورة",
    difficulty: "easy" as const,
    puzzleType: "image",
    reward: 75,
    hintCost: 15,
    questions: [
      {
        text: "شمس",
        clue: "ما هذا الشيء الذي يضيء النهار؟",
        category: "",
        imageUrl: "/images/puzzles/sun.svg",
      },
      {
        text: "قمر",
        clue: "ما هذا الشيء الذي يضيء الليل؟",
        category: "",
        imageUrl: "/images/puzzles/moon.jpg",
      },
      {
        text: "بحر",
        clue: "ما هذه المساحة المائية الواسعة؟",
        category: "",
        imageUrl: "/images/puzzles/sea.jpg",
      },
    ],
    bonusWords: ["نور"],
  },

  // ===== مرحلة 2: ألغاز بصورة واحدة - متوسط =====
  {
    title: "حيوانات بالصور",
    difficulty: "medium" as const,
    puzzleType: "image",
    reward: 100,
    hintCost: 15,
    questions: [
      {
        text: "قطة",
        clue: "ما اسم هذا الحيوان الأليف؟",
        category: "",
        imageUrl: "/images/puzzles/cat.jpg",
      },
      {
        text: "أسد",
        clue: "ما اسم ملك الغابة؟",
        category: "",
        imageUrl: "/images/puzzles/lion.jpg",
      },
    ],
    bonusWords: ["نمر"],
  },

  // ===== مرحلة 3: ألغاز بصورة واحدة - صعب =====
  {
    title: "أماكن بالصور",
    difficulty: "hard" as const,
    puzzleType: "image",
    reward: 125,
    hintCost: 20,
    questions: [
      {
        text: "صحراء",
        clue: "ما اسم هذه المنطقة الجافة؟",
        category: "",
        imageUrl: "/images/puzzles/desert.jpg",
      },
      {
        text: "جبل",
        clue: "ما اسم هذا التضاريس المرتفع؟",
        category: "",
        imageUrl: "/images/puzzles/mountain.jpg",
      },
      {
        text: "مدينة",
        clue: "ما اسم هذه المنطقة الحضرية؟",
        category: "",
        imageUrl: "/images/puzzles/city.jpg",
      },
    ],
    bonusWords: ["قرية"],
  },

  // ===== مرحلة 4: ألغاز بـ 4 صور (images4) =====
  {
    title: "أربع صور كلمة واحدة",
    difficulty: "medium" as const,
    puzzleType: "images4",
    reward: 125,
    hintCost: 20,
    questions: [
      {
        text: "كتاب",
        clue: "ما الشيء المشترك بين هذه الصور؟",
        category: "",
        imageUrl: "/images/puzzles/book.jpg",
        image2Url: "/images/puzzles/pen.svg",
        image3Url: "/images/puzzles/book.jpg",
        image4Url: "/images/puzzles/pen.svg",
      },
    ],
    bonusWords: ["قراءة"],
  },
];

async function createImageLevels() {
  console.log("بدء إنشاء مراحل ألغاز الصور...\n");

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

  for (const levelData of imageLevels) {
    const answerWords = levelData.questions.map((q) => q.text);
    const allWords = [...answerWords, ...levelData.bonusWords];
    const availableLetters = generateLetters(answerWords, 8);

    const level = await db.level.create({
      data: {
        chapterId: chapter.id,
        number: levelNumber++,
        title: levelData.title,
        difficulty: levelData.difficulty,
        gameMode: "quiz",
        puzzleType: levelData.puzzleType,
        gridSizeRows: 5,
        gridSizeCols: 5,
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
            imageUrl: q.imageUrl || "",
            image2Url: q.image2Url || "",
            image3Url: q.image3Url || "",
            image4Url: q.image4Url || "",
            direction: "across",
            startRow: idx,
            startCol: 0,
            number: idx + 1,
          })),
        },
      },
      include: { words: true },
    });

    console.log(`✓ [${level.puzzleType}] ${level.title} - ${levelData.questions.length} سؤال`);
    levelData.questions.forEach((q, i) => {
      const word = level.words[i];
      console.log(`  · سؤال ${i + 1}: "${q.clue}" → إجابة: "${q.text}" | صورة: ${q.imageUrl ? '✓' : '✗'}`);
      if (q.image2Url) console.log(`    صور إضافية: 4 صور`);
    });
    console.log("");
  }

  // إحصائيات
  const totalImages = await db.word.count({ where: { NOT: { imageUrl: "" } } });
  const totalImages4 = await db.level.count({ where: { puzzleType: "images4" } });
  const totalImage = await db.level.count({ where: { puzzleType: "image" } });

  console.log("=".repeat(50));
  console.log("✅ تم إنشاء مراحل ألغاز الصور!");
  console.log("=".repeat(50));
  console.log(`📊 مراحل بصورة واحدة (image): ${totalImage}`);
  console.log(`📊 مراحل بـ 4 صور (images4): ${totalImages4}`);
  console.log(`📊 إجمالي الأسئلة بصور: ${totalImages}`);
}

createImageLevels()
  .catch((e) => { console.error("خطأ:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
