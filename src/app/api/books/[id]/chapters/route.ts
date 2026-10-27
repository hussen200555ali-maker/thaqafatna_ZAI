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
    const { title, content, readingTimeMin, isFree, keywords, relatedLevelId } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
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
