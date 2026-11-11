import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/admin/chapters/[id] - تحديث فصل
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapterId = parseInt(id);
    const body = await request.json();
    const { isPublished, title, description, icon, color, order } = body;

    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        ...(isPublished !== undefined && { isPublished }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json({ chapter });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
