/**
 * API: GET /api/leaderboard?period=weekly&limit=20
 *
 * يرجع قائمة المتصدّرين بناءً على:
 *   - XP (نقاط الخبرة)
 *   - النجوم
 *   - المراحل المكتملة
 *
 * الفترات:
 *   weekly — أعلى 20 لاعباً هذا الأسبوع
 *   monthly — أعلى 20 لاعباً هذا الشهر
 *   all-time — أعلى 20 لاعباً على الإطلاق
 *   friends — (مستقبلاً، يحتاج نظام أصدقاء)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "weekly";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const userId = searchParams.get("userId"); // لمعرفة ترتيب المستخدم

    // حساب تاريخ بداية الفترة
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "weekly":
        startDate.setDate(now.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all-time":
        startDate = new Date(0); // من البداية
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // جلب اللاعبين مع إحصائياتهم
    // نستخدم AdaptiveState كمصدر للـ XP والمستوى
    // و PlayerProgress للنجوم والمراحل المكتملة
    
    const leaderboard = await db.user.findMany({
      where: {
        role: "player",
        progress: {
          some: {
            completedAt: { gte: startDate },
          },
        },
      },
      select: {
        id: true,
        name: true,
        coins: true,
        progress: {
          where: { isCompleted: true },
          select: { stars: true, completedAt: true, score: true },
        },
        adaptiveState: {
          select: { xp: true, playerLevel: true },
        },
        streak: {
          select: { currentStreak: true, longestStreak: true },
        },
        learningEvents: {
          where: { timestamp: { gte: startDate } },
          select: { eventType: true, value: true },
        },
      },
      // نرتب لاحقاً في الكود بعد الحساب
      take: 100,
    });

    // حساب النقاط لكل لاعب
    const ranked = leaderboard
      .map((user) => {
        const totalStars = user.progress.reduce((s, p) => s + p.stars, 0);
        const completedLevels = user.progress.length;
        const xp = user.adaptiveState?.xp || 0;
        const playerLevel = user.adaptiveState?.playerLevel || 1;
        const currentStreak = user.streak?.currentStreak || 0;
        const starsThisPeriod = user.progress
          .filter((p) => p.completedAt && p.completedAt >= startDate)
          .reduce((s, p) => s + p.stars, 0);
        const eventsThisPeriod = user.learningEvents.length;
        
        // النقاط الإجمالية لهذه الفترة
        const score = xp + starsThisPeriod * 30 + eventsThisPeriod * 5;

        return {
          userId: user.id,
          name: user.name || "لاعب ثقافتنا",
          avatar: "🧑‍🎓",
          level: playerLevel,
          xp,
          totalStars,
          completedLevels,
          currentStreak,
          score,
          isCurrentUser: userId === user.id,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // إيجاد ترتيب المستخدم الحالي (إن لم يكن في الـ top)
    let userRank: number | null = null;
    if (userId) {
      const userInTop = ranked.find((r) => r.userId === userId);
      if (userInTop) {
        userRank = userInTop.rank;
      } else {
        // حساب ترتيب المستخدم من كل البيانات
        const allRanked = leaderboard
          .map((user) => {
            const xp = user.adaptiveState?.xp || 0;
            const starsThisPeriod = user.progress
              .filter((p) => p.completedAt && p.completedAt >= startDate)
              .reduce((s, p) => s + p.stars, 0);
            const eventsThisPeriod = user.learningEvents.length;
            return { userId: user.id, score: xp + starsThisPeriod * 30 + eventsThisPeriod * 5 };
          })
          .sort((a, b) => b.score - a.score);
        const idx = allRanked.findIndex((r) => r.userId === userId);
        userRank = idx >= 0 ? idx + 1 : null;
      }
    }

    return NextResponse.json({
      leaderboard: ranked,
      period,
      userRank,
      totalPlayers: leaderboard.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
