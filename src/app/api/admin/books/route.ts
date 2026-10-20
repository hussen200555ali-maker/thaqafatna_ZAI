/**
 * API: GET /api/admin/books — جلب كل الكتب للإدارة (بما فيها المسودات)
 * API: POST /api/admin/books — إنشاء كتاب جديد
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft | published | all
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (status && status !== "all") where.isPublished = status === "published";
    if (categoryId) where.categoryId = parseInt(categoryId);

    const books = await db.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { chapters: true, reviews: true } },
      },
    });

    return NextResponse.json({ books, total: books.length });
  } catch (error) {
    console.error("Error fetching admin books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
