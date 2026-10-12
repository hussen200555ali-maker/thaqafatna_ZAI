"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

  // حالة السؤال الحالي (الكلمة الأولى غير المكتملة)
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set()); // حروف مكتشفة بالتلميح

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
    setCurrentWordIndex(0);
    setSelectedLetters([]);
    setRevealedLetters(new Set());

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

  // الكلمة الحالية
  const currentWord = level?.words[currentWordIndex];
  const currentWordText = currentWord?.text || "";
  const currentWordLength = currentWordText.length;

  // الحروف المعروضة في خانات الإجابة (من اختيار اللاعب + الحروف المكتشفة)
  const answerLetters = useMemo(() => {
    if (!currentWord) return [];
    const letters: (string | null)[] = Array(currentWordLength).fill(null);
    // ملء الحروف المكتشفة بالتلميح
    revealedLetters.forEach((idx) => {
      if (idx < currentWordLength) {
        letters[idx] = currentWordText[idx];
      }
    });
    // ملء الحروف المختارة بالتسلسل
    let selectIdx = 0;
    for (let i = 0; i < currentWordLength && selectIdx < selectedLetters.length; i++) {
      if (letters[i] === null) {
        if (level) {
          letters[i] = level.availableLetters[selectedLetters[selectIdx]];
        }
        selectIdx++;
      }
    }
    return letters;
  }, [currentWord, currentWordLength, currentWordText, selectedLetters, revealedLetters, level]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  const handleLetterClick = (letterIdx: number) => {
    if (selectedLetters.includes(letterIdx)) return;
    if (!level) return;

    const newSelected = [...selectedLetters, letterIdx];
    setSelectedLetters(newSelected);
    playSound("selectLetter");

    // فحص إذا اكتملت الكلمة
    const filledCount = answerLetters.filter(l => l !== null).length + 1;
    if (filledCount >= currentWordLength) {
      // بناء الكلمة المُكوّنة
      const word = buildCurrentWord(newSelected);
      setTimeout(() => checkWord(word, newSelected), 200);
    }
  };

  const buildCurrentWord = (selected: number[]): string => {
    if (!level || !currentWord) return "";
    const letters: (string | null)[] = Array(currentWordLength).fill(null);
    revealedLetters.forEach((idx) => {
      if (idx < currentWordLength) {
        letters[idx] = currentWordText[idx];
      }
    });
    let selectIdx = 0;
    for (let i = 0; i < currentWordLength && selectIdx < selected.length; i++) {
      if (letters[i] === null) {
        letters[i] = level.availableLetters[selected[selectIdx]];
        selectIdx++;
      }
    }
    return letters.join("");
  };

  const checkWord = (word: string, selected: number[]) => {
    if (!level || !currentWord) return;

    const isCorrect = word === currentWordText;
    const isBonus = level.bonusWords.includes(word) && !bonusWords.includes(word);

    if (isCorrect) {
      const newFound = [...foundWords, word];
      setFoundWords(newFound);
      playSound("correctWord");
      toast({
        title: "🎉 إجابة صحيحة!",
        description: currentWord.clue,
      });

      // الانتقال للكلمة التالية أو إكمال المرحلة
      setTimeout(() => {
        if (currentWordIndex + 1 < level.words.length) {
          setCurrentWordIndex(currentWordIndex + 1);
          setSelectedLetters([]);
          setRevealedLetters(new Set());
        } else {
          // إكمال المرحلة
          playSound("levelComplete");
          setShowSuccess(true);
          completeLevel(level.id, level.reward);
          addCoins(bonusWords.length * 20);

          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          if (userId) {
            saveProgress({
              userId,
              levelId: level.id,
              isCompleted: true,
              stars: 1,
              score: level.reward + bonusWords.length * 20,
              hintsUsed,
              timeSpent,
              coinsEarned: level.reward + bonusWords.length * 20,
            }).catch((e) => console.error("Cloud sync error:", e));
          }
        }
      }, 800);
    } else if (isBonus) {
      setBonusWords([...bonusWords, word]);
      addCoins(20);
      playSound("bonusWord");
      toast({
        title: "✨ كلمة إضافية!",
        description: `+20 عملة (${word})`,
      });
      setSelectedLetters([]);
    } else {
      playSound("wrongWord");
      // اهتزاز الخانات
      toast({
        title: "❌ إجابة خاطئة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
      setTimeout(() => {
        setSelectedLetters([]);
      }, 500);
    }
  };

  const handleRemoveLast = () => {
    if (selectedLetters.length === 0) return;
    setSelectedLetters(selectedLetters.slice(0, -1));
    playSound("removeLetter");
  };

  const handleClear = () => {
    setSelectedLetters([]);
    playSound("removeLetter");
  };

  const handleRevealLetter = () => {
    if (!level || !currentWord) return;
    if (coins < level.hintCost) {
      toast({
        title: "عملات غير كافية",
        description: `تحتاج ${level.hintCost} عملة`,
        variant: "destructive",
      });
      return;
    }

    // إيجاد أول خانة فارغة
    const emptyIdx = answerLetters.findIndex(l => l === null);
    if (emptyIdx === -1) {
      toast({ title: "اكتملت الكلمة", description: "اضغط تأكيد للتحقق" });
      return;
    }

    if (spendCoins(level.hintCost)) {
      recordHintUsed();
      const newRevealed = new Set(revealedLetters);
      newRevealed.add(emptyIdx);
      setRevealedLetters(newRevealed);
      setHintsRevealed(new Set([...hintsRevealed, currentWordText]));
      playSound("hint");
      toast({
        title: "💡 كشف حرف",
        description: `الحرف ${emptyIdx + 1}: ${currentWordText[emptyIdx]}`,
      });
    }
  };

  const handleShuffle = () => {
    if (!level) return;
    // خلط الحروف المتاحة
    playSound("shuffle");
    // سنترك الخلط للتطبيق لاحقاً
    toast({ title: "🔀 تم خلط الحروف" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pattern-arabic">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500"
        />
        <p className="text-stone-500 text-sm">جاري تحميل اللغز...</p>
      </div>
    );
  }

  if (!level || !currentWord) {
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

  const progress = (foundWords.length / level.words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      {/* شريط علوي */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              playSound("buttonClick");
              if (onExit) onExit();
              else router.push("/");
            }}
            className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium">رجوع</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">لغز رقم {level.number}</span>
            <Badge className={cn("text-xs", difficultyLabels[level.difficulty].color)}>
              {difficultyLabels[level.difficulty].label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* زر كتم الصوت */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* العملات */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#FFD700" />
                <text x="12" y="16" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">★</text>
              </svg>
              <span className="text-sm font-bold text-white">{coins}</span>
            </div>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="h-1.5 bg-teal-800/30">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-300 to-amber-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          />
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* قائمة الكلمات */}
        <div className="flex flex-wrap gap-2 justify-center">
          {level.words.map((word, idx) => {
            const found = foundWords.includes(word.text);
            const isCurrent = idx === currentWordIndex;
            return (
              <motion.div
                key={word.id}
                animate={found ? { scale: [1, 1.1, 1] } : {}}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
                  found
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white border-amber-500 shadow-md"
                    : isCurrent
                    ? "bg-teal-100 text-teal-800 border-teal-400 ring-2 ring-teal-300"
                    : "bg-white/60 text-stone-500 border-stone-200"
                )}
              >
                {found ? `✓ ${word.text}` : `${idx + 1}. ${"؟".repeat(word.text.length)}`}
              </motion.div>
            );
          })}
        </div>

        {/* بطاقة السؤال */}
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* عنوان السؤال */}
          <div className="bg-teal-600/50 px-6 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-lg">
              {currentWord.direction === "across" ? "← أفقي" : "↓ عمودي"} · {currentWord.number}
            </span>
            {/* زر المشاركة */}
            <button
              onClick={() => {
                playSound("buttonClick");
                toast({ title: "📤 مشاركة", description: "ميزة المشاركة قريباً" });
              }}
              className="w-8 h-8 rounded-full bg-teal-400/30 hover:bg-teal-400/50 flex items-center justify-center transition-colors"
              title="مشاركة"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          {/* نص السؤال */}
          <div className="px-6 py-8 text-center">
            <p className="text-white text-xl sm:text-2xl font-bold leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
              {currentWord.clue}
            </p>
          </div>

          {/* أزرار المساعدة */}
          <div className="bg-teal-900/30 px-4 py-3 flex items-center justify-between">
            <button
              onClick={handleRevealLetter}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600/50 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              اكشف حرف
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{level.hintCost}</span>
            </button>

            <button
              onClick={handleRemoveLast}
              disabled={selectedLetters.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600/50 hover:bg-teal-600 text-white text-sm font-medium transition-colors disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L11 20" />
              </svg>
              احذف حرف
            </button>
          </div>
        </motion.div>

        {/* خانات الإجابة */}
        <div className="flex justify-center gap-2 flex-wrap">
          {answerLetters.map((letter, idx) => {
            const isRevealed = revealedLetters.has(idx);
            const isSelected = letter !== null && !isRevealed;
            return (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center font-bold text-2xl shadow-md transition-all",
                  isRevealed
                    ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white border-blue-600"
                    : isSelected
                    ? "bg-white text-stone-800 border-stone-400"
                    : "bg-teal-800/80 text-transparent border-teal-600"
                )}
              >
                {letter && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={isRevealed ? "text-white" : "text-stone-800"}
                  >
                    {letter}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* الحروف المتاحة - في مربعات بيضاء */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
            {level.availableLetters.map((letter, idx) => {
              const isSelected = selectedLetters.includes(idx);
              return (
                <motion.button
                  key={`${letter}-${idx}`}
                  whileTap={{ scale: 0.9 }}
                  whileHover={!isSelected ? { scale: 1.1, y: -2 } : {}}
                  onClick={() => handleLetterClick(idx)}
                  disabled={isSelected}
                  className={cn(
                    "w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-bold text-xl shadow-md transition-all border-2",
                    isSelected
                      ? "bg-stone-100 text-stone-300 border-stone-200 opacity-40"
                      : "bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:shadow-lg"
                  )}
                >
                  {letter}
                </motion.button>
              );
            })}
          </div>

          {/* زر المسح */}
          {selectedLetters.length > 0 && (
            <div className="flex justify-center mt-3">
              <button
                onClick={handleClear}
                className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                مسح الكل
              </button>
            </div>
          )}
        </div>

        {/* الكلمات الإضافية */}
        {bonusWords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {bonusWords.map((word, idx) => (
              <motion.span
                key={word}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium border border-purple-200"
              >
                ✨ {word} +20
              </motion.span>
            ))}
          </div>
        )}
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
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-amber-300 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
                  fill={starNum <= stars ? "#FFD700" : "#E5E7EB"}
                  className={starNum <= stars ? "drop-shadow-lg" : "opacity-30"}
                >
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                </svg>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "var(--font-tajawal)" }}>
            {stars === 3 ? "🏆 رائع!" : stars === 2 ? "🎉 أحسنت!" : "✅ أكملت!"}
          </h2>

          <p className="text-stone-600 mb-6">أكملت لغز رقم {level.number}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
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
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-md shadow-amber-500/30"
          >
            متابعة 🚀
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
