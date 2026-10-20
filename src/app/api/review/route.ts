/**
 * API: GET /api/review?userId=xxx — جلب الكلمات المستحقة للمراجعة
 * API: POST /api/review — تسجيل نتيجة مراجعة كلمة
 *
 * GET يرجع:
 *   - الكلمات المستحقة (nextReviewAt <= now)
 *   - كلمات جديدة لم تُراجع بعد
 *   - إحصائيات المراجعة
 *
 * POST المدخلات:
 *   userId, word, quality (0-3)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateNextReview, getReviewStats, getMotivationalMessage } from "@/lib/spaced-repetition-engine";

// GET — جلب الكلمات للمراجعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const now = new Date();

    // الكلمات المستحقة للمراجعة (nextReviewAt <= now)
    const dueWords = await db.userWordMastery.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
    });

    // كل كلمات المستخدم للإحصائيات
    const allWords = await db.userWordMastery.findMany({
      where: { userId },
      select: {
        id: true,
        word: true,
        wordText: true,
        clue: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        nextReviewAt: true,
        lastReviewedAt: true,
      },
    });

    const stats = getReviewStats(allWords);

    return NextResponse.json({
      dueWords,
      stats,
      motivationalMessage: getMotivationalMessage(stats.masteredCount, stats.totalCount),
    });
  } catch (error) {
    console.error("Error fetching review words:", error);
    return NextResponse.json({ error: "Failed to fetch review words" }, { status: 500 });
  }
}

// POST — تسجيل نتيجة مراجعة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, word, wordText, clue, quality, sourceType, sourceId } = body;

    if (!userId || !word || quality === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // جلب السجل الحالي (أو إنشاء جديد)
    const existing = await db.userWordMastery.findUnique({
      where: { userId_word: { userId, word } },
    });

    if (!existing) {
      // كلمة جديدة — أنشئ السجل
      const update = calculateNextReview(
        {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          correctCount: 0,
          wrongCount: 0,
        },
        quality
      );

      const mastery = await db.userWordMastery.create({
        data: {
          userId,
          word,
          wordText: wordText || word,
          clue: clue || "",
          sourceType: sourceType || "level",
          sourceId: sourceId || null,
          ...update,
        },
      });

      // سجّل المراجعة
      await db.reviewLog.create({
        data: { userId, word, quality },
      });

      return NextResponse.json({ mastery, isNew: true });
    }

    // كلمة موجودة — حدّثها
    const update = calculateNextReview(
      {
        easeFactor: existing.easeFactor,
        interval: existing.interval,
        repetitions: existing.repetitions,
        correctCount: existing.correctCount,
        wrongCount: existing.wrongCount,
      },
      quality
    );

    const mastery = await db.userWordMastery.update({
      where: { id: existing.id },
      data: update,
    });

    // سجّل المراجعة
    await db.reviewLog.create({
      data: { userId, word, quality },
    });

    return NextResponse.json({ mastery, isNew: false });
  } catch (error) {
    console.error("Error recording review:", error);
    return NextResponse.json({ error: "Failed to record review" }, { status: 500 });
  }
}
