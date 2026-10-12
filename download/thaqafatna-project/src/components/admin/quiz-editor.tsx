"use client";

import { useState, useRef } from "react";
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
  imageUrl?: string;
  image2Url?: string;
  image3Url?: string;
  image4Url?: string;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
}

type PuzzleType = "text" | "image" | "images4";

export function QuizEditor({ words, onChange, categories }: QuizEditorProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [puzzleType, setPuzzleType] = useState<PuzzleType>("text");
  const [imageUrls, setImageUrls] = useState<string[]>(["", "", "", ""]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleAdd = () => {
    if (!newAnswer.trim()) return;
    // في وضع الصور، السؤال اختياري
    if (puzzleType === "text" && !newQuestion.trim()) return;

    const maxNumber = Math.max(0, ...words.map((w) => w.number));
    const newWord: Word = {
      text: newAnswer.trim(),
      clue: newQuestion.trim() || (puzzleType === "image" ? "ما هذا الشيء؟" : "ما الشيء المشترك؟"),
      category: newCategory,
      imageUrl: puzzleType === "text" ? "" : imageUrls[0] || "",
      image2Url: puzzleType === "images4" ? imageUrls[1] || "" : "",
      image3Url: puzzleType === "images4" ? imageUrls[2] || "" : "",
      image4Url: puzzleType === "images4" ? imageUrls[3] || "" : "",
      direction: "across",
      startRow: 0,
      startCol: 0,
      number: maxNumber + 1,
    };

    onChange([...words, newWord]);
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setPuzzleType("text");
    setImageUrls(["", "", "", ""]);
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
    if (word.imageUrl) {
      setPuzzleType(word.image2Url ? "images4" : "image");
      setImageUrls([word.imageUrl || "", word.image2Url || "", word.image3Url || "", word.image4Url || ""]);
    } else {
      setPuzzleType("text");
      setImageUrls(["", "", "", ""]);
    }
  };

  const handleUpdate = () => {
    if (editingId === null) return;
    const newWords = [...words];
    newWords[editingId] = {
      ...newWords[editingId],
      text: newAnswer.trim(),
      clue: newQuestion.trim() || (puzzleType === "image" ? "ما هذا الشيء؟" : "ما الشيء المشترك؟"),
      category: newCategory,
      imageUrl: puzzleType === "text" ? "" : imageUrls[0] || "",
      image2Url: puzzleType === "images4" ? imageUrls[1] || "" : "",
      image3Url: puzzleType === "images4" ? imageUrls[2] || "" : "",
      image4Url: puzzleType === "images4" ? imageUrls[3] || "" : "",
    };
    onChange(newWords);
    handleCancel();
  };

  const handleCancel = () => {
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setPuzzleType("text");
    setImageUrls(["", "", "", ""]);
    setEditingId(null);
  };

  // معالجة رفع الصورة
  const handleImageUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newUrls = [...imageUrls];
      newUrls[idx] = result;
      setImageUrls(newUrls);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (idx: number) => {
    fileInputRefs.current[idx]?.click();
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

        {/* اختيار نوع اللغز */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
            نوع اللغز
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPuzzleType("text")}
              className={cn(
                "py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1",
                puzzleType === "text"
                  ? "bg-teal-100 border-teal-400 text-teal-800"
                  : "bg-white border-stone-200 text-stone-600"
              )}
            >
              <span className="text-lg">📝</span>
              <span>سؤال نصي</span>
            </button>
            <button
              onClick={() => setPuzzleType("image")}
              className={cn(
                "py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1",
                puzzleType === "image"
                  ? "bg-teal-100 border-teal-400 text-teal-800"
                  : "bg-white border-stone-200 text-stone-600"
              )}
            >
              <span className="text-lg">🖼️</span>
              <span>صورة واحدة</span>
            </button>
            <button
              onClick={() => setPuzzleType("images4")}
              className={cn(
                "py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1",
                puzzleType === "images4"
                  ? "bg-teal-100 border-teal-400 text-teal-800"
                  : "bg-white border-stone-200 text-stone-600"
              )}
            >
              <span className="text-lg">📷</span>
              <span>4 صور</span>
            </button>
          </div>
        </div>

        {/* رفع/إدخال الصور */}
        {puzzleType !== "text" && (
          <div className="mb-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <Label className="text-sm font-medium text-teal-700 mb-2 block">
              {puzzleType === "image" ? "صورة اللغز" : "صور اللغز (4 صور)"}
            </Label>
            <div className={cn(
              "grid gap-2",
              puzzleType === "image" ? "grid-cols-1" : "grid-cols-2"
            )}>
              {Array.from({ length: puzzleType === "image" ? 1 : 4 }).map((_, imgIdx) => (
                <div key={imgIdx} className="space-y-1">
                  {/* معاينة الصورة */}
                  {imageUrls[imgIdx] ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-teal-300 group">
                      { }
                      <img src={imageUrls[imgIdx]} alt={`صورة ${imgIdx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const newUrls = [...imageUrls];
                          newUrls[imgIdx] = "";
                          setImageUrls(newUrls);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-teal-300 flex flex-col items-center justify-center gap-1 hover:bg-teal-50 transition-colors">
                      <span className="text-2xl">📷</span>
                      <button
                        onClick={() => triggerFileInput(imgIdx)}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                      >
                        رفع صورة {puzzleType === "images4" ? imgIdx + 1 : ""}
                      </button>
                    </div>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[imgIdx] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(imgIdx, file);
                    }}
                  />
                  {/* إدخال رابط صورة */}
                  <Input
                    type="text"
                    value={imageUrls[imgIdx]}
                    onChange={(e) => {
                      const newUrls = [...imageUrls];
                      newUrls[imgIdx] = e.target.value;
                      setImageUrls(newUrls);
                    }}
                    placeholder="أو أدخل رابط الصورة..."
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-teal-600 mt-2">
              💡 يمكنك رفع صورة من جهازك أو إدخال رابط مباشر
            </p>
          </div>
        )}

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
            نص السؤال / التلميح {puzzleType !== "text" && <span className="text-stone-400">(اختياري)</span>}
          </Label>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder={puzzleType === "image" ? "ما هذا الشيء؟ (اختياري)" : "مثال: من العالم الذي اكتشف الجاذبية؟"}
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
            disabled={!newAnswer.trim() || (puzzleType === "text" && !newQuestion.trim())}
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
            {words.map((word, idx) => {
              const hasImage = word.imageUrl && word.imageUrl.length > 0;
              const has4Images = word.image2Url && word.image2Url.length > 0;
              const puzzleType = has4Images ? "images4" : hasImage ? "image" : "text";

              return (
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
                      {/* نوع اللغز */}
                      <span className="px-2 py-0.5 rounded bg-white/20 text-xs flex items-center gap-1">
                        {puzzleType === "image" ? "🖼️ صورة" : puzzleType === "images4" ? "📷 4 صور" : "📝 نص"}
                      </span>
                      {word.category && (
                        <span className="px-2 py-0.5 rounded bg-white/20 text-xs">
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

                  {/* الصور إن وجدت */}
                  {hasImage && (
                    <div className={cn("p-3", has4Images && "grid grid-cols-2 gap-2")}>
                      {has4Images ? (
                        [word.imageUrl, word.image2Url, word.image3Url, word.image4Url].map((url, i) => (
                          url && (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/10">
                              { }
                              <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white/30 text-2xl">🖼️</div>';
                                }}
                              />
                            </div>
                          )
                        ))
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/10">
                            { }
                            <img src={word.imageUrl} alt="صورة اللغز" className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white/30 text-3xl">🖼️</div>';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
              );
            })}
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
          💡 تلميحات لإنشاء ألغاز بالصور
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• اختر "صورة واحدة" لتخمين شيء/شخصية/مكان من صورة</li>
          <li>• اختر "4 صور" لإيجاد كلمة مشتركة بين 4 صور</li>
          <li>• يمكنك رفع صورة من جهازك أو إدخال رابط مباشر</li>
          <li>• في ألغاز الصور، السؤال النصي اختياري</li>
          <li>• الحروف المتاحة تُولد تلقائياً من الإجابة</li>
        </ul>
      </div>
    </div>
  );
}
