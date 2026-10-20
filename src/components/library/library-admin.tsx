"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * لوحة إدارة المكتبة
 * - قائمة الكتب (مع نشر/إلغاء نشر/حذف)
 * - إضافة كتاب جديد
 * - إدارة الفصول
 */

interface Book {
  id: number;
  title: string;
  author: string;
  isPublished: boolean;
  isFeatured: boolean;
  difficulty: string;
  createdAt: string;
  category: { id: number; name: string; icon: string };
  _count: { chapters: number; reviews: number };
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

export function LibraryAdminView({ onBack }: { onBack: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([
        fetch("/api/admin/books?status=all"),
        fetch("/api/book-categories"),
      ]);
      const booksData = await booksRes.json();
      const catsData = await catsRes.json();
      setBooks(booksData.books || []);
      setCategories(catsData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleTogglePublish = async (bookId: number, current: boolean) => {
    try {
      await fetch(`/api/admin/books/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: current ? "unpublish" : "publish" }),
      });
      toast({ title: current ? "تم إلغاء النشر" : "تم النشر" });
      fetchBooks();
    } catch (e) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;
    try {
      await fetch(`/api/admin/books/${bookId}`, { method: "DELETE" });
      toast({ title: "تم الحذف" });
      fetchBooks();
    } catch (e) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* الرأس */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            رجوع
          </button>
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
            📚 إدارة المكتبة
          </h1>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {showAddForm ? "إغلاق" : "+ كتاب جديد"}
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* نموذج إضافة كتاب */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AddBookForm
                categories={categories}
                onSaved={() => {
                  setShowAddForm(false);
                  fetchBooks();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* قائمة الكتب */}
        {loading ? (
          <div className="text-center py-8 text-stone-500">جاري التحميل...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-700">الكتب ({books.length})</h2>
            </div>
            {books.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className={cn(
                  "p-4 flex items-center gap-4 border-2",
                  book.isPublished ? "border-green-200" : "border-stone-200"
                )}>
                  <div className="text-3xl">📕</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-800 truncate">{book.title}</h3>
                      {book.isPublished ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px] border-0">منشور</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-500 text-[10px] border-0">مسودة</Badge>
                      )}
                      {book.isFeatured && <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">⭐ مميز</Badge>}
                    </div>
                    <p className="text-xs text-stone-500">{book.author}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                      <span>{book.category.icon} {book.category.name}</span>
                      <span>📑 {book._count.chapters} فصول</span>
                      <span>⭐ {book._count.reviews} تقييم</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(book.id, book.isPublished)}
                      className={cn(
                        "text-xs",
                        book.isPublished ? "border-amber-300 text-amber-700" : "border-green-300 text-green-700"
                      )}
                    >
                      {book.isPublished ? "إخفاء" : "نشر"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(book.id)}
                      className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                    >
                      🗑️
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {books.length === 0 && (
              <div className="text-center py-12 text-stone-500">
                لا توجد كتب. اضغط "+ كتاب جديد" للبدء.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// نموذج إضافة كتاب
// ============================================================
function AddBookForm({ categories, onSaved }: { categories: Category[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [readingTimeMin, setReadingTimeMin] = useState(15);
  const [isFeatured, setIsFeatured] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) {
      toast({ title: "أدخل العنوان والمؤلف", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const kwArray = keywords.split(",").map((k) => k.trim()).filter(Boolean);
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          categoryId,
          description: description.trim(),
          difficulty,
          readingTimeMin: parseInt(readingTimeMin.toString()) || 15,
          isFeatured,
          keywords: kwArray,
        }),
      });
      if (res.ok) {
        toast({ title: "تم إنشاء الكتاب", description: "أضف الفصول من صفحة الكتاب" });
        onSaved();
      } else {
        toast({ title: "فشل الإنشاء", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 mb-4 border-2 border-indigo-200 bg-indigo-50">
      <h3 className="font-bold text-stone-700 mb-4">➕ إضافة كتاب جديد</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-sm mb-1 block">العنوان *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مقدمة ابن خلدون" />
        </div>
        <div>
          <Label className="text-sm mb-1 block">المؤلف *</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="عبد الرحمن بن خلدون" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <Label className="text-sm mb-1 block">التصنيف</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(parseInt(e.target.value))}
            className="w-full p-2 rounded-lg border border-stone-300 bg-white text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-sm mb-1 block">الصعوبة</Label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 rounded-lg border border-stone-300 bg-white text-sm"
          >
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>
        <div>
          <Label className="text-sm mb-1 block">وقت القراءة (دقيقة)</Label>
          <Input
            type="number"
            value={readingTimeMin}
            onChange={(e) => setReadingTimeMin(parseInt(e.target.value) || 15)}
            min={1}
          />
        </div>
      </div>
      <div className="mb-3">
        <Label className="text-sm mb-1 block">الوصف</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="نبذة عن الكتاب..."
          className="w-full p-2 rounded-lg border border-stone-300 text-sm resize-none"
          rows={2}
        />
      </div>
      <div className="mb-3">
        <Label className="text-sm mb-1 block">الكلمات المفتاحية (مفصولة بفواصل)</Label>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="تاريخ، حضارة، اجتماع"
        />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="featured" className="text-sm cursor-pointer">⭐ كتاب مميز</Label>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-gradient-to-r from-indigo-500 to-purple-600"
      >
        {saving ? "⏳ جاري..." : "💾 حفظ الكتاب"}
      </Button>
    </Card>
  );
}
