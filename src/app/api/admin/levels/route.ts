import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/levels?chapterId=1 - جلب مراحل فصل
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");
    const status = searchParams.get("status"); // draft, review, published, archived

    const levels = await db.level.findMany({
      where: {
        ...(chapterId ? { chapterId: parseInt(chapterId) } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { number: "asc" },
      include: {
        chapter: {
          select: { id: true, title: true },
        },
        _count: {
          select: { words: true },
        },
      },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching admin levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}

// POST /api/admin/levels - إنشاء مرحلة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chapterId,
      number,
      title,
      difficulty,
      gameMode,
      gridSizeRows,
      gridSizeCols,
      availableLetters,
      bonusWords,
      reward,
      hintCost,
      words,
      cells,
    } = body;

    if (!chapterId || !title || !words) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // توليد الحروف تلقائياً إذا كانت فارغة
    let lettersToSave = availableLetters;
    if (!lettersToSave || (Array.isArray(lettersToSave) && lettersToSave.length === 0)) {
      lettersToSave = words.map((w: any) => w.text).join("").split("");
    }

    // فحص آلي لجودة اللغز (فقط في وضع الشبكة)
    const mode = gameMode || "quiz";
    if (mode === "crossword" && cells && cells.length > 0) {
      const validation = validateLevel(words, cells, lettersToSave);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // الحصول على رقم المرحلة التالي إذا لم يُحدد
    let levelNumber = number;
    if (!levelNumber) {
      const lastLevel = await db.level.findFirst({
        where: { chapterId },
        orderBy: { number: "desc" },
      });
      levelNumber = (lastLevel?.number || 0) + 1;
    }

    // إنشاء المرحلة مع الكلمات والخلايا
    const level = await db.level.create({
      data: {
        chapterId,
        number: levelNumber,
        title,
        difficulty: difficulty || "easy",
        gameMode: mode,
        puzzleType: body.puzzleType || "text",
        timeLimit: body.timeLimit || 0,
        gridSizeRows: gridSizeRows || 5,
        gridSizeCols: gridSizeCols || 5,
        availableLetters: Array.isArray(lettersToSave)
          ? lettersToSave.join(",")
          : lettersToSave || "",
        bonusWords: Array.isArray(bonusWords)
          ? bonusWords.join(",")
          : bonusWords || "",
        reward: reward || 50,
        hintCost: hintCost || 10,
        status: "draft",
        words: {
          create: words.map((w: any) => ({
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
        },
        cells: mode === "crossword" && cells ? {
          create: cells.map((c: any) => ({
            row: c.row,
            col: c.col,
            letter: c.letter,
            number: c.number || null,
          })),
        } : undefined,
      },
      include: {
        words: true,
        cells: true,
      },
    });

    return NextResponse.json({ level }, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return NextResponse.json(
      { error: "Failed to create level" },
      { status: 500 }
    );
  }
}

// ===== الفحص الآلي لجودة اللغز =====
function validateLevel(words: any[], cells: any[], availableLetters: string | string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. التحقق من توفر الحروف (دعم string أو string[])
  const letterPool: string[] = Array.isArray(availableLetters)
    ? [...availableLetters]
    : String(availableLetters).split(",");

  for (const word of words) {
    const wordLetters = word.text.split("");
    const tempPool = [...letterPool];

    for (const letter of wordLetters) {
      const idx = tempPool.indexOf(letter);
      if (idx === -1) {
        errors.push(`الكلمة "${word.text}" تحتاج حرف "${letter}" غير متوفر في المجموعة`);
        break;
      }
      tempPool.splice(idx, 1);
    }
  }

  // 2. التحقق من تطابق الحروف في التقاطعات
  const cellMap = new Map<string, string>();
  for (const cell of cells) {
    const key = `${cell.row}-${cell.col}`;
    if (cellMap.has(key) && cellMap.get(key) !== cell.letter) {
      errors.push(`خلية (${cell.row}, ${cell.col}) تحتوي على حرفين مختلفين`);
    }
    cellMap.set(key, cell.letter);
  }

  // 3. التحقق من أن كل كلمة تتطابق مع الخلايا
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
        errors.push(`الكلمة "${word.text}" لا تتطابق مع الحروف في الشبكة عند (${row}, ${col})`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
