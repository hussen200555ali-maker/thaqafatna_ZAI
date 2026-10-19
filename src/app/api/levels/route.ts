import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/levels?chapterId=1 - جلب مراحل فصل معين
// GET /api/levels/:id - جلب مرحلة محددة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");
    const levelId = searchParams.get("id");

    // جلب مرحلة محددة بتفاصيلها الكاملة
    if (levelId) {
      const level = await db.level.findUnique({
        where: { id: parseInt(levelId) },
        include: {
          chapter: true,
          words: {
            orderBy: { number: "asc" },
          },
          cells: {
            orderBy: [{ row: "asc" }, { col: "asc" }],
          },
        },
      });

      if (!level) {
        return NextResponse.json(
          { error: "Level not found" },
          { status: 404 }
        );
      }

      // تحويل الحروف والكلمات الإضافية إلى مصفوفات + الحقول الجديدة
      // دعم الفواصل العربية (،) والإنجليزية (,)
      const splitLetters = (str: string): string[] => {
        if (!str) return [];
        // استبدال الفواصل العربية بالإنجليزية ثم التقسيم
        return str.replace(/،/g, ",").split(",").map(s => s.trim()).filter(s => s);
      };
      const splitWords = (str: string): string[] => {
        if (!str) return [];
        return str.replace(/،/g, ",").split(",").map(s => s.trim()).filter(s => s);
      };
      
      const formattedLevel = {
        ...level,
        availableLetters: splitLetters(level.availableLetters),
        bonusWords: splitWords(level.bonusWords),
        words: level.words.map((w: any) => ({
          ...w,
          options: w.options ? w.options.split("|") : [],
          matchPairs: w.matchPairs ? w.matchPairs.split("|") : [],
        })),
      };

      return NextResponse.json({ level: formattedLevel });
    }

    // جلب مراحل فصل معين
    const levels = await db.level.findMany({
      where: {
        isPublished: true,
        ...(chapterId ? { chapterId: parseInt(chapterId) } : {}),
      },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        title: true,
        difficulty: true,
        puzzleType: true,
        gameMode: true,
        reward: true,
        hintCost: true,
        chapterId: true,
      },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
