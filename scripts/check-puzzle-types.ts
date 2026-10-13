/**
 * فحص شامل لكل أنواع الألغاز الـ 12 في قاعدة البيانات
 * يتحقق من:
 *   1. توفر كل نوع لغز
 *   2. اكتمال بيانات كل نوع (حقول puzzleType-specific)
 *   3. صحة الإجابات والصور والخيارات
 */

import { db } from "/home/z/my-project/src/lib/db";

const ALL_PUZZLE_TYPES = [
  "text",
  "image",
  "images4",
  "emoji",
  "scrambled",
  "crossword",
  "fillblank",
  "matching",
  "multiple",
  "audio",
  "logic",
  "progressive",
  "mixed",
];

async function main() {
  console.log("=".repeat(70));
  console.log("🔍 فحص شامل لكل أنواع الألغاز في قاعدة البيانات");
  console.log("=".repeat(70));

  // 1. إحصائية عامة
  const allLevels = await db.level.findMany({
    where: { isPublished: true },
    include: {
      words: true,
      cells: true,
    },
  });
  console.log(`\n📊 إجمالي المراحل المنشورة: ${allLevels.length}`);

  // 2. تحليل كل نوع لغز
  console.log("\n" + "─".repeat(70));
  console.log("📋 تفصيل كل نوع لغز:");
  console.log("─".repeat(70));

  const report: any[] = [];

  for (const puzzleType of ALL_PUZZLE_TYPES) {
    const levelsOfType = allLevels.filter((l) => l.puzzleType === puzzleType);
    const count = levelsOfType.length;

    console.log(`\n${puzzleType.toUpperCase()}:`);
    console.log(`  📦 عدد المراحل: ${count}`);

    if (count === 0) {
      console.log(`  ⚠️ لا توجد مراحل من هذا النوع!`);
      report.push({ type: puzzleType, count, status: "missing", issues: ["no_levels"] });
      continue;
    }

    // فحص بيانات كل مرحلة من هذا النوع
    const issues: string[] = [];
    let validCount = 0;

    for (const level of levelsOfType) {
      const levelIssues: string[] = [];

      // فحص الحقول المطلوبة لكل نوع
      switch (puzzleType) {
        case "image":
          if (!level.words.some((w) => w.imageUrl)) {
            levelIssues.push("no_image_url");
          }
          break;
        case "images4":
          if (!level.words.some((w) => w.imageUrl && w.image2Url && w.image3Url && w.image4Url)) {
            levelIssues.push("missing_images");
          }
          break;
        case "emoji":
          if (!level.words.some((w) => w.emojis)) {
            levelIssues.push("no_emojis");
          }
          break;
        case "scrambled":
          if (!level.words.some((w) => w.sequence)) {
            levelIssues.push("no_sequence");
          }
          break;
        case "fillblank":
          if (!level.words.some((w) => w.fillBlanks)) {
            levelIssues.push("no_fillblanks");
          }
          break;
        case "matching":
          if (!level.words.some((w) => w.matchPairs)) {
            levelIssues.push("no_matchpairs");
          }
          break;
        case "multiple":
          if (!level.words.some((w) => w.options)) {
            levelIssues.push("no_options");
          }
          break;
        case "audio":
          if (!level.words.some((w) => w.audioUrl)) {
            levelIssues.push("no_audiourl");
          }
          break;
        case "logic":
          if (!level.words.some((w) => w.logicData || w.sequence)) {
            levelIssues.push("no_logic_data");
          }
          break;
        case "progressive":
          if (!level.words.some((w) => w.clue)) {
            levelIssues.push("no_progressive_clue");
          }
          break;
        case "crossword":
          if (level.cells.length === 0) {
            levelIssues.push("no_cells");
          }
          if (level.words.length < 2) {
            levelIssues.push("insufficient_words_for_crossword");
          }
          break;
        case "text":
          if (!level.words.some((w) => w.clue)) {
            levelIssues.push("no_clue");
          }
          break;
      }

      // فحص إجابة صحيحة لكل سؤال
      const wordsWithoutAnswer = level.words.filter((w) => !w.text || w.text.length < 2);
      if (wordsWithoutAnswer.length > 0) {
        levelIssues.push(`missing_answers (${wordsWithoutAnswer.length})`);
      }

      // فحص الحروف المتاحة للأنواع التي تحتاجها
      if (["text", "scrambled", "crossword", "progressive"].includes(puzzleType)) {
        if (!level.availableLetters || level.availableLetters.length < 5) {
          levelIssues.push("insufficient_letters");
        }
      }

      if (levelIssues.length > 0) {
        issues.push(`مرحلة ${level.id} "${level.title}": ${levelIssues.join(", ")}`);
      } else {
        validCount++;
      }
    }

    console.log(`  ✅ مراحل سليمة: ${validCount}/${count}`);
    if (issues.length > 0) {
      console.log(`  ❌ مراحل بمشاكل (${issues.length}):`);
      issues.slice(0, 3).forEach((i) => console.log(`     • ${i}`));
      if (issues.length > 3) console.log(`     ... و ${issues.length - 3} أخرى`);
    }

    report.push({
      type: puzzleType,
      count,
      validCount,
      status: validCount === count ? "all_valid" : validCount > 0 ? "partial" : "broken",
      issues,
    });
  }

  // 3. ملخص نهائي
  console.log("\n" + "=".repeat(70));
  console.log("📊 الملخص النهائي:");
  console.log("=".repeat(70));

  const totalTypes = ALL_PUZZLE_TYPES.length;
  const missingTypes = report.filter((r) => r.count === 0).map((r) => r.type);
  const brokenTypes = report.filter((r) => r.count > 0 && r.validCount === 0).map((r) => r.type);
  const partialTypes = report.filter((r) => r.status === "partial").map((r) => r.type);
  const validTypes = report.filter((r) => r.status === "all_valid").map((r) => r.type);

  console.log(`✅ أنواع تعمل بشكل ممتاز (${validTypes.length}/${totalTypes}): ${validTypes.join(", ") || "—"}`);
  console.log(`⚠️ أنواع تعمل جزئياً (${partialTypes.length}/${totalTypes}): ${partialTypes.join(", ") || "—"}`);
  console.log(`❌ أنواع مكسورة (${brokenTypes.length}/${totalTypes}): ${brokenTypes.join(", ") || "—"}`);
  console.log(`🚫 أنواع مفقودة (${missingTypes.length}/${totalTypes}): ${missingTypes.join(", ") || "—"}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("❌ خطأ:", e);
  process.exit(1);
});
