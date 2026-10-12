import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/chapters - جلب جميع الفصول المنشورة
export async function GET() {
  try {
    const chapters = await db.chapter.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        levels: {
          where: { isPublished: true },
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
