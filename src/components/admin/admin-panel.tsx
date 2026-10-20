"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelEditor } from "./level-editor";
import { LibraryAdminView } from "@/components/library/library-admin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AdminLevel {
  id: number;
  number: number;
  title: string;
  difficulty: string;
  status: string;
  isPublished: boolean;
  reward: number;
  hintCost: number;
  chapter: { id: number; title: string };
  _count: { words: number };
}

interface AdminChapter {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isPublished: boolean;
  _count: { levels: number };
}

type View = "list" | "editor" | "quality-check" | "difficulty-balance" | "library";

export function AdminPanel() {
  const [view, setView] = useState<View>("list");
  const [levels, setLevels] = useState<AdminLevel[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChapters = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/chapters");
      const data = await response.json();
      setChapters(data.chapters || []);
      if (data.chapters?.length > 0 && !selectedChapterId) {
        setSelectedChapterId(data.chapters[0].id);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الفصول",
        variant: "destructive",
      });
    }
  }, [selectedChapterId, toast]);

  const fetchLevels = useCallback(async () => {
    if (!selectedChapterId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/levels?chapterId=${selectedChapterId}`);
      const data = await response.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error("Error fetching levels:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المراحل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChapterId, toast]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleCreateLevel = () => {
    setEditingLevelId(null);
    setView("editor");
  };

  const handleEditLevel = (id: number) => {
    setEditingLevelId(id);
    setView("editor");
  };

  const handleDeleteLevel = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المرحلة؟")) return;
    try {
      const response = await fetch(`/api/admin/levels/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "تم الحذف", description: "تم حذف المرحلة بنجاح" });
        fetchLevels();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف المرحلة",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateLevel = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/levels/${id}/duplicate`, {
        method: "POST",
      });
      if (response.ok) {
        toast({ title: "تم النسخ", description: "تم نسخ المرحلة بنجاح" });
        fetchLevels();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نسخ المرحلة",
        variant: "destructive",
      });
    }
  };

  const handlePublishLevel = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/levels/${id}/publish`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "تم النشر", description: "تم نشر المرحلة بنجاح" });
        fetchLevels();
      } else {
        toast({
          title: "تعذّر النشر",
          description: data.error || "حدث خطأ",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نشر المرحلة",
        variant: "destructive",
      });
    }
  };

  const handleCreateChapter = async () => {
    const title = prompt("اسم الفصل الجديد:");
    if (!title) return;
    try {
      const response = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, icon: "⭐" }),
      });
      if (response.ok) {
        toast({ title: "تم الإنشاء", description: "تم إنشاء الفصل بنجاح" });
        fetchChapters();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء الفصل",
        variant: "destructive",
      });
    }
  };

  if (view === "editor") {
    return (
      <LevelEditor
        levelId={editingLevelId}
        chapterId={selectedChapterId || 1}
        onBack={() => {
          setView("list");
          fetchLevels();
        }}
      />
    );
  }

  if (view === "quality-check") {
    return <QualityCheckView onBack={() => setView("list")} />;
  }

  if (view === "difficulty-balance") {
    return <DifficultyBalanceView onBack={() => setView("list")} />;
  }

  if (view === "library") {
    return <LibraryAdminView onBack={() => setView("list")} />;
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "مسودة", color: "bg-stone-100 text-stone-600" },
    review: { label: "مراجعة", color: "bg-blue-100 text-blue-700" },
    published: { label: "منشور", color: "bg-green-100 text-green-700" },
    archived: { label: "مؤرشف", color: "bg-stone-100 text-stone-500" },
  };

  const difficultyConfig: Record<string, { label: string; color: string }> = {
    easy: { label: "سهل", color: "bg-green-100 text-green-700" },
    medium: { label: "متوسط", color: "bg-amber-100 text-amber-700" },
    hard: { label: "صعب", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* رأس اللوحة */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // العودة للصفحة الرئيسية
                if (typeof window !== "undefined") {
                  window.location.hash = "";
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l9-9 9 9M5 10v10h14V10" />
              </svg>
              <span className="text-sm font-medium">للعب</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
                لوحة إدارة ثقافتنا
              </h1>
              <p className="text-sm text-stone-500">إدارة الفصول والمراحل والألغاز</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setView("quality-check")}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              ✅ مدقّق الجودة
            </Button>
            <Button
              onClick={() => setView("difficulty-balance")}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              ⚖️ موازنة الصعوبة
            </Button>
            <Button
              onClick={() => setView("library")}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              📚 المكتبة
            </Button>
            <Button onClick={handleCreateChapter} variant="outline">
              + فصل جديد
            </Button>
            <Button
              onClick={handleCreateLevel}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              disabled={!selectedChapterId}
            >
              + مرحلة جديدة
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* تبويب الفصول */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-stone-700 mb-3">الفصول</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapterId(chapter.id)}
                className={cn(
                  "flex-shrink-0 p-4 rounded-xl border-2 transition-all min-w-[200px]",
                  selectedChapterId === chapter.id
                    ? "bg-white border-amber-400 shadow-md"
                    : "bg-white/60 border-transparent hover:bg-white"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{chapter.icon}</span>
                  <span className="font-bold text-stone-800">{chapter.title}</span>
                </div>
                <p className="text-xs text-stone-500 mb-2 line-clamp-1">{chapter.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">{chapter._count.levels} مرحلة</span>
                  {chapter.isPublished ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">منشور</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">مسودة</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* قائمة المراحل */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-700">
              المراحل {chapters.find((c) => c.id === selectedChapterId)?.title && `— ${chapters.find((c) => c.id === selectedChapterId)?.title}`}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-stone-500 mt-2 text-sm">جاري التحميل...</p>
            </div>
          ) : levels.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-stone-700 mb-2">لا توجد مراحل بعد</h3>
              <p className="text-stone-500 mb-4">ابدأ بإنشاء أول مرحلة في هذا الفصل</p>
              <Button onClick={handleCreateLevel} className="bg-gradient-to-r from-amber-500 to-amber-600">
                + إنشاء مرحلة
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levels.map((level, idx) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                            {level.number}
                          </span>
                          <h3 className="font-bold text-stone-800">{level.title}</h3>
                        </div>
                        <p className="text-xs text-stone-500">
                          {level._count.words} كلمة · {level.reward} عملة
                        </p>
                      </div>
                      <Badge className={statusConfig[level.status]?.color}>
                        {statusConfig[level.status]?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={difficultyConfig[level.difficulty]?.color}>
                        {difficultyConfig[level.difficulty]?.label}
                      </Badge>
                      <span className="text-xs text-stone-500">
                        تكلفة التلميح: {level.hintCost}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLevel(level.id)}
                      >
                        ✏️ تعديل
                      </Button>
                      {!level.isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublishLevel(level.id)}
                          className="text-green-600 hover:bg-green-50"
                        >
                          🚀 نشر
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateLevel(level.id)}
                      >
                        📋 نسخ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLevel(level.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QualityCheckView — مدقّق جودة الأسئلة الآلي
// ============================================================

function QualityCheckView({ onBack }: { onBack: () => void }) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [levelData, setLevelData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/chapters")
      .then((r) => r.json())
      .then((data) => {
        setChapters(data.chapters || []);
        if (data.chapters?.length > 0) {
          setSelectedChapterId(data.chapters[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedChapterId) return;
    setLoading(true);
    fetch(`/api/admin/levels?chapterId=${selectedChapterId}`)
      .then((r) => r.json())
      .then((data) => {
        setLevels(data.levels || []);
        if (data.levels?.length > 0) {
          setSelectedLevelId(data.levels[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedChapterId]);

  useEffect(() => {
    if (!selectedLevelId) return;
    fetch(`/api/levels?id=${selectedLevelId}`)
      .then((r) => r.json())
      .then((data) => setLevelData(data.level));
  }, [selectedLevelId]);

  const qualityReport = useMemo(() => {
    if (!levelData?.words) return null;
    const { validateLevelQuestions } = require("@/lib/question-validator");
    return validateLevelQuestions(levelData.words, levelData.difficulty) as any;
  }, [levelData]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            رجوع
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              ✅ مدقّق جودة الأسئلة
            </h1>
            <p className="text-sm text-stone-500">10 معايير تربوية لكل سؤال</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">الفصل</label>
            <select
              value={selectedChapterId ?? ""}
              onChange={(e) => setSelectedChapterId(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-stone-300 bg-white"
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">المرحلة</label>
            <select
              value={selectedLevelId ?? ""}
              onChange={(e) => setSelectedLevelId(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-stone-300 bg-white"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.number}. {l.title} ({l.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p className="text-center text-stone-500 py-8">جاري التحميل...</p>}

        {qualityReport && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-800">تقرير الجودة الإجمالي</h2>
                  <p className="text-sm text-stone-500">{qualityReport.questionReports.length} سؤال تم تحليله</p>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-5xl font-bold",
                    qualityReport.severity === "good" ? "text-green-600"
                      : qualityReport.severity === "warning" ? "text-amber-600" : "text-red-600"
                  )}>
                    {qualityReport.totalScore}%
                  </div>
                  <div className={cn(
                    "text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block",
                    qualityReport.severity === "good" ? "bg-green-100 text-green-700"
                      : qualityReport.severity === "warning" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  )}>
                    {qualityReport.severity === "good" ? "✅ جودة ممتازة"
                      : qualityReport.severity === "warning" ? "⚠️ يحتاج تحسين" : "❌ جودة منخفضة"}
                  </div>
                </div>
              </div>

              {qualityReport.topIssues.length > 0 && (
                <div className="bg-stone-50 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-bold text-stone-700 mb-2">أبرز المشاكل</h3>
                  <ul className="space-y-1">
                    {qualityReport.topIssues.map((issue: any, i: number) => (
                      <li key={i} className="text-xs text-stone-600 flex items-center justify-between">
                        <span>• {issue.issue}</span>
                        <span className="font-bold text-red-600">{issue.count}×</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-bold text-blue-700 mb-2">💡 توصيات ذكية</h3>
                <ul className="space-y-1">
                  {qualityReport.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-blue-900">{rec}</li>
                  ))}
                </ul>
              </div>
            </Card>

            <h3 className="text-lg font-bold text-stone-800 mt-6">تفاصيل كل سؤال</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {qualityReport.questionReports.map((q: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-500 mb-1">سؤال #{i + 1}</div>
                      <p className="text-sm font-bold text-stone-800 truncate">
                        {levelData.words[i]?.clue || "—"}
                      </p>
                      <p className="text-xs text-green-600 mt-1">✓ الإجابة: {levelData.words[i]?.text || "—"}</p>
                    </div>
                    <div className="text-center mr-2">
                      <div className={cn(
                        "text-2xl font-bold",
                        q.severity === "good" ? "text-green-600"
                          : q.severity === "warning" ? "text-amber-600" : "text-red-600"
                      )}>{q.score}%</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.checks.filter((c: any) => !c.passed).slice(0, 3).map((c: any) => (
                      <span key={c.id} className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full",
                        c.severity === "critical" ? "bg-red-100 text-red-700"
                          : c.severity === "warning" ? "bg-amber-100 text-amber-700"
                          : "bg-stone-100 text-stone-600"
                      )}>{c.title}</span>
                    ))}
                    {q.checks.filter((c: any) => c.passed).length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ {q.checks.filter((c: any) => c.passed).length} معايير ناجحة
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DifficultyBalanceView — موازنة صعوبة الفصول
// ============================================================

function DifficultyBalanceView({ onBack }: { onBack: () => void }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/difficulty-check")
      .then((r) => r.json())
      .then((data) => setReport(data.report))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-500">جاري تحليل الصعوبة...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={onBack} className="text-stone-600 hover:text-stone-900">← رجوع</button>
            <h1 className="text-2xl font-bold">⚖️ موازنة الصعوبة</h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-8 text-center text-stone-500">لا توجد فصول منشورة لتحليلها</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            رجوع
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              ⚖️ موازنة الصعوبة
            </h1>
            <p className="text-sm text-stone-500">تحليل توزيع الصعوبة في كل فصل</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-stone-500 mb-1">متوسط الصحة</div>
              <div className={cn(
                "text-3xl font-bold",
                report.overallStatus === "balanced" ? "text-green-600"
                  : report.overallStatus === "needs-attention" ? "text-amber-600" : "text-red-600"
              )}>{report.averageHealthScore}%</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">فصول متوازنة</div>
              <div className="text-3xl font-bold text-green-600">{report.healthyChapters}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">تحتاج انتباه</div>
              <div className="text-3xl font-bold text-amber-600">{report.warningChapters}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">حرجة</div>
              <div className="text-3xl font-bold text-red-600">{report.criticalChapters}</div>
            </div>
          </div>
        </Card>

        {report.topRecommendations.length > 0 && (
          <Card className="p-5 mb-6 bg-purple-50 border-purple-200">
            <h3 className="text-base font-bold text-purple-700 mb-3">💡 أهم التوصيات</h3>
            <ul className="space-y-2">
              {report.topRecommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-purple-900">{rec}</li>
              ))}
            </ul>
          </Card>
        )}

        <h3 className="text-lg font-bold text-stone-800 mb-3">تفاصيل كل فصل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.chapterReports.map((ch: any) => (
            <Card key={ch.chapterId} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ch.chapterIcon}</span>
                  <div>
                    <h4 className="font-bold text-stone-800">{ch.chapterTitle}</h4>
                    <p className="text-xs text-stone-500">{ch.totalLevels} مرحلة</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  ch.status === "balanced" ? "bg-green-100 text-green-700"
                    : ch.status === "needs-attention" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                )}>{ch.healthScore}%</div>
              </div>

              <div className="space-y-2 mb-3">
                <DifficultyBar label="سهل" actual={ch.actual.easy} recommended={ch.recommended.easy} color="bg-green-500" />
                <DifficultyBar label="متوسط" actual={ch.actual.medium} recommended={ch.recommended.medium} color="bg-amber-500" />
                <DifficultyBar label="صعب" actual={ch.actual.hard} recommended={ch.recommended.hard} color="bg-red-500" />
              </div>

              {ch.issues.length > 0 && (
                <div className="bg-stone-50 rounded-lg p-3">
                  <ul className="space-y-1">
                    {ch.issues.slice(0, 2).map((issue: string, i: number) => (
                      <li key={i} className="text-xs text-stone-600">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DifficultyBar({
  label, actual, recommended, color,
}: {
  label: string; actual: number; recommended: number; color: string;
}) {
  const variance = actual - recommended;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-stone-700 font-medium">{label}</span>
        <span className={cn(
          "font-bold",
          Math.abs(variance) <= 10 ? "text-green-600"
            : Math.abs(variance) <= 20 ? "text-amber-600" : "text-red-600"
        )}>{actual}% (الموصى: {recommended}%)</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${actual}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-stone-400 opacity-60" style={{ right: `${recommended}%` }} />
      </div>
    </div>
  );
}
