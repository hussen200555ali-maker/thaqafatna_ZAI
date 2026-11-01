"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelEditor } from "./level-editor";
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

type View = "list" | "editor";

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
