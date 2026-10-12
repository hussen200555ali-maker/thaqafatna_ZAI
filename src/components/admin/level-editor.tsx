"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GridEditor } from "./grid-editor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LevelEditorProps {
  levelId: number | null; // null = إنشاء جديد
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
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
}

export function LevelEditor({ levelId, chapterId, onBack }: LevelEditorProps) {
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

  // تحميل المرحلة إذا كانت موجودة
  const loadLevel = useCallback(async () => {
    if (!levelId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/levels/${levelId}`);
      const data = await response.json();
      const level = data.level;
      if (level) {
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
    } catch (error) {
      console.error("Error loading level:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المرحلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [levelId, toast]);

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  // إعادة بناء الخلايا والكلمات تلقائياً من الشبكة
  const handleGridChange = (newCells: Cell[], newWords: Word[]) => {
    setCells(newCells);
    setWords(newWords);

    // استخراج الحروف المتاحة تلقائياً
    const letterCount = new Map<string, number>();
    for (const cell of newCells) {
      if (cell.letter) {
        letterCount.set(cell.letter, (letterCount.get(cell.letter) || 0) + 1);
      }
    }
    // إضافة حروف إضافية (10% من الإجمالي)
    const letters: string[] = [];
    letterCount.forEach((count, letter) => {
      for (let i = 0; i < count; i++) letters.push(letter);
    });
    // إضافة بعض الحروف الإضافية للتنويع
    const arabicLetters = "ابتثجدحخدرزسشصضطظعغفقكلمنهوي";
    const extraCount = Math.max(2, Math.ceil(letters.length * 0.2));
    for (let i = 0; i < extraCount; i++) {
      const randomLetter = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter);
      }
    }
    setAvailableLetters(letters);
  };

  const handleAddBonusWord = (word: string) => {
    if (word.trim() && !bonusWords.includes(word.trim())) {
      setBonusWords([...bonusWords, word.trim()]);
    }
  };

  const handleRemoveBonusWord = (word: string) => {
    setBonusWords(bonusWords.filter((w) => w !== word));
  };

  const handleSave = async (publish: boolean = false) => {
    setSaving(true);
    setValidation(null);

    const payload = {
      chapterId,
      title,
      difficulty,
      gridSizeRows,
      gridSizeCols,
      availableLetters,
      bonusWords,
      reward,
      hintCost,
      words,
      cells,
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
        return;
      }

      toast({
        title: levelId ? "تم التحديث" : "تم الإنشاء",
        description: publish ? "تم نشر المرحلة" : "تم حفظ المرحلة كمسودة",
      });

      // إذا طلب النشر، انشرها الآن
      if (publish && data.level?.id) {
        const publishResponse = await fetch(`/api/admin/levels/${data.level.id}/publish`, {
          method: "POST",
        });
        if (publishResponse.ok) {
          toast({
            title: "تم النشر",
            description: "المرحلة منشورة الآن ويمكن للاعبين رؤيتها",
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
        <div className="inline-block w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
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
                {words.length} كلمة · {cells.length} خلية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving || !title}
            >
              {saving ? "جاري الحفظ..." : "حفظ كمسودة"}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || !title || words.length === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
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
                  placeholder="مثال: أول كلمة"
                />
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

          <Card className="p-4">
            <h3 className="font-bold text-stone-700 mb-3">الكلمات</h3>
            {words.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">
                أضف كلمات للشبكة لرؤيتها هنا
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700">{word.number}.</span>
                        <span className="font-bold text-stone-800">{word.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {word.direction === "across" ? "أفقي" : "عمودي"}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{word.clue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-bold text-stone-700 mb-3">الكلمات الإضافية</h3>
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

        {/* العمود الأوسط: محرر الشبكة */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-700">محرر الشبكة</h3>
              <div className="text-xs text-stone-500">
                انقر على خلية لإضافة حرف، أو اسحب لرسم كلمة
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

          {/* الحروف المتاحة */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-700">الحروف المتاحة</h3>
              <span className="text-xs text-stone-500">{availableLetters.length} حرف</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLetters.map((letter, idx) => (
                <span
                  key={idx}
                  className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-stone-800"
                >
                  {letter}
                </span>
              ))}
              {availableLetters.length === 0 && (
                <p className="text-sm text-stone-500">ستظهر الحروف تلقائياً عند إضافة كلمات</p>
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
        </div>
      </div>
    </div>
  );
}
