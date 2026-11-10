/**
 * API: GET /api/books/featured — جلب الكتب المميزة
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const books = await db.book.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { views: "desc" },
      take: 6,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        _count: {
          select: { chapters: true, reviews: true },
        },
      },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching featured books:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured books" },
      { status: 500 }
    );
  }
}
