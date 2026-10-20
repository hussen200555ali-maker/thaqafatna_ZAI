/**
 * API: GET /api/notifications — إعدادات + تذكيرات
 * API: POST /api/notifications — إدارة الإشعارات
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        settings: { dailyReminder: true, reviewReminder: true, newBooks: true, reminderTime: "10:00" },
      });
    }

    const now = new Date();
    const dueWords = await db.userWordMastery.count({
      where: { userId, nextReviewAt: { lte: now } },
    });

    const lastDaily = await db.userStreak.findUnique({
      where: { userId },
      select: { lastChallengeDate: true, currentStreak: true },
    });

    const today = now.toISOString().split("T")[0];
    const dailyCompleted = lastDaily?.lastChallengeDate === today;

    return NextResponse.json({
      settings: { dailyReminder: true, reviewReminder: true, newBooks: true, reminderTime: "10:00" },
      pendingReview: dueWords,
      dailyCompleted,
      streak: lastDaily?.currentStreak || 0,
      message: dueWords > 0
        ? `📚 لديك ${dueWords} كلمة تحتاج مراجعة!`
        : dailyCompleted
        ? "✅ أكملت تحدّي اليوم! عُد غداً."
        : "🎯 تحدّي اليوم ينتظرك! +100 عملة مكافأة.",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "test") {
      return NextResponse.json({
        success: true,
        notification: {
          title: "ثقافتنا 📚",
          body: "هذا إشعار تجريبي! الإشعارات تعمل بشكل صحيح.",
          icon: "/icon.svg",
          tag: "test",
        },
      });
    }

    if (action === "subscribe" || action === "unsubscribe") {
      return NextResponse.json({ success: true, message: action === "subscribe" ? "تم تفعيل الإشعارات" : "تم إيقاف الإشعارات" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
