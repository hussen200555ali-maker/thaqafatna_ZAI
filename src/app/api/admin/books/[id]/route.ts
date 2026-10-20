/**
 * API: GET /api/admin/books/[id] — جلب كتاب كامل للإدارة
 * API: PUT /api/admin/books/[id] — تعديل كتاب
 * API: DELETE /api/admin/books/[id] — حذف كتاب
 * API: POST /api/admin/books/[id] — نشر/إلغاء نشر كتاب
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    const book = await db.book.findUnique({
      where: { id: bookId },
      include: {
        category: true,
        chapters: { orderBy: { number: "asc" } },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}

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
          ? Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : body.keywords
          : undefined,
        relatedLevels: body.relatedLevels
          ? Array.isArray(body.relatedLevels) ? JSON.stringify(body.relatedLevels) : body.relatedLevels
          : undefined,
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);

    await db.book.delete({ where: { id: bookId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}

// POST — نشر/إلغاء نشر كتاب
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();
    const { action } = body; // publish | unpublish

    const isPublished = action === "publish";
    const book = await db.book.update({
      where: { id: bookId },
      data: { isPublished },
    });

    return NextResponse.json({ book, published: isPublished });
  } catch (error) {
    console.error("Error toggling publish:", error);
    return NextResponse.json({ error: "Failed to toggle publish" }, { status: 500 });
  }
}
