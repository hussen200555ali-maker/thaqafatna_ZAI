import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/admin/levels/[id]/publish - نشر مرحلة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const levelId = parseInt(id);

    // فحص أن المرحلة تحتوي على كلمات وخلايا
    const level = await db.level.findUnique({
      where: { id: levelId },
      include: {
        words: true,
        cells: true,
      },
    });

    if (!level) {
      return NextResponse.json(
        { error: "Level not found" },
        { status: 404 }
      );
    }

    if (level.words.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish: Level has no words" },
        { status: 400 }
      );
    }

    // فحص الخلايا فقط في وضع الشبكة (crossword)
    if (level.gameMode === "crossword" && level.cells.length === 0) {
      return NextResponse.json(
        { error: "Cannot publish: Level has no cells" },
        { status: 400 }
      );
    }

    const updatedLevel = await db.level.update({
      where: { id: levelId },
      data: {
        status: "published",
        isPublished: true,
      },
    });

    return NextResponse.json({ level: updatedLevel });
  } catch (error) {
    console.error("Error publishing level:", error);
    return NextResponse.json(
      { error: "Failed to publish level" },
      { status: 500 }
    );
  }
}
