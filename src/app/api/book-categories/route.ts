/**
 * API: GET /api/book-categories — جلب تصنيفات الكتب
 * API: POST /api/book-categories — إنشاء تصنيف (للإدارة)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — جلب التصنيفات المنشورة
export async function GET() {
  try {
    const categories = await db.bookCategory.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        booksCount: c._count.books,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST — إنشاء تصنيف (للإدارة)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, icon, color, description, order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug" },
        { status: 400 }
      );
    }

    const category = await db.bookCategory.create({
      data: {
        name,
        slug,
        icon: icon || "📚",
        color: color || "#3b82f6",
        description: description || "",
        order: order || 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
