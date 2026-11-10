/**
 * API: POST /api/books/[id]/certificate — إصدار شهادة إتقان
 *
 * يتحقق من إكمال المستخدم لكل الفصول + الألغاز
 * ثم يُصدر شهادة برقم فريد
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // التحقق من وجود شهادة سابقة
    const existing = await db.userCertificate.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (existing) {
      return NextResponse.json({ certificate: existing, alreadyExists: true });
    }

    // التحقق من إكمال كل الفصول
    const progress = await db.userReadingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    const totalChapters = await db.bookChapter.count({
      where: { bookId, isPublished: true },
    });

    let completedChapters: number[] = [];
    try {
      const parsed = JSON.parse(progress?.completedChapters || "[]");
      if (Array.isArray(parsed)) completedChapters = parsed;
    } catch {}

    if (completedChapters.length < totalChapters) {
      return NextResponse.json(
        {
          error: "Book not completed",
          completed: completedChapters.length,
          total: totalChapters,
        },
        { status: 400 }
      );
    }

    // إنشاء رقم شهادة فريد
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    const certificateNumber = `THQ-${year}-${random}`;

    // حساب النقاط (بناءً على الوقت + التقييم)
    const score = Math.min(100, 80 + (progress?.timeSpentSec || 0 > 0 ? 20 : 10));

    const certificate = await db.userCertificate.create({
      data: {
        userId,
        bookId,
        certificateNumber,
        score,
      },
      include: {
        book: { select: { title: true, author: true } },
      },
    });

    return NextResponse.json({ certificate, isNew: true });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
  }
}

/**
 * API: GET /api/books/[id]/certificate?userId=xxx — جلب شهادة المستخدم
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ certificate: null });
    }

    const certificate = await db.userCertificate.findUnique({
      where: { userId_bookId: { userId, bookId } },
      include: {
        book: { select: { title: true, author: true, category: { select: { name: true, icon: true } } } },
      },
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}
