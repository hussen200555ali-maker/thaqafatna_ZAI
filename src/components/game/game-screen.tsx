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
import { fetchLevelById, saveProgress } from "@/lib/game-data-api";
import { useToast } from "@/hooks/use-toast";
import { playSound, getMuted, setMuted } from "@/lib/sound-effects";
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

  const { completeLevel, addCoins, spendCoins, useHint: recordHintUsed, coins, hintsUsed, getLevelStars, userId } =
    useGameStore();

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(getMuted());
  }, []);

  // تحميل المرحلة من API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFoundWords([]);
    setBonusWords([]);
    setShowSuccess(false);
    setHintsRevealed(new Set());
    setStartTime(Date.now());

    fetchLevelById(levelId).then((data) => {
      if (!cancelled) {
        setLevel(data);
        setLoading(false);
        if (data) {
          setTimeout(() => playSound("levelStart"), 200);
        }
      }
    });
    return () => { cancelled = true; };
  }, [levelId]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  const handleWordSubmit = (word: string) => {
    if (!level) return;

    const isCorrectWord = level.words.some((w) => w.text === word && !foundWords.includes(w.text));
    const isBonusWord = level.bonusWords.includes(word) && !bonusWords.includes(word);

    if (isCorrectWord) {
      setFoundWords([...foundWords, word]);
      playSound("correctWord");
      const wordDef = level.words.find((w) => w.text === word);
      toast({
        title: "🎉 كلمة صحيحة!",
        description: wordDef?.clue,
      });

      // فحص إكمال جميع الكلمات
      const newFound = [...foundWords, word];
      if (level.words.every((w) => newFound.includes(w.text))) {
        setTimeout(() => {
          playSound("levelComplete");
          setShowSuccess(true);
          completeLevel(level.id, level.reward);
          addCoins(bonusWords.length * 20);

          // حفظ التقدم سحابياً
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          if (userId) {
            saveProgress({
              userId,
              levelId: level.id,
              isCompleted: true,
              stars: 1,
              score: level.reward + bonusWords.length * 20,
              hintsUsed: hintsUsed,
              timeSpent,
              coinsEarned: level.reward + bonusWords.length * 20,
            }).catch((e) => console.error("Cloud sync error:", e));
          }
        }, 600);
      }
    } else if (isBonusWord) {
      setBonusWords([...bonusWords, word]);
      addCoins(20);
      playSound("bonusWord");
      toast({
        title: "✨ كلمة إضافية!",
        description: `+20 عملة (${word})`,
      });
    } else {
      playSound("wrongWord");
      toast({
        title: "❌ كلمة غير صحيحة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleHint = () => {
    if (!level) return;
    if (coins < level.hintCost) {
      toast({
        title: "عملات غير كافية",
        description: `تحتاج ${level.hintCost} عملة لاستخدام تلميح`,
        variant: "destructive",
      });
      return;
    }

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
      playSound("hint");
      toast({
        title: "💡 تلميح",
        description: `${wordToReveal.text}: ${wordToReveal.clue}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pattern-arabic">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500"
        />
        <p className="text-stone-500 text-sm">جاري تحميل المرحلة...</p>
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

  const difficultyLabels: Record<string, { label: string; color: string; icon: string }> = {
    easy: { label: "سهل", color: "bg-green-100 text-green-700", icon: "⭐" },
    medium: { label: "متوسط", color: "bg-amber-100 text-amber-700", icon: "⭐⭐" },
    hard: { label: "صعب", color: "bg-red-100 text-red-700", icon: "⭐⭐⭐" },
  };

  const isCompleted = getLevelStars(level.id) > 0;
  const progress = (foundWords.length / level.words.length) * 100;

  return (
    <div className="min-h-screen pattern-arabic flex flex-col">
      {/* شريط علوي */}
      <header className="sticky top-0 z-20 glass border-b border-amber-200/30">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              playSound("buttonClick");
              if (onExit) onExit();
              else router.push("/");
            }}
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
              {difficultyLabels[level.difficulty].icon} {difficultyLabels[level.difficulty].label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* زر كتم الصوت */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-amber-100/50 transition-colors"
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-500">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-600">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-200">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="oklch(0.78 0.13 80)" />
                <text x="12" y="16" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">★</text>
              </svg>
              <span className="text-sm font-bold text-amber-700">{coins}</span>
            </div>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="h-1.5 bg-stone-100 relative overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          />
          {progress > 0 && (
            <div className="absolute top-0 right-0 h-full flex items-center pr-2">
              <span className="text-[10px] font-bold text-white drop-shadow">
                {foundWords.length}/{level.words.length}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* التلميحات الكاشفة */}
        <AnimatePresence>
          {hintsRevealed.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 overflow-hidden"
            >
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  💡
                </motion.span>
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
            </motion.div>
          )}
        </AnimatePresence>

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
                <motion.div
                  key={word.id}
                  initial={found ? { scale: 0.8 } : {}}
                  animate={found ? { scale: 1 } : {}}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    found
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30"
                      : hinted
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-stone-50 text-stone-500 border-stone-200"
                  )}
                >
                  <span className="font-bold">{word.number}</span>
                  <span className="opacity-60">{word.direction === "across" ? "→" : "↓"}</span>
                  <span>{found ? word.text : "؟".repeat(word.text.length)}</span>
                  {found && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="mr-1"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* الكلمات الإضافية */}
          {bonusWords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1">
                <span>✨</span> كلمات إضافية ({bonusWords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {bonusWords.map((word, idx) => (
                  <motion.span
                    key={word}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 300 }}
                    className="px-2 py-1 rounded-md bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium border border-purple-200"
                  >
                    {word} +20
                  </motion.span>
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
            <LetterCircle
              letters={level.availableLetters}
              onWordSubmit={handleWordSubmit}
              foundWords={foundWords}
              bonusWords={bonusWords}
            />
          </div>
        </div>

        {/* أزرار المساعدة */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/30 transition-all"
          >
            <motion.svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <path d="M9 21h6m-3-3v3M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.5 1 2.5h6c0-1 .5-2 1-2.5A6 6 0 0 0 12 3z" />
            </motion.svg>
            <span className="text-sm font-bold">تلميح</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{level.hintCost}</span>
          </motion.button>
        </div>
      </main>

      {/* شاشة النجاح */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessModal
            level={level}
            foundWords={foundWords.length}
            bonusWords={bonusWords.length}
            timeSpent={Math.floor((Date.now() - startTime) / 1000)}
            hintsUsed={hintsUsed}
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

interface SuccessModalProps {
  level: Level;
  foundWords: number;
  bonusWords: number;
  timeSpent: number;
  hintsUsed: number;
  onClose: () => void;
}

function SuccessModal({ level, foundWords, bonusWords, timeSpent, hintsUsed, onClose }: SuccessModalProps) {
  const totalReward = level.reward + bonusWords * 20;
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const timeStr = minutes > 0 ? `${minutes} د ${seconds} ث` : `${seconds} ثانية`;

  // حساب عدد النجوم (3 نجوم = ممتاز، 2 = جيد، 1 = مقبول)
  const stars = hintsUsed === 0 && timeSpent < 60 ? 3 : hintsUsed <= 2 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50, rotateX: 45 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.5, y: 50, rotateX: 45 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-amber-300 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* خلفية احتفالية */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-50 pointer-events-none" />
        {/* نجوم متطايرة */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 300,
              y: (Math.random() - 0.5) * 300,
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}
            className="absolute top-1/2 left-1/2 text-2xl pointer-events-none"
          >
            {["⭐", "🎉", "✨", "💫", "🌟"][i % 5]}
          </motion.div>
        ))}

        <div className="relative text-center">
          {/* النجوم */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((starNum) => (
              <motion.div
                key={starNum}
                initial={{ scale: 0, rotate: -180, y: -50 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ delay: 0.3 + starNum * 0.15, type: "spring", stiffness: 200 }}
              >
                <svg
                  width={starNum <= stars ? "40" : "32"}
                  height={starNum <= stars ? "40" : "32"}
                  viewBox="0 0 24 24"
                  fill={starNum <= stars ? "oklch(0.78 0.13 80)" : "oklch(0.85 0 0)"}
                  className={starNum <= stars ? "drop-shadow-lg" : "opacity-30"}
                >
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                </svg>
              </motion.div>
            ))}
          </div>

          {/* أيقونة النجاح */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-gold-lg"
          >
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-bold text-stone-800 mb-2"
            style={{ fontFamily: "var(--font-tajawal)" }}
          >
            {stars === 3 ? "🏆 رائع!" : stars === 2 ? "🎉 أحسنت!" : "✅ أكملت!"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-stone-600 mb-6"
          >
            أكملت مرحلة «{level.title}»
          </motion.p>

          {/* الإحصائيات */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-xs text-stone-500 mb-1">⏱️ الوقت</div>
              <div className="text-lg font-bold text-amber-600">{timeStr}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <div className="text-xs text-stone-500 mb-1">✨ إضافية</div>
              <div className="text-lg font-bold text-purple-600">{bonusWords}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs text-stone-500 mb-1">💡 تلميحات</div>
              <div className="text-lg font-bold text-blue-600">{hintsUsed}</div>
            </div>
            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="text-xs text-stone-500 mb-1">🪙 مكافأة</div>
              <div className="text-lg font-bold text-green-600">+{totalReward}</div>
            </div>
          </motion.div>

          {/* أزرار */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col gap-2"
          >
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-md shadow-amber-500/30"
            >
              متابعة 🚀
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
