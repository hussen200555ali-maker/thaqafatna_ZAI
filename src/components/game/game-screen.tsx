"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/game-store";
import { Level, Word } from "@/lib/game-data";
import { fetchLevelById, saveProgress } from "@/lib/game-data-api";
import { useToast } from "@/hooks/use-toast";
import { playSound, getMuted, setMuted } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

// الأبجدية العربية الكاملة مرتبة
const ARABIC_KEYBOARD = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط", "ئ"],
  ["ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "ذ"],
];

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
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<{ letter: string; used: boolean }[]>([]);
  const [answerOrder, setAnswerOrder] = useState<number[]>([]); // أرقام index في selectedLetters بترتيب النقر
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());
  const [wrongShake, setWrongShake] = useState(false);

  useEffect(() => {
    setIsMuted(getMuted());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFoundWords([]);
    setBonusWords([]);
    setShowSuccess(false);
    setStartTime(Date.now());
    setCurrentWordIndex(0);
    setSelectedLetters([]);
    setAnswerOrder([]);
    setRevealedLetters(new Set());

    fetchLevelById(levelId).then((data) => {
      if (!cancelled) {
        setLevel(data);
        setLoading(false);
        if (data) {
          setTimeout(() => playSound("levelStart"), 200);
          // تهيئة الحروف المتاحة مع لوحة المفاتيح الكاملة
          if (data.availableLetters && data.availableLetters.length > 0) {
            const letters = data.availableLetters.map(l => ({ letter: l, used: false }));
            setSelectedLetters(letters);
          }
        }
      }
    });
    return () => { cancelled = true; };
  }, [levelId]);

  const currentWord = level?.words[currentWordIndex];
  const currentWordText = currentWord?.text || "";

  // الحروف المعروضة في خانات الإجابة (مكشوفة + مختارة من المستخدم بترتيب النقر)
  const answerLetters = useMemo(() => {
    if (!currentWord) return [];
    const letters: (string | null)[] = Array(currentWordText.length).fill(null);
    // ملء الحروف المكتشفة بالتلميح أولاً
    revealedLetters.forEach((idx) => {
      if (idx < currentWordText.length) {
        letters[idx] = currentWordText[idx];
      }
    });
    // ملء الحروف المختارة من المستخدم بترتيب النقر
    let letterIdx = 0;
    for (const selIdx of answerOrder) {
      // إيجاد أول خانة فارغة
      while (letterIdx < currentWordText.length && letters[letterIdx] !== null) {
        letterIdx++;
      }
      if (letterIdx < currentWordText.length && selectedLetters[selIdx]) {
        letters[letterIdx] = selectedLetters[selIdx].letter;
        letterIdx++;
      }
    }
    return letters;
  }, [currentWord, currentWordText, revealedLetters, selectedLetters, answerOrder]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  const handleLetterClick = useCallback((letter: string) => {
    // البحث عن أول حرف غير مستخدم مطابق
    const idx = selectedLetters.findIndex(l => l.letter === letter && !l.used);
    if (idx === -1) return;

    const newLetters = [...selectedLetters];
    newLetters[idx] = { ...newLetters[idx], used: true };
    const newOrder = [...answerOrder, idx];
    setSelectedLetters(newLetters);
    setAnswerOrder(newOrder);
    playSound("selectLetter");

    // حساب عدد الخانات المملوءة بعد هذا الاختيار
    const filledCount = revealedLetters.size + newOrder.length;
    if (filledCount >= currentWordText.length) {
      const word = buildCurrentWord(newLetters, newOrder);
      setTimeout(() => checkWord(word, newLetters, newOrder), 200);
    }
  }, [selectedLetters, answerOrder, revealedLetters, currentWordText]);

  const buildCurrentWord = (letters: { letter: string; used: boolean }[], order: number[]): string => {
    if (!currentWord) return "";
    const result: (string | null)[] = Array(currentWordText.length).fill(null);
    // ملء الحروف المكتشفة بالتلميح
    revealedLetters.forEach((idx) => {
      if (idx < currentWordText.length) {
        result[idx] = currentWordText[idx];
      }
    });
    // ملء الحروف المختارة من المستخدم بترتيب النقر
    let letterIdx = 0;
    for (const selIdx of order) {
      while (letterIdx < currentWordText.length && result[letterIdx] !== null) {
        letterIdx++;
      }
      if (letterIdx < currentWordText.length && letters[selIdx]) {
        result[letterIdx] = letters[selIdx].letter;
        letterIdx++;
      }
    }
    return result.join("");
  };

  const checkWord = (word: string, letters: { letter: string; used: boolean }[], order: number[]) => {
    if (!level || !currentWord) return;

    const isCorrect = word === currentWordText;
    const isBonus = level.bonusWords.includes(word) && !bonusWords.includes(word);

    if (isCorrect) {
      const newFound = [...foundWords, word];
      setFoundWords(newFound);
      playSound("correctWord");
      toast({ title: "🎉 إجابة صحيحة!", description: currentWord.clue });

      setTimeout(() => {
        if (currentWordIndex + 1 < level.words.length) {
          setCurrentWordIndex(currentWordIndex + 1);
          setRevealedLetters(new Set());
          // إعادة تعيين الحروف المستخدمة
          setSelectedLetters(prev => prev.map(l => ({ ...l, used: false }))); setAnswerOrder([]);
        } else {
          playSound("levelComplete");
          setShowSuccess(true);
          completeLevel(level.id, level.reward);
          addCoins(bonusWords.length * 20);
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          if (userId) {
            saveProgress({
              userId, levelId: level.id, isCompleted: true, stars: 1,
              score: level.reward + bonusWords.length * 20,
              hintsUsed, timeSpent,
              coinsEarned: level.reward + bonusWords.length * 20,
            }).catch((e) => console.error("Cloud sync error:", e));
          }
        }
      }, 800);
    } else if (isBonus) {
      setBonusWords([...bonusWords, word]);
      addCoins(20);
      playSound("bonusWord");
      toast({ title: "✨ كلمة إضافية!", description: `+20 عملة (${word})` });
      setSelectedLetters(prev => prev.map(l => ({ ...l, used: false }))); setAnswerOrder([]);
    } else {
      playSound("wrongWord");
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
      toast({ title: "❌ إجابة خاطئة", description: "حاول مرة أخرى", variant: "destructive" });
      setTimeout(() => {
        setSelectedLetters(prev => prev.map(l => ({ ...l, used: false }))); setAnswerOrder([]);
      }, 500);
    }
  };

  const handleRemoveLast = () => {
    if (answerOrder.length === 0) return;
    // إزالة آخر حرف من ترتيب النقر
    const lastIdx = answerOrder[answerOrder.length - 1];
    const newOrder = answerOrder.slice(0, -1);
    const newLetters = [...selectedLetters];
    newLetters[lastIdx] = { ...newLetters[lastIdx], used: false };
    setSelectedLetters(newLetters);
    setAnswerOrder(newOrder);
    playSound("removeLetter");
  };

  const handleClear = () => {
    setSelectedLetters(prev => prev.map(l => ({ ...l, used: false }))); setAnswerOrder([]);
    playSound("removeLetter");
  };

  const handleRevealLetter = () => {
    if (!level || !currentWord) return;
    if (coins < level.hintCost) {
      toast({ title: "عملات غير كافية", description: `تحتاج ${level.hintCost} عملة`, variant: "destructive" });
      return;
    }
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
      playSound("hint");
      toast({ title: "💡 كشف حرف", description: `الحرف ${emptyIdx + 1}: ${currentWordText[emptyIdx]}` });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-teal-900 to-cyan-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-teal-400 border-t-transparent"
        />
        <p className="text-teal-200 text-sm">جاري تحميل اللغز...</p>
      </div>
    );
  }

  if (!level || !currentWord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-teal-900 to-cyan-950">
        <Card className="p-8 text-center bg-white/10 border-white/20 backdrop-blur-md">
          <p className="text-white mb-4">المرحلة غير موجودة</p>
          <Button onClick={() => onExit?.() || router.push("/")} variant="outline">العودة</Button>
        </Card>
      </div>
    );
  }

  const puzzleType = level.puzzleType || "text";
  const progress = (foundWords.length / level.words.length) * 100;
  const difficultyLabels: Record<string, { label: string; color: string }> = {
    easy: { label: "سهل", color: "bg-green-500/20 text-green-300" },
    medium: { label: "متوسط", color: "bg-amber-500/20 text-amber-300" },
    hard: { label: "صعب", color: "bg-red-500/20 text-red-300" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-800 via-teal-900 to-cyan-950 flex flex-col pattern-pro">
      {/* شريط علوي محسّن */}
      <header className="bg-teal-950/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => { playSound("buttonClick"); if (onExit) onExit(); else router.push("/"); }}
            className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">رجوع</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">مرحلة {level.number}</span>
            {difficultyLabels[level.difficulty] && (
              <Badge className={cn("text-xs border-0", difficultyLabels[level.difficulty].color)}>
                {difficultyLabels[level.difficulty].label}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80">
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
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="text-sm font-bold text-white">{coins}</span>
            </div>
          </div>
        </div>
        {/* شريط التقدم */}
        <div className="h-1 bg-teal-950/50">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          />
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* مؤشر الأسئلة */}
        <div className="flex items-center gap-2 justify-center">
          {level.words.map((w, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all",
                foundWords.includes(w.text)
                  ? "w-8 bg-green-400"
                  : idx === currentWordIndex
                  ? "w-8 bg-yellow-400 animate-pulse"
                  : "w-2 bg-white/20"
              )}
            />
          ))}
        </div>

        {/* منطقة اللغز */}
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex-1 flex flex-col items-center justify-center gap-4", wrongShake && "animate-shake")}
          style={wrongShake ? { animation: "shake 0.5s" } : {}}
        >
          {/* 1. عرض الصورة إذا كان اللغز بصري */}
          {puzzleType === "image" && currentWord.imageUrl && (
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img src={currentWord.imageUrl} alt="لغز" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-teal-700 text-white text-6xl">🖼️</div>'; }}
              />
            </div>
          )}

          {/* 2. عرض 4 صور */}
          {puzzleType === "images4" && (
            <div className="grid grid-cols-2 gap-2 w-64 sm:w-72">
              {[currentWord.imageUrl, currentWord.image2Url, currentWord.image3Url, currentWord.image4Url].map((url, i) => (
                url ? (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-lg border border-white/10">
                    <img src={url} alt={`صورة ${i+1}`} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-teal-700 text-white text-3xl">🖼️</div>'; }}
                    />
                  </div>
                ) : (
                  <div key={i} className="aspect-square rounded-xl bg-teal-700/50 flex items-center justify-center text-white/30 text-3xl">🖼️</div>
                )
              ))}
            </div>
          )}

          {/* 3. عرض الإيموجي */}
          {puzzleType === "emoji" && currentWord.emojis && (
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl px-8 py-6 border-2 border-amber-400/30">
              <div className="flex items-center justify-center gap-2 text-5xl sm:text-6xl">
                {currentWord.emojis.split("").map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
              {currentWord.clue && (
                <p className="text-white/70 text-sm text-center mt-3">{currentWord.clue}</p>
              )}
            </div>
          )}

          {/* 4. عرض الحروف المبعثرة */}
          {puzzleType === "scrambled" && currentWord.sequence && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl px-6 py-4 border-2 border-purple-400/30 w-full max-w-md">
              <p className="text-white/70 text-sm text-center mb-3">{currentWord.clue}</p>
              <div className="flex items-center justify-center gap-2">
                {currentWord.sequence.split("").map((letter, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    className="w-12 h-12 rounded-xl bg-white/20 border-2 border-purple-400/50 flex items-center justify-center text-white text-xl font-bold"
                  >
                    {letter}
                  </motion.div>
                ))}
              </div>
              <p className="text-white/50 text-xs text-center mt-3">↑ رتب هذه الحروف لتكوين كلمة</p>
            </div>
          )}

          {/* 5. عرض الفراغات */}
          {puzzleType === "fillblank" && currentWord.fillBlanks && (
            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl px-6 py-4 shadow-xl max-w-md w-full">
              <p className="text-white text-lg sm:text-xl font-bold text-center leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
                {currentWord.fillBlanks.split("___").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="inline-block mx-1 px-3 py-0.5 rounded-lg bg-yellow-400/30 border-b-2 border-yellow-400 text-yellow-200">
                        {"?".repeat(currentWord.text.length)}
                      </span>
                    )}
                  </span>
                ))}
              </p>
              <p className="text-white/60 text-xs text-center mt-2">الإجابة: {currentWord.text.length} حروف</p>
            </div>
          )}

          {/* 6. عرض التوصيل والربط */}
          {puzzleType === "matching" && currentWord.matchPairs && currentWord.matchPairs.length > 0 && (
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl px-6 py-4 border-2 border-blue-400/30 w-full max-w-lg">
              <p className="text-white text-sm text-center mb-4">{currentWord.clue}</p>
              <div className="grid grid-cols-2 gap-3">
                {currentWord.matchPairs.flatMap((pair: string) => pair.split("|")).map((word, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-4 py-2.5 rounded-xl bg-white/15 border-2 border-white/20 text-white text-sm font-bold hover:bg-white/25 transition-colors cursor-pointer"
                  >
                    {word}
                  </motion.button>
                ))}
              </div>
              <p className="text-white/50 text-xs text-center mt-3">اضغط على الكلمات المتطابقة</p>
            </div>
          )}

          {/* 7. عرض الاختيار من متعدد */}
          {puzzleType === "multiple" && currentWord.options && currentWord.options.length > 0 && (
            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl px-6 py-4 shadow-xl max-w-md w-full">
              <p className="text-white text-lg font-bold text-center mb-4" style={{ fontFamily: "var(--font-tajawal)" }}>
                {currentWord.clue}
              </p>
              <div className="space-y-2">
                {currentWord.options.map((option: string, i: number) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                      if (i === currentWord.correctOption) {
                        playSound("correctWord");
                        const newFound = [...foundWords, currentWord.text];
                        setFoundWords(newFound);
                        toast({ title: "🎉 إجابة صحيحة!", description: currentWord.text });
                        setTimeout(() => {
                          if (currentWordIndex + 1 < level.words.length) {
                            setCurrentWordIndex(currentWordIndex + 1);
                            setRevealedLetters(new Set());
                            setSelectedLetters(prev => prev.map(l => ({ ...l, used: false })));
                            setAnswerOrder([]);
                          } else {
                            playSound("levelComplete");
                            setShowSuccess(true);
                            completeLevel(level.id, level.reward);
                          }
                        }, 800);
                      } else {
                        playSound("wrongWord");
                        setWrongShake(true);
                        setTimeout(() => setWrongShake(false), 500);
                        toast({ title: "❌ خطأ", description: "حاول مرة أخرى", variant: "destructive" });
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/15 border-2 border-white/20 text-white text-sm font-bold hover:bg-white/25 transition-colors text-right flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {["أ", "ب", "ج", "د"][i]}
                    </span>
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* 8. عرض اللغز المنطقي */}
          {puzzleType === "logic" && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl px-6 py-4 shadow-xl max-w-md w-full">
              {currentWord.sequence && (
                <div className="mb-3">
                  <p className="text-white/70 text-sm text-center mb-2">{currentWord.clue}</p>
                  <div className="flex items-center justify-center gap-2">
                    {currentWord.sequence.split(",").map((num, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="w-12 h-12 rounded-xl bg-white/20 border-2 border-indigo-400/50 flex items-center justify-center text-white text-lg font-bold"
                      >
                        {num}
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: currentWord.sequence.split(",").length * 0.15 }}
                      className="w-12 h-12 rounded-xl bg-yellow-400/30 border-2 border-yellow-400 border-dashed flex items-center justify-center text-yellow-200 text-lg"
                    >
                      ?
                    </motion.div>
                  </div>
                </div>
              )}
              {!currentWord.sequence && (
                <p className="text-white text-lg font-bold text-center" style={{ fontFamily: "var(--font-tajawal)" }}>
                  {currentWord.clue}
                </p>
              )}
            </div>
          )}

          {/* 9. عرض التلميحات المتدرجة */}
          {puzzleType === "progressive" && (
            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl px-6 py-4 border-2 border-amber-400/30 max-w-md w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-xs font-bold">
                  💡 تلميحات متدرجة
                </span>
              </div>
              <p className="text-white text-lg font-bold text-center leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
                {currentWord.clue}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-white/50 text-xs">عدد الحروف: {currentWord.text.length}</span>
                {revealedLetters.size > 0 && (
                  <span className="text-white/50 text-xs">• أول حرف: {currentWord.text[0]}</span>
                )}
              </div>
            </div>
          )}

          {/* 10. عرض المرحلة المختلطة (بوس) */}
          {puzzleType === "mixed" && (
            <div className="w-full max-w-md space-y-3">
              {/* شارة البوس */}
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold animate-pulse">
                  👑 تحدي البوس
                </span>
              </div>
              {/* محتوى مختلط حسب البيانات */}
              {currentWord.emojis && (
                <div className="flex items-center justify-center gap-2 text-4xl">
                  {currentWord.emojis.split("").map((emoji, i) => (
                    <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>
                      {emoji}
                    </motion.span>
                  ))}
                </div>
              )}
              {currentWord.sequence && (
                <div className="flex items-center justify-center gap-2">
                  {currentWord.sequence.split("").map((letter, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold">
                      {letter}
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-600 to-red-700 rounded-2xl px-6 py-4 shadow-xl">
                <p className="text-white text-lg font-bold text-center" style={{ fontFamily: "var(--font-tajawal)" }}>
                  {currentWord.clue}
                </p>
              </div>
            </div>
          )}

          {/* عرض النص للغز النصي العادي */}
          {puzzleType === "text" && (
            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl px-6 py-4 shadow-xl max-w-md w-full">
              {currentWord.category && (
                <div className="text-center mb-2">
                  <span className="px-3 py-1 rounded-lg bg-white/20 text-white text-sm font-bold">
                    {currentWord.category}
                  </span>
                </div>
              )}
              <p className="text-white text-lg sm:text-xl font-bold text-center leading-relaxed" style={{ fontFamily: "var(--font-tajawal)" }}>
                {currentWord.clue}
              </p>
            </div>
          )}

          {/* خانات الإجابة (للأنواع التي تستخدم الكتابة) */}
          {puzzleType !== "multiple" && puzzleType !== "matching" && (
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {answerLetters.map((letter, idx) => {
                const isRevealed = revealedLetters.has(idx);
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-md transition-all border-2",
                      isRevealed
                        ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white border-blue-300"
                        : letter !== null
                        ? "bg-white text-stone-800 border-stone-300"
                        : "bg-teal-950/60 border-teal-700/50"
                    )}
                  >
                    {letter && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {letter}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* الكلمات الإضافية */}
        {bonusWords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {bonusWords.map((word, idx) => (
              <motion.span
                key={word}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 text-sm font-medium border border-purple-400/30"
              >
                ✨ {word} +20
              </motion.span>
            ))}
          </div>
        )}
      </main>

      {/* لوحة المفاتيح العربية - تظهر فقط للأنواع التي تحتاج كتابة */}
      {(puzzleType === "text" || puzzleType === "image" || puzzleType === "images4" || puzzleType === "emoji" || puzzleType === "scrambled" || puzzleType === "fillblank" || puzzleType === "logic" || puzzleType === "progressive" || puzzleType === "mixed") && (
      <div className="bg-teal-950/60 backdrop-blur-md border-t border-white/10 p-3">
        {/* أزرار المساعدة */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={handleRevealLetter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            💡 تلميح
            <span className="text-yellow-400">{level.hintCost}🪙</span>
          </button>
          <button
            onClick={handleRemoveLast}
            disabled={answerOrder.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-30"
          >
            ⌫ حذف
          </button>
          <button
            onClick={handleClear}
            disabled={answerOrder.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors disabled:opacity-30"
          >
            🗑️ مسح
          </button>
        </div>

        {/* لوحة المفاتيح */}
        <div className="flex flex-col gap-1.5 max-w-2xl mx-auto">
          {ARABIC_KEYBOARD.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {row.map((letter, idx) => {
                // البحث عن الحرف في الحروف المتاحة
                const availableLetter = selectedLetters.find(l => l.letter === letter && !l.used);
                const isAvailable = !!availableLetter;
                const isUsed = selectedLetters.some(l => l.letter === letter && l.used) && !isAvailable;

                return (
                  <motion.button
                    key={`${letter}-${idx}`}
                    whileTap={{ scale: 0.9 }}
                    whileHover={isAvailable ? { scale: 1.1, y: -2 } : {}}
                    onClick={() => handleLetterClick(letter)}
                    disabled={!isAvailable}
                    className={cn(
                      "w-8 h-9 sm:w-9 sm:h-10 rounded-lg font-bold text-sm sm:text-base transition-all",
                      isAvailable
                        ? "bg-gradient-to-br from-white to-stone-100 text-stone-800 shadow-md hover:shadow-lg border border-white/50 cursor-pointer"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      )}

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

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

function SuccessModal({ level, foundWords, bonusWords, timeSpent, hintsUsed, onClose }: {
  level: Level; foundWords: number; bonusWords: number; timeSpent: number; hintsUsed: number; onClose: () => void;
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.3, y: 80, rotateX: 45 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.3, y: 80, rotateX: 45 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="bg-gradient-to-br from-teal-700 via-cyan-800 to-teal-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-teal-300/30 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* خلفية متوهجة */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-400/10"
        />

        {/* رموز متطايرة أكثر */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 0],
              x: (Math.random() - 0.5) * 500,
              y: (Math.random() - 0.5) * 500,
              opacity: [0, 1, 0],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 2.5, delay: i * 0.08, repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute top-1/2 left-1/2 text-2xl pointer-events-none"
          >
            {["⭐", "🎉", "✨", "💫", "🌟", "🎊", "🏆", "💎"][i % 8]}
          </motion.div>
        ))}

        <div className="relative text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((starNum) => (
              <motion.div
                key={starNum}
                initial={{ scale: 0, rotate: -180, y: -50 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ delay: 0.3 + starNum * 0.15, type: "spring", stiffness: 200 }}
              >
                <svg width={starNum <= stars ? "44" : "36"} height={starNum <= stars ? "44" : "36"} viewBox="0 0 24 24"
                  fill={starNum <= stars ? "#FFD700" : "rgba(255,255,255,0.1)"} className={starNum <= stars ? "drop-shadow-lg" : ""}>
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                </svg>
              </motion.div>
            ))}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-tajawal)" }}
          >
            {stars === 3 ? "🏆 رائع!" : stars === 2 ? "🎉 أحسنت!" : "✅ أكملت!"}
          </motion.h2>

          <p className="text-teal-200 mb-6">مرحلة {level.number} مكتملة</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "⏱️ الوقت", value: timeStr, color: "bg-amber-500/20 text-amber-300" },
              { label: "✨ إضافية", value: bonusWords, color: "bg-purple-500/20 text-purple-300" },
              { label: "💡 تلميحات", value: hintsUsed, color: "bg-blue-500/20 text-blue-300" },
              { label: "🪙 مكافأة", value: `+${totalReward}`, color: "bg-green-500/20 text-green-300" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className={cn("p-3 rounded-xl border border-white/10", stat.color)}
              >
                <div className="text-xs opacity-80 mb-1">{stat.label}</div>
                <div className="text-lg font-bold">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-stone-900 font-bold py-3 rounded-xl shadow-lg"
          >
            متابعة 🚀
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
