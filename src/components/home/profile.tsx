"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game-store";
import { useState, useMemo } from "react";
import { playSound } from "@/lib/sound-effects";

interface ProfileViewProps {
  onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const {
    completedLevels,
    coins,
    hintsUsed,
    dailyStreak,
    totalStars,
    levelStars,
    userId,
    resetProgress,
  } = useGameStore();

  // إحصائيات تفصيلية للنجوم
  const starStats = useMemo(() => {
    const allStars = Object.values(levelStars);
    const threeStar = allStars.filter(s => s === 3).length;
    const twoStar = allStars.filter(s => s === 2).length;
    const oneStar = allStars.filter(s => s === 1).length;
    const maxPossible = completedLevels.length * 3;
    const completionRate = maxPossible > 0 ? Math.round((totalStars / maxPossible) * 100) : 0;
    return { threeStar, twoStar, oneStar, completionRate, maxPossible };
  }, [levelStars, completedLevels, totalStars]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (showResetConfirm) {
      playSound("buttonClick");
      resetProgress();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const stats = [
    {
      icon: "🎯",
      label: "مراحل مكتملة",
      value: completedLevels.length,
      color: "from-amber-400 to-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    {
      icon: "⭐",
      label: "نجوم مكتسبة",
      value: totalStars,
      color: "from-yellow-400 to-orange-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-100",
    },
    {
      icon: "🏆",
      label: "مراحل 3 نجوم",
      value: starStats.threeStar,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    },
    {
      icon: "🪙",
      label: "عملات ذهبية",
      value: coins,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    {
      icon: "🔥",
      label: "سلسلة يومية",
      value: `${dailyStreak} يوم`,
      color: "from-orange-400 to-red-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    },
    {
      icon: "💡",
      label: "تلميحات مستخدمة",
      value: hintsUsed,
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
  ];

  const achievements = [
    {
      icon: "🌱",
      title: "أول خطوة",
      description: "أكمل أول مرحلة",
      unlocked: completedLevels.length >= 1,
    },
    {
      icon: "📚",
      title: "قارئ نهم",
      description: "أكمل 5 مراحل",
      unlocked: completedLevels.length >= 5,
    },
    {
      icon: "🏆",
      title: "بطل",
      description: "أكمل 10 مراحل",
      unlocked: completedLevels.length >= 10,
    },
    {
      icon: "🔥",
      title: "مثابر",
      description: "سلسلة 3 أيام",
      unlocked: dailyStreak >= 3,
    },
    {
      icon: "💎",
      title: "جامع العملات",
      description: "اجمع 500 عملة",
      unlocked: coins >= 500,
    },
    {
      icon: "🧠",
      title: "ذكي",
      description: "أكمل مرحلة بدون تلميح",
      unlocked: hintsUsed === 0 && completedLevels.length > 0,
    },
    {
      icon: "⭐⭐⭐",
      title: "بطل النجوم",
      description: "احصل على 3 نجوم في 5 مراحل",
      unlocked: starStats.threeStar >= 5,
    },
    {
      icon: "👑",
      title: "أسطورة",
      description: "اجمع 50 نجمة",
      unlocked: totalStars >= 50,
    },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          playSound("buttonClick");
          onBack();
        }}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        رجوع
      </button>

      {/* بطاقة الملف الشخصي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-700 via-stone-800 to-stone-900 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-500/5" />

        <div className="relative flex items-center gap-4">
          {/* الصورة الرمزية */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-gold-lg">
            🧑‍🎓
          </div>

          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-tajawal)" }}>
              لاعب ثقافتنا
            </h2>
            <p className="text-amber-200/80 text-sm mb-2">
              {userId ? `معرّف: ${userId.slice(0, 8)}...` : "ضيف"}
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold">
                المستوى {Math.floor(completedLevels.length / 5) + 1}
              </span>
              <span className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-xs">
                {totalStars} ⭐
              </span>
            </div>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="mt-6 relative">
          <div className="flex items-center justify-between text-xs text-amber-200/80 mb-2">
            <span>التقدم نحو المستوى التالي</span>
            <span>{completedLevels.length % 5}/5 مراحل</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedLevels.length % 5) * 20}%` }}
              transition={{ duration: 0.8, type: "spring" }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* لوحة النجوم التفصيلية */}
      {completedLevels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-amber-200 p-5 sm:p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2" style={{ fontFamily: "var(--font-tajawal)" }}>
              ⭐ لوحة النجوم
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              {totalStars} / {starStats.maxPossible} نجمة
            </span>
          </div>

          {/* شريط نسبة الإكمال */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
              <span>نسبة الإتقان</span>
              <span className="font-bold">{starStats.completionRate}%</span>
            </div>
            <div className="h-3 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${starStats.completionRate}%` }}
                transition={{ duration: 0.8, type: "spring" }}
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400"
              />
            </div>
          </div>

          {/* توزيع النجوم */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/70 border border-amber-100">
              <div className="flex items-center gap-0.5 mb-1">
                {[1, 2, 3].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                  </svg>
                ))}
              </div>
              <div className="text-2xl font-bold text-amber-600">{starStats.threeStar}</div>
              <div className="text-[10px] text-stone-600">مراحل مثالية</div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/70 border border-amber-100">
              <div className="flex items-center gap-0.5 mb-1">
                {[1, 2].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                  </svg>
                ))}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)">
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-amber-500">{starStats.twoStar}</div>
              <div className="text-[10px] text-stone-600">مراحل جيدة</div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/70 border border-amber-100">
              <div className="flex items-center gap-0.5 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                </svg>
                {[1, 2].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)">
                    <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                  </svg>
                ))}
              </div>
              <div className="text-2xl font-bold text-amber-400">{starStats.oneStar}</div>
              <div className="text-[10px] text-stone-600">مراحل مكتملة</div>
            </div>
          </div>

          <p className="text-xs text-stone-500 text-center mt-3">
            💡 أعد المحاولة لتحسين نتائجك — ستُحفظ أعلى نتيجة دائماً
          </p>
        </motion.div>
      )}

      {/* الإحصائيات */}
      <div>
        <h3 className="text-lg font-bold text-stone-800 mb-3" style={{ fontFamily: "var(--font-tajawal)" }}>
          📊 الإحصائيات
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-2xl ${stat.bgColor} ${stat.borderColor} border`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-xs text-stone-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* الإنجازات */}
      <div>
        <h3 className="text-lg font-bold text-stone-800 mb-3" style={{ fontFamily: "var(--font-tajawal)" }}>
          🏅 الإنجازات
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                  : "bg-stone-50 border-stone-200 opacity-60"
              }`}
            >
              <div className={`text-3xl ${achievement.unlocked ? "" : "grayscale"}`}>
                {achievement.unlocked ? achievement.icon : "🔒"}
              </div>
              <div className="flex-1">
                <div className={`font-bold ${achievement.unlocked ? "text-stone-800" : "text-stone-500"}`}>
                  {achievement.title}
                </div>
                <div className="text-xs text-stone-500">{achievement.description}</div>
              </div>
              {achievement.unlocked && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500 text-xl"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* أزرار */}
      <div className="flex gap-3">
        <Button
          onClick={handleReset}
          variant="outline"
          className={`flex-1 ${
            showResetConfirm
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "text-stone-600"
          }`}
        >
          {showResetConfirm ? "⚠️ تأكيد إعادة التعيين؟" : "إعادة تعيين التقدم"}
        </Button>
      </div>
    </div>
  );
}
