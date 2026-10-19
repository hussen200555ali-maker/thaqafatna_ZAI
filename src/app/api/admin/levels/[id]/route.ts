import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/levels/[id] - جلب مرحلة محددة بتفاصيلها الكاملة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const level = await db.level.findUnique({
      where: { id: parseInt(id) },
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

    const formattedLevel = {
      ...level,
      availableLetters: level.availableLetters.split(","),
      bonusWords: level.bonusWords ? level.bonusWords.split(",") : [],
    };

    return NextResponse.json({ level: formattedLevel });
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json(
      { error: "Failed to fetch level" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/levels/[id] - تحديث مرحلة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const levelId = parseInt(id);

    const {
      title,
      difficulty,
      gameMode,
      gridSizeRows,
      gridSizeCols,
      availableLetters,
      bonusWords,
      reward,
      hintCost,
      chapterId,
      number,
      words,
      cells,
    } = body;

    const mode = gameMode || "crossword";

    // فحص آلي للجودة في وضع الشبكة فقط
    if (mode === "crossword" && words && cells && cells.length > 0) {
      const validation = validateLevel(words, cells, availableLetters);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // حذف الكلمات والخلايا القديمة ثم إضافة الجديدة
    await db.$transaction(async (tx) => {
      // تحديث المرحلة
      await tx.level.update({
        where: { id: levelId },
        data: {
          title,
          difficulty,
          gameMode: mode,
          puzzleType: body.puzzleType || "text",
          timeLimit: body.timeLimit || 0,
          gridSizeRows,
          gridSizeCols,
          availableLetters: Array.isArray(availableLetters)
            ? availableLetters.join(",")
            : availableLetters,
          bonusWords: Array.isArray(bonusWords)
            ? bonusWords.join(",")
            : bonusWords || "",
          reward,
          hintCost,
          chapterId,
          number,
          version: { increment: 1 },
        },
      });

      if (words) {
        // حذف الكلمات القديمة
        await tx.word.deleteMany({ where: { levelId } });

        // إضافة الكلمات الجديدة
        await tx.word.createMany({
          data: words.map((w: any) => ({
            levelId,
            text: w.text,
            clue: w.clue,
            category: w.category || "",
            imageUrl: w.imageUrl || "",
            image2Url: w.image2Url || "",
            image3Url: w.image3Url || "",
            image4Url: w.image4Url || "",
            emojis: w.emojis || "",
            options: Array.isArray(w.options) ? w.options.join("|") : (w.options || ""),
            correctOption: w.correctOption || 0,
            matchPairs: Array.isArray(w.matchPairs) ? w.matchPairs.join("|") : (w.matchPairs || ""),
            fillBlanks: w.fillBlanks || "",
            audioUrl: w.audioUrl || "",
            logicData: w.logicData || "",
            sequence: w.sequence || "",
            direction: w.direction || "across",
            startRow: w.startRow || 0,
            startCol: w.startCol || 0,
            number: w.number,
          })),
        });
      }

      if (mode === "crossword" && cells) {
        // حذف الخلايا القديمة
        await tx.cell.deleteMany({ where: { levelId } });

        // إضافة الخلايا الجديدة
        await tx.cell.createMany({
          data: cells.map((c: any) => ({
            levelId,
            row: c.row,
            col: c.col,
            letter: c.letter,
            number: c.number || null,
          })),
        });
      }
    });

    const updatedLevel = await db.level.findUnique({
      where: { id: levelId },
      include: {
        words: { orderBy: { number: "asc" } },
        cells: { orderBy: [{ row: "asc" }, { col: "asc" }] },
      },
    });

    return NextResponse.json({ level: updatedLevel });
  } catch (error) {
    console.error("Error updating level:", error);
    return NextResponse.json(
      { error: "Failed to update level" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/levels/[id] - حذف مرحلة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.level.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting level:", error);
    return NextResponse.json(
      { error: "Failed to delete level" },
      { status: 500 }
    );
  }
}

function validateLevel(words: any[], cells: any[], availableLetters: string | string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const letterPool: string[] = Array.isArray(availableLetters)
    ? [...availableLetters]
    : String(availableLetters).split(",");

  for (const word of words) {
    const wordLetters = word.text.split("");
    const tempPool = [...letterPool];

    for (const letter of wordLetters) {
      const idx = tempPool.indexOf(letter);
      if (idx === -1) {
        errors.push(`الكلمة "${word.text}" تحتاج حرف "${letter}" غير متوفر`);
        break;
      }
      tempPool.splice(idx, 1);
    }
  }

  const cellMap = new Map<string, string>();
  for (const cell of cells) {
    const key = `${cell.row}-${cell.col}`;
    if (cellMap.has(key) && cellMap.get(key) !== cell.letter) {
      errors.push(`خلية (${cell.row}, ${cell.col}) تحتوي على حرفين مختلفين`);
    }
    cellMap.set(key, cell.letter);
  }

  for (const word of words) {
    for (let i = 0; i < word.text.length; i++) {
      const row = word.direction === "across" ? word.startRow : word.startRow + i;
      const col = word.direction === "across" ? word.startCol + i : word.startCol;
      const key = `${row}-${col}`;
      const cellLetter = cellMap.get(key);

      if (!cellLetter) {
        errors.push(`الكلمة "${word.text}" تخرج خارج حدود الشبكة`);
        break;
      }
      if (cellLetter !== word.text[i]) {
        errors.push(`الكلمة "${word.text}" لا تتطابق مع الشبكة`);
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
