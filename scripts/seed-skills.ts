/**
 * سكربت بذور المهارات (Skills Seeder)
 * =================================
 *
 * ينشئ شبكة هرمية من المهارات ويربطها بفصول اللعبة.
 * شبكة المهارات مستوحاة من:
 *   - Duolingo (Skill Tree)
 *   - Khan Academy (Mastery)
 *   - Brilliant.org (Knowledge Graph)
 *
 * التسلسل الهرمي:
 *   مهارة جذرية → مهارات فرعية → ربط بمراحل محددة
 *
 * التشغيل: bun /home/z/my-project/scripts/seed-skills.ts
 */

import { db } from "../src/lib/db";

// ============================================================
// تعريف شبكة المهارات
// ============================================================

interface SkillSeed {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: "vocabulary" | "grammar" | "culture" | "logic" | "memory";
  level: 1 | 2 | 3 | 4 | 5;
  isRoot: boolean;
  parentCode?: string;
  // الفصول التي تُغطّي هذه المهارة (chapterId → وزن 1-10)
  chapterBindings?: { chapterId: number; weight: number }[];
}

const skills: SkillSeed[] = [
  // ====== الجذور الثقافية الكبرى (5 مهارات جذرية) ======
  {
    code: "vocab",
    title: "المفردات العربية",
    description: "إثراء الرصيد اللغوي بكلمات عربية أصيلة ومتنوعة",
    icon: "📖",
    category: "vocabulary",
    level: 1,
    isRoot: true,
  },
  {
    code: "culture",
    title: "الثقافة العربية",
    description: "تراث، أمثال، عادات، وتقاليد العالم العربي",
    icon: "🏛️",
    category: "culture",
    level: 2,
    isRoot: true,
  },
  {
    code: "history",
    title: "التاريخ والحضارة",
    description: "شخصيات، أحداث، وحضارات العربية والإسلامية",
    icon: "📜",
    category: "culture",
    level: 3,
    isRoot: true,
  },
  {
    code: "science",
    title: "العلوم والمعرفة",
    description: "مصطلحات علمية وطبيعية وبحرية",
    icon: "🔬",
    category: "vocabulary",
    level: 3,
    isRoot: true,
  },
  {
    code: "logic",
    title: "التفكير المنطقي",
    description: "حل المشكلات، الأنماط، الاستنتاج",
    icon: "🧩",
    category: "logic",
    level: 4,
    isRoot: true,
  },

  // ====== المفردات (تحت vocab) ======
  {
    code: "vocab.basic",
    title: "مفردات أساسية",
    description: "كلمات شائعة من الحياة اليومية",
    icon: "🌱",
    category: "vocabulary",
    level: 1,
    isRoot: false,
    parentCode: "vocab",
    chapterBindings: [{ chapterId: 1, weight: 9 }], // البدايات
  },
  {
    code: "vocab.nature",
    title: "مفردات الطبيعة",
    description: "نباتات، حيوانات، ظواهر طبيعية",
    icon: "🌿",
    category: "vocabulary",
    level: 2,
    isRoot: false,
    parentCode: "vocab",
    chapterBindings: [{ chapterId: 2, weight: 9 }], // الطبيعة
  },
  {
    code: "vocab.science",
    title: "المصطلحات العلمية",
    description: "كلمات من عالم العلوم والتقنية",
    icon: "🧪",
    category: "vocabulary",
    level: 3,
    isRoot: false,
    parentCode: "vocab",
    chapterBindings: [{ chapterId: 4, weight: 8 }], // العلوم
  },
  {
    code: "vocab.literary",
    title: "المفردات الأدبية",
    description: "كلمات من الشعر والأدب العربي",
    icon: "✒️",
    category: "vocabulary",
    level: 4,
    isRoot: false,
    parentCode: "vocab",
    chapterBindings: [{ chapterId: 6, weight: 9 }], // الأدب
  },

  // ====== الثقافة (تحت culture) ======
  {
    code: "culture.heritage",
    title: "التراث العربي",
    description: "عادات، أغانٍ، حرف، وأسلحة تقليدية",
    icon: "🏺",
    category: "culture",
    level: 2,
    isRoot: false,
    parentCode: "culture",
    chapterBindings: [{ chapterId: 3, weight: 9 }], // التراث
  },
  {
    code: "culture.proverbs",
    title: "الأمثال الشائعة",
    description: "أمثال عربية تستخدم في الحياة اليومية",
    icon: "💭",
    category: "culture",
    level: 3,
    isRoot: false,
    parentCode: "culture",
    chapterBindings: [{ chapterId: 3, weight: 6 }],
  },
  {
    code: "culture.figures",
    title: "الشخصيات الإسلامية",
    description: "صحابة، علماء، وقادة مسلمون",
    icon: "🕌",
    category: "culture",
    level: 3,
    isRoot: false,
    parentCode: "culture",
    chapterBindings: [{ chapterId: 5, weight: 9 }], // التاريخ
  },
  {
    code: "culture.geography",
    title: "الجغرافيا العربية",
    description: "مدن، بلدان، وأنهار العالم العربي",
    icon: "🗺️",
    category: "culture",
    level: 2,
    isRoot: false,
    parentCode: "culture",
    chapterBindings: [{ chapterId: 2, weight: 4 }],
  },

  // ====== التاريخ (تحت history) ======
  {
    code: "history.prophets",
    title: "قصص الأنبياء",
    description: "أنبياء ورسل في التراث الإسلامي",
    icon: "🌟",
    category: "culture",
    level: 3,
    isRoot: false,
    parentCode: "history",
    chapterBindings: [{ chapterId: 5, weight: 7 }],
  },
  {
    code: "history.battles",
    title: "المعارك والغزوات",
    description: "أحداث عسكرية في التاريخ الإسلامي",
    icon: "⚔️",
    category: "culture",
    level: 4,
    isRoot: false,
    parentCode: "history",
    chapterBindings: [{ chapterId: 5, weight: 5 }],
  },

  // ====== العلوم (تحت science) ======
  {
    code: "science.nature",
    title: "علوم الطبيعة",
    description: "ظواهر طبيعية: طقس، فلك، جيولوجيا",
    icon: "⛅",
    category: "vocabulary",
    level: 3,
    isRoot: false,
    parentCode: "science",
    chapterBindings: [{ chapterId: 2, weight: 5 }, { chapterId: 4, weight: 6 }],
  },
  {
    code: "science.tech",
    title: "العلوم التقنية",
    description: "مصطلحات تقنية وحديثة",
    icon: "💡",
    category: "vocabulary",
    level: 4,
    isRoot: false,
    parentCode: "science",
    chapterBindings: [{ chapterId: 4, weight: 7 }],
  },

  // ====== المنطق (تحت logic) ======
  {
    code: "logic.patterns",
    title: "التعرف على الأنماط",
    description: "اكتشاف تسلسلات وأنماط رقمية وحرفية",
    icon: "🔢",
    category: "logic",
    level: 3,
    isRoot: false,
    parentCode: "logic",
  },
  {
    code: "logic.deduction",
    title: "الاستنتاج المنطقي",
    description: "استخلاص النتائج من المقدمات",
    icon: "🧠",
    category: "logic",
    level: 4,
    isRoot: false,
    parentCode: "logic",
  },

  // ====== الذاكرة (مهارة عرضية) ======
  {
    code: "memory.work",
    title: "الذاكرة العاملة",
    description: "تذكر الكلمات والتسلسلات قصيرة المدى",
    icon: "💭",
    category: "memory",
    level: 2,
    isRoot: false,
    parentCode: "vocab",
  },
];

// ============================================================
// تنفيذ البذور
// ============================================================

async function seedSkills() {
  console.log("🌱 بدء زرع المهارات...");
  console.log(`📊 إجمالي المهارات: ${skills.length}`);

  // 1. إنشاء المهارات
  const skillCodeToId = new Map<string, number>();

  // أولاً المهارات الجذرية (بدون parent)
  for (const skill of skills.filter((s) => !s.parentCode)) {
    const created = await db.skill.upsert({
      where: { code: skill.code },
      create: {
        code: skill.code,
        title: skill.title,
        description: skill.description,
        icon: skill.icon,
        category: skill.category,
        level: skill.level,
        isRoot: skill.isRoot,
      },
      update: {
        title: skill.title,
        description: skill.description,
        icon: skill.icon,
        category: skill.category,
        level: skill.level,
        isRoot: skill.isRoot,
      },
    });
    skillCodeToId.set(skill.code, created.id);
    console.log(`  ✓ ${skill.isRoot ? "🌟" : "  "} ${skill.code} → ID ${created.id}`);
  }

  // ثانياً المهارات الفرعية
  for (const skill of skills.filter((s) => s.parentCode)) {
    const parentId = skillCodeToId.get(skill.parentCode!);
    if (!parentId) {
      console.warn(`  ⚠️ لم يتم العثور على الأصل لـ ${skill.code}`);
      continue;
    }
    const created = await db.skill.upsert({
      where: { code: skill.code },
      create: {
        code: skill.code,
        title: skill.title,
        description: skill.description,
        icon: skill.icon,
        category: skill.category,
        level: skill.level,
        isRoot: skill.isRoot,
        parentId,
      },
      update: {
        title: skill.title,
        description: skill.description,
        icon: skill.icon,
        category: skill.category,
        level: skill.level,
        isRoot: skill.isRoot,
        parentId,
      },
    });
    skillCodeToId.set(skill.code, created.id);
    console.log(`  ✓    ${skill.code} → ID ${created.id} (parent: ${skill.parentCode})`);
  }

  // 2. ربط المهارات بالفصول عبر المراحل
  console.log("\n🔗 ربط المهارات بالمراحل...");

  for (const skill of skills) {
    if (!skill.chapterBindings) continue;
    const skillId = skillCodeToId.get(skill.code)!;

    for (const binding of skill.chapterBindings) {
      // جلب كل مراحل الفصل
      const levels = await db.level.findMany({
        where: { chapterId: binding.chapterId, isPublished: true },
        select: { id: true },
      });

      for (const level of levels) {
        await db.levelSkill.upsert({
          where: {
            levelId_skillId: { levelId: level.id, skillId },
          },
          create: {
            levelId: level.id,
            skillId,
            weight: binding.weight,
          },
          update: { weight: binding.weight },
        });
      }
      console.log(
        `  ✓ ${skill.code} ↔ فصل ${binding.chapterId} (${levels.length} مرحلة، وزن ${binding.weight})`
      );
    }
  }

  // 3. إحصائيات نهائية
  const totalSkills = await db.skill.count();
  const totalBindings = await db.levelSkill.count();
  const rootSkills = await db.skill.count({ where: { isRoot: true } });

  console.log("\n" + "=".repeat(60));
  console.log("✅ اكتمل زرع المهارات بنجاح!");
  console.log("=".repeat(60));
  console.log(`📊 إجمالي المهارات: ${totalSkills}`);
  console.log(`🌟 المهارات الجذرية: ${rootSkills}`);
  console.log(`🔗 روابط المراحل بالمهارات: ${totalBindings}`);
  console.log("=".repeat(60));
}

seedSkills()
  .catch((e) => {
    console.error("❌ خطأ في الزرع:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
