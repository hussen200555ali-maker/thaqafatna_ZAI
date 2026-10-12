/**
 * API: GET /api/knowledge-map?userId=xxx
 *
 * يبني خريطة المعرفة البصرية الكاملة للاعب:
 *   - شجرة المهارات الهرمية (5 جذور + فروعها)
 *   - إتقان اللاعب لكل مهارة
 *   - حالة كل فصل (مكتمل/جاري/مقفل)
 *   - روابط المعرفة بين الفصول والمهارات
 *
 * يُستخدم في مكوّن KnowledgeMap component
 *
 * ملاحظة أداء: نستعلم بشكل منفصل (بدلاً من includes متداخلة)
 * لأن SQLite يواجه صعوبة مع joins عميقة في dev mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // 1. جلب المهارات الجذرية فقط (بدون includes ثقيلة)
    const rootSkills = await db.skill.findMany({
      where: { isRoot: true },
      orderBy: { level: "asc" },
    });

    // 2. جلب كل المهارات الفرعية
    const allChildren = await db.skill.findMany({
      where: { isRoot: false },
      orderBy: { level: "asc" },
    });

    // 3. جلب إتقان اللاعب لكل المهارات
    const playerSkills = await db.playerSkill.findMany({
      where: { userId },
    });

    // 4. جلب روابط المهارات بالمراحل
    const allLevelSkills = await db.levelSkill.findMany();

    // 5. جلب تقدّم اللاعب
    const playerProgress = await db.playerProgress.findMany({
      where: { userId },
      select: { levelId: true, isCompleted: true, stars: true },
    });

    // 6. جلب كل المراحل (بدون includes)
    const allLevels = await db.level.findMany({
      select: {
        id: true,
        number: true,
        title: true,
        chapterId: true,
      },
    });

    // 7. جلب كل الفصول
    const allChapters = await db.chapter.findMany({
      select: { id: true, title: true, icon: true, color: true },
    });

    // بناء الـ maps للاستعلام السريع
    const playerSkillMap = new Map(
      playerSkills.map((ps) => [ps.skillId, ps])
    );
    const completedLevels = new Set(
      playerProgress.filter((p) => p.isCompleted).map((p) => p.levelId)
    );
    const levelStarsMap = new Map(
      playerProgress.map((p) => [p.levelId, p.stars])
    );
    const levelMap = new Map(allLevels.map((l) => [l.id, l]));
    const chapterMap = new Map(allChapters.map((c) => [c.id, c]));

    // مجموعة المهارات الفرعية لكل جذر
    const childrenByParent = new Map<number, typeof allChildren>();
    for (const child of allChildren) {
      if (child.parentId) {
        const arr = childrenByParent.get(child.parentId) || [];
        arr.push(child);
        childrenByParent.set(child.parentId, arr);
      }
    }

    // مجموعة LevelSkill لكل skillId
    const levelSkillsBySkill = new Map<number, typeof allLevelSkills>();
    for (const ls of allLevelSkills) {
      const arr = levelSkillsBySkill.get(ls.skillId) || [];
      arr.push(ls);
      levelSkillsBySkill.set(ls.skillId, arr);
    }

    // بناء الخريطة النهائية
    const knowledgeMap = rootSkills.map((rootSkill) => {
      const rootPs = playerSkillMap.get(rootSkill.id);
      const rootMastery = rootPs?.mastery ?? 0;

      const children = childrenByParent.get(rootSkill.id) || [];

      return {
        id: rootSkill.id,
        code: rootSkill.code,
        title: rootSkill.title,
        description: rootSkill.description,
        icon: rootSkill.icon,
        category: rootSkill.category,
        level: rootSkill.level,
        mastery: Math.round(rootMastery),
        isRoot: true,
        children: children.map((childSkill) => {
          const childPs = playerSkillMap.get(childSkill.id);
          const childMastery = childPs?.mastery ?? 0;
          const lsList = levelSkillsBySkill.get(childSkill.id) || [];

          const relatedLevels = lsList.map((ls) => {
            const level = levelMap.get(ls.levelId);
            const chapter = level ? chapterMap.get(level.chapterId) : null;
            const isCompleted = completedLevels.has(ls.levelId);
            const stars = levelStarsMap.get(ls.levelId) ?? 0;
            return {
              levelId: ls.levelId,
              levelNumber: level?.number ?? 0,
              levelTitle: level?.title ?? "",
              chapterTitle: chapter?.title ?? "",
              chapterIcon: chapter?.icon ?? "",
              chapterColor: chapter?.color ?? "",
              weight: ls.weight,
              isCompleted,
              stars,
            };
          });

          return {
            id: childSkill.id,
            code: childSkill.code,
            title: childSkill.title,
            description: childSkill.description,
            icon: childSkill.icon,
            category: childSkill.category,
            level: childSkill.level,
            mastery: Math.round(childMastery),
            isRoot: false,
            relatedLevels,
            stats: {
              attempts: childPs?.attempts ?? 0,
              correct: childPs?.correct ?? 0,
              incorrect: childPs?.incorrect ?? 0,
              masteredAt: childPs?.masteredAt ?? null,
              lastPracticedAt: childPs?.lastPracticedAt ?? null,
            },
          };
        }),
      };
    });

    // إحصائيات إجمالية
    const totalSkills = knowledgeMap.reduce(
      (sum, root) => sum + 1 + root.children.length,
      0
    );
    const masteredSkills = knowledgeMap.reduce((sum, root) => {
      const rootMastered = root.mastery >= 80 ? 1 : 0;
      const childrenMastered = root.children.filter(
        (c) => c.mastery >= 80
      ).length;
      return sum + rootMastered + childrenMastered;
    }, 0);

    return NextResponse.json({
      knowledgeMap,
      stats: {
        totalSkills,
        masteredSkills,
        masteryRate:
          totalSkills > 0
            ? Math.round((masteredSkills / totalSkills) * 100)
            : 0,
        totalLevels: playerProgress.length,
        completedLevels: completedLevels.size,
      },
    });
  } catch (error) {
    console.error("Error fetching knowledge map:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge map" },
      { status: 500 }
    );
  }
}
