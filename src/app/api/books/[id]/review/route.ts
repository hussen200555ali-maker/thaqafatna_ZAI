/**
 * API: POST /api/books/[id]/review — إضافة/تحديث تقييم
 *
 * المدخلات:
 *   userId: string
 *   rating: 1-5
 *   review: string (اختياري)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();
    const { userId, rating, review } = body;

    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Missing or invalid userId/rating (1-5)" },
        { status: 400 }
      );
    }

    // Upsert التقييم (تحدّث إن وُجد، أنشئ إن لم يوجد)
    const bookReview = await db.bookReview.upsert({
      where: {
        userId_bookId: { userId, bookId },
      },
      create: {
        userId,
        bookId,
        rating,
        review: review || "",
      },
      update: {
        rating,
        review: review || "",
      },
    });

    // تحديث متوسط التقييم وعدد التقييمات في الكتاب
    const allReviews = await db.bookReview.findMany({
      where: { bookId },
      select: { rating: true },
    });
    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
        : 0;

    await db.book.update({
      where: { id: bookId },
      data: {
        ratingAvg: Math.round(avgRating * 10) / 10,
        ratingCount: allReviews.length,
      },
    });

    return NextResponse.json({ review: bookReview, avgRating: Math.round(avgRating * 10) / 10, ratingCount: allReviews.length });
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json(
      { error: "Failed to add review" },
      { status: 500 }
    );
  }
}
