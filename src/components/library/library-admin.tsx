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
import { PdfImportTool } from "./pdf-import-tool";
import { BookUploadModal } from "./book-upload-modal";

/**
 * لوحة إدارة المكتبة الموحدة
 * كل ما يخص المكتبة في مكان واحد بتبويبات:
 *   1. 📚 الكتب — قائمة + إضافة + نشر/إخفاء + حذف
 *   2. 📤 استيراد PDF — رفع + استخراج + نشر
 *   3. 📂 التصنيفات — إضافة + تعديل + حذف
 *   4. 📑 الفصول — إدارة فصول كل كتاب
 *   5. 📊 إحصائيات — مشاهدات + تنزيلات + تقييمات
 */

type Tab = "books" | "import" | "categories" | "chapters" | "stats";

interface Book {
  id: number;
  title: string;
  author: string;
  isPublished: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  difficulty: string;
  readingTimeMin: number;
  views: number;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  // حقول الملفات المرفوعة
  coverImage: string;
  pdfUrl: string;
  pdfFileName: string;
  pdfSize: number;
  pdfPageCount: number;
  coverImageFileName: string;
  coverImageSize: number;
  contentType: string;
  uploadedAt: string | null;
  category: { id: number; name: string; icon: string; color: string };
  _count: { chapters: number; reviews: number };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  isPublished: boolean;
  _count?: { books: number };
}

export function LibraryAdminView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("books");
  const { toast } = useToast();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "books", label: "الكتب", icon: "📚" },
    { id: "import", label: "استيراد PDF", icon: "📤" },
    { id: "categories", label: "التصنيفات", icon: "📂" },
    { id: "chapters", label: "الفصول", icon: "📑" },
    { id: "stats", label: "إحصائيات", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ===== Header ===== */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-sm font-medium">رجوع</span>
          </button>
          <h1 className="text-xl font-bold text-stone-900" style={{ fontFamily: "var(--font-tajawal)" }}>
            📚 إدارة المكتبة
          </h1>
          <div className="w-16" />
        </div>
        {/* تبويبات */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "books" && <BooksTab />}
            {activeTab === "import" && <ImportTab />}
            {activeTab === "categories" && <CategoriesTab />}
            {activeTab === "chapters" && <ChaptersTab />}
            {activeTab === "stats" && <StatsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// تبويب 1: الكتب
// ============================================================
function BooksTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadBook, setUploadBook] = useState<Book | null>(null);
  const { toast } = useToast();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/books?status=all");
      const data = await res.json();
      setBooks(data.books || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const filtered = books.filter((b) => {
    if (search && !b.title.includes(search) && !b.author.includes(search)) return false;
    if (filterStatus === "published" && !b.isPublished) return false;
    if (filterStatus === "draft" && b.isPublished) return false;
    if (filterStatus === "featured" && !b.isFeatured) return false;
    return true;
  });

  const handleTogglePublish = async (id: number, current: boolean) => {
    await fetch(`/api/admin/books/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: current ? "unpublish" : "publish" }) });
    toast({ title: current ? "تم إخفاء الكتاب" : "تم نشر الكتاب" });
    fetchBooks();
  };

  const handleToggleFeatured = async (book: Book) => {
    await fetch(`/api/admin/books/${book.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: !book.isFeatured }) });
    toast({ title: !book.isFeatured ? "⭐ تم التمييز" : "تم إلغاء التمييز" });
    fetchBooks();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;
    await fetch(`/api/admin/books/${id}`, { method: "DELETE" });
    toast({ title: "تم حذف الكتاب" });
    fetchBooks();
  };

  return (
    <div className="space-y-4">
      {/* شريط أدوات */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 ابحث..." className="flex-1 min-w-[200px] h-10" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
          <option value="all">الكل ({books.length})</option>
          <option value="published">منشور ({books.filter(b => b.isPublished).length})</option>
          <option value="draft">مسودة ({books.filter(b => !b.isPublished).length})</option>
          <option value="featured">مميز ({books.filter(b => b.isFeatured).length})</option>
        </select>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-gradient-to-r from-indigo-500 to-purple-600 whitespace-nowrap">
          {showAddForm ? "إغلاق" : "+ كتاب جديد"}
        </Button>
      </div>

      {/* نموذج إضافة */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <AddBookFormInline onSaved={() => { setShowAddForm(false); fetchBooks(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة الكتب */}
      {loading ? (
        <p className="text-center text-stone-400 py-8">جاري التحميل...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((book) => (
            <Card key={book.id} className={cn("p-3 flex items-center gap-3 border-2", book.isPublished ? "border-green-200" : "border-stone-200")}>
              {/* الغلاف */}
              <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden shadow-sm">
                {book.coverImage && book.coverImage.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl">
                    📕
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-stone-800 truncate">{book.title}</h3>
                  {book.isPublished ? <Badge className="bg-green-100 text-green-700 text-[9px] border-0">منشور</Badge> : <Badge className="bg-stone-100 text-stone-500 text-[9px] border-0">مسودة</Badge>}
                  {book.isFeatured && <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0">⭐ مميز</Badge>}
                  {book.pdfUrl && <Badge className="bg-blue-100 text-blue-700 text-[9px] border-0">📄 PDF</Badge>}
                  {book.isPremium && <Badge className="bg-purple-100 text-purple-700 text-[9px] border-0">PRO</Badge>}
                </div>
                <p className="text-xs text-stone-500">{book.author} · {book.category.icon} {book.category.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-0.5">
                  <span>📑 {book._count.chapters} فصول</span>
                  <span>👁️ {book.views}</span>
                  <span>⭐ {book.ratingAvg || "—"}</span>
                  {book.downloads > 0 && <span>📥 {book.downloads}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setUploadBook(book)} className="px-2 h-7 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-medium" title="رفع PDF و الغلاف">
                  📤 رفع
                </button>
                <button onClick={() => handleToggleFeatured(book)} className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors", book.isFeatured ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-400 hover:bg-stone-200")} title="تمييز">⭐</button>
                <button onClick={() => handleTogglePublish(book.id, book.isPublished)} className={cn("px-2 h-7 rounded-lg text-xs font-medium transition-colors", book.isPublished ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")} title="نشر/إخفاء">{book.isPublished ? "إخفاء" : "نشر"}</button>
                <button onClick={() => handleDelete(book.id)} className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs" title="حذف">🗑️</button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-stone-400 py-8">لا توجد كتب مطابقة</p>}
        </div>
      )}

      {/* مودال رفع الملفات */}
      <AnimatePresence>
        {uploadBook && (
          <BookUploadModal
            book={uploadBook}
            onClose={() => setUploadBook(null)}
            onUpdated={() => {
              fetchBooks();
              // تحديث بيانات الكتاب في المودال أيضاً
              const updated = books.find(b => b.id === uploadBook.id);
              if (updated) setUploadBook(updated);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// نموذج إضافة كتاب (مضمن)
// ============================================================
function AddBookFormInline({ onSaved }: { onSaved: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [readingTimeMin, setReadingTimeMin] = useState(15);
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/book-categories").then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) { toast({ title: "أدخل العنوان والمؤلف", variant: "destructive" }); return; }
    setSaving(true);
    const res = await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, author, categoryId, description, difficulty, readingTimeMin, isFeatured }) });
    if (res.ok) { toast({ title: "تم إنشاء الكتاب" }); onSaved(); }
    else { toast({ title: "فشل", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <Card className="p-4 border-2 border-indigo-200 bg-indigo-50/50">
      <h3 className="font-bold text-stone-700 mb-3">➕ إضافة كتاب جديد</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div><Label className="text-xs mb-1 block">العنوان *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مقدمة ابن خلدون" /></div>
        <div><Label className="text-xs mb-1 block">المؤلف *</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="عبد الرحمن بن خلدون" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div><Label className="text-xs mb-1 block">التصنيف</Label><select value={categoryId} onChange={(e) => setCategoryId(parseInt(e.target.value))} className="w-full p-2 rounded-lg border border-stone-300 text-sm bg-white">{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
        <div><Label className="text-xs mb-1 block">الصعوبة</Label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 rounded-lg border border-stone-300 text-sm bg-white"><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div>
        <div><Label className="text-xs mb-1 block">وقت القراءة (د)</Label><Input type="number" value={readingTimeMin} onChange={(e) => setReadingTimeMin(parseInt(e.target.value) || 15)} min={1} /></div>
      </div>
      <div className="mb-3"><Label className="text-xs mb-1 block">الوصف</Label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="نبذة عن الكتاب..." className="w-full p-2 rounded-lg border border-stone-300 text-sm resize-none" rows={2} /></div>
      <label className="flex items-center gap-2 mb-3 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4" /><span className="text-sm">⭐ كتاب مميز</span></label>
      <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-600">{saving ? "⏳..." : "💾 حفظ"}</Button>
    </Card>
  );
}

// ============================================================
// تبويب 2: استيراد PDF
// ============================================================
function ImportTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { fetch("/api/book-categories").then(r => r.json()).then(d => setCategories(d.categories || [])); }, []);
  return <PdfImportTool categories={categories} />;
}

// ============================================================
// تبويب 3: التصنيفات
// ============================================================
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📚");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newDesc, setNewDesc] = useState("");
  const { toast } = useToast();

  const fetchCats = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/book-categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s/g, "-");
    await fetch("/api/book-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName, slug, icon: newIcon, color: newColor, description: newDesc }) });
    toast({ title: "تم إضافة التصنيف" });
    setNewName(""); setNewDesc(""); setShowAdd(false);
    fetchCats();
  };

  const iconOptions = ["📚", "📖", "🕌", "📜", "🔬", "🌍", "🎨", "👶", "💼", "⭐", "🏛️", "🗺️"];
  const colorOptions = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#6366f1"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-700">📂 التصنيفات ({categories.length})</h2>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" variant="outline">+ تصنيف جديد</Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="p-4 border-2 border-indigo-200 bg-indigo-50/50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs mb-1 block">الاسم *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="الأدب العربي" /></div>
                <div><Label className="text-xs mb-1 block">الوصف</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="كتب الأدب والشعر" /></div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">الأيقونة</Label>
                <div className="flex gap-1 flex-wrap">
                  {iconOptions.map((ic) => <button key={ic} onClick={() => setNewIcon(ic)} className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all", newIcon === ic ? "bg-indigo-200 border-2 border-indigo-400" : "bg-stone-100 hover:bg-stone-200")}>{ic}</button>)}
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">اللون</Label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => <button key={c} onClick={() => setNewColor(c)} className={cn("w-8 h-8 rounded-lg transition-all", newColor === c ? "ring-2 ring-offset-2 ring-stone-400" : "")} style={{ backgroundColor: c }} />)}
                </div>
              </div>
              <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600">💾 حفظ التصنيف</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <p className="text-center text-stone-400 py-4">جاري التحميل...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${cat.color}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: cat.color + "22" }}>{cat.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-stone-800">{cat.name}</h3>
                <p className="text-xs text-stone-400 truncate">{cat.description || "بدون وصف"}</p>
              </div>
              <Badge variant="outline" className="text-xs">{cat._count?.books || 0} كتاب</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب 4: الفصول
// ============================================================
function ChaptersTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/books?status=all").then(r => r.json()).then(d => { setBooks(d.books || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    fetch(`/api/books/${selectedBook}/chapters`).then(r => r.json()).then(d => setChapters(d.chapters || []));
  }, [selectedBook]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-stone-700">📑 إدارة الفصول</h2>
      {/* اختيار الكتاب */}
      <select value={selectedBook || ""} onChange={(e) => setSelectedBook(parseInt(e.target.value))} className="w-full p-2 rounded-lg border border-stone-200 text-sm bg-white">
        <option value="">اختر كتاباً...</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}
      </select>

      {selectedBook && (
        <div className="space-y-2">
          {chapters.length === 0 ? (
            <p className="text-center text-stone-400 py-4">لا توجد فصول. أضف فصولاً من تبويب "استيراد PDF" أو يدوياً.</p>
          ) : (
            chapters.map((ch) => (
              <Card key={ch.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{ch.order}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-stone-800 truncate">{ch.title}</h3>
                  <p className="text-xs text-stone-400">⏱️ {ch.estimatedMinutes} دقيقة {ch.isFree ? "· 🆓 مجاني" : "· 🔒 مدفوع"}</p>
                </div>
                {ch.relatedLevelId && <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0">🎮 لغز</Badge>}
                <a href={`/library/reader/${selectedBook}/${ch.order}`} target="_blank" className="text-xs text-indigo-600 hover:underline">معاينة</a>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// تبويب 5: إحصائيات
// ============================================================
function StatsTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/books?status=all").then(r => r.json()).then(d => { setBooks(d.books || []); setLoading(false); });
  }, []);

  if (loading) return <p className="text-center text-stone-400 py-4">جاري التحميل...</p>;

  const totalBooks = books.length;
  const published = books.filter(b => b.isPublished).length;
  const featured = books.filter(b => b.isFeatured).length;
  const totalViews = books.reduce((s, b) => s + b.views, 0);
  const totalDownloads = books.reduce((s, b) => s + b.downloads, 0);
  const totalChapters = books.reduce((s, b) => s + b._count.chapters, 0);
  const totalReviews = books.reduce((s, b) => s + b._count.reviews, 0);
  const avgRating = books.filter(b => b.ratingAvg > 0).reduce((s, b) => s + b.ratingAvg, 0) / (books.filter(b => b.ratingAvg > 0).length || 1);
  const topBooks = [...books].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-stone-700">📊 إحصائيات المكتبة</h2>
      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="📚" label="إجمالي الكتب" value={totalBooks} color="from-blue-500 to-indigo-600" />
        <StatCard icon="✅" label="منشورة" value={published} color="from-green-500 to-emerald-600" />
        <StatCard icon="⭐" label="مميزة" value={featured} color="from-amber-500 to-orange-600" />
        <StatCard icon="📑" label="إجمالي الفصول" value={totalChapters} color="from-purple-500 to-pink-600" />
        <StatCard icon="👁️" label="إجمالي المشاهدات" value={totalViews} color="from-cyan-500 to-blue-600" />
        <StatCard icon="⬇️" label="التنزيلات" value={totalDownloads} color="from-teal-500 to-green-600" />
        <StatCard icon="💬" label="التقييمات" value={totalReviews} color="from-rose-500 to-red-600" />
        <StatCard icon="⭐" label="متوسط التقييم" value={avgRating.toFixed(1)} color="from-yellow-500 to-amber-600" />
      </div>

      {/* الأكثر قراءة */}
      <div>
        <h3 className="font-bold text-stone-700 mb-3">🔥 الأكثر قراءة</h3>
        <div className="space-y-2">
          {topBooks.map((book, idx) => (
            <Card key={book.id} className="p-3 flex items-center gap-3">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-stone-300" : idx === 2 ? "bg-orange-400" : "bg-stone-200 text-stone-600")}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-stone-800 truncate">{book.title}</h4>
                <p className="text-xs text-stone-400">{book.author}</p>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-stone-800">{book.views}</div>
                <div className="text-[10px] text-stone-400">مشاهدة</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <Card className="p-4 text-center">
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl mx-auto mb-2", color)}>{icon}</div>
      <div className="text-2xl font-bold text-stone-800">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-xs text-stone-400">{label}</div>
    </Card>
  );
}
