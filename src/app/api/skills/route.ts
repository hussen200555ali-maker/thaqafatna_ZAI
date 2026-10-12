/**
 * API: GET /api/skills
 *
 * يجلب كل المهارات (للاستخدام في لوحة الإدارة).
 * يدعم فلترة بـ ?category=vocabulary|culture|logic|memory
 * و ?rootOnly=true لجلب الجذور فقط
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const rootOnly = searchParams.get("rootOnly") === "true";

    const where: any = {};
    if (category) where.category = category;
    if (rootOnly) where.isRoot = true;

    const skills = await db.skill.findMany({
      where,
      include: {
        parent: { select: { code: true, title: true } },
        children: { select: { id: true, code: true, title: true } },
        levelSkills: {
          select: {
            level: {
              select: { id: true, number: true, title: true, chapter: { select: { title: true } } },
            },
            weight: true,
          },
        },
        _count: { select: { playerSkills: true, levelSkills: true } },
      },
      orderBy: [{ isRoot: "desc" }, { level: "asc" }, { code: "asc" }],
    });

    return NextResponse.json({
      skills: skills.map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        description: s.description,
        icon: s.icon,
        category: s.category,
        level: s.level,
        isRoot: s.isRoot,
        parent: s.parent,
        childrenCount: s.children.length,
        levelsCount: s._count.levelSkills,
        playersTracked: s._count.playerSkills,
        relatedLevels: s.levelSkills.map((ls) => ({
          levelId: ls.level.id,
          number: ls.level.number,
          title: ls.level.title,
          chapter: ls.level.chapter.title,
          weight: ls.weight,
        })),
      })),
      count: skills.length,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
