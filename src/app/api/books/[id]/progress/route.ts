/**
 * API: GET /api/books/[id]/progress — جلب تقدّم القراءة
 * API: POST /api/books/[id]/progress — تحديث تقدّم القراءة
 *
 * المدخلات POST:
 *   userId: string
 *   currentChapter?: number
 *   currentScroll?: number (0-100)
 *   timeSpentSec?: number
 *   completedChapter?: number — رقم فصل اكتمل
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — جلب تقدّم القراءة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const progress = await db.userReadingProgress.findUnique({
      where: {
        userId_bookId: { userId, bookId },
      },
    });

    // تحويل completedChapters من string إلى array
    const formattedProgress = progress
      ? {
          ...progress,
          completedChapters: (() => {
            try {
              const c = JSON.parse(progress.completedChapters || "[]");
              return Array.isArray(c) ? c : [];
            } catch {
              return [];
            }
          })(),
        }
      : null;

    return NextResponse.json({ progress: formattedProgress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST — تحديث تقدّم القراءة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();
    const { userId, currentChapter, currentScroll, timeSpentSec, completedChapter } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // جلب التقدّم الحالي
    const existing = await db.userReadingProgress.findUnique({
      where: {
        userId_bookId: { userId, bookId },
      },
    });

    // تحديث قائمة الفصول المكتملة
    let completedChaptersArr: number[] = [];
    try {
      const parsed = JSON.parse(existing?.completedChapters || "[]");
      if (Array.isArray(parsed)) completedChaptersArr = parsed;
    } catch {
      // ignore
    }

    if (completedChapter && !completedChaptersArr.includes(completedChapter)) {
      completedChaptersArr.push(completedChapter);
    }

    // جلب عدد الفصول الكلي
    const totalChapters = await db.bookChapter.count({
      where: { bookId, isPublished: true },
    });

    // التحقّق من إكمال الكتاب
    const isCompleted =
      completedChaptersArr.length >= totalChapters && totalChapters > 0;

    const progress = await db.userReadingProgress.upsert({
      where: {
        userId_bookId: { userId, bookId },
      },
      create: {
        userId,
        bookId,
        currentChapter: currentChapter || 1,
        currentScroll: currentScroll || 0,
        timeSpentSec: timeSpentSec || 0,
        completedChapters: JSON.stringify(completedChaptersArr),
        completedAt: isCompleted ? new Date() : null,
        lastReadAt: new Date(),
      },
      update: {
        currentChapter: currentChapter || existing?.currentChapter || 1,
        currentScroll: currentScroll ?? existing?.currentScroll ?? 0,
        timeSpentSec: (existing?.timeSpentSec || 0) + (timeSpentSec || 0),
        completedChapters: JSON.stringify(completedChaptersArr),
        completedAt: isCompleted ? new Date() : existing?.completedAt,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      progress: {
        ...progress,
        completedChapters: completedChaptersArr,
        totalChapters,
        isCompleted,
        completionRate: totalChapters > 0
          ? Math.round((completedChaptersArr.length / totalChapters) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
