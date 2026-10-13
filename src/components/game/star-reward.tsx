"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { playStarSound, playSound } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

/**
 * نظام النجوم الإيجابي
 *
 * الفلسفة:
 *   ★ نجمة الإنجاز  — مضمونة بمجرد إكمال المرحلة (لا تُسحب أبداً)
 *   ★ نجمة الذكاء   — تتوهج عند عدم استخدام تلميحات (أو استخدام قليل جداً)
 *   ★ نجمة السرعة   — تتوهج عند الإنجاز خلال وقت مناسب حسب الصعوبة
 *
 * التصميم: نجوم "تتوهج تدريجياً" بدلاً من أن تظهر فجأة — يعطي إحساس إنجاز إيجابي.
 */

export interface StarInfo {
  /** رقم النجمة 1..3 */
  index: number;
  /** ما إذا كسبها اللاعب */
  earned: boolean;
  /** سبب كسبها (يظهر تحتها) */
  reason: string;
  /** سبب عدم كسبها (يظهر بدلاً من السبب الإيجابي إذا لم تُكسب) */
  hint?: string;
  /** أيقونة نوع النجمة */
  icon: string;
  /** عنوان النجمة */
  title: string;
}

interface StarRewardProps {
  /** عدد النجوم المكتسبة (0..3) */
  stars: number;
  /** معلومات تفصيلية لكل نجمة */
  starInfos: StarInfo[];
  /** حجم النجمة */
  size?: "sm" | "md" | "lg";
  /** هل نُشغّل الصوت */
  silent?: boolean;
  /** هل نعرض الأسباب تحت النجوم */
  showReasons?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { star: 36, gap: "gap-1" },
  md: { star: 56, gap: "gap-2" },
  lg: { star: 80, gap: "gap-3" },
};

export function StarReward({
  stars,
  starInfos,
  size = "lg",
  silent = false,
  showReasons = true,
  className,
}: StarRewardProps) {
  const { star: starSize, gap } = sizeMap[size];
  const [revealed, setRevealed] = useState<number>(0);
  const [shining, setShining] = useState<Set<number>>(new Set());
  const startedRef = useRef(false);

  // سلسلة كشف تدريجية للنجوم المكتسبة
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let delay = 200;
    const timers: ReturnType<typeof setTimeout>[] = [];

    starInfos.forEach((info) => {
      const t = setTimeout(() => {
        if (info.earned) {
          // نجمة كسبت → كشف ثم توهج
          setRevealed((r) => Math.max(r, info.index));
          if (!silent) playStarSound(info.index);
          // تأخير بسيط ثم توهج
          const shineT = setTimeout(() => {
            setShining((s) => new Set(s).add(info.index));
            if (!silent) playSound("starShine");
          }, 450);
          timers.push(shineT);
        } else {
          // نجمة مفقودة → نغمة لطيفة فقط
          if (!silent) playSound("starMiss");
        }
      }, delay);
      timers.push(t);
      delay += 850;
    });

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("flex items-center justify-center", gap)}>
        {starInfos.map((info) => {
          const isRevealed = revealed >= info.index && info.earned;
          const isShining = shining.has(info.index);
          return (
            <SingleStar
              key={info.index}
              info={info}
              starSize={starSize}
              isRevealed={isRevealed}
              isShining={isShining}
            />
          );
        })}
      </div>

      {showReasons && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + starInfos.length * 0.85 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-sm"
        >
          {starInfos.map((info) => (
            <div
              key={info.index}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium border transition-all",
                info.earned
                  ? "bg-yellow-400/15 text-yellow-200 border-yellow-400/30"
                  : "bg-white/5 text-white/40 border-white/10"
              )}
              title={info.hint || info.reason}
            >
              <span className="ml-1">{info.icon}</span>
              {info.title}
              {info.earned ? " ✓" : ""}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function SingleStar({
  info,
  starSize,
  isRevealed,
  isShining,
}: {
  info: StarInfo;
  starSize: number;
  isRevealed: boolean;
  isShining: boolean;
}) {
  return (
    <div className="relative">
      {/* حلقة الوهج الخلفية */}
      <AnimatePresence>
        {isShining && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.4], opacity: [0, 0.7, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,165,0,0.3) 50%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* جسيمات متطايرة عند التوهج */}
      <AnimatePresence>
        {isShining && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const dist = starSize * 0.9;
              return (
                <motion.div
                  key={`spark-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1.2, delay: 0.1 + i * 0.02 }}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-yellow-300 pointer-events-none"
                  style={{ boxShadow: "0 0 6px #FFD700" }}
                />
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* النجمة نفسها */}
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={
          isRevealed
            ? { scale: 1, rotate: 0, opacity: 1 }
            : { scale: 1, rotate: 0, opacity: 1 }
        }
        transition={
          isRevealed
            ? { type: "spring", stiffness: 220, damping: 12, delay: 0.05 }
            : { delay: 0.1 }
        }
        className="relative"
        style={{ width: starSize, height: starSize }}
      >
        {info.earned ? (
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "drop-shadow-xl transition-all",
              isShining && "animate-pulse-soft"
            )}
            style={{
              filter: isShining
                ? "drop-shadow(0 0 12px rgba(255,215,0,0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                : "drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
            }}
          >
            <defs>
              <linearGradient id={`star-grad-${info.index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF59D" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA000" />
              </linearGradient>
              <radialGradient id={`star-shine-${info.index}`} cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#FFE082" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* ظل النجمة */}
            <path
              d="M12 2.5l2.8 5.7 6.3.9-4.55 4.43 1.07 6.26L12 17.85l-5.62 2.95 1.07-6.26L2.9 9.1l6.3-.9z"
              fill="url(#star-grad-)"
              opacity="0.3"
              transform="translate(0 0.6)"
            />
            {/* النجمة الرئيسية */}
            <path
              d="M12 2.5l2.8 5.7 6.3.9-4.55 4.43 1.07 6.26L12 17.85l-5.62 2.95 1.07-6.26L2.9 9.1l6.3-.9z"
              fill={`url(#star-grad-${info.index})`}
              stroke="#B8860B"
              strokeWidth="0.4"
              strokeLinejoin="round"
            />
            {/* لمعة داخلية */}
            {isShining && (
              <path
                d="M12 2.5l2.8 5.7 6.3.9-4.55 4.43 1.07 6.26L12 17.85l-5.62 2.95 1.07-6.26L2.9 9.1l6.3-.9z"
                fill={`url(#star-shine-${info.index})`}
              />
            )}
          </svg>
        ) : (
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            className="opacity-40"
          >
            <path
              d="M12 2.5l2.8 5.7 6.3.9-4.55 4.43 1.07 6.26L12 17.85l-5.62 2.95 1.07-6.26L2.9 9.1l6.3-.9z"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.5"
              strokeDasharray="2 1.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.div>

      {/* تسمية النجمة تحت الرمز — تظهر فقط للنجوم الكبيرة */}
      {starSize >= 36 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold",
            info.earned ? "text-yellow-300" : "text-white/30"
          )}
        >
          {info.icon}
        </motion.div>
      )}
    </div>
  );
}

/**
 * دالة مساعدة: حساب النجوم بناءً على الأداء
 *
 * ترجع كائن يحتوي على عدد النجوم ومعلومات تفصيلية لكل نجمة.
 */
export function computeStars({
  timeSpent,
  hintsUsed,
  difficulty,
  wordCount,
}: {
  timeSpent: number;
  hintsUsed: number;
  difficulty: "easy" | "medium" | "hard";
  wordCount: number;
}): { stars: number; infos: StarInfo[] } {
  // عتبات الوقت حسب الصعوبة وعدد الكلمات (نمنح وقتاً سخياً)
  // المتوسط: 25 ثانية للكلمة السهلة، 35 للمتوسطة، 50 للصعبة
  const timePerWord =
    difficulty === "easy" ? 25 : difficulty === "medium" ? 35 : 50;
  const speedThreshold = Math.max(timePerWord * wordCount, 60);

  // النجمة 1: الإنجاز — مضمونة
  const star1 = true;

  // النجمة 2: الذكاء — كافأ المستخدم إذا استخدم تلميحين كحد أقصى
  const star2 = hintsUsed <= Math.max(1, Math.floor(wordCount / 3));

  // النجمة 3: السرعة — كافأه إذا أنهى خلال العتبة ولم يستخدم تلميحات كثيرة
  const star3 = timeSpent <= speedThreshold && hintsUsed <= 1;

  const stars = (star1 ? 1 : 0) + (star2 ? 1 : 0) + (star3 ? 1 : 0);

  const formatTime = (s: number) =>
    s < 60 ? `${s} ث` : `${Math.floor(s / 60)} د ${s % 60} ث`;

  const infos: StarInfo[] = [
    {
      index: 1,
      earned: star1,
      title: "الإنجاز",
      reason: "أكملتَ المرحلة بنجاح 🎉",
      hint: "أكمل المرحلة للحصول عليها",
      icon: "🎯",
    },
    {
      index: 2,
      earned: star2,
      title: "الذكاء",
      reason: hintsUsed === 0 ? "بدون تلميحات!" : `تلميحات قليلة (${hintsUsed})`,
      hint:
        hintsUsed === 0
          ? "حافظ على عدم استخدام التلميحات"
          : `حاول ألا تستخدم أكثر من ${Math.max(1, Math.floor(wordCount / 3))} تلميحات`,
      icon: "🧠",
    },
    {
      index: 3,
      earned: star3,
      title: "السرعة",
      reason: `أنهيت في ${formatTime(timeSpent)} (العتبة ${formatTime(speedThreshold)})`,
      hint: `أنهِ المرحلة خلال ${formatTime(speedThreshold)} وبتلميح واحد كحد أقصى`,
      icon: "⚡",
    },
  ];

  return { stars, infos };
}
