"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface QuizEditorProps {
  words: Word[];
  onChange: (words: Word[]) => void;
  categories: { value: string; label: string; icon: string }[];
}

interface Word {
  id?: number;
  text: string;
  clue: string;
  category?: string;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
}

export function QuizEditor({ words, onChange, categories }: QuizEditorProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const maxNumber = Math.max(0, ...words.map((w) => w.number));
    const newWord: Word = {
      text: newAnswer.trim(),
      clue: newQuestion.trim(),
      category: newCategory,
      direction: "across",
      startRow: 0,
      startCol: 0,
      number: maxNumber + 1,
    };

    onChange([...words, newWord]);
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
  };

  const handleDelete = (idx: number) => {
    const newWords = words.filter((_, i) => i !== idx);
    const renumbered = newWords.map((w, i) => ({ ...w, number: i + 1 }));
    onChange(renumbered);
  };

  const handleEdit = (idx: number) => {
    setEditingId(idx);
    const word = words[idx];
    setNewQuestion(word.clue);
    setNewAnswer(word.text);
    setNewCategory(word.category || "");
  };

  const handleUpdate = () => {
    if (editingId === null) return;
    const newWords = [...words];
    newWords[editingId] = {
      ...newWords[editingId],
      text: newAnswer.trim(),
      clue: newQuestion.trim(),
      category: newCategory,
    };
    onChange(newWords);
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setEditingId(null);
  };

  const handleCancel = () => {
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-700">محرر الأسئلة</h3>
        <span className="text-sm text-stone-500">{words.length} سؤال</span>
      </div>

      {/* نموذج إضافة/تعديل سؤال */}
      <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-4 rounded-xl border-2 border-amber-200 mb-4">
        <h4 className="font-bold text-stone-700 mb-3">
          {editingId !== null ? "✏️ تعديل السؤال" : "➕ إضافة سؤال جديد"}
        </h4>

        {/* التصنيف */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
            تصنيف السؤال
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setNewCategory(cat.value)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all flex items-center gap-1",
                  newCategory === cat.value
                    ? "bg-teal-100 border-teal-400 text-teal-800"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* السؤال */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
            نص السؤال / التلميح
          </Label>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="مثال: من العالم الإيطالي الذي اكتشف الموجات؟"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-400 resize-none text-sm"
            rows={2}
          />
        </div>

        {/* الإجابة */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
            الإجابة (الكلمة)
          </Label>
          <Input
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="مثال: ماركوني"
            className="text-base font-bold"
          />
          {newAnswer && (
            <p className="text-xs text-stone-500 mt-1">
              طول الكلمة: {newAnswer.trim().length} حروف · ستظهر الحروف تلقائياً في الشاشة
            </p>
          )}
        </div>

        {/* أزرار */}
        <div className="flex gap-2">
          <Button
            onClick={editingId !== null ? handleUpdate : handleAdd}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {editingId !== null ? "تحديث" : "إضافة السؤال"}
          </Button>
          {editingId !== null && (
            <Button variant="outline" onClick={handleCancel}>
              إلغاء
            </Button>
          )}
        </div>
      </div>

      {/* قائمة الأسئلة */}
      {words.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-stone-600">الأسئلة المضافة:</h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {words.map((word, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-xl overflow-hidden shadow-md"
              >
                {/* رأس السؤال */}
                <div className="bg-teal-600/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-sm font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {word.number}
                    </span>
                    {word.category && (
                      <span className="px-2 py-0.5 rounded bg-white/20 text-xs">
                        {categories.find((c) => c.value === word.category)?.icon}{" "}
                        {word.category}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(idx)}
                      className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="w-7 h-7 rounded-lg bg-white/20 hover:bg-red-500/50 flex items-center justify-center text-white text-xs transition-colors"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* نص السؤال */}
                <div className="px-4 py-3">
                  <p className="text-white text-base font-medium leading-relaxed">
                    {word.clue}
                  </p>
                </div>

                {/* الإجابة في خانات */}
                <div className="bg-teal-900/30 px-4 py-2.5 flex justify-center gap-1 flex-wrap">
                  {word.text.split("").map((letter, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg bg-white border-2 border-stone-300 flex items-center justify-center text-stone-800 text-sm font-bold shadow-sm"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="font-bold text-stone-700 mb-1">لا توجد أسئلة بعد</h3>
          <p className="text-stone-500 text-sm">
            ابدأ بإضافة سؤال جديد من النموذج أعلاه
          </p>
        </div>
      )}

      {/* تلميحات الاستخدام */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
          💡 تلميحات لإنشاء أسئلة جيدة
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• استخدم تصنيفات واضحة (من، ماذا، أين) لمساعدة اللاعب</li>
          <li>• اجعل الأسئلة محددة وواضحة</li>
          <li>• استخدم كلمات قصيرة (3-7 حروف) للأسئلة السهلة</li>
          <li>• تجنب الكلمات النادرة أو المعقدة</li>
          <li>• الحروف المتاحة تُولد تلقائياً مع حروف إضافية للتضليل</li>
        </ul>
      </div>
    </div>
  );
}
