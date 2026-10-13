/**
 * API: GET /api/analytics?userId=xxx
 *
 * يجلب كل تحليلات اللاعب في بنية واحدة منظّمة:
 *   - الحالة التكيّفية (المستوى، XP، معامل الصعوبة)
 *   - نقاط القوة والضعف
 *   - التوصية الذكية
 *   - نمو الأسبوع الأخير
 *   - توزيع أنواع الألغاز
 *
 * يُستخدم في:
 *   - صفحة الملف الشخصي
 *   - خريطة المعرفة البصرية
 *   - شاشة التوصية الذكية في الصفحة الرئيسية
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPlayerAnalytics, recalcAdaptiveState } from "@/lib/adaptive-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // التأكد من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, coins: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // جلب التحليلات (مع إعادة الحساب إن لزم)
    const analytics = await getPlayerAnalytics(userId);

    if (!analytics) {
      return NextResponse.json(
        { error: "Failed to compute analytics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: { id: user.id, coins: user.coins },
      analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/analytics
 *
 * يعالج إكمال مرحلة بشكل كامل من جهة الخادم:
 *   - تحديث إتقان المهارات
 *   - تسجيل أحداث التعلّم
 *   - تحديث إحصائيات نوع اللغز
 *   - إعادة حساب الحالة التكيّفية
 *
 * يُستدعى تلقائياً عند إكمال المرحلة من game-screen.tsx
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      levelId,
      stars,
      hintsUsed,
      timeSpentSec,
      correctCount,
      wrongCount,
      bonusWordsFound,
      puzzleType,
    } = body;

    if (!userId || !levelId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // استيراد lazy لتجنّب circular imports
    const { processLevelCompletion } = await import("@/lib/adaptive-engine");

    await processLevelCompletion({
      userId,
      levelId: Number(levelId),
      stars: Number(stars) || 1,
      hintsUsed: Number(hintsUsed) || 0,
      timeSpentSec: Number(timeSpentSec) || 0,
      correctCount: Number(correctCount) || 1,
      wrongCount: Number(wrongCount) || 0,
      bonusWordsFound: Number(bonusWordsFound) || 0,
      puzzleType: String(puzzleType || "text"),
    });

    // إعادة الحساب وجلب التحليلات المُحدّثة
    await recalcAdaptiveState(userId);
    const updatedAnalytics = await getPlayerAnalytics(userId);

    return NextResponse.json({
      success: true,
      analytics: updatedAnalytics,
    });
  } catch (error) {
    console.error("Error processing level completion:", error);
    return NextResponse.json(
      { error: "Failed to process level completion" },
      { status: 500 }
    );
  }
}
