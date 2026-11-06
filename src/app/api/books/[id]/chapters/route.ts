/**
 * API: GET /api/books/[id]/chapters — جلب فصول الكتاب
 * API: POST /api/books/[id]/chapters — إضافة فصل (للإدارة)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — جلب فصول الكتاب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    const chapters = await db.bookChapter.findMany({
      where: { bookId, isPublished: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        order: true,
        title: true,
        estimatedMinutes: true,
        isFree: true,
        keywords: true,
        relatedLevelId: true,
        pageStart: true,
        pageEnd: true,
      },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST — إضافة فصل (للإدارة)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();

    // ===== دعم الإنشاء الجماعي (batch) =====
    // إن كان body.chapters مصفوفة، نُنشئها دفعة واحدة
    if (Array.isArray(body.chapters)) {
      const chaptersData = body.chapters as Array<{
        title: string;
        content?: string;
        readingTimeMin?: number;
        isFree?: boolean;
        keywords?: string[] | string;
        relatedLevelId?: number | null;
        pageStart?: number | null;
        pageEnd?: number | null;
      }>;

      // التحقق من البيانات
      for (const ch of chaptersData) {
        if (!ch.title) {
          return NextResponse.json(
            { error: "كل فصل يجب أن يحتوي على title" },
            { status: 400 }
          );
        }
        if (
          (ch.pageStart != null && ch.pageEnd == null) ||
          (ch.pageStart == null && ch.pageEnd != null)
        ) {
          return NextResponse.json(
            { error: "يجب تحديد pageStart و pageEnd معًا أو تركهما فارغين" },
            { status: 400 }
          );
        }
        if (
          ch.pageStart != null &&
          ch.pageEnd != null &&
          Number(ch.pageEnd) < Number(ch.pageStart)
        ) {
          return NextResponse.json(
            { error: `pageEnd (${ch.pageEnd}) يجب أن يكون ≥ pageStart (${ch.pageStart}) للفصل: ${ch.title}` },
            { status: 400 }
          );
        }
      }

      // حذف الفصول القديمة المرتبطة بهذا الكتاب (لتفادي التكرار عند إعادة الحفظ)
      if (body.replace === true) {
        await db.bookChapter.deleteMany({ where: { bookId } });
      }

      // جلب آخر order
      const lastChapter = await db.bookChapter.findFirst({
        where: { bookId },
        orderBy: { order: "desc" },
      });
      let nextOrder = (lastChapter?.order || 0) + 1;

      const created: any[] = [];
      for (const ch of chaptersData) {
        const c = await db.bookChapter.create({
          data: {
            bookId,
            order: nextOrder++,
            title: ch.title,
            content: ch.content || "",
            estimatedMinutes: ch.readingTimeMin || 5,
            isFree: ch.isFree !== undefined ? ch.isFree : true,
            keywords: Array.isArray(ch.keywords)
              ? JSON.stringify(ch.keywords)
              : ch.keywords || "[]",
            relatedLevelId: ch.relatedLevelId || null,
            pageStart: ch.pageStart != null ? Number(ch.pageStart) : null,
            pageEnd: ch.pageEnd != null ? Number(ch.pageEnd) : null,
          },
        });
        created.push(c);
      }

      return NextResponse.json({ chapters: created, count: created.length }, { status: 201 });
    }

    // ===== دعم الإنشاء الفردي (للتوافق مع القديم) =====
    const {
      title,
      content,
      readingTimeMin,
      isFree,
      keywords,
      relatedLevelId,
      pageStart,
      pageEnd,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    // التحقق من pageStart/pageEnd
    if (
      (pageStart != null && pageEnd == null) ||
      (pageStart == null && pageEnd != null)
    ) {
      return NextResponse.json(
        { error: "يجب تحديد pageStart و pageEnd معًا أو تركهما فارغين" },
        { status: 400 }
      );
    }
    if (
      pageStart != null &&
      pageEnd != null &&
      Number(pageEnd) < Number(pageStart)
    ) {
      return NextResponse.json(
        { error: "pageEnd يجب أن يكون ≥ pageStart" },
        { status: 400 }
      );
    }

    // جلب آخر رقم فصل
    const lastChapter = await db.bookChapter.findFirst({
      where: { bookId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastChapter?.order || 0) + 1;

    const chapter = await db.bookChapter.create({
      data: {
        bookId,
        order: nextOrder,
        title,
        content: content || "",
        estimatedMinutes: readingTimeMin || 5,
        isFree: isFree !== undefined ? isFree : true,
        keywords: Array.isArray(keywords)
          ? JSON.stringify(keywords)
          : keywords || "[]",
        relatedLevelId: relatedLevelId || null,
        pageStart: pageStart != null ? Number(pageStart) : null,
        pageEnd: pageEnd != null ? Number(pageEnd) : null,
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}
