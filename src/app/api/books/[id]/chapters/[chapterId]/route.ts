/**
 * API: GET /api/books/[id]/chapters/[chapterId] — جلب محتوى فصل واحد
 *
 * يرجع المحتوى الكامل للفصل (content HTML)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;
    const bookId = parseInt(id);
    const chapterNumber = parseInt(chapterId);

    const chapter = await db.bookChapter.findFirst({
      where: { bookId, number: chapterNumber, isPublished: true },
      select: {
        id: true,
        number: true,
        title: true,
        content: true,
        readingTimeMin: true,
        isFree: true,
        relatedLevelId: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // جلب عدد الفصول الكلي للتنقّل
    const totalChapters = await db.bookChapter.count({
      where: { bookId, isPublished: true },
    });

    return NextResponse.json({
      chapter,
      totalChapters,
      hasPrev: chapterNumber > 1,
      hasNext: chapterNumber < totalChapters,
    });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}
