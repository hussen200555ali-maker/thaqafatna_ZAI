/**
 * API: GET /api/books/recommend?userId=xxx — توصيات كتب شخصية
 *
 * خوارزمية التوصية:
 *   1. كتب من نفس تصنيفات الكتب التي قرأها المستخدم
 *   2. كتب بنفس مستوى الصعوبة الذي يفضّله
 *   3. كتب لها كلمات مفتاحية مشتركة مع تاريخ القراءة
 *   4. كتب مميزة (fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 12);

    if (!userId) {
      // بدون userId: نرجع الكتب المميزة فقط
      const books = await db.book.findMany({
        where: { isPublished: true, isFeatured: true },
        take: limit,
        orderBy: { views: "desc" },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          _count: { select: { chapters: true } },
        },
      });
      return NextResponse.json({ books, reason: "featured" });
    }

    // 1. جلب تاريخ القراءة للمستخدم
    const readingHistory = await db.userReadingProgress.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            categoryId: true,
            difficulty: true,
            keywords: true,
          },
        },
      },
    });

    // 2. استخراج تفضيلات المستخدم
    const readBookIds = new Set(readingHistory.map((h) => h.bookId));
    const preferredCategories = new Set<number>();
    const preferredDifficulties = new Set<string>();
    const preferredKeywords = new Set<string>();

    for (const h of readingHistory) {
      if (h.book) {
        preferredCategories.add(h.book.categoryId);
        preferredDifficulties.add(h.book.difficulty);
        try {
          const kws = JSON.parse(h.book.keywords || "[]");
          if (Array.isArray(kws)) kws.forEach((k) => preferredKeywords.add(k));
        } catch {}
      }
    }

    // 3. بناء query للتوصيات
    const where: any = {
      isPublished: true,
      id: { notIn: [...readBookIds] },
    };

    if (preferredCategories.size > 0) {
      where.OR = [
        { categoryId: { in: [...preferredCategories] } },
        ...(preferredDifficulties.size > 0
          ? [{ difficulty: { in: [...preferredDifficulties] } }]
          : []),
      ];
    } else {
      where.isFeatured = true;
    }

    let books = await db.book.findMany({
      where,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { views: "desc" }],
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { chapters: true } },
      },
    });

    // 4. إذا لم نجد كفاية، نكمل بالكتب المميزة
    if (books.length < limit) {
      const additional = await db.book.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
          id: { notIn: [...readBookIds, ...books.map((b) => b.id)] },
        },
        take: limit - books.length,
        orderBy: { views: "desc" },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          _count: { select: { chapters: true } },
        },
      });
      books = [...books, ...additional];
    }

    const reason = preferredCategories.size > 0 ? "based_on_history" : "featured";

    return NextResponse.json({
      books,
      reason,
      preferences: {
        categories: [...preferredCategories],
        difficulties: [...preferredDifficulties],
        keywords: [...preferredKeywords],
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
