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
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-stone-200 rounded-xl w-full max-w-md" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] bg-stone-200 rounded-lg" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ===== Header ===== */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "var(--font-tajawal)" }}>📚 مكتبة ثقافتنا</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600" title="تبديل العرض">
                {viewMode === "grid" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* شريط البحث */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ابحث عن كتاب، مؤلف، أو موضوع..."
              className="w-full h-12 text-base pr-4 pl-12 rounded-xl border-2 border-stone-200 focus:border-indigo-400 bg-stone-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 text-sm">✕</button>
            )}
          </div>

          {/* شريط التصنيفات */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => { setActiveCategory(null); setDifficultyFilter(null); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                !activeCategory && !difficultyFilter ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              الكل ({allBooks.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                  activeCategory === cat.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs opacity-60">({cat.booksCount})</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {isSearching ? (
          /* ===== نتائج البحث ===== */
          <section>
            <h2 className="text-lg font-bold text-stone-800 mb-4">
              نتائج البحث عن "{searchQuery}" — {searchResults.length} كتاب
            </h2>
            {searchResults.length > 0 ? (
              <BookGrid books={searchResults} viewMode={viewMode} />
            ) : (
              <EmptyState icon="🔍" title="لا توجد نتائج" message="جرّب كلمات بحث مختلفة" />
            )}
          </section>
        ) : (
          <>
            {/* ===== كتب مميزة (Carousel-like) ===== */}
            {featuredBooks.length > 0 && !activeCategory && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    ⭐ كتب مميزة
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredBooks.map((book, idx) => (
                    <FeaturedCard key={book.id} book={book} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* ===== توصيات شخصية ===== */}
            {recommendedBooks.length > 0 && !activeCategory && (
              <section>
                <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                  🎯 توصيات لك
                  <span className="text-xs font-normal text-stone-400">بناءً على قراءاتك</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recommendedBooks.map((book, idx) => (
                    <BookCard key={book.id} book={book} index={idx} viewMode="grid" />
                  ))}
                </div>
              </section>
            )}

            {/* ===== شريط الفلترة + الترتيب ===== */}
            <section>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-xl font-bold text-stone-900">
                  {activeCategory ? `${categories.find(c => c.id === activeCategory)?.icon} ${categories.find(c => c.id === activeCategory)?.name}` : "📚 كل الكتب"}
                  <span className="text-sm font-normal text-stone-400 mr-2">({displayedBooks.length})</span>
                </h2>
                <div className="flex items-center gap-2">
                  {/* فلترة بالصعوبة */}
                  <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                    {["easy", "medium", "hard"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-all",
                          difficultyFilter === d ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        {d === "easy" ? "🟢 سهل" : d === "medium" ? "🟡 متوسط" : "🔴 صعب"}
                      </button>
                    ))}
                  </div>
                  {/* ترتيب */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 cursor-pointer hover:border-stone-300"
                  >
                    <option value="newest">📅 الأحدث</option>
                    <option value="popular">🔥 الأكثر قراءة</option>
                    <option value="rating">⭐ الأعلى تقييماً</option>
                    <option value="title">🔤 أبجدياً</option>
                    <option value="time">⏱️ الأقصر وقتاً</option>
                  </select>
                </div>
              </div>

              {displayedBooks.length > 0 ? (
                <BookGrid books={displayedBooks} viewMode={viewMode} />
              ) : (
                <EmptyState icon="📚" title="لا توجد كتب" message="لا توجد كتب مطابقة للفلاتر المختارة" />
              )}
            </section>
          </>
        )}
      </main>
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
