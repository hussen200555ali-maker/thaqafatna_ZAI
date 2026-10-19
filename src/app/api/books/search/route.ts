/**
 * API: GET /api/books/search?q=... — البحث في الكتب
 *
 * يبحث في: العنوان، المؤلف، الوصف، الكلمات المفتاحية
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        books: [],
        message: "Query too short (min 2 chars)",
      });
    }

    // البحث في العنوان، المؤلف، الوصف
    const books = await db.book.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { description: { contains: q } },
        ],
      },
      orderBy: [{ views: "desc" }, { ratingAvg: "desc" }],
      take: 20,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        _count: {
          select: { chapters: true },
        },
      },
    });

    return NextResponse.json({
      books,
      query: q,
      count: books.length,
    });
  } catch (error) {
    console.error("Error searching books:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    );
  }
}
