/**
 * API: GET /api/books — جلب كل الكتب
 * API: POST /api/books — إنشاء كتاب جديد (للإدارة)
 *
 * معطيات GET الاختيارية:
 *   ?categoryId=1 — فلترة حسب التصنيف
 *   ?difficulty=easy — فلترة حسب الصعوبة
 *   ?limit=20 — عدد الكتب (افتراضي 50)
 *   ?offset=0 — للترقيم
 *
 * معطيات POST:
 *   جميع حقول الكتاب (title, author, categoryId, ...)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/books — جلب الكتب المنشورة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const difficulty = searchParams.get("difficulty");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { isPublished: true };
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (difficulty) where.difficulty = difficulty;

    const books = await db.book.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
      take: limit,
      skip: offset,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        _count: {
          select: { chapters: true, reviews: true },
        },
      },
    });

    const total = await db.book.count({ where });

    return NextResponse.json({
      books,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

// POST /api/books — إنشاء كتاب جديد (للإدارة)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categoryId,
      title,
      author,
      description,
      coverImage,
      contentType,
      pdfUrl,
      audioUrl,
      difficulty,
      readingTimeMin,
      pages,
      language,
      keywords,
      isFeatured,
      isPremium,
    } = body;

    if (!categoryId || !title || !author) {
      return NextResponse.json(
        { error: "Missing required fields: categoryId, title, author" },
        { status: 400 }
      );
    }

    const book = await db.book.create({
      data: {
        categoryId: parseInt(categoryId),
        title,
        author,
        description: description || "",
        coverImage: coverImage || "",
        contentType: contentType || "text",
        pdfUrl: pdfUrl || "",
        audioUrl: audioUrl || "",
        difficulty: difficulty || "medium",
        readingTimeMin: readingTimeMin || 15,
        pages: pages || 0,
        language: language || "ar",
        keywords: Array.isArray(keywords)
          ? JSON.stringify(keywords)
          : keywords || "[]",
        isFeatured: isFeatured || false,
        isPremium: isPremium || false,
        isPublished: false, // افتراضياً مسودة
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
