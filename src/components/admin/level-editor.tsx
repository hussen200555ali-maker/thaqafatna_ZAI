"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GridEditor } from "./grid-editor";
import { QuizEditor } from "./quiz-editor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PUZZLE_TYPES, PuzzleType, getPuzzleTypeDef } from "@/lib/puzzle-types";

interface LevelEditorProps {
  levelId: number | null;
  chapterId: number;
  onBack: () => void;
}

interface Cell {
  row: number;
  col: number;
  letter: string;
  number?: number | null;
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
  /** نوع اللغز الخاص بالسؤال (للأنواع المختلطة) */
  puzzleType?: string;
}

const CATEGORIES = [
  { value: "", label: "بدون تصنيف", icon: "📝" },
  { value: "من", label: "من؟", icon: "👤" },
  { value: "ماذا", label: "ماذا؟", icon: "❓" },
  { value: "أين", label: "أين؟", icon: "📍" },
  { value: "متى", label: "متى؟", icon: "📅" },
  { value: "كيف", label: "كيف؟", icon: "💡" },
  { value: "كم", label: "كم؟", icon: "🔢" },
  { value: "أكمل", label: "أكمل الجملة", icon: "✍️" },
  { value: "عرف", label: "عرّف", icon: "📖" },
  { value: "ضد", label: "ضد (مفردات)", icon: "⚖️" },
  { value: "مرادف", label: "مرادف", icon: "🔗" },
];

export function LevelEditor({ levelId, chapterId, onBack }: LevelEditorProps) {
  const [gameMode, setGameMode] = useState<"crossword" | "quiz">("quiz");
  const [puzzleType, setPuzzleType] = useState<PuzzleType>("text");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gridSizeRows, setGridSizeRows] = useState(5);
  const [gridSizeCols, setGridSizeCols] = useState(5);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [reward, setReward] = useState(50);
  const [hintCost, setHintCost] = useState(10);
  const [cells, setCells] = useState<Cell[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "settings" | "preview">("editor");
  const { toast } = useToast();

  useEffect(() => {
    if (!levelId) {
      setGameMode("quiz");
      return;
    }
    setLoading(true);
    fetch(`/api/admin/levels/${levelId}`)
      .then((res) => res.json())
      .then((data) => {
        const level = data.level;
        if (level) {
          setGameMode(level.gameMode || "quiz");
          setTitle(level.title);
          setDifficulty(level.difficulty);
          setGridSizeRows(level.gridSizeRows);
          setGridSizeCols(level.gridSizeCols);
          setAvailableLetters(level.availableLetters || []);
          setBonusWords(level.bonusWords || []);
          setReward(level.reward);
          setHintCost(level.hintCost);
          setCells(level.cells || []);
          // تحويل الحقول النصية إلى مصفوفات عند التحميل
          const transformedWords: Word[] = (level.words || []).map((w: any) => ({
            ...w,
            options: Array.isArray(w.options) ? w.options
              : (w.options ? String(w.options).split("|") : []),
            matchPairs: Array.isArray(w.matchPairs) ? w.matchPairs
              : (w.matchPairs ? String(w.matchPairs).split("|") : []),
          }));
          setWords(transformedWords);
        }
      })
      .catch((err) => {
        console.error("Error loading level:", err);
        toast({ title: "خطأ", description: "فشل تحميل المرحلة", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [levelId, toast]);

  // توليد الحروف المتاحة تلقائياً من الكلمات
  const generateLetters = (allWords: Word[], extraWords: string[] = []): string[] => {
    const letterCount = new Map<string, number>();
    for (const word of allWords) {
      for (const letter of word.text) {
        letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
      }
    }
    const letters: string[] = [];
    letterCount.forEach((count, letter) => {
      for (let i = 0; i < count; i++) letters.push(letter);
    });
    const arabicLetters = "ابتثجدحخدرزسشصضطظعغفقكلمنهوي";
    const extraCount = Math.max(3, Math.ceil(letters.length * 0.3));
    for (let i = 0; i < extraCount; i++) {
      const randomLetter = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];
      if (!letters.includes(randomLetter)) letters.push(randomLetter);
    }
    return letters.sort(() => Math.random() - 0.5);
  };

  const handleWordsChange = (newWords: Word[], newCells?: Cell[]) => {
    setWords(newWords);
    if (newCells) setCells(newCells);
    setAvailableLetters(generateLetters(newWords, bonusWords));
  };

  const handleGridChange = (newCells: Cell[], newWords: Word[]) => {
    setCells(newCells);
    setWords(newWords);
    setAvailableLetters(generateLetters(newWords, bonusWords));
  };

  const handleAddBonusWord = (word: string) => {
    if (word.trim() && !bonusWords.includes(word.trim())) {
      const newBonus = [...bonusWords, word.trim()];
      setBonusWords(newBonus);
      setAvailableLetters(generateLetters(words, newBonus));
    }
  };

  const handleRemoveBonusWord = (word: string) => {
    const newBonus = bonusWords.filter((w) => w !== word);
    setBonusWords(newBonus);
    setAvailableLetters(generateLetters(words, newBonus));
  };

  const handleSave = async (publish: boolean = false) => {
    setSaving(true);
    setValidation(null);

    if (words.length === 0) {
      toast({ title: "لا يمكن الحفظ", description: "أضف كلمة واحدة على الأقل", variant: "destructive" });
      setSaving(false);
      return;
    }

    // توليد الحروف تلقائياً إذا كانت فارغة
    let lettersToSend = availableLetters;
    if (!lettersToSend || lettersToSend.length === 0) {
      const answerWords = words.map((w) => w.text);
      lettersToSend = generateLetters(words, bonusWords);
      setAvailableLetters(lettersToSend);
    }

    // استخدام نوع اللغز المختار من المحرر
    const payload = {
      chapterId,
      gameMode,
      puzzleType: puzzleType,
      title,
      difficulty,
      gridSizeRows,
      gridSizeCols,
      availableLetters: lettersToSend,
      bonusWords,
      reward,
      hintCost,
      words: words.map((w) => ({
        text: w.text,
        clue: w.clue,
        category: w.category || "",
        imageUrl: w.imageUrl || "",
        image2Url: w.image2Url || "",
        image3Url: w.image3Url || "",
        image4Url: w.image4Url || "",
        emojis: w.emojis || "",
        options: Array.isArray(w.options) ? w.options : (w.options ? String(w.options).split("|") : []),
        correctOption: w.correctOption || 0,
        matchPairs: Array.isArray(w.matchPairs) ? w.matchPairs : (w.matchPairs ? String(w.matchPairs).split("|") : []),
        fillBlanks: w.fillBlanks || "",
        audioUrl: w.audioUrl || "",
        logicData: w.logicData || "",
        sequence: w.sequence || "",
        direction: w.direction,
        startRow: w.startRow,
        startCol: w.startCol,
        number: w.number,
        puzzleType: w.puzzleType || puzzleType,
      })),
      cells: gameMode === "crossword" ? cells : [],
    };

    try {
      const url = levelId ? `/api/admin/levels/${levelId}` : "/api/admin/levels";
      const method = levelId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setValidation({ valid: false, errors: data.details });
          toast({ title: "فشل التحقق", description: data.details.join(" · "), variant: "destructive" });
        } else {
          toast({ title: "فشل الحفظ", description: data.error || "حدث خطأ غير متوقع", variant: "destructive" });
        }
        setSaving(false);
        return;
      }

      toast({
        title: levelId ? "تم التحديث" : "تم الإنشاء",
        description: publish ? "تم نشر المرحلة" : "تم حفظ المرحلة كمسودة",
      });

      if (publish && data.level?.id) {
        const publishResponse = await fetch(`/api/admin/levels/${data.level.id}/publish`, { method: "POST" });
        if (publishResponse.ok) toast({ title: "تم النشر", description: "المرحلة منشورة الآن" });
      }
      onBack();
    } catch (error) {
      console.error("Error saving level:", error);
      toast({ title: "خطأ", description: "فشل حفظ المرحلة", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const canSave = title && words.length > 0;

  // تحديد نوع اللغز للعرض
  const puzzleTypeDef = getPuzzleTypeDef(puzzleType);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ===== الرأس ===== */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* يمين: زر الرجوع + العنوان */}
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-stone-800 truncate">
                  {levelId ? "تعديل المرحلة" : "مرحلة جديدة"}
                </h1>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {gameMode === "quiz" ? "❓ أسئلة" : "🔤 شبكة"}
                  </Badge>
                  {puzzleType !== "text" && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      {puzzleTypeDef?.icon} {puzzleTypeDef?.label}
                    </Badge>
                  )}
                  <span>{words.length} سؤال</span>
                </div>
              </div>
            </div>

            {/* يسار: أزرار الحفظ */}
            <div className="flex items-center gap-2 shrink-0">
              {/* مؤشر الحالة */}
              {!canSave && (
                <span className="text-xs text-amber-600 font-medium hidden md:flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {!title ? "أدخل العنوان" : "أضف سؤالاً"}
                </span>
              )}
              {canSave && (
                <span className="text-xs text-green-600 font-medium hidden md:flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  جاهز للحفظ
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving || !canSave}
                className={cn(!canSave && "opacity-40")}
              >
                {saving ? "⏳" : "💾"} مسودة
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving || !canSave}
                className={cn(
                  "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                  !canSave && "opacity-40"
                )}
              >
                {saving ? "⏳ جاري..." : "🚀 حفظ ونشر"}
              </Button>
            </div>
          </div>

          {/* تبويبات */}
          <div className="flex items-center gap-1 mt-3 border-b border-stone-200 -mb-3">
            {([
              { id: "editor", label: "المحرر", icon: "✏️" },
              { id: "settings", label: "الإعدادات", icon: "⚙️" },
              { id: "preview", label: "معاينة", icon: "👁️" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 -mb-px",
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* تبويب: المحرر */}
        {activeTab === "editor" && (
          <div className="space-y-4">
            {/* اختيار نوع اللغز */}
            <Card className="p-4">
              <Label className="text-sm font-bold text-stone-700 mb-3 block">
                🎮 نوع اللغز
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {PUZZLE_TYPES.map((pt) => (
                  <button
                    key={pt.type}
                    onClick={() => {
                      setPuzzleType(pt.type);
                      if (pt.type === "crossword") setGameMode("crossword");
                      else setGameMode("quiz");
                    }}
                    className={cn(
                      "py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 text-center",
                      puzzleType === pt.type
                        ? "bg-teal-50 border-teal-400 text-teal-800 shadow-sm"
                        : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                    )}
                    style={puzzleType === pt.type ? { borderColor: pt.color } : {}}
                  >
                    <span className="text-2xl">{pt.icon}</span>
                    <span className="text-xs">{pt.label}</span>
                    <span className="text-[9px] text-stone-400">{pt.difficulty}</span>
                  </button>
                ))}
              </div>
              {/* وصف النوع المختار */}
              {puzzleType !== "text" && (
                <div className="mt-3 p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-2">
                  <span className="text-lg">{getPuzzleTypeDef(puzzleType)?.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-stone-700">{getPuzzleTypeDef(puzzleType)?.label}</p>
                    <p className="text-xs text-stone-500">{getPuzzleTypeDef(puzzleType)?.description}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* اختيار الصعوبة */}
            <Card className="p-4">
              <Label className="text-sm font-bold text-stone-700 mb-3 block">
                📊 مستوى الصعوبة
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: "easy", label: "سهل", icon: "🟢", reward: 50 },
                  { val: "medium", label: "متوسط", icon: "🟡", reward: 75 },
                  { val: "hard", label: "صعب", icon: "🔴", reward: 100 },
                ] as const).map((d) => (
                  <button
                    key={d.val}
                    onClick={() => {
                      setDifficulty(d.val);
                      setReward(d.reward);
                    }}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-0.5",
                      difficulty === d.val
                        ? "bg-amber-50 border-amber-400 text-amber-800"
                        : "bg-white border-stone-200 text-stone-600"
                    )}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                    <span className="text-[10px] text-stone-500">{d.reward} 🪙</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* المحرر حسب الوضع */}
            {gameMode === "quiz" ? (
              <QuizEditor
                words={words}
                onChange={handleWordsChange}
                categories={CATEGORIES}
                levelPuzzleType={puzzleType}
              />
            ) : (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-stone-700">محرر الشبكة المتقاطعة</h3>
                  <span className="text-xs text-stone-500">اسحب من خلية إلى أخرى لرسم كلمة</span>
                </div>
                <GridEditor
                  rows={gridSizeRows}
                  cols={gridSizeCols}
                  cells={cells}
                  words={words}
                  onChange={handleGridChange}
                />
              </Card>
            )}

            {/* نتائج الفحص */}
            {validation && !validation.valid && (
              <Card className="p-4 border-red-200 bg-red-50">
                <h3 className="font-bold text-red-700 mb-2">⚠️ أخطاء في الفحص</h3>
                <ul className="space-y-1 text-sm text-red-600">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* تبويب: الإعدادات */}
        {activeTab === "settings" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* معلومات أساسية */}
            <Card className="p-5">
              <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
                📝 معلومات المرحلة
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
                    عنوان المرحلة
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: لغز رقم 1"
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
                      المكافأة (🪙)
                    </Label>
                    <Input
                      type="number"
                      value={reward}
                      onChange={(e) => setReward(parseInt(e.target.value) || 50)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
                      تكلفة التلميح (🪙)
                    </Label>
                    <Input
                      type="number"
                      value={hintCost}
                      onChange={(e) => setHintCost(parseInt(e.target.value) || 10)}
                      min={0}
                    />
                  </div>
                </div>

                {gameMode === "crossword" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
                        عدد الصفوف
                      </Label>
                      <Input
                        type="number"
                        value={gridSizeRows}
                        onChange={(e) => setGridSizeRows(Math.min(10, Math.max(3, parseInt(e.target.value) || 5)))}
                        min={3}
                        max={10}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-stone-600 mb-1.5 block">
                        عدد الأعمدة
                      </Label>
                      <Input
                        type="number"
                        value={gridSizeCols}
                        onChange={(e) => setGridSizeCols(Math.min(10, Math.max(3, parseInt(e.target.value) || 5)))}
                        min={3}
                        max={10}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* الحروف المتاحة */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-700 flex items-center gap-2">
                  🔤 الحروف المتاحة
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">{availableLetters.length} حرف</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAvailableLetters(generateLetters(words, bonusWords))}
                  >
                    🔀 إعادة توليد
                  </Button>
                </div>
              </div>
              {availableLetters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableLetters.map((letter, idx) => (
                    <span
                      key={idx}
                      className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-stone-50 border border-stone-200 flex items-center justify-center font-bold text-stone-800 shadow-sm"
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-4">
                  ستظهر الحروف تلقائياً عند إضافة الكلمات
                </p>
              )}
            </Card>

            {/* الكلمات الإضافية */}
            <Card className="p-5">
              <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
                ✨ الكلمات الإضافية (مكافآت)
              </h3>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="أضف كلمة..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        handleAddBonusWord(input.value);
                        input.value = "";
                      }
                    }
                  }}
                />
              </div>
              {bonusWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {bonusWords.map((word) => (
                    <span
                      key={word}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200 flex items-center gap-1.5"
                    >
                      {word}
                      <button
                        onClick={() => handleRemoveBonusWord(word)}
                        className="hover:text-purple-900 w-4 h-4 flex items-center justify-center rounded-full bg-purple-200 text-xs"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 text-center py-2">
                  لا توجد كلمات إضافية
                </p>
              )}
            </Card>
          </div>
        )}

        {/* تبويب: المعاينة */}
        {activeTab === "preview" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <Card className="p-5">
              <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
                👁️ معاينة الأسئلة
              </h3>

              {words.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-stone-500">أضف أسئلة من تبويب "المحرر" لرؤية المعاينة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ملخص المرحلة */}
                  <div className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{title || "بدون عنوان"}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0">
                          {difficulty === "easy" ? "🟢 سهل" : difficulty === "medium" ? "🟡 متوسط" : "🔴 صعب"}
                        </Badge>
                        <span className="text-sm">🪙 {reward}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-teal-200">
                      <span>{words.length} سؤال</span>
                      <span>·</span>
                      <span>{availableLetters.length} حرف</span>
                      <span>·</span>
                      <span>{bonusWords.length} كلمات إضافية</span>
                    </div>
                  </div>

                  {/* قائمة الأسئلة */}
                  {words.map((word, idx) => {
                    const hasImage = word.imageUrl && word.imageUrl.length > 0;
                    const has4Images = word.image2Url && word.image2Url.length > 0;

                    return (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-xl overflow-hidden shadow-md"
                      >
                        <div className="bg-teal-600/50 px-4 py-2 flex items-center justify-between">
                          <span className="text-white text-sm font-bold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                              {word.number}
                            </span>
                            {has4Images ? "📷 4 صور" : hasImage ? "🖼️ صورة" : "📝 نص"}
                            {word.category && (
                              <span className="px-2 py-0.5 rounded bg-white/20 text-xs">{word.category}</span>
                            )}
                          </span>
                        </div>

                        {hasImage && (
                          <div className={cn("p-3", has4Images && "grid grid-cols-2 gap-2")}>
                            {has4Images ? (
                              [word.imageUrl, word.image2Url, word.image3Url, word.image4Url].map((url, i) =>
                                url ? (
                                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/10">
                                    { }
                                    <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white/30 text-2xl">🖼️</div>'; }}
                                    />
                                  </div>
                                ) : null
                              )
                            ) : (
                              <div className="flex justify-center">
                                <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/10">
                                  { }
                                  <img src={word.imageUrl} alt="صورة اللغز" className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white/30 text-3xl">🖼️</div>'; }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="px-4 py-3">
                          <p className="text-white text-base font-medium">{word.clue}</p>
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
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
