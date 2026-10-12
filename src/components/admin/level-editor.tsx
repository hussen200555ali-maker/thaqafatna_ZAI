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
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
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
          setWords(level.words || []);
        }
      })
      .catch((err) => {
        console.error("Error loading level:", err);
        toast({
          title: "خطأ",
          description: "فشل تحميل المرحلة",
          variant: "destructive",
        });
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

    // إضافة حروف إضافية للتضليل (20% من الإجمالي)
    const arabicLetters = "ابتثجدحخدرزسشصضطظعغفقكلمنهوي";
    const extraCount = Math.max(3, Math.ceil(letters.length * 0.3));
    for (let i = 0; i < extraCount; i++) {
      const random = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];
      if (!letters.includes(random) || Math.random() > 0.5) {
        letters.push(random);
      }
    }
    // خلط الحروف
    return letters.sort(() => Math.random() - 0.5);
  };

  const handleWordsChange = (newWords: Word[], newCells?: Cell[]) => {
    setWords(newWords);
    if (newCells) setCells(newCells);
    // توليد الحروف تلقائياً
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
      toast({
        title: "لا يمكن الحفظ",
        description: "أضف كلمة واحدة على الأقل",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const payload = {
      chapterId,
      gameMode,
      title,
      difficulty,
      gridSizeRows,
      gridSizeCols,
      availableLetters,
      bonusWords,
      reward,
      hintCost,
      words: words.map((w) => ({
        text: w.text,
        clue: w.clue,
        category: w.category || "",
        direction: w.direction,
        startRow: w.startRow,
        startCol: w.startCol,
        number: w.number,
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
        }
        toast({
          title: "فشل الحفظ",
          description: data.error || "حدث خطأ",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: levelId ? "تم التحديث" : "تم الإنشاء",
        description: publish ? "تم نشر المرحلة" : "تم حفظ المرحلة كمسودة",
      });

      if (publish && data.level?.id) {
        const publishResponse = await fetch(`/api/admin/levels/${data.level.id}/publish`, {
          method: "POST",
        });
        if (publishResponse.ok) {
          toast({
            title: "تم النشر",
            description: "المرحلة منشورة الآن",
          });
        }
      }

      onBack();
    } catch (error) {
      console.error("Error saving level:", error);
      toast({
        title: "خطأ",
        description: "فشل حفظ المرحلة",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* الرأس */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack}>
              ← رجوع
            </Button>
            <div>
              <h1 className="text-xl font-bold text-stone-800">
                {levelId ? "تعديل المرحلة" : "مرحلة جديدة"}
              </h1>
              <p className="text-xs text-stone-500">
                {gameMode === "quiz" ? "وضع الأسئلة" : "وضع الشبكة"} · {words.length} سؤال/كلمة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!title && (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                ⚠️ أدخل عنوان المرحلة
              </span>
            )}
            {title && words.length === 0 && (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                ⚠️ أضف سؤالاً واحداً على الأقل
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving || !title || words.length === 0}
              className={cn(
                (!title || words.length === 0) && "opacity-40 cursor-not-allowed"
              )}
            >
              {saving ? "جاري الحفظ..." : "حفظ كمسودة"}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || !title || words.length === 0}
              className={cn(
                "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                (!title || words.length === 0) && "opacity-40 cursor-not-allowed"
              )}
            >
              {saving ? "جاري النشر..." : "حفظ ونشر"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر: معلومات المرحلة */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-stone-700 mb-3">معلومات المرحلة</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="title">عنوان المرحلة</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: لغز رقم 1"
                />
              </div>

              {/* اختيار وضع اللعبة */}
              <div>
                <Label>وضع اللعبة</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setGameMode("quiz")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1",
                      gameMode === "quiz"
                        ? "bg-amber-100 border-amber-400 text-amber-800"
                        : "bg-white border-stone-200 text-stone-600"
                    )}
                  >
                    <span className="text-xl">❓</span>
                    <span>أسئلة</span>
                  </button>
                  <button
                    onClick={() => setGameMode("crossword")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1",
                      gameMode === "crossword"
                        ? "bg-amber-100 border-amber-400 text-amber-800"
                        : "bg-white border-stone-200 text-stone-600"
                    )}
                  >
                    <span className="text-xl">🔤</span>
                    <span>شبكة</span>
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {gameMode === "quiz"
                    ? "سؤال + إجابة + حروف متاحة (مثل وصلة)"
                    : "شبكة كلمات متقاطعة بالسحب"}
                </p>
              </div>

              <div>
                <Label>مستوى الصعوبة</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium border-2 transition-all",
                        difficulty === d
                          ? "bg-amber-100 border-amber-400 text-amber-800"
                          : "bg-white border-stone-200 text-stone-600"
                      )}
                    >
                      {d === "easy" ? "سهل" : d === "medium" ? "متوسط" : "صعب"}
                    </button>
                  ))}
                </div>
              </div>

              {gameMode === "crossword" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>عدد الصفوف</Label>
                    <Input
                      type="number"
                      value={gridSizeRows}
                      onChange={(e) => setGridSizeRows(Math.min(10, Math.max(3, parseInt(e.target.value) || 5)))}
                      min={3}
                      max={10}
                    />
                  </div>
                  <div>
                    <Label>عدد الأعمدة</Label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>المكافأة</Label>
                  <Input
                    type="number"
                    value={reward}
                    onChange={(e) => setReward(parseInt(e.target.value) || 50)}
                    min={0}
                  />
                </div>
                <div>
                  <Label>تكلفة التلميح</Label>
                  <Input
                    type="number"
                    value={hintCost}
                    onChange={(e) => setHintCost(parseInt(e.target.value) || 10)}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* قائمة الأسئلة/الكلمات */}
          <Card className="p-4">
            <h3 className="font-bold text-stone-700 mb-3">
              {gameMode === "quiz" ? "الأسئلة" : "الكلمات"} ({words.length})
            </h3>
            {words.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                {gameMode === "quiz" ? "أضف أسئلة من المحرر" : "أضف كلمات من الشبكة"}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700">{word.number}.</span>
                        {word.category && (
                          <Badge variant="outline" className="text-xs py-0">
                            {word.category}
                          </Badge>
                        )}
                        <span className="font-bold text-stone-800 truncate">{word.text}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{word.clue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* الكلمات الإضافية */}
          <Card className="p-4">
            <h3 className="font-bold text-stone-700 mb-3">الكلمات الإضافية (مكافآت)</h3>
            <div className="flex gap-2 mb-2">
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
            <div className="flex flex-wrap gap-2">
              {bonusWords.map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center gap-1"
                >
                  {word}
                  <button
                    onClick={() => handleRemoveBonusWord(word)}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              ))}
              {bonusWords.length === 0 && (
                <p className="text-xs text-stone-500">لا توجد كلمات إضافية</p>
              )}
            </div>
          </Card>
        </div>

        {/* العمود الأوسط: المحرر */}
        <div className="lg:col-span-2 space-y-4">
          {gameMode === "quiz" ? (
            <QuizEditor
              words={words}
              onChange={handleWordsChange}
              categories={CATEGORIES}
            />
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-stone-700">محرر الشبكة</h3>
                <div className="text-xs text-stone-500">
                  اسحب من خلية إلى أخرى لرسم كلمة
                </div>
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

          {/* الحروف المتاحة */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-700">الحروف المتاحة</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">{availableLetters.length} حرف</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAvailableLetters(generateLetters(words, bonusWords));
                  }}
                >
                  🔀 توليد تلقائي
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLetters.map((letter, idx) => (
                <span
                  key={idx}
                  className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-800 shadow-sm"
                >
                  {letter}
                </span>
              ))}
              {availableLetters.length === 0 && (
                <p className="text-sm text-stone-500">
                  ستظهر الحروف تلقائياً عند إضافة الكلمات
                </p>
              )}
            </div>
          </Card>

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

          {/* معاينة */}
          {words.length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <h3 className="font-bold text-teal-700 mb-3 flex items-center gap-2">
                <span>👁️</span> معاينة الأسئلة
              </h3>
              <div className="space-y-3">
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-teal-700 to-cyan-800 rounded-xl overflow-hidden shadow-md"
                  >
                    <div className="bg-teal-600/50 px-4 py-2 flex items-center justify-between">
                      <span className="text-white text-sm font-bold">
                        {word.category ? `${word.category} · ` : ""}سؤال {word.number}
                      </span>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-white text-base font-medium">{word.clue}</p>
                    </div>
                    <div className="bg-teal-900/30 px-4 py-2 flex justify-center gap-1">
                      {word.text.split("").map((letter, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white text-sm font-bold"
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
