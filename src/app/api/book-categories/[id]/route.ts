/**
 * API: PATCH /api/book-categories/[id] — تحديث تصنيف
 * API: DELETE /api/book-categories/[id] — حذف تصنيف
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    const body = await request.json();
    const { name, slug, icon, color, description, order, isPublished } = body;

    // تحقق من عدم تكرار slug (لو تغيّر)
    if (slug) {
      const existing = await db.bookCategory.findFirst({
        where: { slug, NOT: { id: categoryId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Slug مستخدم بالفعل في تصنيف آخر" },
          { status: 400 }
        );
      }
    }

    const updated = await db.bookCategory.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    // تحقق من عدم وجود كتب مرتبطة
    const booksCount = await db.book.count({
      where: { categoryId },
    });
    if (booksCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن الحذف: ${booksCount} كتاب مرتبط بهذا التصنيف. حوّلها لتصنيف آخر أولاً.` },
        { status: 400 }
      );
    }

    await db.bookCategory.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
