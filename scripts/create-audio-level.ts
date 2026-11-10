/**
 * إنشاء مرحلة لغز صوتي تجريبية
 * تستخدم Web Speech API للمتصفح كحل بديل بدون الحاجة لملفات صوت حقيقية
 */

import { db } from "/home/z/my-project/src/lib/db";

async function main() {
  console.log("🔊 إنشاء مرحلة لغز صوتي تجريبية...\n");

  // إيجاد فصل مناسب
  const chapter = await db.chapter.findFirst({
    where: { title: { contains: "بدايات" } },
  });
  if (!chapter) {
    console.error("❌ لم يتم العثور على فصل 'البدايات'");
    return;
  }

  // إيجاد آخر رقم مرحلة في الفصل
  const lastLevel = await db.level.findFirst({
    where: { chapterId: chapter.id },
    orderBy: { number: "desc" },
  });
  const nextNumber = (lastLevel?.number ?? 0) + 1;

  // إنشاء المرحلة
  const level = await db.level.create({
    data: {
      chapterId: chapter.id,
      number: nextNumber,
      title: "أصوات وكلمات",
      difficulty: "medium",
      gameMode: "quiz",
      puzzleType: "audio",
      gridSizeRows: 5,
      gridSizeCols: 5,
      availableLetters: "م,ا,ء,س,ل,ك,ب,ت,ح,و,ر,ن,ي,ش",
      bonusWords: "ماش,ماس",
      reward: 60,
      hintCost: 10,
      status: "published",
      isPublished: true,
      learningGoals: JSON.stringify([
        "تدريب الأذن على تمييز الكلمات المنطوقة",
        "ربط الصوت بالكتابة الصحيحة",
        "تنمية مهارة الإصغاء النشط",
      ]),
      educationalDescription: "مرحلة تعتمد على الاستماع لكلمات عربية شائعة وكتابتها بشكل صحيح",
    },
  });

  console.log(`✅ تم إنشاء المرحلة: ${level.title} (ID: ${level.id})`);

  // إضافة الكلمات/الأسئلة
  // نستخدم روابط صوتية بديلة (data URL) لتجنب الاعتماد على ملفات خارجية
  // في الإنتاج، يمكن استبدالها بروابط صوتية حقيقية من CDN

  const questions = [
    {
      text: "ماء",
      clue: "اسمع الكلمة واكتبها — سائل شفاف ضروري للحياة",
      audioUrl: "", // سيُستخدم Web Speech API كحل بديل
      number: 1,
      direction: "across",
      startRow: 0,
      startCol: 0,
    },
    {
      text: "كتاب",
      clue: "اسمع الكلمة واكتبها — مصدر المعرفة والقراءة",
      audioUrl: "",
      number: 2,
      direction: "across",
      startRow: 1,
      startCol: 0,
    },
    {
      text: "مسلم",
      clue: "اسمع الكلمة واكتبها — من يتبع دين الإسلام",
      audioUrl: "",
      number: 3,
      direction: "across",
      startRow: 2,
      startCol: 0,
    },
    {
      text: "نور",
      clue: "اسمع الكلمة واكتبها — الضوء الساطع",
      audioUrl: "",
      number: 4,
      direction: "across",
      startRow: 3,
      startCol: 0,
    },
    {
      text: "شمس",
      clue: "اسمع الكلمة واكتبها — النجم الذي يضيء نهارنا",
      audioUrl: "",
      number: 5,
      direction: "across",
      startRow: 4,
      startCol: 0,
    },
  ];

  for (const q of questions) {
    await db.word.create({
      data: {
        levelId: level.id,
        text: q.text,
        clue: q.clue,
        audioUrl: q.audioUrl,
        number: q.number,
        direction: q.direction,
        startRow: q.startRow,
        startCol: q.startCol,
        category: "مفردات",
      },
    });
  }

  console.log(`✅ تم إضافة ${questions.length} أسئلة صوتية`);
  console.log(`\n📊 ملخص:`);
  console.log(`   - المرحلة: ${level.id} في فصل "${chapter.title}"`);
  console.log(`   - عدد الأسئلة: ${questions.length}`);
  console.log(`   - النوع: audio (لغز صوتي)`);
  console.log(`   - المكافأة: ${level.reward} عملة`);
  console.log(`\n💡 ملاحظة: روابط audioUrl فارغة — سيُستخدم حل بديل تلقائياً`);
  console.log(`   في الواجهة: يعرض زر تشغيل + تلميح بعدد الحروف`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("❌ خطأ:", e);
  process.exit(1);
});
