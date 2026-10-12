// إنشاء منصة ثقافية متكاملة لـ"ثقافتنا"
// تشمل: أمثال عربية، حكم، شعر، تاريخ إسلامي، جغرافيا، علوم، شخصيات، معالم

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

// ===== الفصول الثقافية =====
const newChapters = [
  { title: "أمثال عربية", description: "حكم وأمثال من التراث العربي", icon: "📜", color: "oklch(0.65 0.18 30)", unlockAt: 0, order: 4 },
  { title: "شخصيات إسلامية", description: "علماء وقادة من تاريخ الإسلام", icon: "🏛️", color: "oklch(0.60 0.09 195)", unlockAt: 0, order: 5 },
  { title: "جغرافيا عربية", description: "بلدان وأماكن من العالم العربي", icon: "🗺️", color: "oklch(0.70 0.14 145)", unlockAt: 0, order: 6 },
  { title: "علوم وفنون", description: "مصطلحات علمية وفنية", icon: "🔬", color: "oklch(0.65 0.10 290)", unlockAt: 0, order: 7 },
  { title: "شعر وأدب", description: "أبيات شعرية وأسماء أدبية", icon: "📚", color: "oklch(0.58 0.20 350)", unlockAt: 0, order: 8 },
];

// ===== المحتوى الثقافي لكل فصل =====
const chapterContent: Record<string, { title: string; difficulty: string; questions: any[]; bonusWords: string[] }[]> = {
  "أمثال عربية": [
    {
      title: "أمثال شعبية",
      difficulty: "easy",
      questions: [
        { text: "صبر", clue: "أكمل المثل: ال... مفتاح الفرج", category: "أكمل" },
        { text: "سيف", clue: "أكمل المثل: ال... أصدق الأنباء", category: "أكمل" },
        { text: "علم", clue: "أكمل المثل: اطلبوا ال... من المهد إلى اللحد", category: "أكمل" },
        { text: "صديق", clue: "أكمل المثل: الصديق عند الضيق", category: "أكمل" },
        { text: "خير", clue: "أكمل المثل: في التأني ال... وفي العجلة الندامة", category: "أكمل" },
      ],
      bonusWords: ["صبر", "خير"],
    },
    {
      title: "حكم عربية",
      difficulty: "medium",
      questions: [
        { text: "وقت", clue: "أكمل الحكمة: ال... كالسيف", category: "أكمل" },
        { text: "عقل", clue: "أكمل الحكمة: ال... زينة الرجل", category: "أكمل" },
        { text: "كلمة", clue: "أكمل الحكمة: ال... الطيبة جواز مرور", category: "أكمل" },
        { text: "عمل", clue: "أكمل الحكمة: ال... أبلغ من القول", category: "أكمل" },
      ],
      bonusWords: ["قول", "فعل"],
    },
    {
      title: "أمثال صعبة",
      difficulty: "hard",
      questions: [
        { text: "يد", clue: "أكمل المثل: ال... التي تعطي خير من التي تأخذ", category: "أكمل" },
        { text: "ماء", clue: "أكمل المثل: ال... أمانة الله في الأرض", category: "أكمل" },
        { text: "قلم", clue: "أكمل المثل: ال... سيف المثقف", category: "أكمل" },
      ],
      bonusWords: ["سيف", "يد"],
    },
  ],

  "شخصيات إسلامية": [
    {
      title: "علماء المسلمين",
      difficulty: "easy",
      questions: [
        { text: "نيوتن", clue: "من العالم الذي اكتشف قانون الجاذبية؟", category: "من" },
        { text: "الخوارزمي", clue: "من عالم الرياضيات الذي أسس علم الجبر؟", category: "من" },
        { text: "ابن سينا", clue: "من طبيب وفيلسوف مسلم كتب القانون في الطب؟", category: "من" },
        { text: "الرازي", clue: "من الطبيب المسلم الذي اكتشف الجدري؟", category: "من" },
      ],
      bonusWords: ["علم", "طب"],
    },
    {
      title: "قادة ومحاربون",
      difficulty: "medium",
      questions: [
        { text: "صلاح", clue: "من القائد الذي حرر بيت المقدس؟", category: "من" },
        { text: "خالد", clue: "من القائد الذي لقب بسيف الله المسلول؟", category: "من" },
        { text: "طارق", clue: "من القائد الذي فتح الأندلس؟", category: "من" },
        { text: "قطز", clue: "من السلطان الذي هزم المغول؟", category: "من" },
      ],
      bonusWords: ["سيف", "نصر"],
    },
    {
      title: "صحابة رسول الله",
      difficulty: "medium",
      questions: [
        { text: "أبو بكر", clue: "من أول الخلفاء الراشدين؟", category: "من" },
        { text: "عمر", clue: "من ثاني الخلفاء الراشدين؟", category: "من" },
        { text: "عثمان", clue: "من ثالث الخلفاء الراشدين؟", category: "من" },
        { text: "علي", clue: "من رابع الخلفاء الراشدين؟", category: "من" },
      ],
      bonusWords: ["خلافة", "عدل"],
    },
  ],

  "جغرافيا عربية": [
    {
      title: "عواصم عربية",
      difficulty: "easy",
      questions: [
        { text: "رياض", clue: "ما عاصمة المملكة العربية السعودية؟", category: "أين" },
        { text: "قاهرة", clue: "ما عاصمة مصر؟", category: "أين" },
        { text: "بغداد", clue: "ما عاصمة العراق؟", category: "أين" },
        { text: "دمشق", clue: "ما عاصمة سوريا؟", category: "أين" },
      ],
      bonusWords: ["عاصمة", "مدينة"],
    },
    {
      title: "أنهار وبحار",
      difficulty: "medium",
      questions: [
        { text: "نيل", clue: "ما أطول نهر في العالم؟", category: "ماذا" },
        { text: "فرات", clue: "ما النهر الذي يمر بالعراق وسوريا؟", category: "ماذا" },
        { text: "أحمر", clue: "ما البحر الذي يفصل بين أفريقيا وآسيا؟", category: "ماذا" },
        { text: "متوسط", clue: "ما البحر الذي يقع بين أوروبا وأفريقيا؟", category: "ماذا" },
      ],
      bonusWords: ["بحر", "نهر"],
    },
    {
      title: "جبال وصحارى",
      difficulty: "hard",
      questions: [
        { text: "أطلس", clue: "ما اسم الجبال التي تمتد في المغرب؟", category: "ماذا" },
        { text: "كبير", clue: "أكمل: الصحراء ال... في شمال أفريقيا", category: "أكمل" },
        { text: "عربي", clue: "أكمل: الجزيرة ال... موطن العرب الأوائل", category: "أكمل" },
      ],
      bonusWords: ["جبل", "صحر"],
    },
  ],

  "علوم وفنون": [
    {
      title: "مصطلحات علمية",
      difficulty: "medium",
      questions: [
        { text: "ذرة", clue: "ما أصغر وحدة في المادة؟", category: "ماذا" },
        { text: "ضوء", clue: "ما الإشعاع المرئي للعين؟", category: "ماذا" },
        { text: "طاقة", clue: "ما القدرة على القيام بعمل؟", category: "ماذا" },
        { text: "موجة", clue: "ما اضطراب ينتقل عبر وسط؟", category: "ماذا" },
      ],
      bonusWords: ["علم", "فيزياء"],
    },
    {
      title: "فنون وآداب",
      difficulty: "hard",
      questions: [
        { text: "موسيقى", clue: "فن يؤلف الأصوات بإيقاع متناسق", category: "عرف" },
        { text: "رسم", clue: "فن التعبير بالألوان والخطوط", category: "عرف" },
        { text: "شعر", clue: "فن الكلام الموزون المقفى", category: "عرف" },
      ],
      bonusWords: ["فن", "أدب"],
    },
  ],

  "شعر وأدب": [
    {
      title: "شعراء العرب",
      difficulty: "medium",
      questions: [
        { text: "متنبي", clue: "من الشاعر الذي قال: الخيل والليل والبيداء تعرفني؟", category: "من" },
        { text: "شافي", clue: "من الشاعر الذي قال: سأمضي فما بال المنايا قوافلي؟", category: "من" },
        { text: "جاحظ", clue: "من الأديب الذي كتب كتاب الحيوان؟", category: "من" },
      ],
      bonusWords: ["شعر", "أدب"],
    },
    {
      title: "أبيات شعرية",
      difficulty: "hard",
      questions: [
        { text: "علم", clue: "أكمل البيت: العلم نور والجهل ظلام", category: "أكمل" },
        { text: "كتاب", clue: "أكمل البيت: خير جليس في الزمان كتاب", category: "أكمل" },
        { text: "صبر", clue: "أكمل البيت: إذا اشتدت رياح اليأس صبر", category: "أكمل" },
      ],
      bonusWords: ["بيت", "شعر"],
    },
  ],
};

async function createCulturalPlatform() {
  console.log("🌟 بدء إنشاء المنصة الثقافية المتكاملة...\n");

  // إنشاء الفصول الجديدة
  const chapterMap = new Map<string, number>();
  for (const ch of newChapters) {
    const existing = await db.chapter.findFirst({ where: { title: ch.title } });
    if (existing) {
      chapterMap.set(ch.title, existing.id);
      console.log(`📁 الفصل موجود: ${ch.title}`);
      continue;
    }
    const created = await db.chapter.create({
      data: {
        title: ch.title,
        description: ch.description,
        icon: ch.icon,
        color: ch.color,
        unlockAt: ch.unlockAt,
        order: ch.order,
        isPublished: true,
      },
    });
    chapterMap.set(ch.title, created.id);
    console.log(`📁 ✅ فصل جديد: ${ch.title} (${ch.icon})`);
  }

  let levelCount = 0;
  let questionCount = 0;

  // إنشاء المراحل لكل فصل
  for (const [chapterTitle, levels] of Object.entries(chapterContent)) {
    const chapterId = chapterMap.get(chapterTitle);
    if (!chapterId) continue;

    // الحصول على رقم المرحلة التالي في هذا الفصل
    const lastLevel = await db.level.findFirst({
      where: { chapterId },
      orderBy: { number: "desc" },
    });
    let levelNumber = (lastLevel?.number || 0) + 1;

    for (const levelData of levels) {
      // فحص إذا كانت المرحلة موجودة
      const existing = await db.level.findFirst({
        where: { chapterId, title: levelData.title },
      });
      if (existing) {
        console.log(`  ⏭️  مرحلة موجودة: ${levelData.title}`);
        continue;
      }

      const answerWords = levelData.questions.map((q: any) => q.text);
      const availableLetters = generateLetters(answerWords, 6);

      const reward = levelData.difficulty === "easy" ? 50 : levelData.difficulty === "medium" ? 75 : 100;
      const hintCost = levelData.difficulty === "easy" ? 10 : levelData.difficulty === "medium" ? 15 : 20;

      const level = await db.level.create({
        data: {
          chapterId,
          number: levelNumber++,
          title: levelData.title,
          difficulty: levelData.difficulty,
          gameMode: "quiz",
          puzzleType: "text",
          gridSizeRows: 5,
          gridSizeCols: 5,
          availableLetters: availableLetters.join(","),
          bonusWords: levelData.bonusWords.join(","),
          reward,
          hintCost,
          status: "published",
          isPublished: true,
          words: {
            create: levelData.questions.map((q: any, idx: number) => ({
              text: q.text,
              clue: q.clue,
              category: q.category || "",
              imageUrl: "",
              image2Url: "",
              image3Url: "",
              image4Url: "",
              direction: "across",
              startRow: idx,
              startCol: 0,
              number: idx + 1,
            })),
          },
        },
        include: { words: true },
      });

      levelCount++;
      questionCount += levelData.questions.length;
      console.log(`  ✅ [${levelData.difficulty}] ${levelData.title} - ${levelData.questions.length} سؤال`);
    }
  }

  // إحصائيات نهائية
  const totalChapters = await db.chapter.count();
  const totalLevels = await db.level.count();
  const totalQuestions = await db.word.count();
  const publishedLevels = await db.level.count({ where: { isPublished: true } });

  console.log("\n" + "=".repeat(60));
  console.log("🌟 تم إنشاء المنصة الثقافية المتكاملة!");
  console.log("=".repeat(60));
  console.log(`📊 الفصول: ${totalChapters}`);
  console.log(`📊 المراحل: ${totalLevels} (${publishedLevels} منشورة)`);
  console.log(`📊 الأسئلة: ${totalQuestions}`);
  console.log(`📊 المراحل الجديدة: ${levelCount} (${questionCount} سؤال)`);
  console.log("=".repeat(60));

  // عرض توزيع التصنيفات
  const categories = await db.word.groupBy({
    by: ["category"],
    _count: { category: true },
    where: { category: { not: "" } },
  });
  console.log("\n📋 توزيع التصنيفات:");
  for (const cat of categories.sort((a, b) => b._count.category - a._count.category)) {
    console.log(`   • ${cat.category}: ${cat._count.category} سؤال`);
  }

  // عرض توزيع الصعوبة
  const difficulties = await db.level.groupBy({
    by: ["difficulty"],
    _count: { difficulty: true },
  });
  console.log("\n📊 توزيع الصعوبة:");
  for (const d of difficulties) {
    console.log(`   • ${d.difficulty}: ${d._count.difficulty} مرحلة`);
  }
}

createCulturalPlatform()
  .catch((e) => { console.error("خطأ:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
