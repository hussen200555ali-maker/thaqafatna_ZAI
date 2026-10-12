"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// ألوان مسار الكلمات (تدور بين الألوان)
const WORD_COLORS = [
  { line: "#4ECDC4", fill: "rgba(78, 205, 196, 0.25)", border: "#4ECDC4" }, // فيروزي
  { line: "#FF6B6B", fill: "rgba(255, 107, 107, 0.25)", border: "#FF6B6B" }, // أحمر مرجاني
  { line: "#9B59B6", fill: "rgba(155, 89, 182, 0.25)", border: "#9B59B6" }, // بنفسجي
  { line: "#3498DB", fill: "rgba(52, 152, 219, 0.25)", border: "#3498DB" }, // أزرق
  { line: "#E67E22", fill: "rgba(230, 126, 34, 0.25)", border: "#E67E22" }, // برتقالي
  { line: "#27AE60", fill: "rgba(39, 174, 96, 0.25)", border: "#27AE60" }, // أخضر
];

const DRAG_COLOR = { line: "#D4A017", fill: "rgba(212, 160, 23, 0.3)", border: "#D4A017" };

export function GridEditor({ rows, cols, cells, words, onChange }: GridEditorProps) {
  const [tool, setTool] = useState<Tool>("word");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  // pendingDrag: المسار الذي تم رسمه ويبقى مرئياً بعد إفلات الضغط حتى يكتب المستخدم الكلمة
  const [pendingDrag, setPendingDrag] = useState<{
    start: { row: number; col: number };
    end: { row: number; col: number };
    direction: "across" | "down";
    length: number;
  } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [inputWord, setInputWord] = useState("");
  const [inputClue, setInputClue] = useState("");
  const [inputDirection, setInputDirection] = useState<"across" | "down">("across");
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(48); // حجم الخلية بالبكسل
  // قوة إعادة الرسم بعد التركيب وأي تغيير في البيانات
  // هذا يضمن أن getCellCenter يقرأ إحداثيات DOM صحيحة
  const [, forceRender] = useState(0);
  const triggerRender = () => forceRender(v => v + 1);

  // قياس حجم الخلية الفعلي بعد التركيب
  useEffect(() => {
    if (gridRef.current) {
      const firstCell = gridRef.current.querySelector("[data-cell]") as HTMLElement;
      if (firstCell) {
        const rect = firstCell.getBoundingClientRect();
        if (rect.width > 0 && rect.width !== cellSize) {
          setCellSize(rect.width);
        }
      }
      // قوة إعادة الرسم مرة واحدة بعد القياس للتأكد من أن SVG يستخدم إحداثيات DOM الصحيحة
      triggerRender();
    }
  }, [rows, cols, cells.length, words.length]);

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

    setInputWord("");
    setInputClue("");
    setSelectedCell(null);
    setPendingDrag(null);
  };

  // حذف كلمة
  const removeWord = (idx: number) => {
    const newWords = words.filter((_, i) => i !== idx);
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
      setPendingDrag(null);
      return;
    }
    // مسح المسار المعلّق عند بدء سحب جديد
    setPendingDrag(null);
    setIsDragging(true);
    setDragStart({ row, col });
    setDragEnd({ row, col });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isDragging) return;
    // قصر السحب على الاتجاه الأفقي أو العمودي فقط من نقطة البداية
    if (!dragStart) return;
    if (dragStart.row === row) {
      // أفقي
      setDragEnd({ row, col });
    } else if (dragStart.col === col) {
      // عمودي
      setDragEnd({ row, col });
    } else {
      // إذا تحرك المستخدم بشكل غير أفقي/عمودي، ابقِ النهاية في نفس الصف/العمود
      // نختار الاتجاه الأقرب للسحب
      const rowDiff = Math.abs(row - dragStart.row);
      const colDiff = Math.abs(col - dragStart.col);
      if (colDiff > rowDiff) {
        setDragEnd({ row: dragStart.row, col });
      } else {
        setDragEnd({ row, col: dragStart.col });
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const isHorizontal = dragStart.row === dragEnd.row;
    const isVertical = dragStart.col === dragEnd.col;

    if (!isHorizontal && !isVertical) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    // حساب طول المسار
    const length = isHorizontal
      ? Math.abs(dragEnd.col - dragStart.col) + 1
      : Math.abs(dragEnd.row - dragStart.row) + 1;

    // إذا كان السحب على خلية واحدة فقط (length === 1)، اعتبره نقرة عادية
    if (length < 2) {
      setSelectedCell(dragStart);
      setInputDirection(isHorizontal ? "across" : "down");
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setPendingDrag(null);
      return;
    }

    // إبقاء المسار مرئياً بعد إفلات الضغط عبر pendingDrag
    setPendingDrag({
      start: dragStart,
      end: dragEnd,
      direction: isHorizontal ? "across" : "down",
      length,
    });

    setSelectedCell(dragStart);
    setInputDirection(isHorizontal ? "across" : "down");

    // إيقاف حالة السحب النشط لكن الإبقاء على pendingDrag
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // فحص إذا كانت خلية في مسار السحب (نشط أو معلّق)
  const isCellInDrag = (row: number, col: number): boolean => {
    // السحب النشط
    if (isDragging && dragStart && dragEnd) {
      if (dragStart.row === dragEnd.row) {
        return row === dragStart.row && col >= Math.min(dragStart.col, dragEnd.col) && col <= Math.max(dragStart.col, dragEnd.col);
      }
      if (dragStart.col === dragEnd.col) {
        return col === dragStart.col && row >= Math.min(dragStart.row, dragEnd.row) && row <= Math.max(dragStart.row, dragEnd.row);
      }
    }
    // المسار المعلّق بعد إفلات الضغط
    if (pendingDrag) {
      const { start, end } = pendingDrag;
      if (start.row === end.row) {
        return row === start.row && col >= Math.min(start.col, end.col) && col <= Math.max(start.col, end.col);
      }
      if (start.col === end.col) {
        return col === start.col && row >= Math.min(start.row, end.row) && row <= Math.max(start.row, end.row);
      }
    }
    return false;
  };

  // هل الخلية هي بداية السحب (النشط أو المعلّق)؟
  const isDragStart = (row: number, col: number): boolean => {
    if (isDragging && dragStart) {
      return dragStart.row === row && dragStart.col === col;
    }
    if (pendingDrag) {
      return pendingDrag.start.row === row && pendingDrag.start.col === col;
    }
    return false;
  };

  // هل الخلية هي نهاية السحب (النشط أو المعلّق)؟
  const isDragEnd = (row: number, col: number): boolean => {
    if (isDragging && dragEnd) {
      return dragEnd.row === row && dragEnd.col === col;
    }
    if (pendingDrag) {
      return pendingDrag.end.row === row && pendingDrag.end.col === col;
    }
    return false;
  };

  const isCellSelected = (row: number, col: number): boolean => {
    return selectedCell?.row === row && selectedCell?.col === col;
  };

  // الحصول على لون كلمة حسب رقمها
  const getWordColor = (wordIdx: number) => WORD_COLORS[wordIdx % WORD_COLORS.length];

  // فحص إذا كانت خلية في كلمة محددة
  const getCellWordInfo = (row: number, col: number): { wordIdx: number; isStart: boolean; isEnd: boolean } | null => {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.text.length; j++) {
        const r = word.direction === "across" ? word.startRow : word.startRow + j;
        const c = word.direction === "across" ? word.startCol + j : word.startCol;
        if (r === row && c === col) {
          return {
            wordIdx: i,
            isStart: j === 0,
            isEnd: j === word.text.length - 1,
          };
        }
      }
    }
    return null;
  };

  // حساب إحداثيات مركز الخلية في SVG (مع مراعاة RTL)
  // نستخدم DOM لضمان دقة الإحداثيات بصرياً
  const getCellCenter = (row: number, col: number) => {
    if (!gridRef.current) {
      // fallback: حساب رياضي بسيط
      const gap = 4;
      const totalCellSize = cellSize + gap;
      const visualCol = cols - 1 - col; // عكس RTL
      return {
        x: visualCol * totalCellSize + cellSize / 2,
        y: row * totalCellSize + cellSize / 2,
      };
    }
    const cell = gridRef.current.querySelector(
      `[data-cell="${row}-${col}"]`
    ) as HTMLElement;
    if (!cell) {
      const gap = 4;
      const totalCellSize = cellSize + gap;
      const visualCol = cols - 1 - col;
      return {
        x: visualCol * totalCellSize + cellSize / 2,
        y: row * totalCellSize + cellSize / 2,
      };
    }
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    return {
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      y: cellRect.top - gridRect.top + cellRect.height / 2,
    };
  };

  const g = grid();

  // حساب حجم SVG الإجمالي
  const gap = 4;
  const svgWidth = cols * (cellSize + gap);
  const svgHeight = rows * (cellSize + gap);

  return (
    <div className="space-y-3" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
        {isDragging && dragStart && dragEnd && (
          <span className="text-xs text-amber-700 font-bold">
            رسم: {Math.abs(dragEnd.row - dragStart.row) + Math.abs(dragEnd.col - dragStart.col) + 1} خلايا
          </span>
        )}
        {!isDragging && pendingDrag && (
          <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            مسار جاهز: {pendingDrag.length} خلايا
          </span>
        )}
      </div>

      {/* الشبكة مع طبقة SVG للخطوط */}
      <div className="inline-block rounded-2xl bg-gradient-to-br from-stone-50 to-amber-50 p-3 border border-stone-200">
        <div
          ref={gridRef}
          className="grid-editor-grid relative grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            width: cols * (cellSize + 4) - 4,
            height: rows * (cellSize + 4) - 4,
          }}
        >
          {g.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const wordInfo = getCellWordInfo(rowIdx, colIdx);
              const inDrag = isCellInDrag(rowIdx, colIdx);
              const isSelected = isCellSelected(rowIdx, colIdx);
              const isStartDrag = isDragStart(rowIdx, colIdx);
              const isEndDrag = isDragEnd(rowIdx, colIdx);
              const existingCell = cell;
              const startOfWord = words.find((w) => w.startRow === rowIdx && w.startCol === colIdx);
              const wordColor = wordInfo ? getWordColor(wordInfo.wordIdx) : null;
              // هل يوجد سحب نشط أو مسار معلّق؟
              const hasDragActive = isDragging || pendingDrag !== null;
              // إخفاء تلوين الكلمات الموجودة أثناء السحب لإظهار المسار الحالي فقط
              const showWordColor = wordColor && !hasDragActive && !inDrag;
              // إظهار التحديد الأزرق فقط عندما لا يكون هناك مسار معلّق
              const showSelected = isSelected && !inDrag && !pendingDrag;

              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  data-cell={`${rowIdx}-${colIdx}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                  className={cn(
                    "relative w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center font-bold text-lg select-none border-2 transition-all cursor-pointer",
                    inDrag
                      ? isStartDrag
                        ? "text-white shadow-lg"
                        : isEndDrag
                        ? "text-white shadow-lg"
                        : "text-stone-800"
                      : showSelected
                      ? "bg-blue-200 border-blue-400"
                      : showWordColor
                      ? "border-2"
                      : existingCell
                      ? "bg-white border-stone-300 text-stone-800"
                      : "bg-stone-100 border-stone-200 text-stone-300 hover:bg-stone-200"
                  )}
                  style={
                    inDrag
                      ? {
                          backgroundColor: isStartDrag || isEndDrag ? DRAG_COLOR.line : DRAG_COLOR.fill,
                          borderColor: DRAG_COLOR.border,
                        }
                      : showWordColor && wordColor
                      ? {
                          backgroundColor: wordColor.fill,
                          borderColor: wordColor.border,
                        }
                      : undefined
                  }
                >
                  {/* رقم بداية الكلمة */}
                  {startOfWord && (
                    <span className="absolute top-0 right-0.5 text-[8px] font-bold text-stone-500 leading-none">
                      {startOfWord.number}
                    </span>
                  )}
                  {/* الحرف */}
                  <span className={cn(inDrag || wordInfo ? "text-stone-800 font-bold" : "")}>
                    {existingCell?.letter}
                  </span>
                  {/* نقطة في منتصف الخلية الفارغة */}
                  {!existingCell && !inDrag && !wordColor && (
                    <span className="absolute w-1 h-1 rounded-full bg-stone-300" />
                  )}
                  {/* علامة بداية السحب */}
                  {isStartDrag && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-md border-4 border-white pointer-events-none"
                    />
                  )}
                  {/* علامة نهاية السحب */}
                  {isEndDrag && isDragging && !isStartDrag && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-amber-500 pointer-events-none"
                    />
                  )}
                </motion.div>
              );
            })
          )}

          {/* طبقة SVG لرسم الخطوط المتصلة فوق الشبكة */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgWidth}
            height={svgHeight}
            style={{ top: 0, left: 0 }}
          >
            {/* خطوط الكلمات المضافة - تُخفت أثناء السحب أو عند وجود مسار معلّق */}
            {words.map((word, idx) => {
              const color = getWordColor(idx);
              const start = getCellCenter(word.startRow, word.startCol);
              const endRow = word.direction === "across" ? word.startRow : word.startRow + word.text.length - 1;
              const endCol = word.direction === "across" ? word.startCol + word.text.length - 1 : word.startCol;
              const end = getCellCenter(endRow, endCol);

              // تخفيت الخطوط الموجودة أثناء السحب النشط أو عند وجود مسار معلّق
              const dimmed = isDragging || pendingDrag !== null;
              const lineOpacity = dimmed ? 0.12 : 0.35;
              const circleOpacity = dimmed ? 0.2 : 1;

              return (
                <g key={`word-${idx}`} style={{ transition: "opacity 0.2s" }}>
                  {/* الخط الرئيسي */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color.line}
                    strokeWidth={Math.max(cellSize * 0.7, 24)}
                    strokeLinecap="round"
                    opacity={lineOpacity}
                  />
                  {/* دائرة البداية */}
                  <circle
                    cx={start.x}
                    cy={start.y}
                    r={cellSize * 0.18}
                    fill={color.line}
                    opacity={circleOpacity}
                  />
                  {/* دائرة النهاية */}
                  <circle
                    cx={end.x}
                    cy={end.y}
                    r={cellSize * 0.18}
                    fill="none"
                    stroke={color.line}
                    strokeWidth={3}
                    opacity={circleOpacity}
                  />
                </g>
              );
            })}

            {/* خط السحب الحالي (أثناء السحب) */}
            {isDragging && dragStart && dragEnd && (
              <g>
                <line
                  x1={getCellCenter(dragStart.row, dragStart.col).x}
                  y1={getCellCenter(dragStart.row, dragStart.col).y}
                  x2={getCellCenter(dragEnd.row, dragEnd.col).x}
                  y2={getCellCenter(dragEnd.row, dragEnd.col).y}
                  stroke={DRAG_COLOR.line}
                  strokeWidth={Math.max(cellSize * 0.7, 24)}
                  strokeLinecap="round"
                  opacity={0.5}
                />
                {/* دائرة البداية */}
                <circle
                  cx={getCellCenter(dragStart.row, dragStart.col).x}
                  cy={getCellCenter(dragStart.row, dragStart.col).y}
                  r={cellSize * 0.22}
                  fill={DRAG_COLOR.line}
                  className="animate-pulse"
                />
                {/* دائرة النهاية */}
                <circle
                  cx={getCellCenter(dragEnd.row, dragEnd.col).x}
                  cy={getCellCenter(dragEnd.row, dragEnd.col).y}
                  r={cellSize * 0.22}
                  fill="none"
                  stroke={DRAG_COLOR.line}
                  strokeWidth={4}
                  className="animate-pulse"
                />
              </g>
            )}

            {/* خط المسار المعلّق (بعد إفلات الضغط، يبقى مرئياً حتى كتابة الكلمة) */}
            {!isDragging && pendingDrag && (
              <g>
                <line
                  x1={getCellCenter(pendingDrag.start.row, pendingDrag.start.col).x}
                  y1={getCellCenter(pendingDrag.start.row, pendingDrag.start.col).y}
                  x2={getCellCenter(pendingDrag.end.row, pendingDrag.end.col).x}
                  y2={getCellCenter(pendingDrag.end.row, pendingDrag.end.col).y}
                  stroke={DRAG_COLOR.line}
                  strokeWidth={Math.max(cellSize * 0.7, 24)}
                  strokeLinecap="round"
                  opacity={0.6}
                />
                {/* دائرة البداية */}
                <circle
                  cx={getCellCenter(pendingDrag.start.row, pendingDrag.start.col).x}
                  cy={getCellCenter(pendingDrag.start.row, pendingDrag.start.col).y}
                  r={cellSize * 0.24}
                  fill={DRAG_COLOR.line}
                />
                {/* دائرة النهاية */}
                <circle
                  cx={getCellCenter(pendingDrag.end.row, pendingDrag.end.col).x}
                  cy={getCellCenter(pendingDrag.end.row, pendingDrag.end.col).y}
                  r={cellSize * 0.24}
                  fill="none"
                  stroke={DRAG_COLOR.line}
                  strokeWidth={4}
                />
                {/* نص يظهر طول المسار */}
                <text
                  x={(getCellCenter(pendingDrag.start.row, pendingDrag.start.col).x + getCellCenter(pendingDrag.end.row, pendingDrag.end.col).x) / 2}
                  y={(getCellCenter(pendingDrag.start.row, pendingDrag.start.col).y + getCellCenter(pendingDrag.end.row, pendingDrag.end.col).y) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={cellSize * 0.32}
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  {pendingDrag.length}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* تلميح الاستخدام */}
      <div className="text-xs text-stone-500 flex items-center gap-2">
        <span>💡</span>
        <span>اسحب من نقطة البداية إلى نهاية الكلمة لرسم المسار، ثم اكتب الكلمة في النموذج</span>
      </div>

      {/* نموذج إضافة كلمة */}
      {selectedCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white border-2 border-amber-300 shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-stone-800">
              إضافة كلمة في الخلية ({selectedCell.row + 1}, {selectedCell.col + 1})
            </h4>
            {pendingDrag && (
              <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">
                طول المسار: {pendingDrag.length} حروف
              </span>
            )}
          </div>
          {pendingDrag && (
            <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
              <span>🎯</span>
              <span>المسار جاهز! اكتب كلمة من {pendingDrag.length} حروف لتملأ الخلايا المحددة تلقائياً</span>
            </div>
          )}
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
                autoFocus
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
              onClick={() => {
                setSelectedCell(null);
                setPendingDrag(null);
                setInputWord("");
                setInputClue("");
              }}
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
            {words.map((word, idx) => {
              const color = getWordColor(idx);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200"
                >
                  <div className="flex items-center gap-2">
                    {/* مؤشر اللون */}
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color.line }}
                    />
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
