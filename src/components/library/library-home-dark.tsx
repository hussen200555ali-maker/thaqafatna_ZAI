"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookCover } from "./book-cover";

interface Book {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  pdfUrl?: string;
  contentType?: string;
  difficulty: string;
  readingTimeMin: number;
  pages: number;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  downloads: number;
  isFeatured: boolean;
  isPremium: boolean;
  category: { id: number; name: string; icon: string; color: string };
  _count: { chapters: number; reviews: number };
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  booksCount?: number;
  description?: string;
  isPublished?: boolean;
  _count?: { books: number };
}

const placeholderSuggestions = [
  "ابحث عن كتاب... أو مؤلف... أو موضوع...",
  "مثلاً: «مدخل إلى الليبرالية الكلاسيكية»",
  "اكتب اسم مؤلفك المفضل...",
  "ابحث في التصنيف: الدين الإسلامي",
  "جرّب: «تطوير الذات»",
  "اكتب: «التاريخ والتراث»",
];

/**
 * 🏠 الصفحة الرئيسية الجديدة - تصميم Dark Elegant
 * مستوحى من: Amazon Kindle Dark + Apple Books + مكتبة نور
 */
export function LibraryHomeDark({
  books,
  categories,
}: {
  books: Book[];
  categories: Category[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [stats, setStats] = useState({ books: 0, categories: 0, downloads: 0, authors: 0 });

  // تبديل placeholder كل 3 ثوانٍ
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholderSuggestions.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // عدّاد إحصائيات بأنيميشن
  useEffect(() => {
    const targetStats = {
      books: books.length,
      categories: categories.length,
      downloads: books.reduce((sum, b) => sum + (b.downloads || 0), 0),
      authors: new Set(books.map((b) => b.author)).size,
    };

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      setStats({
        books: Math.floor(targetStats.books * eased),
        categories: Math.floor(targetStats.categories * eased),
        downloads: Math.floor(targetStats.downloads * eased),
        authors: Math.floor(targetStats.authors * eased),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [books, categories]);

  // تصفية الكتب
  const featuredBooks = books.filter((b) => b.isFeatured).slice(0, 8);
  const recentBooks = [...books]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
  const popularToday = [...books]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);
  const mostDownloaded = [...books]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 6);

  // تصنيفات بأيقونات مخصصة
  const categoryIcons: Record<string, { icon: string; gradient: string }> = {
    "الأدب العربي": { icon: "📖", gradient: "from-blue-600 to-indigo-700" },
    "الكتب الدينية": { icon: "🕌", gradient: "from-emerald-600 to-teal-700" },
    "التاريخ والتراث": { icon: "📜", gradient: "from-amber-600 to-orange-700" },
    "العلوم والمعرفة": { icon: "🔬", gradient: "from-purple-600 to-fuchsia-700" },
    "الجغرافيا والرحلات": { icon: "🌍", gradient: "from-cyan-600 to-blue-700" },
    "الفنون والآداب": { icon: "🎨", gradient: "from-pink-600 to-rose-700" },
    "أدب الأطفال": { icon: "🧸", gradient: "from-orange-500 to-amber-600" },
    "التطوير المهني": { icon: "💼", gradient: "from-stone-600 to-slate-700" },
    "التنمية البشرية": { icon: "🌱", gradient: "from-green-600 to-emerald-700" },
    "الفلسفة والمنطق": { icon: "🧠", gradient: "from-violet-600 to-purple-700" },
    "علم النفس": { icon: "💭", gradient: "from-rose-600 to-pink-700" },
    "الشعر والشعراء": { icon: "✒️", gradient: "from-indigo-600 to-violet-700" },
    "السير والتراجم": { icon: "👥", gradient: "from-teal-600 to-cyan-700" },
    "الروايات والقصص": { icon: "📚", gradient: "from-red-600 to-rose-700" },
  };

  const getCategoryStyle = (name: string) => {
    return (
      categoryIcons[name] || {
        icon: "📕",
        gradient: "from-slate-600 to-stone-700",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* ===== خلفية متوهّجة ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      {/* ===== Header ===== */}
      <header className="relative z-10 bg-stone-950/50 backdrop-blur-xl border-b border-stone-800/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/library" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                ثقافتنا
              </h1>
              <p className="text-[10px] text-stone-500 -mt-1">المكتبة الذكية</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/library" className="px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800/50 rounded-lg transition-colors">
              الرئيسية
            </Link>
            <Link href="/library/categories" className="px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800/50 rounded-lg transition-colors">
              التصنيفات
            </Link>
            <Link href="/library/authors" className="px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800/50 rounded-lg transition-colors">
              المؤلفون
            </Link>
            <Link href="/library/my-library" className="px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800/50 rounded-lg transition-colors">
              ⭐ مكتبتي
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg bg-stone-800/50 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors" title="إشارات مرجعية">
              🔖
            </button>
            <button className="w-9 h-9 rounded-lg bg-stone-800/50 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors" title="الإشعارات">
              🔔
            </button>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              ح
            </div>
          </div>
        </div>
      </header>

      {/* ===== Hero Section مع البحث ===== */}
      <section className="relative z-10 pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              مكتبة عربية ذكية · {stats.books} كتاب
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
              اكتشف عالم
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                الكتب العربية
              </span>
            </h1>
            <p className="text-stone-400 text-lg mb-8 max-w-2xl mx-auto">
              آلاف الكتب العربية في مختلف التصنيفات · اقرأ وحمّل مجاناً · مدعوم بالذكاء الاصطناعي
            </p>
          </motion.div>

          {/* شريط البحث الذكي */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />
              <div className="relative flex items-center gap-2 bg-stone-900/80 backdrop-blur-xl border border-stone-700 rounded-2xl p-2 shadow-2xl">
                <div className="pr-3 pl-1 text-stone-500">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/library?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  placeholder={placeholderSuggestions[placeholderIdx]}
                  className="flex-1 bg-transparent text-white placeholder-stone-500 outline-none text-base py-2 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-400"
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      window.location.href = `/library?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium text-sm shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                >
                  بحث
                </button>
              </div>
            </div>

            {/* اقتراحات سريعة */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-stone-500">جرّب:</span>
              {["الليبرالية", "ابن خلدون", "التراث", "تطوير الذات"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSearchQuery(s)}
                  className="px-3 py-1 rounded-full bg-stone-800/50 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== إحصائيات المكتبة ===== */}
      <section className="relative z-10 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "كتاب عربي", value: stats.books, icon: "📚", color: "from-purple-500 to-pink-500" },
            { label: "تصنيف", value: stats.categories, icon: "📂", color: "from-blue-500 to-cyan-500" },
            { label: "مؤلف", value: stats.authors, icon: "✍️", color: "from-emerald-500 to-teal-500" },
            { label: "تنزيل", value: stats.downloads, icon: "📥", color: "from-amber-500 to-orange-500" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="relative bg-stone-900/50 backdrop-blur border border-stone-800 rounded-2xl p-4 overflow-hidden group hover:border-stone-700 transition-colors"
            >
              <div className={cn("absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br opacity-20 blur-2xl group-hover:opacity-40 transition-opacity", stat.color)} />
              <div className="relative">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value.toLocaleString("ar-EG")}</div>
                <div className="text-xs text-stone-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== الكتب المميزة ===== */}
      {featuredBooks.length > 0 && (
        <section className="relative z-10 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400">⭐</span>
                  <span>الكتب المميزة</span>
                </h2>
                <p className="text-sm text-stone-400 mt-1">مختارات فريق التحرير</p>
              </div>
              <Link href="/library?filter=featured" className="text-sm text-purple-300 hover:text-purple-200 transition-colors">
                عرض الكل ←
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featuredBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/library/${book.id}`} className="block group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <BookCover
                          title={book.title}
                          author={book.author}
                          categoryName={book.category.name}
                          difficulty={book.difficulty}
                          size="md"
                          coverImageUrl={book.coverImage}
                          showPdfBadge={!!book.pdfUrl}
                          className="group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-stone-500 truncate">{book.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-amber-400">⭐ {book.ratingAvg || "—"}</span>
                        <span className="text-xs text-stone-600">·</span>
                        <span className="text-xs text-stone-500">👁️ {book.views}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== أحدث الكتب ===== */}
      <section className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400">🆕</span>
                <span>أحدث الكتب</span>
              </h2>
              <p className="text-sm text-stone-400 mt-1">أضيفت حديثاً إلى المكتبة</p>
            </div>
            <Link href="/library?sort=recent" className="text-sm text-purple-300 hover:text-purple-200 transition-colors">
              عرض الكل ←
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentBooks.slice(0, 6).map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/library/${book.id}`} className="block group">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    categoryName={book.category.name}
                    difficulty={book.difficulty}
                    size="sm"
                    coverImageUrl={book.coverImage}
                    showPdfBadge={!!book.pdfUrl}
                    className="group-hover:scale-105 transition-transform"
                  />
                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 truncate">{book.author}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== التصنيفات ===== */}
      <section className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <span className="text-blue-400">📂</span>
              <span>تصفّح حسب التصنيف</span>
            </h2>
            <p className="text-sm text-stone-400 mt-1">اختر تصنيفك المفضل واكتشف كتباً جديدة</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.slice(0, 15).map((cat, i) => {
              const style = getCategoryStyle(cat.name);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link
                    href={`/library?category=${cat.id}`}
                    className={cn(
                      "relative block p-4 rounded-2xl bg-gradient-to-br text-white overflow-hidden group hover:scale-105 transition-transform shadow-lg",
                      style.gradient
                    )}
                  >
                    <div className="absolute -top-4 -left-4 text-6xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all">
                      {style.icon}
                    </div>
                    <div className="relative">
                      <div className="text-3xl mb-2">{style.icon}</div>
                      <h3 className="font-bold text-sm mb-1 line-clamp-1">{cat.name}</h3>
                      <p className="text-xs opacity-80">
                        {cat._count?.books || cat.booksCount || 0} كتاب
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-6">
            <Link
              href="/library/categories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800/50 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
            >
              <span>عرض كل التصنيفات</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== الأكثر تنزيلاً ===== */}
      {mostDownloaded.some((b) => b.downloads > 0) && (
        <section className="relative z-10 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-rose-400">🔥</span>
                  <span>الأكثر تنزيلاً</span>
                </h2>
                <p className="text-sm text-stone-400 mt-1">الكتب الأكثر شعبية هذا الأسبوع</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mostDownloaded.slice(0, 6).map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    href={`/library/${book.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800 hover:border-stone-700 transition-colors group"
                  >
                    <div className="text-2xl font-bold text-stone-700 w-8">{i + 1}</div>
                    <BookCover
                      title={book.title}
                      author={book.author}
                      categoryName={book.category.name}
                      difficulty={book.difficulty}
                      size="sm"
                      coverImageUrl={book.coverImage}
                      showPdfBadge={!!book.pdfUrl}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-stone-500 truncate mb-2">{book.author}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-emerald-400 font-medium">
                          📥 {book.downloads} تنزيل
                        </span>
                        <span className="text-xs text-amber-400">
                          ⭐ {book.ratingAvg || "—"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA: ارفع كتابك ===== */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur border border-purple-500/30 rounded-3xl p-8 overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-right">
                <h2 className="text-2xl font-bold text-white mb-2">
                  هل أنت مؤلف؟
                </h2>
                <p className="text-stone-300 text-sm mb-4 max-w-md">
                  ارفع كتابك وانشره لآلاف القراء العرب مجاناً. انضم لمجتمع المؤلفين العرب.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link
                    href="/admin/library"
                    className="px-5 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-sm hover:bg-stone-100 transition-colors"
                  >
                    📤 ارفع كتابك
                  </Link>
                  <Link
                    href="/library/authors"
                    className="px-5 py-2.5 rounded-xl bg-stone-800/50 text-white border border-stone-700 hover:bg-stone-800 transition-colors text-sm"
                  >
                    تعرّف على المؤلفين
                  </Link>
                </div>
              </div>

              <div className="text-7xl">✍️</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 bg-stone-950/80 backdrop-blur border-t border-stone-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  📚
                </div>
                <span className="font-bold text-white">ثقافتنا</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                منصة عربية تعليمية ترفيهية تجمع بين الألغاز التكيّفية والمكتبة الذكية.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-stone-300 mb-3 text-sm">المكتبة</h4>
              <ul className="space-y-2 text-xs text-stone-500">
                <li><Link href="/library" className="hover:text-purple-300 transition-colors">كل الكتب</Link></li>
                <li><Link href="/library/categories" className="hover:text-purple-300 transition-colors">التصنيفات</Link></li>
                <li><Link href="/library/authors" className="hover:text-purple-300 transition-colors">المؤلفون</Link></li>
                <li><Link href="/library/my-library" className="hover:text-purple-300 transition-colors">مكتبتي</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-stone-300 mb-3 text-sm">المساعدة</h4>
              <ul className="space-y-2 text-xs text-stone-500">
                <li><Link href="/help" className="hover:text-purple-300 transition-colors">كيف أقرأ كتاباً؟</Link></li>
                <li><Link href="/help/upload" className="hover:text-purple-300 transition-colors">كيف أرفع كتابي؟</Link></li>
                <li><Link href="/contact" className="hover:text-purple-300 transition-colors">تواصل معنا</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-stone-300 mb-3 text-sm">تابعنا</h4>
              <div className="flex gap-2">
                {["🐦", "📘", "📷", "▶️"].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-stone-800/50 hover:bg-stone-700 flex items-center justify-center transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-800/50 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-stone-600">
              © 2026 ثقافتنا · جميع الحقوق محفوظة
            </p>
            <p className="text-xs text-stone-600">
              صُنع بـ ❤️ للغة وثقافة الأمة العربية
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
