"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Level, Word } from "@/lib/game-data";
import { motion, AnimatePresence } from "framer-motion";

interface CrosswordGridProps {
  level: Level;
  foundWords: string[];
  onCellClick?: (row: number, col: number) => void;
  highlightedCells?: { row: number; col: number }[];
}

interface CellData {
  letter: string;
  number?: number;
  isBlocked: boolean;
  wordIds: string[];
}

export function CrosswordGrid({
  level,
  foundWords,
  onCellClick,
  highlightedCells = [],
}: CrosswordGridProps) {
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const grid = useMemo(() => {
    const grid: CellData[][] = [];
    for (let r = 0; r < level.gridSize.rows; r++) {
      const row: CellData[] = [];
      for (let col = 0; col < level.gridSize.cols; col++) {
        const cell = level.cells.find((c) => c.row === r && c.col === col);
        const letter = cell?.letter || "";
        const isBlocked = letter === "" || letter === " ";
        const wordsThroughCell = level.words.filter((word) => {
          if (word.direction === "across") {
            return word.startRow === r && col >= word.startCol && col < word.startCol + word.text.length;
          } else {
            return word.startCol === col && r >= word.startRow && r < word.startRow + word.text.length;
          }
        });
        row.push({
          letter,
          number: cell?.number,
          isBlocked,
          wordIds: wordsThroughCell.map((w) => w.id),
        });
      }
      grid.push(row);
    }
    return grid;
  }, [level]);

  const isCellFound = useCallback(
    (row: number, col: number): boolean => {
      for (const word of level.words) {
        if (!foundWords.includes(word.text)) continue;
        if (word.direction === "across") {
          if (word.startRow === row && col >= word.startCol && col < word.startCol + word.text.length) {
            return true;
          }
        } else {
          if (word.startCol === col && row >= word.startRow && row < word.startRow + word.text.length) {
            return true;
          }
        }
      }
      return false;
    },
    [level.words, foundWords]
  );

  const isCellHighlighted = (row: number, col: number): boolean => {
    return highlightedCells.some((c) => c.row === row && c.col === col);
  };

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.isBlocked) return;

    const wordsInCell = level.words.filter((word) => {
      if (word.direction === "across") {
        return word.startRow === row && col >= word.startCol && col < word.startCol + word.text.length;
      } else {
        return word.startCol === col && row >= word.startRow && row < word.startRow + word.text.length;
      }
    });

    if (wordsInCell.length > 0) {
      const currentIdx = wordsInCell.findIndex((w) => w.id === selectedWord?.id);
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % wordsInCell.length;
      setSelectedWord(wordsInCell[nextIdx]);
    }

    onCellClick?.(row, col);
  };

  return (
    <div className="inline-block rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 sm:p-4 shadow-gold border border-amber-200/40">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${level.gridSize.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${level.gridSize.rows}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const found = isCellFound(rowIdx, colIdx);
            const highlighted = isCellHighlighted(rowIdx, colIdx);
            const isPartOfSelected = selectedWord
              ? cell.wordIds.includes(selectedWord.id)
              : false;

            return (
              <motion.button
                key={`${rowIdx}-${colIdx}`}
                whileTap={{ scale: cell.isBlocked ? 1 : 0.9 }}
                whileHover={{ scale: cell.isBlocked ? 1 : 1.05 }}
                onClick={() => handleCellClick(rowIdx, colIdx)}
                disabled={cell.isBlocked}
                className={cn(
                  "relative flex items-center justify-center rounded-md transition-all duration-200 select-none",
                  "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12",
                  cell.isBlocked
                    ? "bg-transparent cursor-default"
                    : found
                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md border-2 border-amber-500/50"
                    : isPartOfSelected
                    ? "bg-amber-200 border-2 border-amber-400 text-stone-800"
                    : highlighted
                    ? "bg-amber-100 border-2 border-amber-300 text-stone-800"
                    : "bg-white border border-stone-300 text-stone-700 hover:bg-amber-50"
                )}
                aria-label={`خلية ${rowIdx + 1},${colIdx + 1}${cell.letter ? ` - الحرف ${cell.letter}` : ""}`}
              >
                {cell.number && (
                  <span className="absolute top-0 right-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold text-stone-500 leading-none">
                    {cell.number}
                  </span>
                )}
                <AnimatePresence mode="popLayout">
                  {found && cell.letter && (
                    <motion.span
                      key={cell.letter}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-base sm:text-lg md:text-xl font-bold"
                    >
                      {cell.letter}
                    </motion.span>
                  )}
                  {!found && cell.letter && cell.isBlocked === false && (
                    <span className="text-base sm:text-lg md:text-xl font-bold opacity-30">
                      ◌
                    </span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
