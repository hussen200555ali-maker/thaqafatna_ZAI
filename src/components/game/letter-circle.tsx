"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sound-effects";

interface LetterCircleProps {
  letters: string[];
  onWordSubmit: (word: string) => void;
  foundWords?: string[];
  bonusWords?: string[];
}

export function LetterCircle({ letters, onWordSubmit, foundWords = [], bonusWords = [] }: LetterCircleProps) {
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [lettersState, setLettersState] = useState(letters);
  const [isShuffling, setIsShuffling] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);
  const lastSubmitRef = useRef<string>("");

  useEffect(() => {
    setLettersState(letters);
  }, [letters]);

  const handleLetterClick = (index: number) => {
    if (selectedLetters.includes(index)) return;
    const newSelected = [...selectedLetters, index];
    setSelectedLetters(newSelected);
    setCurrentWord(newSelected.map((i) => lettersState[i]).join(""));
    playSound("selectLetter");
  };

  const handleRemoveLast = () => {
    if (selectedLetters.length === 0) return;
    const newSelected = selectedLetters.slice(0, -1);
    setSelectedLetters(newSelected);
    setCurrentWord(newSelected.map((i) => lettersState[i]).join(""));
    playSound("removeLetter");
  };

  const handleClear = () => {
    setSelectedLetters([]);
    setCurrentWord("");
    playSound("removeLetter");
  };

  const handleSubmit = () => {
    if (currentWord.length < 2 || currentWord === lastSubmitRef.current) return;
    lastSubmitRef.current = currentWord;

    // فحص إذا كانت الكلمة صحيحة
    const isCorrect = foundWords.includes(currentWord) || lettersState.join("").includes(currentWord);
    const isBonus = bonusWords.includes(currentWord);

    if (isCorrect) {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 600);
    } else if (isBonus) {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 600);
    }

    onWordSubmit(currentWord);
    setTimeout(() => {
      handleClear();
      lastSubmitRef.current = "";
    }, 300);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    const shuffled = [...lettersState];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setLettersState(shuffled);
    handleClear();
    playSound("shuffle");
    setTimeout(() => setIsShuffling(false), 500);
  };

  const radius = 110;
  const centerX = 140;
  const centerY = 140;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 w-full transition-all duration-300",
        wrongFlash && "scale-95",
        correctFlash && "scale-105"
      )}
    >
      {/* عرض الكلمة الحالية */}
      <div className="min-h-[3.5rem] flex items-center justify-center w-full max-w-xs">
        <AnimatePresence mode="popLayout">
          {currentWord ? (
            <motion.div
              key={currentWord}
              initial={{ scale: 0.5, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-2xl transition-colors",
                correctFlash
                  ? "bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/40"
                  : wrongFlash
                  ? "bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-500/40"
                  : "bg-gradient-to-br from-stone-700 to-stone-900 shadow-lg shadow-stone-900/30"
              )}
              dir="rtl"
            >
              {currentWord.split("").map((letter, idx) => (
                <motion.span
                  key={`${letter}-${idx}`}
                  initial={{ y: -20, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 400 }}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-lg",
                    correctFlash
                      ? "bg-white/20 text-white"
                      : wrongFlash
                      ? "bg-white/20 text-white"
                      : "text-amber-50 bg-amber-500/20 border border-amber-400/30"
                  )}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-stone-400 text-sm flex items-center gap-2"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👆
              </motion.span>
              اختر الحروف لتكوين كلمة
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* دائرة الحروف */}
      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
        {/* الدائرة الخارجية الزخرفية */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-3 rounded-full border border-amber-200/30" />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-amber-50/80 to-amber-100/40 backdrop-blur-sm border border-amber-200/60" />

        {/* الحروف */}
        {lettersState.map((letter, index) => {
          const angle = (index / lettersState.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle) - 24;
          const y = centerY + radius * Math.sin(angle) - 24;
          const isSelected = selectedLetters.includes(index);
          const orderIndex = selectedLetters.indexOf(index);
          const isLastSelected = orderIndex === selectedLetters.length - 1;

          return (
            <motion.button
              key={`${letter}-${index}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                x: x - 116,
                y: y - 116,
                opacity: isSelected ? 0.25 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: index * 0.05,
              }}
              whileHover={isSelected ? {} : { scale: 1.15, zIndex: 10 }}
              whileTap={isSelected ? {} : { scale: 0.9 }}
              onClick={() => handleLetterClick(index)}
              disabled={isSelected}
              className={cn(
                "absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-lg select-none transition-colors",
                isSelected
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : isLastSelected
                  ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white border-2 border-amber-300 shadow-amber-500/50"
                  : "bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 border-2 border-amber-300/50 shadow-amber-500/30"
              )}
              style={{ top: "50%", left: "50%" }}
            >
              {letter}
              {orderIndex >= 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-stone-800 text-amber-50 text-xs font-bold rounded-full flex items-center justify-center border-2 border-amber-400"
                >
                  {orderIndex + 1}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* زر المسح في المنتصف */}
        <AnimatePresence>
          {selectedLetters.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
            >
              <button
                onClick={handleRemoveLast}
                className="w-12 h-12 rounded-full bg-white hover:bg-stone-50 flex items-center justify-center shadow-md border-2 border-amber-300 transition-colors"
                aria-label="حذف آخر حرف"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
              {selectedLetters.length > 1 && (
                <button
                  onClick={handleClear}
                  className="text-[10px] text-stone-500 hover:text-stone-700 font-medium"
                >
                  مسح الكل
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 transition-colors border border-stone-200 shadow-sm"
          aria-label="خلط الحروف"
        >
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isShuffling ? { rotate: 180 } : { rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </motion.svg>
          <span className="text-sm font-medium">خلط</span>
        </motion.button>

        <AnimatePresence>
          {currentWord.length >= 2 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30 transition-all font-bold"
            >
              <span className="text-sm">تأكيد</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
