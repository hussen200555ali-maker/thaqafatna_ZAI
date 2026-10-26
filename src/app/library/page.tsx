"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/library/book-cover";
import { useGameStore } from "@/lib/game-store";
import { LibraryHomeDark } from "@/components/library/library-home-dark";

/**
 * صفحة المكتبة الرئيسية — تصميم احترافي عالمي
 * مستوحى من: Google Books + Apple Books + Amazon Kindle
 */

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
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
  booksCount: number;
}

type SortOption = "newest" | "popular" | "rating" | "title" | "time";
type ViewMode = "grid" | "list";

export default function LibraryPage() {
  const router = useRouter();
  const { userId } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  useEffect(() => {
    const promises = [
      fetch("/api/books?limit=100").then((r) => r.json()),
      fetch("/api/book-categories").then((r) => r.json()),
    ];
    if (userId) {
      promises.push(fetch(`/api/books/recommend?userId=${userId}&limit=4`).then((r) => r.json()));
    }
    Promise.all(promises)
      .then((results) => {
        setAllBooks(results[0].books || []);
        setCategories(results[1].categories || []);
        if (results[2]) setRecommendedBooks(results[2].books || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // البحث
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/books/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.books || []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // فلترة + ترتيب
  const displayedBooks = useMemo(() => {
    let books = isSearching ? searchResults : allBooks;
    if (activeCategory) books = books.filter((b) => b.category.id === activeCategory);
    if (difficultyFilter) books = books.filter((b) => b.difficulty === difficultyFilter);
    switch (sortBy) {
      case "popular": books = [...books].sort((a, b) => b.views - a.views); break;
      case "rating": books = [...books].sort((a, b) => b.ratingAvg - a.ratingAvg); break;
      case "title": books = [...books].sort((a, b) => a.title.localeCompare(b.title, "ar")); break;
      case "time": books = [...books].sort((a, b) => a.readingTimeMin - b.readingTimeMin); break;
      default: books = [...books].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return books;
  }, [allBooks, searchResults, isSearching, activeCategory, difficultyFilter, sortBy]);

  const featuredBooks = allBooks.filter((b) => b.isFeatured).slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-stone-800 rounded-xl w-full max-w-md" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] bg-stone-800 rounded-lg" />
                  <div className="h-4 bg-stone-800 rounded w-3/4" />
                  <div className="h-3 bg-stone-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 التصميم الجديد Dark Elegant
  // إذا لم تكن هناك فلاتر نشطة، اعرض الصفحة الرئيسية الاحترافية الجديدة
  const hasActiveFilter = isSearching || (activeCategory ?? 0) !== 0 || difficultyFilter !== "";
  if (!hasActiveFilter) {
    return <LibraryHomeDark books={allBooks} categories={categories} />;
  }

  // صفحة نتائج البحث/الفلترة - تصميم Dark أيضاً
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* خلفية متوهّجة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-stone-950/50 backdrop-blur-xl border-b border-stone-800/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-stone-300 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm">الرئيسية</span>
          </button>

          <div className="flex-1 max-w-2xl">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ابحث عن كتاب أو مؤلف..."
              className="bg-stone-900/80 border-stone-700 text-white placeholder-stone-500 focus:border-purple-500"
            />
          </div>

          <Link
            href="/admin/library"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium shadow-lg"
          >
            📚 إدارة
          </Link>
        </div>
      </header>

      {/* المحتوى */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* شريط الفلاتر */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={activeCategory ?? 0}
            onChange={(e) => setActiveCategory(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-sm"
          >
            <option value={0}>📂 كل التصنيفات ({allBooks.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-sm"
          >
            <option value="recent">🆕 الأحدث</option>
            <option value="popular">🔥 الأشهر</option>
            <option value="rating">⭐ الأعلى تقييماً</option>
            <option value="title">📚 أبجدياً</option>
            <option value="time">⏱️ الأقصر</option>
          </select>

          {(isSearching || activeCategory !== 0 || difficultyFilter !== "") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(0);
                setDifficultyFilter("");
                setIsSearching(false);
              }}
              className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm transition-colors"
            >
              ✕ مسح الفلاتر
            </button>
          )}
        </div>

        {/* عدد النتائج */}
        <div className="mb-4">
          <p className="text-sm text-stone-400">
            {isSearching && searchQuery ? (
              <>نتائج البحث عن "<span className="text-purple-300">{searchQuery}</span>"</>
            ) : (
              <>عرض كل الكتب</>
            )}{" "}
            ({displayedBooks.length} كتاب)
          </p>
        </div>

        {/* شبكة الكتب */}
        {displayedBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayedBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.5) }}
              >
                <Link href={`/library/${book.id}`} className="block group">
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
                  <div className="mt-2 px-1">
                    <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 truncate">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-amber-400">⭐ {book.ratingAvg || "—"}</span>
                      <span className="text-stone-600">·</span>
                      <span className="text-stone-500">👁️ {book.views}</span>
                      {book.pdfUrl && (
                        <>
                          <span className="text-stone-600">·</span>
                          <span className="text-blue-400">📄</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-stone-300 mb-2">لا توجد كتب مطابقة</h3>
            <p className="text-stone-500 mb-6">جرّب كلمات بحث أو فلاتر مختلفة</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(0);
                setDifficultyFilter("");
                setIsSearching(false);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium"
            >
              عرض كل الكتب
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// شبكة الكتب
// ============================================================
function BookGrid({ books, viewMode }: { books: Book[]; viewMode: ViewMode }) {
  return (
    <div className={cn(
      "gap-4",
      viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col"
    )}>
      {books.map((book, idx) => (
        <BookCard key={book.id} book={book} index={idx} viewMode={viewMode} />
      ))}
    </div>
  );
}

// ============================================================
// بطاقة كتاب
// ============================================================
function BookCard({ book, index, viewMode }: { book: Book; index: number; viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.03, 0.5) }}>
        <Link href={`/library/${book.id}`}>
          <Card className="flex gap-4 p-3 hover:shadow-lg transition-all cursor-pointer group border-stone-200 hover:border-indigo-300">
            <BookCover title={book.title} author={book.author} categoryName={book.category.name} difficulty={book.difficulty} size="sm" coverImageUrl={book.coverImage} showPdfBadge={!!book.pdfUrl} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-stone-900 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
              <p className="text-sm text-stone-500 mb-2">{book.author}</p>
              <p className="text-xs text-stone-600 line-clamp-2 mb-2">{book.description}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <span>⭐ {book.ratingAvg || "—"}</span>
                <span>📑 {book._count.chapters} فصول</span>
                <span>⏱️ {book.readingTimeMin}د</span>
                <span>👁️ {book.views}</span>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * 0.03, 0.5) }}>
      <Link href={`/library/${book.id}`}>
        <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all group h-full p-3 border-stone-200 hover:border-indigo-300">
          <div className="relative mb-3 flex justify-center">
            <div className="transition-transform group-hover:scale-105 group-hover:-rotate-1">
              <BookCover title={book.title} author={book.author} categoryName={book.category.name} difficulty={book.difficulty} size="sm" coverImageUrl={book.coverImage} showPdfBadge={!!book.pdfUrl} />
            </div>
            {book.isFeatured && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-md z-10">⭐</span>
            )}
            {book.isPremium && (
              <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[8px] font-bold shadow-md z-10">PRO</span>
            )}
          </div>
          <h3 className="font-bold text-sm text-stone-900 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
          <p className="text-xs text-stone-500 truncate mb-2">{book.author}</p>
          <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-2">
            <span className="flex items-center gap-1">
              <span className="text-amber-500">⭐</span>
              <span className="font-medium">{book.ratingAvg || "—"}</span>
            </span>
            <span>📑 {book._count.chapters}</span>
            <span>⏱️ {book.readingTimeMin}د</span>
            <span>👁️ {book.views > 999 ? `${(book.views / 1000).toFixed(1)}K` : book.views}</span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// بطاقة كتاب مميز (أكبر)
// ============================================================
function FeaturedCard({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
    >
      <Link href={`/library/${book.id}`}>
        <Card className="overflow-hidden cursor-pointer hover:shadow-2xl transition-all group h-full border-2 border-amber-200 hover:border-amber-400 bg-gradient-to-b from-amber-50/50 to-white">
          <div className="relative p-4 flex justify-center bg-gradient-to-b from-amber-50 to-transparent">
            <div className="transition-transform group-hover:scale-110 group-hover:-rotate-2">
              <BookCover title={book.title} author={book.author} categoryName={book.category.name} difficulty={book.difficulty} size="md" coverImageUrl={book.coverImage} showPdfBadge={!!book.pdfUrl} />
            </div>
            <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-400 text-white text-[10px] font-bold shadow-md">⭐ مميز</span>
          </div>
          <div className="p-4 pt-2">
            <h3 className="font-bold text-stone-900 truncate group-hover:text-amber-600 transition-colors">{book.title}</h3>
            <p className="text-sm text-stone-500 mb-2">{book.author}</p>
            <p className="text-xs text-stone-600 line-clamp-2 mb-3">{book.description}</p>
            <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-2">
              <span className="flex items-center gap-1"><span className="text-amber-500">⭐</span><span className="font-bold text-stone-700">{book.ratingAvg || "—"}</span></span>
              <span>📑 {book._count.chapters} فصول</span>
              <span>⏱️ {Math.floor(book.readingTimeMin / 60) > 0 ? `${Math.floor(book.readingTimeMin / 60)} ساعة` : `${book.readingTimeMin} دقيقة`}</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// حالة فارغة
// ============================================================
function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-bold text-stone-700 mb-1">{title}</h3>
      <p className="text-stone-400 text-sm">{message}</p>
    </div>
  );
}
