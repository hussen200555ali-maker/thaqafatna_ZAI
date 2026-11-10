"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: "🌟",
    title: "أهلاً بك في ثقافتنا",
    description: "رحلة ممتعة في عالم الكلمات العربية، حيث تكتشف وتتعلّم وتتحدى نفسك كل يوم",
    gradient: "from-amber-400 via-amber-500 to-amber-600",
  },
  {
    icon: "🎯",
    title: "كوّن الكلمات",
    description: "اسحب الحروف من الدائرة لتكوين الكلمات المطلوبة في الشبكة. كل كلمة صحيحة تكشف جزءاً من الحل",
    gradient: "from-purple-400 via-purple-500 to-purple-600",
  },
  {
    icon: "💡",
    title: "تلميحات ذكية",
    description: "استخدم العملات للحصول على تلميحات عند الحاجة، أو اكتشف كلمات إضافية لمكافآت أكبر",
    gradient: "from-teal-400 via-teal-500 to-teal-600",
  },
  {
    icon: "🔥",
    title: "تحدَّ يومياً",
    description: "عُد كل يوم لتحدٍّ جديد ومكافآت متزايدة. حافظ على سلسلتك لتضاعف نقاطك",
    gradient: "from-rose-400 via-rose-500 to-rose-600",
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addCoins } = useGameStore();
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      addCoins(50); // مكافأة ترحيبية
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    addCoins(50);
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* زر التخطي */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleSkip}
          className="px-4 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          تخطّي
        </button>
      </div>

      {/* المحتوى */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* الأيقونة الكبيرة */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-6xl sm:text-7xl shadow-2xl`}
            >
              {slide.icon}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold text-stone-800 mb-4"
              style={{ fontFamily: "var(--font-tajawal)" }}
            >
              {slide.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-stone-600 text-base sm:text-lg leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* مؤشرات التقدم */}
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === currentSlide ? "w-8 bg-amber-500" : "w-2 bg-stone-300"
            }`}
          />
        ))}
      </div>

      {/* الأزرار */}
      <div className="px-6 pb-8 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          className={`w-full py-6 text-lg font-bold rounded-2xl text-white shadow-lg bg-gradient-to-r ${slide.gradient} hover:opacity-90 transition-all`}
        >
          {isLastSlide ? "ابدأ اللعب 🎮" : "التالي"}
        </Button>

        {/* الشعار */}
        <div className="mt-6 flex items-center justify-center">
          <Logo size={24} showText={false} />
          <span className="text-stone-400 text-sm mr-2">ثقافتنا</span>
        </div>
      </div>
    </div>
  );
}
