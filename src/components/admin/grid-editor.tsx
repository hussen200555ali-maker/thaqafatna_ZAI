"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GridEditorProps {
  rows: number;
  cols: number;
  cells: Cell[];
  words: Word[];
  onChange: (cells: Cell[], words: Word[]) => void;
}

interface Cell {
  row: number;
  col: number;
  letter: string;
  number?: number | null;
}

interface Word {
  text: string;
  clue: string;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
}

type Tool = "select" | "word";

export function GridEditor({ rows, cols, cells, words, onChange }: GridEditorProps) {
  const [tool, setTool] = useState<Tool>("word");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [inputWord, setInputWord] = useState("");
  const [inputClue, setInputClue] = useState("");
  const [inputDirection, setInputDirection] = useState<"across" | "down">("across");

  // بناء شبكة من الخلايا للوصول السريع
  const grid = useCallback(() => {
    const g: (Cell | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: (Cell | null)[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = cells.find((cell) => cell.row === r && cell.col === c);
        row.push(cell || null);
      }
      g.push(row);
    }
    return g;
  }, [rows, cols, cells]);

  const getCell = (row: number, col: number): Cell | null => {
    return cells.find((c) => c.row === row && c.col === col) || null;
  };

  // تحديث خلية
  const updateCell = (row: number, col: number, letter: string) => {
    const existing = cells.find((c) => c.row === row && c.col === col);
    let newCells: Cell[];
    if (existing) {
      newCells = cells.map((c) =>
        c.row === row && c.col === col ? { ...c, letter } : c
      );
    } else {
      newCells = [...cells, { row, col, letter }];
    }
    // إعادة بناء الكلمات
    const newWords = rebuildWords(newCells, words);
    onChange(newCells, newWords);
  };

  // مسح خلية
  const clearCell = (row: number, col: number) => {
    const newCells = cells.filter((c) => !(c.row === row && c.col === col));
    const newWords = rebuildWords(newCells, words);
    onChange(newCells, newWords);
  };

  // إعادة بناء الكلمات بعد تغيير الشبكة
  const rebuildWords = (newCells: Cell[], oldWords: Word[]): Word[] => {
    // نحتفظ بالكلمات القديمة إذا كانت لا تزال صالحة
    return oldWords.filter((word) => {
      for (let i = 0; i < word.text.length; i++) {
        const r = word.direction === "across" ? word.startRow : word.startRow + i;
        const c = word.direction === "across" ? word.startCol + i : word.startCol;
        const cell = newCells.find((cell) => cell.row === r && cell.col === c);
        if (!cell || cell.letter !== word.text[i]) {
          return false;
        }
      }
      return true;
    });
  };

  // إضافة كلمة جديدة
  const addWord = () => {
    if (!inputWord.trim() || !selectedCell) return;

    const text = inputWord.trim();
    const startRow = selectedCell.row;
    const startCol = selectedCell.col;

    // فحص أن الكلمة تناسب الشبكة
    const endRow = inputDirection === "down" ? startRow + text.length - 1 : startRow;
    const endCol = inputDirection === "across" ? startCol + text.length - 1 : startCol;

    if (endRow >= rows || endCol >= cols) {
      alert("الكلمة طويلة جداً ولا تناسب الشبكة");
      return;
    }

    // إنشاء/تحديث الخلايا
    const newCells = [...cells];
    for (let i = 0; i < text.length; i++) {
      const r = inputDirection === "across" ? startRow : startRow + i;
      const c = inputDirection === "across" ? startCol + i : startCol;
      const existing = newCells.find((cell) => cell.row === r && cell.col === c);
      if (existing) {
        existing.letter = text[i];
      } else {
        newCells.push({ row: r, col: c, letter: text[i] });
      }
    }

    // إضافة الكلمة
    const maxNumber = Math.max(0, ...words.map((w) => w.number));
    const newWord: Word = {
      text,
      clue: inputClue || "تلميح",
      direction: inputDirection,
      startRow,
      startCol,
      number: maxNumber + 1,
    };

    const newWords = [...words, newWord];
    onChange(newCells, newWords);

    // إعادة تعيين المدخلات
    setInputWord("");
    setInputClue("");
    setSelectedCell(null);
  };

  // حذف كلمة
  const removeWord = (idx: number) => {
    const word = words[idx];
    const newWords = words.filter((_, i) => i !== idx);
    // إعادة ترقيم الكلمات
    const renumbered = newWords.map((w, i) => ({ ...w, number: i + 1 }));
    onChange(cells, renumbered);
  };

  // معالج النقر على خلية
  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  // معالج سحب الكلمة
  const handleCellMouseDown = (row: number, col: number) => {
    if (tool === "select") {
      setSelectedCell({ row, col });
      return;
    }
    setIsDragging(true);
    setDragStart({ row, col });
    setDragEnd({ row, col });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isDragging) return;
    setDragEnd({ row, col });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    // تحديد اتجاه السحب
    const isHorizontal = dragStart.row === dragEnd.row;
    const isVertical = dragStart.col === dragEnd.col;

    if (!isHorizontal && !isVertical) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    setSelectedCell(dragStart);
    setInputDirection(isHorizontal ? "across" : "down");
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isCellInDrag = (row: number, col: number): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (dragStart.row === dragEnd.row) {
      return row === dragStart.row && col >= Math.min(dragStart.col, dragEnd.col) && col <= Math.max(dragStart.col, dragEnd.col);
    }
    if (dragStart.col === dragEnd.col) {
      return col === dragStart.col && row >= Math.min(dragStart.row, dragEnd.row) && row <= Math.max(dragStart.row, dragEnd.row);
    }
    return false;
  };

  const isCellSelected = (row: number, col: number): boolean => {
    return selectedCell?.row === row && selectedCell?.col === col;
  };

  const isCellInWord = (row: number, col: number): { color: string } | null => {
    for (const word of words) {
      for (let i = 0; i < word.text.length; i++) {
        const r = word.direction === "across" ? word.startRow : word.startRow + i;
        const c = word.direction === "across" ? word.startCol + i : word.startCol;
        if (r === row && c === col) {
          return { color: word.direction === "across" ? "bg-amber-200" : "bg-purple-200" };
        }
      }
    }
    return null;
  };

  const g = grid();

  return (
    <div className="space-y-3" onMouseUp={handleMouseUp}>
      {/* شريط الأدوات */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setTool("word")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
            tool === "word"
              ? "bg-amber-100 border-amber-400 text-amber-800"
              : "bg-white border-stone-200 text-stone-600"
          )}
        >
          ✏️ رسم كلمة
        </button>
        <button
          onClick={() => setTool("select")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
            tool === "select"
              ? "bg-amber-100 border-amber-400 text-amber-800"
              : "bg-white border-stone-200 text-stone-600"
          )}
        >
          👆 تحديد
        </button>
        {selectedCell && (
          <span className="text-xs text-stone-500">
            المحدد: ({selectedCell.row + 1}, {selectedCell.col + 1})
          </span>
        )}
      </div>

      {/* الشبكة */}
      <div className="inline-block rounded-2xl bg-gradient-to-br from-stone-50 to-amber-50 p-3 border border-stone-200">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {g.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const inWord = isCellInWord(rowIdx, colIdx);
              const inDrag = isCellInDrag(rowIdx, colIdx);
              const isSelected = isCellSelected(rowIdx, colIdx);
              const existingCell = cell;
              const startOfWord = words.find((w) => w.startRow === rowIdx && w.startCol === colIdx);

              return (
                <motion.button
                  key={`${rowIdx}-${colIdx}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                  className={cn(
                    "relative w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center font-bold text-lg select-none border-2 transition-all",
                    inDrag
                      ? "bg-amber-300 border-amber-500"
                      : isSelected
                      ? "bg-blue-200 border-blue-400"
                      : inWord
                      ? cn(inWord?.color, "border-amber-400")
                      : existingCell
                      ? "bg-white border-stone-300 text-stone-800"
                      : "bg-stone-100 border-stone-200 text-stone-300 hover:bg-stone-200"
                  )}
                >
                  {startOfWord && (
                    <span className="absolute top-0 right-0.5 text-[8px] font-bold text-stone-500 leading-none">
                      {startOfWord.number}
                    </span>
                  )}
                  {existingCell?.letter}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* نموذج إضافة كلمة */}
      {selectedCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white border-2 border-amber-300 shadow-md"
        >
          <h4 className="font-bold text-stone-800 mb-3">
            إضافة كلمة في الخلية ({selectedCell.row + 1}, {selectedCell.col + 1})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm font-medium text-stone-600">الكلمة</label>
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWord()}
                placeholder="اكتب الكلمة..."
                className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-600">الاتجاه</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setInputDirection("across")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                    inputDirection === "across"
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "bg-white border-stone-200 text-stone-600"
                  )}
                >
                  ← أفقي
                </button>
                <button
                  onClick={() => setInputDirection("down")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                    inputDirection === "down"
                      ? "bg-purple-100 border-purple-400 text-purple-800"
                      : "bg-white border-stone-200 text-stone-600"
                  )}
                >
                  ↓ عمودي
                </button>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-stone-600">التلميح</label>
            <input
              type="text"
              value={inputClue}
              onChange={(e) => setInputClue(e.target.value)}
              placeholder="اكتب تلميحاً..."
              className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addWord}
              disabled={!inputWord.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              إضافة الكلمة
            </Button>
            <Button
              variant="outline"
              onClick={() => clearCell(selectedCell.row, selectedCell.col)}
              className="text-red-600 hover:bg-red-50"
            >
              مسح الخلية
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedCell(null)}
            >
              إلغاء
            </Button>
          </div>
        </motion.div>
      )}

      {/* قائمة الكلمات المضافة */}
      {words.length > 0 && (
        <div>
          <h4 className="font-bold text-stone-700 mb-2">الكلمات المضافة ({words.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {words.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                    {word.number}
                  </span>
                  <span className="font-bold text-stone-800">{word.text}</span>
                  <span className="text-xs text-stone-500">
                    {word.direction === "across" ? "أفقي" : "عمودي"}
                  </span>
                  <span className="text-xs text-stone-500">— {word.clue}</span>
                </div>
                <button
                  onClick={() => removeWord(idx)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
