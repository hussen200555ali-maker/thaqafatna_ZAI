"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

interface LetterCircleProps {
  letters: string[];
  onWordSubmit: (word: string) => void;
  shuffled?: boolean;
}

export function LetterCircle({ letters, onWordSubmit, shuffled = false }: LetterCircleProps) {
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [lettersState, setLettersState] = useState(letters);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    setLettersState(letters);
  }, [letters]);

  const handleLetterClick = (index: number) => {
    if (selectedLetters.includes(index)) return;
    const newSelected = [...selectedLetters, index];
    setSelectedLetters(newSelected);
    setCurrentWord(newSelected.map((i) => lettersState[i]).join(""));
  };

  const handleRemoveLast = () => {
    if (selectedLetters.length === 0) return;
    const newSelected = selectedLetters.slice(0, -1);
    setSelectedLetters(newSelected);
    setCurrentWord(newSelected.map((i) => lettersState[i]).join(""));
  };

  const handleClear = () => {
    setSelectedLetters([]);
    setCurrentWord("");
  };

  const handleSubmit = () => {
    if (currentWord.length < 2) return;
    onWordSubmit(currentWord);
    handleClear();
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
    setTimeout(() => setIsShuffling(false), 500);
  };

  // ترتيب الحروف في دائرة
  const radius = 100; // نصف القطر
  const centerX = 130;
  const centerY = 130;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* عرض الكلمة الحالية */}
      <div className="min-h-[3rem] flex items-center justify-center w-full max-w-xs">
        <AnimatePresence mode="popLayout">
          {currentWord ? (
            <motion.div
              key={currentWord}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-1"
              dir="rtl"
            >
              {currentWord.split("").map((letter, idx) => (
                <motion.span
                  key={`${letter}-${idx}`}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 text-amber-50 font-bold text-lg shadow-lg border border-amber-500/30"
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
              className="text-stone-400 text-sm"
            >
              اختر الحروف لتكوين كلمة
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* دائرة الحروف */}
      <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]">
        {/* الدائرة الخارجية الزخرفية */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/50 animate-spin-slow" style={{ animation: "spin 30s linear infinite" }} />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-50/80 to-amber-100/40 backdrop-blur-sm border border-amber-200/60" />

        {/* الحروف */}
        {lettersState.map((letter, index) => {
          const angle = (index / lettersState.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle) - 22;
          const y = centerY + radius * Math.sin(angle) - 22;
          const isSelected = selectedLetters.includes(index);
          const orderIndex = selectedLetters.indexOf(index);

          return (
            <motion.button
              key={`${letter}-${index}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                x: x - 108,
                y: y - 108,
                opacity: isSelected ? 0.3 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: index * 0.05,
              }}
              whileHover={{ scale: isSelected ? 1 : 1.15, zIndex: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleLetterClick(index)}
              disabled={isSelected}
              className={cn(
                "absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg select-none transition-colors",
                isSelected
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 border-2 border-amber-300/50"
              )}
              style={{ top: "50%", left: "50%" }}
            >
              {letter}
              {orderIndex >= 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-stone-700 text-amber-50 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {orderIndex + 1}
                </span>
              )}
            </motion.button>
          );
        })}

        {/* زر المسح في المنتصف */}
        <AnimatePresence>
          {selectedLetters.length > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleRemoveLast}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center shadow-md border border-stone-300"
              aria-label="حذف آخر حرف"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleShuffle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200"
          aria-label="خلط الحروف"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          <span className="text-sm font-medium">خلط</span>
        </button>

        {currentWord.length >= 2 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30 transition-all"
          >
            <span className="text-sm font-bold">تأكيد</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.button>
        )}

        {currentWord.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors text-sm"
          >
            مسح الكل
          </button>
        )}
      </div>
    </div>
  );
}
