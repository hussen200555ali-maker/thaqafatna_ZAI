/**
 * API: POST /api/books/[id]/bookmark — إضافة/إزالة إشارة مرجعية
 * API: GET /api/books/[id]/bookmark?userId=xxx — جلب الإشارات
 *
 * المدخلات POST:
 *   userId, chapterId?, note?
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ bookmarks: [] });
    }

    const bookmarks = await db.userBookmark.findMany({
      where: { userId, bookId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookId = parseInt(id);
    const body = await request.json();
    const { userId, chapterId, note, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // action: "add" | "remove" | "toggle"
    const effectiveAction = action || "toggle";

    if (effectiveAction === "add") {
      const bookmark = await db.userBookmark.create({
        data: {
          userId,
          bookId,
          chapterId: chapterId || null,
          note: note || "",
        },
      });
      return NextResponse.json({ bookmark, isBookmarked: true });
    }

    if (effectiveAction === "remove") {
      await db.userBookmark.deleteMany({
        where: { userId, bookId, chapterId: chapterId || null },
      });
      return NextResponse.json({ isBookmarked: false });
    }

    // toggle
    const existing = await db.userBookmark.findFirst({
      where: { userId, bookId, chapterId: chapterId || null },
    });

    if (existing) {
      await db.userBookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ isBookmarked: false });
    } else {
      const bookmark = await db.userBookmark.create({
        data: {
          userId,
          bookId,
          chapterId: chapterId || null,
          note: note || "",
        },
      });
      return NextResponse.json({ bookmark, isBookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
