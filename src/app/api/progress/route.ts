import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/progress?userId=xxx - جلب تقدم اللاعب
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // إنشاء مستخدم ضيف جديد
      const user = await db.user.create({
        data: {
          role: "player",
          coins: 100,
        },
      });

      return NextResponse.json({
        user,
        progress: [],
        isNewUser: true,
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            level: {
              select: { id: true, title: true, number: true, chapterId: true },
            },
          },
        },
        streak: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user, progress: user.progress, streak: user.streak });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST /api/progress - حفظ تقدم اللاعب
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      levelId,
      isCompleted,
      stars,
      score,
      hintsUsed,
      timeSpent,
      coinsEarned,
    } = body;

    if (!userId || !levelId) {
      return NextResponse.json(
        { error: "Missing userId or levelId" },
        { status: 400 }
      );
    }

    // حفظ/تحديث تقدم المرحلة
    const progress = await db.playerProgress.upsert({
      where: {
        userId_levelId: { userId, levelId },
      },
      create: {
        userId,
        levelId,
        isCompleted,
        stars: stars || 0,
        score: score || 0,
        hintsUsed: hintsUsed || 0,
        timeSpent: timeSpent || 0,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        isCompleted,
        stars: Math.max(stars || 0, 0),
        score: Math.max(score || 0, 0),
        hintsUsed,
        timeSpent,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    // إضافة العملات للمستخدم
    if (coinsEarned && coinsEarned > 0) {
      await db.user.update({
        where: { id: userId },
        data: {
          coins: { increment: coinsEarned },
        },
      });
    }

    // فتح المرحلة التالية تلقائياً عند الإكمال
    if (isCompleted) {
      const currentLevel = await db.level.findUnique({
        where: { id: levelId },
      });
      if (currentLevel) {
        const nextLevel = await db.level.findFirst({
          where: {
            chapterId: currentLevel.chapterId,
            number: currentLevel.number + 1,
            isPublished: true,
          },
        });
        if (nextLevel) {
          await db.playerProgress.upsert({
            where: {
              userId_levelId: { userId, levelId: nextLevel.id },
            },
            create: {
              userId,
              levelId: nextLevel.id,
              isCompleted: false,
              stars: 0,
            },
            update: {},
          });
        }
      }
    }

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json({ progress, user: updatedUser });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
