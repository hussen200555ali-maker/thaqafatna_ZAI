"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * مكوّن لوحة تحليلات التعلّم
 *
 * يعرض تحليلات شاملة للاعب:
 *   1. المستوى العام + XP + معامل الصعوبة
 *   2. نمو الأسبوع الأخير (رسم بياني بسيط)
 *   3. نقاط القوة والضعف (Top 3 لكل فئة)
 *   4. توزيع الأداء حسب نوع اللغز
 *   5. التوصية الذكية للمرحلة التالية
 *
 * مستوحى من:
 *   - Duolingo's Year in Review
 *   - Khan Academy's Mastery Overview
 *   - Apple Health's trends UI
 */

interface LearningAnalyticsProps {
  userId: string | null;
  onLevelSelect?: (levelId: number) => void;
}

interface AnalyticsData {
  playerLevel: number;
  xp: number;
  totalStars: number;
  difficultyMultiplier: number;
  strengths: SkillSummary[];
  weaknesses: SkillSummary[];
  recommendation: {
    recommendedLevelId: number | null;
    reason: string;
    type: "next" | "review" | "challenge" | "explore";
    targetSkills: string[];
  };
  weeklyProgress: { date: string; events: number; stars: number }[];
  puzzleTypeBreakdown: PuzzleTypeBreakdown[];
}

interface SkillSummary {
  id: number;
  code: string;
  title: string;
  icon: string;
  mastery: number;
  category: string;
}

interface PuzzleTypeBreakdown {
  puzzleType: string;
  attempts: number;
  correct: number;
  successRate: number;
  avgTimeSec: number;
  lastPlayedAt: string | null;
}

// خريطة أنواع الألغاز للعناوين العربية
const PUZZLE_TYPE_LABELS: Record<string, { name: string; icon: string; color: string }> = {
  text: { name: "سؤال نصي", icon: "📝", color: "from-blue-500 to-blue-700" },
  image: { name: "صورة", icon: "🖼️", color: "from-amber-500 to-amber-700" },
  images4: { name: "4 صور", icon: "📸", color: "from-orange-500 to-red-700" },
  emoji: { name: "إيموجي", icon: "😀", color: "from-pink-500 to-pink-700" },
  scrambled: { name: "حروف مبعثرة", icon: "🔀", color: "from-purple-500 to-purple-700" },
  crossword: { name: "شبكة متقاطعة", icon: "🧩", color: "from-green-500 to-green-700" },
  fillblank: { name: "فراغات", icon: "✏️", color: "from-cyan-500 to-cyan-700" },
  matching: { name: "توصيل", icon: "🔗", color: "from-indigo-500 to-indigo-700" },
  multiple: { name: "اختيار من متعدد", icon: "🔘", color: "from-teal-500 to-teal-700" },
  audio: { name: "صوتي", icon: "🔊", color: "from-rose-500 to-rose-700" },
  logic: { name: "منطقي", icon: "🧠", color: "from-violet-500 to-violet-700" },
  progressive: { name: "تلميحات متدرجة", icon: "💡", color: "from-yellow-500 to-amber-700" },
  mixed: { name: "تحدّي البوس", icon: "👑", color: "from-red-600 to-purple-800" },
};

// خريطة أنواع التوصيات
const RECOMMENDATION_STYLES = {
  next: {
    label: "الخطوة التالية",
    icon: "🚀",
    color: "from-blue-500 to-cyan-600",
    bg: "from-blue-500/10 to-cyan-600/10",
    border: "border-blue-400/30",
  },
  review: {
    label: "مراجعة",
    icon: "📚",
    color: "from-amber-500 to-orange-600",
    bg: "from-amber-500/10 to-orange-600/10",
    border: "border-amber-400/30",
  },
  challenge: {
    label: "تحدٍّ جديد",
    icon: "🎯",
    color: "from-purple-500 to-pink-600",
    bg: "from-purple-500/10 to-pink-600/10",
    border: "border-purple-400/30",
  },
  explore: {
    label: "استكشاف",
    icon: "🧭",
    color: "from-green-500 to-emerald-600",
    bg: "from-green-500/10 to-emerald-600/10",
    border: "border-green-400/30",
  },
};

export function LearningAnalytics({ userId, onLevelSelect }: LearningAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch((e) => console.error("Error fetching analytics:", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent"
        />
        <span className="ml-3 text-amber-700 text-sm" style={{ fontFamily: "var(--font-tajawal)" }}>
          جاري تحليل أدائك...
        </span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center bg-amber-50 border-amber-200">
        <p className="text-amber-700">لا توجد بيانات كافية بعد — ابدأ أول مرحلة لتحليل أدائك!</p>
      </Card>
    );
  }

  const recStyle = RECOMMENDATION_STYLES[analytics.recommendation.type];

  return (
    <div className="space-y-5">
      {/* ===== 1. البطاقة الرئيسية: المستوى + XP + التوصية الذكية ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 sm:p-7 shadow-xl border-2",
          recStyle.bg,
          recStyle.border
        )}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          {/* المستوى + XP */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg",
              recStyle.color
            )}>
              {analytics.playerLevel}
            </div>
            <div>
              <p className="text-stone-500 text-xs">المستوى الحالي</p>
              <p className="text-stone-800 text-xl font-bold" style={{ fontFamily: "var(--font-tajawal)" }}>
                المستوى {analytics.playerLevel}
              </p>
            </div>
            <div className="mr-auto text-left">
              <p className="text-stone-500 text-xs">نقاط الخبرة</p>
              <p className="text-stone-800 text-lg font-bold">{analytics.xp.toLocaleString()} XP</p>
            </div>
          </div>

          {/* التوصية الذكية */}
          <div className={cn(
            "rounded-2xl bg-gradient-to-r p-4 border",
            recStyle.bg,
            recStyle.border
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shadow-md flex-shrink-0",
                recStyle.color
              )}>
                {recStyle.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md bg-gradient-to-r text-white text-[10px] font-bold",
                    recStyle.color
                  )}>
                    {recStyle.label}
                  </span>
                  {analytics.difficultyMultiplier !== 1.0 && (
                    <span className="text-[10px] text-stone-500">
                      معامل الصعوبة: {analytics.difficultyMultiplier.toFixed(2)}x
                    </span>
                  )}
                </div>
                <p className="text-stone-700 text-sm font-medium leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
                  {analytics.recommendation.reason}
                </p>
                {analytics.recommendation.recommendedLevelId && onLevelSelect && (
                  <button
                    onClick={() => onLevelSelect(analytics.recommendation.recommendedLevelId!)}
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r text-white text-xs font-bold shadow-md hover:shadow-lg transition-all",
                      recStyle.color
                    )}
                  >
                    ابدأ الآن ←
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== 2. نمو الأسبوع (رسم بياني بسيط) ===== */}
      <Card className="p-5 bg-white border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
            📈 نمو هذا الأسبوع
          </h3>
          <span className="text-xs text-stone-500">آخر 7 أيام</span>
        </div>

        <div className="flex items-end justify-between gap-1.5 h-32">
          {analytics.weeklyProgress.map((day, idx) => {
            const maxEvents = Math.max(
              ...analytics.weeklyProgress.map((d) => d.events),
              1
            );
            const heightPct = (day.events / maxEvents) * 100;
            const dayLabel = new Date(day.date).toLocaleDateString("ar-SA", {
              weekday: "short",
            });

            return (
              <motion.div
                key={day.date}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${heightPct}%`, opacity: 1 }}
                transition={{ delay: idx * 0.08, type: "spring", stiffness: 100 }}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {/* عدد النجوم في الأعلى */}
                {day.stars > 0 && (
                  <span className="text-[10px] text-amber-500 font-bold">
                    +{day.stars}⭐
                  </span>
                )}
                {/* العمود */}
                <div
                  className={cn(
                    "w-full rounded-t-md min-h-[2px] transition-colors",
                    day.events > 0
                      ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                      : "bg-stone-100"
                  )}
                  style={{ minHeight: day.events > 0 ? "8px" : "2px" }}
                  title={`${day.events} حدث`}
                />
                {/* اليوم */}
                <span className="text-[10px] text-stone-500">{dayLabel}</span>
              </motion.div>
            );
          })}
        </div>

        {/* ملخص النشاط */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-600">
            📊 إجمالي النشاط:{" "}
            <span className="font-bold text-stone-800">
              {analytics.weeklyProgress.reduce((s, d) => s + d.events, 0)}
            </span>{" "}
            حدث
          </span>
          <span className="text-stone-600">
            ⭐{" "}
            <span className="font-bold text-amber-600">
              {analytics.weeklyProgress.reduce((s, d) => s + d.stars, 0)}
            </span>{" "}
            نجمة هذا الأسبوع
          </span>
        </div>
      </Card>

      {/* ===== 3. نقاط القوة والضعف ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* نقاط القوة */}
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💪</span>
            <h3 className="text-base font-bold text-green-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              نقاط القوة
            </h3>
          </div>
          {analytics.strengths.length === 0 ? (
            <p className="text-xs text-green-700/60 italic">
              لا تزال في البداية — أكمل المزيد من المراحل لتكتشف نقاط قوتك!
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.strengths.map((s, idx) => (
                <SkillRow key={s.id} skill={s} type="strength" index={idx} />
              ))}
            </div>
          )}
        </Card>

        {/* نقاط الضعف */}
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎯</span>
            <h3 className="text-base font-bold text-amber-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              مهارات تحتاج تحسيناً
            </h3>
          </div>
          {analytics.weaknesses.length === 0 ? (
            <p className="text-xs text-amber-700/60 italic">
              ممتاز! لا توجد مهارات ضعيفة لديك حالياً 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.weaknesses.map((s, idx) => (
                <SkillRow key={s.id} skill={s} type="weakness" index={idx} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ===== 4. توزيع الأداء حسب نوع اللغز ===== */}
      {analytics.puzzleTypeBreakdown.length > 0 && (
        <Card className="p-5 bg-white border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              🎮 توزيع أدائك حسب نوع اللغز
            </h3>
            <span className="text-xs text-stone-500">
              {analytics.puzzleTypeBreakdown.length} أنواع لعبتها
            </span>
          </div>

          <div className="space-y-3">
            {analytics.puzzleTypeBreakdown.map((pt, idx) => {
              const label = PUZZLE_TYPE_LABELS[pt.puzzleType] || {
                name: pt.puzzleType,
                icon: "❓",
                color: "from-stone-500 to-stone-700",
              };
              return (
                <motion.div
                  key={pt.puzzleType}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg shadow-sm flex-shrink-0",
                    label.color
                  )}>
                    {label.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-stone-800">{label.name}</span>
                      <span className={cn(
                        "text-xs font-bold",
                        pt.successRate >= 80
                          ? "text-green-600"
                          : pt.successRate >= 50
                          ? "text-amber-600"
                          : "text-red-500"
                      )}>
                        {pt.successRate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <span>{pt.attempts} محاولة</span>
                      <span>•</span>
                      <span>⏱ {pt.avgTimeSec}ث</span>
                      <span>•</span>
                      <span>✓ {pt.correct}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// مكوّن مساعد: صف مهارة في قائمة القوة/الضعف
// ============================================================
function SkillRow({
  skill,
  type,
  index,
}: {
  skill: SkillSummary;
  type: "strength" | "weakness";
  index: number;
}) {
  const colorClass =
    type === "strength"
      ? "bg-gradient-to-r from-green-500 to-emerald-600"
      : "bg-gradient-to-r from-amber-500 to-orange-600";

  return (
    <motion.div
      initial={{ opacity: 0, x: type === "strength" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 p-2 rounded-xl bg-white/60 backdrop-blur-sm"
    >
      <div className="text-2xl">{skill.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-stone-800 truncate" style={{ fontFamily: "var(--font-tajawal)" }}>
          {skill.title}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.mastery}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={cn("h-full rounded-full", colorClass)}
            />
          </div>
          <span className="text-[10px] font-bold text-stone-700">{skill.mastery}%</span>
        </div>
      </div>
    </motion.div>
  );
}
