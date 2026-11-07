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
      where: { bookId, order: chapterNumber, isPublished: true },
      select: {
        id: true,
        order: true,
        title: true,
        content: true,
        estimatedMinutes: true,
        isFree: true,
        relatedLevelId: true,
        pageStart: true,
        pageEnd: true,
      },
    });

    if (!chapter) {
      // 📌 Fallback: لو الكتاب له PDF لكن بدون فصول، نرجع فصلًا افتراضيًا
      // بدل 404، حتى يتمكن القارئ من عرض الـ PDF مباشرة
      const book = await db.book.findUnique({
        where: { id: bookId },
        select: { id: true, title: true, pdfUrl: true, contentType: true },
      });
      if (book?.pdfUrl) {
        return NextResponse.json({
          chapter: {
            id: 0,
            order: chapterNumber,
            title: book.title,
            content: "",
            estimatedMinutes: 0,
            isFree: true,
            relatedLevelId: null,
            pageStart: null,
            pageEnd: null,
          },
          totalChapters: 0,
          hasPrev: false,
          hasNext: false,
          isPdfOnly: true,
        });
      }
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
