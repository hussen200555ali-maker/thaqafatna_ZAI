/**
 * API: GET /api/books/[id] — جلب كتاب محدد بتفاصيله
 * API: PUT /api/books/[id] — تعديل كتاب (للإدارة)
 * API: DELETE /api/books/[id] — حذف كتاب (للإدارة)
 *
 * يتضمّن: الفصول، التصنيف، التقييمات، تقدّم القراءة
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/books/[id] — جلب كتاب محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const book = await db.book.findUnique({
      where: { id: bookId },
      include: {
        category: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { number: "asc" },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { reviews: true, bookmarks: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // زيادة عدد المشاهدات
    await db.book.update({
      where: { id: bookId },
      data: { views: { increment: 1 } },
    });

    // جلب تقدّم القراءة إن وُجد userId
    let readingProgress: any = null;
    let userBookmark: any = null;
    if (userId) {
      readingProgress = await db.userReadingProgress.findUnique({
        where: {
          userId_bookId: { userId, bookId },
        },
      });
      userBookmark = await db.userBookmark.findFirst({
        where: { userId, bookId },
      });
    }

    return NextResponse.json({
      book: {
        ...book,
        // تحويل keywords من string إلى array
        keywords: (() => {
          try {
            const k = JSON.parse(book.keywords || "[]");
            return Array.isArray(k) ? k : [];
          } catch {
            return [];
          }
        })(),
        relatedLevels: (() => {
          try {
            const r = JSON.parse(book.relatedLevels || "[]");
            return Array.isArray(r) ? r : [];
          } catch {
            return [];
          }
        })(),
      },
      readingProgress,
      isBookmarked: !!userBookmark,
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] — تعديل كتاب (للإدارة)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();

    const book = await db.book.update({
      where: { id: bookId },
      data: {
        ...body,
        categoryId: body.categoryId ? parseInt(body.categoryId) : undefined,
        keywords: body.keywords
          ? Array.isArray(body.keywords)
            ? JSON.stringify(body.keywords)
            : body.keywords
          : undefined,
        relatedLevels: body.relatedLevels
          ? Array.isArray(body.relatedLevels)
            ? JSON.stringify(body.relatedLevels)
            : body.relatedLevels
          : undefined,
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] — حذف كتاب (للإدارة)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    await db.book.delete({
      where: { id: bookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
