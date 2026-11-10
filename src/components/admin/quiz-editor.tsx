"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { validateQuestion } from "@/lib/question-validator";

/**
 * محرر الأسئلة المحسّن — يدعم كل أنواع الألغاز الـ 13
 *
 * الأنواع المدعومة:
 *   1. text       - سؤال نصي مباشر
 *   2. image      - صورة واحدة
 *   3. images4    - 4 صور
 *   4. emoji      - إيموجي
 *   5. scrambled  - حروف مبعثرة
 *   6. fillblank  - ملء الفراغات
 *   7. matching   - توصيل
 *   8. multiple   - اختيار من متعدد
 *   9. audio      - لغز صوتي
 *  10. logic      - لغز منطقي
 *  11. progressive - تلميحات متدرجة
 *  12. mixed      - مرحلة البوس (يجمع عدة أنواع)
 *  13. crossword  - شبكة متقاطعة (له محرر مخصص)
 *
 * يحوي مدقّق جودة لحظي أثناء التحرير
 */

interface QuizEditorProps {
  words: Word[];
  onChange: (words: Word[]) => void;
  categories: { value: string; label: string; icon: string }[];
  /** نوع اللغز المختار من المستوى الأعلى (level-editor) */
  levelPuzzleType?: string;
}

export interface Word {
  id?: number;
  text: string;
  clue: string;
  category?: string;
  imageUrl?: string;
  image2Url?: string;
  image3Url?: string;
  image4Url?: string;
  emojis?: string;
  options?: string[];
  correctOption?: number;
  matchPairs?: string[];
  fillBlanks?: string;
  audioUrl?: string;
  logicData?: string;
  sequence?: string;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
  /** نوع اللغز الخاص بهذا السؤال (لأنواع mixed) */
  puzzleType?: string;
}

export function QuizEditor({ words, onChange, categories, levelPuzzleType = "text" }: QuizEditorProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // نموذج إضافة/تعديل
  const [form, setForm] = useState<Word>({
    text: "",
    clue: "",
    category: "",
    imageUrl: "",
    image2Url: "",
    image3Url: "",
    image4Url: "",
    emojis: "",
    options: [],
    correctOption: 0,
    matchPairs: [],
    fillBlanks: "",
    audioUrl: "",
    logicData: "",
    sequence: "",
    direction: "across",
    startRow: 0,
    startCol: 0,
    number: 0,
    puzzleType: levelPuzzleType,
  });

  // نوع اللغز النشط في النموذج (يمكن أن يختلف عن levelPuzzleType للأنواع المختلطة)
  const [activePuzzleType, setActivePuzzleType] = useState<string>(levelPuzzleType);

  // حقل خيار جديد (للاختيار من متعدد)
  const [newOption, setNewOption] = useState("");
  // حقل زوج جديد (للتوصيل)
  const [newPair, setNewPair] = useState("");

  // مدقّق الجودة اللحظي
  const qualityReport = useMemo(() => {
    if (!form.text || form.text.length < 2) return null;
    return validateQuestion(
      {
        text: form.text,
        clue: form.clue,
        category: form.category,
        options: form.options,
        correctOption: form.correctOption,
        matchPairs: form.matchPairs,
        fillBlanks: form.fillBlanks,
        emojis: form.emojis,
        imageUrl: form.imageUrl,
        sequence: form.sequence,
      },
      { difficulty: "medium" }
    );
  }, [form]);

  // التحقق من إمكانية الحفظ
  const canSave = useMemo(() => {
    if (!form.text.trim() || form.text.trim().length < 2) return false;

    switch (activePuzzleType) {
      case "text":
        return form.clue.trim().length > 0;
      case "image":
        return !!form.imageUrl;
      case "images4":
        return !!(form.imageUrl && form.image2Url && form.image3Url && form.image4Url);
      case "emoji":
        return !!form.emojis && form.emojis.length > 0;
      case "scrambled":
        return !!form.sequence && form.sequence.length > 0;
      case "fillblank":
        return !!form.fillBlanks && form.fillBlanks.includes("___");
      case "matching":
        return !!form.matchPairs && form.matchPairs.length >= 2;
      case "multiple":
        return !!form.options && form.options.length >= 3;
      case "audio":
        return form.clue.trim().length > 0;
      case "logic":
        return form.clue.trim().length > 0 || !!form.sequence;
      case "progressive":
        return form.clue.trim().length > 0;
      case "mixed":
        return form.clue.trim().length > 0 || !!form.imageUrl || !!form.emojis;
      default:
        return false;
    }
  }, [form, activePuzzleType]);

  // تعريف أنواع الألغاز المدعومة في النموذج (بدون crossword — له محرر مخصص)
  const formPuzzleTypes = [
    { type: "text", label: "نصي", icon: "📝" },
    { type: "image", label: "صورة", icon: "🖼️" },
    { type: "images4", label: "4 صور", icon: "📷" },
    { type: "emoji", label: "إيموجي", icon: "😎" },
    { type: "scrambled", label: "حروف مبعثرة", icon: "🔤" },
    { type: "fillblank", label: "فراغات", icon: "✏️" },
    { type: "matching", label: "توصيل", icon: "🔗" },
    { type: "multiple", label: "متعدد", icon: "☑️" },
    { type: "audio", label: "صوتي", icon: "🔊" },
    { type: "logic", label: "منطقي", icon: "🧩" },
    { type: "progressive", label: "متدرّج", icon: "💡" },
    { type: "mixed", label: "بوس", icon: "👑" },
  ];

  // تعديل نوع اللغز النشط
  const handlePuzzleTypeChange = (type: string) => {
    setActivePuzzleType(type);
    setForm((prev) => ({ ...prev, puzzleType: type }));
  };

  // إضافة/تحديث سؤال
  const handleSave = () => {
    if (!canSave) return;

    const wordData: Word = {
      ...form,
      text: form.text.trim(),
      clue: form.clue.trim() || getDefaultClue(activePuzzleType),
      puzzleType: activePuzzleType,
      number: editingId !== null ? words[editingId].number : Math.max(0, ...words.map((w) => w.number)) + 1,
    };

    if (editingId !== null) {
      const newWords = [...words];
      newWords[editingId] = wordData;
      onChange(newWords);
    } else {
      onChange([...words, wordData]);
    }
    handleReset();
  };

  const handleReset = () => {
    setForm({
      text: "",
      clue: "",
      category: "",
      imageUrl: "",
      image2Url: "",
      image3Url: "",
      image4Url: "",
      emojis: "",
      options: [],
      correctOption: 0,
      matchPairs: [],
      fillBlanks: "",
      audioUrl: "",
      logicData: "",
      sequence: "",
      direction: "across",
      startRow: 0,
      startCol: 0,
      number: 0,
      puzzleType: activePuzzleType,
    });
    setEditingId(null);
    setNewOption("");
    setNewPair("");
  };

  const handleEdit = (idx: number) => {
    const word = words[idx];
    setEditingId(idx);
    setActivePuzzleType(word.puzzleType || "text");
    setForm({
      ...word,
      options: word.options || [],
      matchPairs: word.matchPairs || [],
      puzzleType: word.puzzleType || "text",
    });
  };

  const handleDelete = (idx: number) => {
    const newWords = words.filter((_, i) => i !== idx);
    const renumbered = newWords.map((w, i) => ({ ...w, number: i + 1 }));
    onChange(renumbered);
  };

  // رفع صورة
  const handleImageUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const field = ["imageUrl", "image2Url", "image3Url", "image4Url"][idx];
      setForm((prev) => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (idx: number) => {
    fileInputRefs.current[idx]?.click();
  };

  // رفع صوت
  const handleAudioUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setForm((prev) => ({ ...prev, audioUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  // إضافة/حذف خيار (للاختيار من متعدد)
  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setForm((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption.trim()],
    }));
    setNewOption("");
  };

  const handleRemoveOption = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== idx),
      correctOption: (prev.correctOption ?? 0) === idx ? 0 : (prev.correctOption ?? 0) > idx ? (prev.correctOption ?? 0) - 1 : (prev.correctOption ?? 0),
    }));
  };

  // إضافة/حذف زوج (للتوصيل)
  const handleAddPair = () => {
    if (!newPair.trim() || !newPair.includes("|")) return;
    setForm((prev) => ({
      ...prev,
      matchPairs: [...(prev.matchPairs || []), newPair.trim()],
    }));
    setNewPair("");
  };

  const handleRemovePair = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      matchPairs: (prev.matchPairs || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-700">محرر الأسئلة</h3>
        <span className="text-sm text-stone-500">{words.length} سؤال</span>
      </div>

      {/* ===== نموذج إضافة/تعديل سؤال ===== */}
      <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-4 rounded-xl border-2 border-amber-200 mb-4">
        <h4 className="font-bold text-stone-700 mb-3">
          {editingId !== null ? "✏️ تعديل السؤال" : "➕ إضافة سؤال جديد"}
        </h4>

        {/* اختيار نوع اللغز */}
        <div className="mb-4">
          <Label className="text-sm font-medium text-stone-600 mb-2 block">
            نوع اللغز
          </Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {formPuzzleTypes.map((pt) => (
              <button
                key={pt.type}
                onClick={() => handlePuzzleTypeChange(pt.type)}
                className={cn(
                  "py-2 px-1 rounded-lg text-xs font-medium border-2 transition-all flex flex-col items-center gap-0.5",
                  activePuzzleType === pt.type
                    ? "bg-teal-100 border-teal-400 text-teal-800"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <span className="text-base">{pt.icon}</span>
                <span>{pt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== حقول خاصة بكل نوع ===== */}

        {/* الصور (image, images4) */}
        {(activePuzzleType === "image" || activePuzzleType === "images4") && (
          <div className="mb-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <Label className="text-sm font-medium text-teal-700 mb-2 block">
              {activePuzzleType === "image" ? "صورة اللغز" : "صور اللغز (4 صور)"}
            </Label>
            <div className={cn("grid gap-2", activePuzzleType === "image" ? "grid-cols-1" : "grid-cols-2")}>
              {Array.from({ length: activePuzzleType === "image" ? 1 : 4 }).map((_, imgIdx) => {
                const url = [form.imageUrl, form.image2Url, form.image3Url, form.image4Url][imgIdx];
                return (
                  <div key={imgIdx} className="space-y-1">
                    {url ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-teal-300 group">
                        <img src={url} alt={`صورة ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const field = ["imageUrl", "image2Url", "image3Url", "image4Url"][imgIdx];
                            setForm((prev) => ({ ...prev, [field]: "" }));
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-teal-300 flex flex-col items-center justify-center gap-1 hover:bg-teal-50 transition-colors">
                        <span className="text-2xl">📷</span>
                        <button
                          onClick={() => triggerFileInput(imgIdx)}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                        >رفع صورة {activePuzzleType === "images4" ? imgIdx + 1 : ""}</button>
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
                    <Input
                      type="text"
                      value={url || ""}
                      onChange={(e) => {
                        const field = ["imageUrl", "image2Url", "image3Url", "image4Url"][imgIdx];
                        setForm((prev) => ({ ...prev, [field]: e.target.value }));
                      }}
                      placeholder="أو رابط مباشر..."
                      className="text-xs h-8"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* إيموجي */}
        {activePuzzleType === "emoji" && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Label className="text-sm font-medium text-amber-700 mb-2 block">
              الإيموجي (ضع عدة رموز تعبيرية)
            </Label>
            <Input
              value={form.emojis || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, emojis: e.target.value }))}
              placeholder="مثال: 🌙⭐🕌"
              className="text-2xl text-center"
            />
            <p className="text-xs text-amber-600 mt-1">💡 اجمع عدة إيموجي للدلالة على كلمة واحدة</p>
          </div>
        )}

        {/* حروف مبعثرة */}
        {activePuzzleType === "scrambled" && (
          <div className="mb-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
            <Label className="text-sm font-medium text-purple-700 mb-2 block">
              الحروف المبعثرة (مفصولة بفواصل)
            </Label>
            <Input
              value={form.sequence || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, sequence: e.target.value }))}
              placeholder="مثال: ك,ت,ا,ب"
              className="text-base font-bold"
            />
            <p className="text-xs text-purple-600 mt-1">💡 اكتب الحروف بالترتيب الصحيح مفصولة بفواصل</p>
          </div>
        )}

        {/* ملء الفراغات */}
        {activePuzzleType === "fillblank" && (
          <div className="mb-3 p-3 rounded-xl bg-cyan-50 border border-cyan-200">
            <Label className="text-sm font-medium text-cyan-700 mb-2 block">
              النص مع الفراغات (استخدم ___ للفراغ)
            </Label>
            <textarea
              value={form.fillBlanks || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, fillBlanks: e.target.value }))}
              placeholder="مثال: الكعبة في مدينة ___"
              className="w-full px-3 py-2 rounded-lg border border-cyan-200 focus:outline-none focus:border-cyan-400 resize-none text-sm"
              rows={2}
            />
            <p className="text-xs text-cyan-600 mt-1">💡 الإجابة ستُملأ في مكان ___</p>
          </div>
        )}

        {/* توصيل */}
        {activePuzzleType === "matching" && (
          <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
            <Label className="text-sm font-medium text-indigo-700 mb-2 block">
              أزواج التوصيل (كلمة|مطابقتها)
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newPair}
                onChange={(e) => setNewPair(e.target.value)}
                placeholder="مثال: الرياض|العاصمة"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPair();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddPair} disabled={!newPair.includes("|")}>
                إضافة
              </Button>
            </div>
            {form.matchPairs && form.matchPairs.length > 0 && (
              <div className="space-y-1">
                {form.matchPairs.map((pair, idx) => {
                  const [left, right] = pair.split("|");
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-white rounded p-1.5 text-sm">
                      <span className="font-bold text-indigo-700">{left}</span>
                      <span className="text-stone-400">↔</span>
                      <span className="flex-1">{right}</span>
                      <button
                        onClick={() => handleRemovePair(idx)}
                        className="text-red-500 hover:text-red-700"
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* اختيار من متعدد */}
        {activePuzzleType === "multiple" && (
          <div className="mb-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <Label className="text-sm font-medium text-teal-700 mb-2 block">
              الخيارات (3-5 خيارات)
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="أضف خياراً..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddOption} disabled={!newOption.trim()}>
                إضافة
              </Button>
            </div>
            {form.options && form.options.length > 0 && (
              <div className="space-y-1">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded p-1.5">
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, correctOption: idx }))}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs",
                        form.correctOption === idx
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-stone-300"
                      )}
                    >
                      {form.correctOption === idx ? "✓" : String.fromCharCode(1571 + idx)}
                    </button>
                    <span className={cn("flex-1 text-sm", form.correctOption === idx && "font-bold text-green-700")}>
                      {opt}
                    </span>
                    <button
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-500 hover:text-red-700"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-teal-600 mt-1">
              💡 اضغط على الدائرة لتحديد الإجابة الصحيحة (الإجابة: {form.text || "?"})
            </p>
          </div>
        )}

        {/* صوتي */}
        {activePuzzleType === "audio" && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
            <Label className="text-sm font-medium text-rose-700 mb-2 block">
              ملف صوتي (اختياري — إذا لم يوجد، سيُستخدم النطق التلقائي)
            </Label>
            <div className="flex items-center gap-2">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                }}
              />
              <Button size="sm" variant="outline" onClick={() => audioInputRef.current?.click()}>
                🔊 رفع صوت
              </Button>
              {form.audioUrl && (
                <span className="text-xs text-green-600">✓ تم رفع صوت</span>
              )}
            </div>
            <Input
              type="text"
              value={form.audioUrl || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, audioUrl: e.target.value }))}
              placeholder="أو رابط صوت مباشر..."
              className="mt-2 text-xs h-8"
            />
            <p className="text-xs text-rose-600 mt-1">
              💡 إذا لم ترفع صوتاً، سيستخدم المتصفح Web Speech API للنطق التلقائي
            </p>
          </div>
        )}

        {/* منطقي */}
        {activePuzzleType === "logic" && (
          <div className="mb-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
            <Label className="text-sm font-medium text-violet-700 mb-2 block">
              تسلسل الأرقام/الحروف (اختياري — مفصول بفواصل)
            </Label>
            <Input
              value={form.sequence || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, sequence: e.target.value }))}
              placeholder="مثال: 1,2,4,8 (الإجابة: 16)"
              className="text-base font-bold"
            />
            <p className="text-xs text-violet-600 mt-1">
              💡 اكتب التسلسل — سيظهر علامة ؟ للمكان الناقص
            </p>
          </div>
        )}

        {/* تلميحات متدرجة */}
        {activePuzzleType === "progressive" && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Label className="text-sm font-medium text-amber-700 mb-2 block">
              التلميح الرئيسي
            </Label>
            <textarea
              value={form.clue}
              onChange={(e) => setForm((prev) => ({ ...prev, clue: e.target.value }))}
              placeholder="مثال: شيء موجود في السماء يضيء ليلاً"
              className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:border-amber-400 resize-none text-sm"
              rows={2}
            />
            <p className="text-xs text-amber-600 mt-1">
              💡 ستظهر تلميحات إضافية تلقائياً أثناء اللعب
            </p>
          </div>
        )}

        {/* بوس (mixed) */}
        {activePuzzleType === "mixed" && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-700">
              👑 مرحلة البوس تجمع أنواعاً متعددة. اكتب سؤالاً نصياً أو أضف صور/إيموجي.
              <br />
              💡 يمكنك إضافة أسئلة من أنواع مختلفة في نفس المرحلة.
            </p>
          </div>
        )}

        {/* ===== الحقول المشتركة لكل الأنواع ===== */}

        {/* التصنيف */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">تصنيف السؤال</Label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setForm((prev) => ({ ...prev, category: cat.value }))}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all flex items-center gap-1",
                  form.category === cat.value
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

        {/* نص السؤال (مشترك لكل الأنواع عدا images التي يصبح اختيارياً) */}
        <div className="mb-3">
          <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
            نص السؤال / التلميح
            {(activePuzzleType === "image" || activePuzzleType === "images4") && (
              <span className="text-stone-400"> (اختياري)</span>
            )}
          </Label>
          <textarea
            value={form.clue}
            onChange={(e) => setForm((prev) => ({ ...prev, clue: e.target.value }))}
            placeholder={getCluePlaceholder(activePuzzleType)}
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
            value={form.text}
            onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="مثال: كتاب"
            className="text-base font-bold"
          />
          {form.text && (
            <p className="text-xs text-stone-500 mt-1">
              طول الكلمة: {form.text.trim().length} حروف
            </p>
          )}
        </div>

        {/* ===== مدقّق الجودة اللحظي ===== */}
        {qualityReport && (
          <div className={cn(
            "mb-3 p-2.5 rounded-lg border text-xs",
            qualityReport.severity === "good"
              ? "bg-green-50 border-green-200 text-green-700"
              : qualityReport.severity === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className="flex items-center justify-between">
              <span className="font-bold">
                {qualityReport.severity === "good" ? "✅ جودة ممتازة"
                  : qualityReport.severity === "warning" ? "⚠️ يحتاج تحسين"
                  : "❌ جودة منخفضة"}
              </span>
              <span className="font-bold">{qualityReport.score}%</span>
            </div>
            {qualityReport.suggestions.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {qualityReport.suggestions.slice(0, 2).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* أزرار */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {editingId !== null ? "تحديث السؤال" : "إضافة السؤال"}
          </Button>
          {editingId !== null && (
            <Button variant="outline" onClick={handleReset}>إلغاء</Button>
          )}
        </div>
      </div>

      {/* ===== قائمة الأسئلة ===== */}
      <AnimatePresence>
        {words.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h4 className="text-sm font-bold text-stone-600">الأسئلة المضافة:</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {words.map((word, idx) => {
                const wordPuzzleType = word.puzzleType || "text";
                const typeIcon = formPuzzleTypes.find((p) => p.type === wordPuzzleType)?.icon || "📝";
                const typeLabel = formPuzzleTypes.find((p) => p.type === wordPuzzleType)?.label || "نصي";

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-xl overflow-hidden shadow-md"
                  >
                    <div className="bg-teal-600/50 px-4 py-2 flex items-center justify-between">
                      <span className="text-white text-sm font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                          {word.number}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/20 text-xs flex items-center gap-1">
                          {typeIcon} {typeLabel}
                        </span>
                        {word.category && (
                          <span className="px-2 py-0.5 rounded bg-white/20 text-xs">{word.category}</span>
                        )}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(idx)}
                          className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
                          title="تعديل"
                        >✏️</button>
                        <button
                          onClick={() => handleDelete(idx)}
                          className="w-7 h-7 rounded-lg bg-white/20 hover:bg-red-500/50 flex items-center justify-center text-white text-xs transition-colors"
                          title="حذف"
                        >🗑️</button>
                      </div>
                    </div>

                    {/* عرض محتوى السؤال حسب نوعه */}
                    <QuestionPreview word={word} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📝</div>
            <h3 className="font-bold text-stone-700 mb-1">لا توجد أسئلة بعد</h3>
            <p className="text-stone-500 text-sm">ابدأ بإضافة سؤال جديد من النموذج أعلاه</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// مكوّن معاينة السؤال حسب نوعه
// ============================================================

function QuestionPreview({ word }: { word: Word }) {
  const type = word.puzzleType || "text";

  // عرض الصور
  if ((type === "image" || type === "images4") && word.imageUrl) {
    const has4 = type === "images4" && word.image2Url;
    return (
      <div className={cn("p-3", has4 && "grid grid-cols-2 gap-2")}>
        {has4 ? (
          [word.imageUrl, word.image2Url, word.image3Url, word.image4Url].map((url, i) => (
            url && (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/10">
                <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-white/30 text-2xl">🖼️</div>';
                  }}
                />
              </div>
            )
          ))
        ) : (
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/10">
              <img src={word.imageUrl} alt="صورة اللغز" className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center text-white/30 text-3xl">🖼️</div>';
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // عرض إيموجي
  if (type === "emoji" && word.emojis) {
    return (
      <div className="px-4 py-3 text-center text-3xl">{word.emojis}</div>
    );
  }

  // عرض حروف مبعثرة
  if (type === "scrambled" && word.sequence) {
    return (
      <div className="px-4 py-3 flex justify-center gap-1 flex-wrap">
        {word.sequence.split(",").map((letter, i) => (
          <div key={i} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold">
            {letter}
          </div>
        ))}
      </div>
    );
  }

  // عرض فراغات
  if (type === "fillblank" && word.fillBlanks) {
    return (
      <div className="px-4 py-3 text-white text-sm text-center">
        {word.fillBlanks.split("___").map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className="inline-block mx-1 px-2 py-0.5 rounded bg-yellow-400/30 text-yellow-200">
                {"?".repeat(word.text.length)}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // عرض توصيل
  if (type === "matching" && word.matchPairs) {
    return (
      <div className="px-4 py-2 space-y-1">
        {word.matchPairs.slice(0, 3).map((pair, i) => {
          const [left, right] = pair.split("|");
          return (
            <div key={i} className="text-white text-xs flex items-center gap-2">
              <span className="font-bold">{left}</span>
              <span className="text-stone-300">↔</span>
              <span>{right}</span>
            </div>
          );
        })}
        {word.matchPairs.length > 3 && (
          <div className="text-stone-300 text-xs">+ {word.matchPairs.length - 3} أزواج أخرى</div>
        )}
      </div>
    );
  }

  // عرض اختيار من متعدد
  if (type === "multiple" && word.options) {
    return (
      <div className="px-4 py-2 space-y-1">
        {word.options.slice(0, 4).map((opt, i) => (
          <div key={i} className={cn(
            "text-xs px-2 py-1 rounded",
            i === word.correctOption ? "bg-green-500/30 text-green-100" : "bg-white/10 text-white/70"
          )}>
            {String.fromCharCode(1571 + i)} - {opt}
            {i === word.correctOption && " ✓"}
          </div>
        ))}
      </div>
    );
  }

  // عرض منطقي
  if (type === "logic" && word.sequence) {
    return (
      <div className="px-4 py-3 flex justify-center gap-1 flex-wrap">
        {word.sequence.split(",").map((num, i) => (
          <div key={i} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {num}
          </div>
        ))}
        <div className="w-8 h-8 rounded-lg bg-yellow-400/30 border border-yellow-400 flex items-center justify-center text-yellow-200 font-bold text-sm">
          ?
        </div>
      </div>
    );
  }

  // عرض صوتي
  if (type === "audio") {
    return (
      <div className="px-4 py-3 text-center">
        <div className="text-3xl">🔊</div>
        <p className="text-white/60 text-xs mt-1">سيُنطق: {word.text}</p>
      </div>
    );
  }

  // عرض افتراضي: نص السؤال + الإجابة في خانات
  return (
    <div>
      <div className="px-4 py-3">
        <p className="text-white text-base font-medium leading-relaxed">{word.clue}</p>
      </div>
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
    </div>
  );
}

// ============================================================
// دوال مساعدة
// ============================================================

function getDefaultClue(type: string): string {
  switch (type) {
    case "image": return "ما هذا الشيء؟";
    case "images4": return "ما الشيء المشترك بين الصور؟";
    case "emoji": return "ما الكلمة التي تمثلها هذه الرموز؟";
    case "scrambled": return "رتب الحروف لتكوين كلمة";
    case "fillblank": return "أكمل الفراغ";
    case "matching": return "صل كل كلمة بمطابقتها";
    case "multiple": return "اختر الإجابة الصحيحة";
    case "audio": return "اسمع واكتب الكلمة";
    case "logic": return "ما العنصر التالي في التسلسل؟";
    case "progressive": return "خمّن الكلمة";
    case "mixed": return "سؤال بوس";
    default: return "";
  }
}

function getCluePlaceholder(type: string): string {
  switch (type) {
    case "image": return "وصف اختياري للصورة";
    case "images4": return "تلميح اختياري للصور المشتركة";
    case "emoji": return "تلميح اختياري للإيموجي";
    case "scrambled": return "تلميح اختياري للحروف المبعثرة";
    case "fillblank": return "اكتب النص مع ___ للفراغ";
    case "matching": return "تلميح اختياري لأزواج التوصيل";
    case "multiple": return "اكتب السؤال هنا";
    case "audio": return "تلميح اختياري للغز الصوتي";
    case "logic": return "اكتب السؤال أو التلميح للغز المنطقي";
    case "progressive": return "اكتب التلميح الرئيسي للغز";
    case "mixed": return "اكتب السؤال أو التلميح";
    default: return "اكتب السؤال هنا";
  }
}
