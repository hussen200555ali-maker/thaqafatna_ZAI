"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sound-effects";

/**
 * شاشة الأهداف التربوية قبل بدء المرحلة
 * تُعرض للاعب قبل أن يبدأ المرحلة، فتعطيه صورة واضحة لما سيتعلّمه.
 */

export interface LearningGoalsProps {
  levelTitle: string;
  levelNumber: number;
  chapterIcon?: string;
  chapterTitle?: string;
  difficulty?: "easy" | "medium" | "hard";
  puzzleType?: string;
  learningGoals?: string[];
  educationalDescription?: string;
  wordCount?: number;
  onStart: () => void;
  onSkip?: () => void;
}

const PUZZLE_TYPE_INFO: Record<string, { icon: string; name: string; goals: string[] }> = {
  text: { icon: "📝", name: "سؤال نصي", goals: ["فهم السؤال وتحليل الإجابة الصحيحة", "إثراء الرصيد اللغوي"] },
  image: { icon: "🖼️", name: "لغز الصورة", goals: ["الربط بين الصورة والكلمة", "تطوير التفكير البصري"] },
  images4: { icon: "📸", name: "4 صور كلمة واحدة", goals: ["إيجاد القاسم المشترك بين الصور", "تطوير التفكير الاستقرائي"] },
  emoji: { icon: "😀", name: "لغز الإيموجي", goals: ["تفسير الرموز التعبيرية", "الربط بين الإيموجي والمعنى"] },
  scrambled: { icon: "🔀", name: "حروف مبعثرة", goals: ["إعادة ترتيب الحروف", "تقوية الذاكرة العاملة"] },
  crossword: { icon: "🧩", name: "شبكة متقاطعة", goals: ["الربط بين الكلمات الأفقية والعمودية", "تطوير التفكير المنطقي"] },
  fillblank: { icon: "✏️", name: "ملء الفراغات", goals: ["فهم السياق اللغوي", "اختيار الكلمة المناسبة للمكان"] },
  matching: { icon: "🔗", name: "توصيل الكلمات", goals: ["الربط بين المفاهيم المتقابلة", "تنمية مهارة التصنيف"] },
  multiple: { icon: "🔘", name: "اختيار من متعدد", goals: ["تمييز الإجابة الصحيحة من الخيارات", "تطوير مهارة التقييم"] },
  audio: { icon: "🔊", name: "لغز صوتي", goals: ["تنمية مهارة الإصغاء", "تمييز النطق الصحيح"] },
  logic: { icon: "🧠", name: "لغز منطقي", goals: ["تطوير التفكير النقدي", "اكتشاف الأنماط والاستنتاج"] },
  progressive: { icon: "💡", name: "تلميحات متدرجة", goals: ["الحل الذكي بالتلميحات المتدرجة", "الصبر والمثابرة"] },
  mixed: { icon: "👑", name: "تحدّي البوس", goals: ["إتقان كل المهارات السابقة", "تحدي شامل للاختبرات متعددة"] },
};

const DIFFICULTY_INFO = {
  easy: { icon: "🟢", label: "مبتدئ", color: "text-green-300", bg: "bg-green-500/20" },
  medium: { icon: "🟡", label: "متوسط", color: "text-amber-300", bg: "bg-amber-500/20" },
  hard: { icon: "🔴", label: "متقدم", color: "text-red-300", bg: "bg-red-500/20" },
};

export function LearningGoalsScreen({
  levelTitle, levelNumber, chapterIcon, chapterTitle, difficulty = "medium",
  puzzleType = "text", learningGoals = [], educationalDescription, wordCount = 0,
  onStart, onSkip,
}: LearningGoalsProps) {
  const puzzleInfo = PUZZLE_TYPE_INFO[puzzleType] || PUZZLE_TYPE_INFO.text;
  const effectiveGoals = learningGoals.length > 0 ? learningGoals : generateDefaultGoals(puzzleType, wordCount);
  const diffInfo = DIFFICULTY_INFO[difficulty];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="relative w-full max-w-md my-4"
      >
        <div className="bg-gradient-to-br from-teal-700 via-cyan-800 to-teal-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-teal-300/30 relative overflow-hidden">
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-purple-400/10"
          />

          <div className="relative flex flex-col items-center text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-soft-lg mb-3"
            >
              {chapterIcon || puzzleInfo.icon}
            </motion.div>

            {chapterTitle && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-teal-200 text-xs mb-1"
              >
                {chapterIcon} {chapterTitle}
              </motion.div>
            )}
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-tajawal)" }}
            >
              مرحلة {levelNumber}: {levelTitle}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold", diffInfo.bg, diffInfo.color)}
            >
              {diffInfo.icon} {diffInfo.label}
            </motion.div>
          </div>

          {educationalDescription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 mb-4 border border-white/10"
            >
              <p className="text-teal-100 text-sm text-center leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
                {educationalDescription}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="text-xl">🎯</span>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-tajawal)" }}>
              ماذا ستتعلّم؟
            </h3>
          </motion.div>

          <ul className="space-y-2 mb-6">
            {effectiveGoals.map((goal, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <span className="text-amber-300 mt-0.5 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-white text-sm flex-1" style={{ fontFamily: "var(--font-tajawal)" }}>{goal}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-2 gap-2 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg mb-0.5">{puzzleInfo.icon}</div>
              <div className="text-[10px] text-stone-400 mb-0.5">نوع اللغز</div>
              <div className="text-xs font-bold text-white">{puzzleInfo.name}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2.5 border border-white/10 text-center">
              <div className="text-lg mb-0.5">❓</div>
              <div className="text-[10px] text-stone-400 mb-0.5">عدد الأسئلة</div>
              <div className="text-xs font-bold text-white">{wordCount || 5} سؤال</div>
            </div>
          </motion.div>

          <div className="flex gap-2">
            <Button
              onClick={() => { playSound("buttonClick"); onStart(); }}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-stone-900 font-bold py-3 rounded-xl shadow-lg"
            >
              ابدأ التعلّم 🚀
            </Button>
            {onSkip && (
              <Button
                onClick={() => { playSound("buttonClick"); onSkip(); }}
                variant="outline"
                className="px-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                تخطّي
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function generateDefaultGoals(puzzleType: string, wordCount: number): string[] {
  const puzzleInfo = PUZZLE_TYPE_INFO[puzzleType] || PUZZLE_TYPE_INFO.text;
  const goals = [...puzzleInfo.goals];
  if (wordCount > 0) {
    goals.push(`إتقان ${wordCount} ${wordCount === 1 ? "كلمة" : "كلمات"} جديدة`);
  }
  goals.push("اختبار معلوماتك بطريقة ممتعة");
  return goals.slice(0, 4);
}
