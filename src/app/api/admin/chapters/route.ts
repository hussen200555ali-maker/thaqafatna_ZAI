import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/chapters - جلب جميع الفصول (بما فيها المسودات)
export async function GET() {
  try {
    const chapters = await db.chapter.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Error fetching admin chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST /api/admin/chapters - إنشاء فصل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, icon, color, unlockAt } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // الحصول على أعلى ترتيب
    const lastChapter = await db.chapter.findFirst({
      orderBy: { order: "desc" },
    });

    const chapter = await db.chapter.create({
      data: {
        title,
        description: description || "",
        icon: icon || "⭐",
        color: color || "oklch(0.78 0.13 80)",
        unlockAt: unlockAt || 0,
        order: (lastChapter?.order || 0) + 1,
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}
