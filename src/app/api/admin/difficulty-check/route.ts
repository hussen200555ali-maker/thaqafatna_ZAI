/**
 * API: GET /api/admin/difficulty-check
 *
 * يحلّل توزيع الصعوبة في كل الفصول ويعطي توصيات للتحسين.
 * يُستخدم في لوحة الإدارة → تبويب "موازنة الصعوبة".
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeAllChapters } from "@/lib/difficulty-balancer";

export async function GET() {
  try {
    const chapters = await db.chapter.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        levels: {
          where: { isPublished: true },
          select: { id: true, number: true, difficulty: true },
        },
      },
    });

    if (chapters.length === 0) {
      return NextResponse.json({ report: null, message: "لا توجد فصول منشورة بعد" });
    }

    const chaptersForAnalysis = chapters.map((c) => ({
      id: c.id,
      title: c.title,
      icon: c.icon,
      order: c.order || c.id,
      levels: c.levels.map((l) => ({ difficulty: l.difficulty })),
    }));

    const report = analyzeAllChapters(chaptersForAnalysis);

    return NextResponse.json({ report, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error in difficulty check:", error);
    return NextResponse.json(
      { error: "Failed to analyze difficulty balance" },
      { status: 500 }
    );
  }
}
