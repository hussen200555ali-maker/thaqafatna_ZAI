"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CrosswordGrid } from "./crossword-grid";
import { LetterCircle } from "./letter-circle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/game-store";
import { Level } from "@/lib/game-data";
import { fetchLevelById } from "@/lib/game-data-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GameScreenProps {
  levelId: number;
  onExit?: () => void;
}

export function GameScreen({ levelId, onExit }: GameScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);

  const { completeLevel, addCoins, spendCoins, useHint: recordHintUsed, coins, hintsUsed, getLevelStars } =
    useGameStore();

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<Set<string>>(new Set());

  // تحميل المرحلة من API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFoundWords([]);
    setBonusWords([]);
    setShowSuccess(false);
    setHintsRevealed(new Set());

    fetchLevelById(levelId).then((data) => {
      if (!cancelled) {
        setLevel(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [levelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!level) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-stone-600 mb-4">المرحلة غير موجودة</p>
          <Button onClick={() => onExit?.() || router.push("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  const handleWordSubmit = (word: string) => {
    // التحقق من الكلمة
    const isCorrectWord = level.words.some((w) => w.text === word && !foundWords.includes(w.text));
    const isBonusWord = level.bonusWords.includes(word) && !bonusWords.includes(word);

    if (isCorrectWord) {
      setFoundWords([...foundWords, word]);
      const wordDef = level.words.find((w) => w.text === word);
      toast({
        title: "🎉 كلمة صحيحة!",
        description: wordDef?.clue,
      });

      // فحص إكمال جميع الكلمات
      const newFound = [...foundWords, word];
      if (level.words.every((w) => newFound.includes(w.text))) {
        setTimeout(() => {
          setShowSuccess(true);
          completeLevel(level.id, level.reward);
        }, 600);
      }
    } else if (isBonusWord) {
      setBonusWords([...bonusWords, word]);
      addCoins(20);
      toast({
        title: "✨ كلمة إضافية!",
        description: `+20 عملة (${word})`,
      });
    } else {
      toast({
        title: "❌ كلمة غير صحيحة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleHint = () => {
    if (coins < level.hintCost) {
      toast({
        title: "عملات غير كافية",
        description: `تحتاج ${level.hintCost} عملة لاستخدام تلميح`,
        variant: "destructive",
      });
      return;
    }

    // البحث عن كلمة لم تُكشف بعد
    const unrevealedWords = level.words.filter((w) => !hintsRevealed.has(w.text) && !foundWords.includes(w.text));

    if (unrevealedWords.length === 0) {
      toast({
        title: "لا توجد تلميحات متاحة",
        description: "تم كشف كل التلميحات",
      });
      return;
    }

    const wordToReveal = unrevealedWords[0];
    if (spendCoins(level.hintCost)) {
      recordHintUsed();
      setHintsRevealed(new Set([...hintsRevealed, wordToReveal.text]));
      toast({
        title: "💡 تلميح",
        description: `${wordToReveal.text}: ${wordToReveal.clue}`,
      });
    }
  };

  const difficultyLabels: Record<string, { label: string; color: string }> = {
    easy: { label: "سهل", color: "bg-green-100 text-green-700" },
    medium: { label: "متوسط", color: "bg-amber-100 text-amber-700" },
    hard: { label: "صعب", color: "bg-red-100 text-red-700" },
  };

  const isCompleted = getLevelStars(level.id) > 0;
  const progress = (foundWords.length / level.words.length) * 100;

  return (
    <div className="min-h-screen pattern-arabic flex flex-col">
      {/* شريط علوي */}
      <header className="sticky top-0 z-20 glass border-b border-amber-200/30">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onExit?.() || router.push("/")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-100/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-medium text-stone-700 hidden sm:inline">رجوع</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              {level.title}
            </h1>
            <Badge className={cn("text-xs", difficultyLabels[level.difficulty].color)}>
              {difficultyLabels[level.difficulty].label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="oklch(0.78 0.13 80)">
                <circle cx="12" cy="12" r="10" />
                <text x="12" y="16" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">$</text>
              </svg>
              <span className="text-sm font-bold text-amber-700">{coins}</span>
            </div>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="h-1 bg-stone-100">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* التلميحات الكاشفة */}
        {hintsRevealed.size > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200">
            <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21h6m-3-3v3M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.5 1 2.5h6c0-1 .5-2 1-2.5A6 6 0 0 0 12 3z" />
              </svg>
              تلميحات
            </h3>
            <ul className="space-y-1">
              {Array.from(hintsRevealed).map((word) => {
                const w = level.words.find((x) => x.text === word);
                if (!w) return null;
                return (
                  <li key={word} className="text-sm text-blue-700">
                    <span className="font-bold">{w.number}.</span>{" "}
                    {w.direction === "across" ? "أفقي" : "عمودي"} — {w.clue}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* قائمة الكلمات */}
        <div className="mb-4 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-amber-200/50">
          <h3 className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            الكلمات المطلوبة ({foundWords.length}/{level.words.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {level.words.map((word) => {
              const found = foundWords.includes(word.text);
              const hinted = hintsRevealed.has(word.text);
              return (
                <div
                  key={word.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    found
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white border-amber-500"
                      : hinted
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-stone-50 text-stone-500 border-stone-200"
                  )}
                >
                  <span className="font-bold">{word.number}</span>
                  <span className="opacity-60">{word.direction === "across" ? "→" : "↓"}</span>
                  <span>{found ? word.text : "؟".repeat(word.text.length)}</span>
                </div>
              );
            })}
          </div>

          {/* الكلمات الإضافية */}
          {bonusWords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs font-bold text-stone-600 mb-2">
                ✨ كلمات إضافية ({bonusWords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {bonusWords.map((word) => (
                  <span
                    key={word}
                    className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-medium"
                  >
                    {word} +20
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* الشبكة + دائرة الحروف */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* الشبكة */}
          <div className="flex flex-col items-center">
            <CrosswordGrid level={level} foundWords={foundWords} />
          </div>

          {/* دائرة الحروف */}
          <div className="flex flex-col items-center">
            <LetterCircle letters={level.availableLetters} onWordSubmit={handleWordSubmit} />
          </div>
        </div>

        {/* أزرار المساعدة */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handleHint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/30 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21h6m-3-3v3M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.5 1 2.5h6c0-1 .5-2 1-2.5A6 6 0 0 0 12 3z" />
            </svg>
            <span className="text-sm font-bold">تلميح</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{level.hintCost}</span>
          </button>
        </div>
      </main>

      {/* شاشة النجاح */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessModal
            level={level}
            foundWords={foundWords.length}
            bonusWords={bonusWords.length}
            onClose={() => {
              setShowSuccess(false);
              if (onExit) onExit();
              else router.push("/");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessModal({
  level,
  foundWords,
  bonusWords,
  onClose,
}: {
  level: Level;
  foundWords: number;
  bonusWords: number;
  onClose: () => void;
}) {
  const totalReward = level.reward + bonusWords * 20;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-amber-300"
      >
        <div className="text-center">
          {/* أيقونة النجاح */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-gold-lg"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "var(--font-tajawal)" }}>
            🎉 أحسنت!
          </h2>
          <p className="text-stone-600 mb-6">
            أكملت مرحلة «{level.title}»
          </p>

          {/* الإحصائيات */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-xs text-stone-500 mb-1">كلمات</div>
              <div className="text-lg font-bold text-amber-600">{foundWords}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <div className="text-xs text-stone-500 mb-1">إضافية</div>
              <div className="text-lg font-bold text-purple-600">{bonusWords}</div>
            </div>
            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="text-xs text-stone-500 mb-1">مكافأة</div>
              <div className="text-lg font-bold text-green-600">+{totalReward}</div>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-md shadow-amber-500/30"
            >
              متابعة
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
