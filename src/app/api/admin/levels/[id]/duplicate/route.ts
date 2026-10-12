import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/admin/levels/[id]/duplicate - نسخ مرحلة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const levelId = parseInt(id);

    const originalLevel = await db.level.findUnique({
      where: { id: levelId },
      include: {
        words: true,
        cells: true,
      },
    });

    if (!originalLevel) {
      return NextResponse.json(
        { error: "Level not found" },
        { status: 404 }
      );
    }

    // إنشاء نسخة جديدة
    const newLevel = await db.level.create({
      data: {
        chapterId: originalLevel.chapterId,
        number: originalLevel.number + 1,
        title: `${originalLevel.title} (نسخة)`,
        difficulty: originalLevel.difficulty,
        gridSizeRows: originalLevel.gridSizeRows,
        gridSizeCols: originalLevel.gridSizeCols,
        availableLetters: originalLevel.availableLetters,
        bonusWords: originalLevel.bonusWords,
        reward: originalLevel.reward,
        hintCost: originalLevel.hintCost,
        status: "draft",
        words: {
          create: originalLevel.words.map((w) => ({
            text: w.text,
            clue: w.clue,
            direction: w.direction,
            startRow: w.startRow,
            startCol: w.startCol,
            number: w.number,
          })),
        },
        cells: {
          create: originalLevel.cells.map((c) => ({
            row: c.row,
            col: c.col,
            letter: c.letter,
            number: c.number,
          })),
        },
      },
      include: {
        words: true,
        cells: true,
      },
    });

    return NextResponse.json({ level: newLevel }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating level:", error);
    return NextResponse.json(
      { error: "Failed to duplicate level" },
      { status: 500 }
    );
  }
}
