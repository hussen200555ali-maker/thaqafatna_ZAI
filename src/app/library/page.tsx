"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/game-store";

/**
 * صفحة المكتبة الرئيسية
 * تعرض: كتب مميزة + تصنيفات + بحث + الأكثر قراءة + استكمال القراءة
 */

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  difficulty: string;
  readingTimeMin: number;
  pages: number;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  isFeatured: boolean;
  category: { id: number; name: string; icon: string; color: string };
  _count: { chapters: number; reviews: number };
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  booksCount: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const { userId } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [continueReading, setContinueReading] = useState<any[]>([]);

  useEffect(() => {
    const promises = [
      fetch("/api/books/featured").then((r) => r.json()),
      fetch("/api/books?limit=50").then((r) => r.json()),
      fetch("/api/book-categories").then((r) => r.json()),
    ];

    // إضافة طلب التوصيات إن وُجد userId
    if (userId) {
      promises.push(
        fetch(`/api/books/recommend?userId=${userId}&limit=6`).then((r) => r.json())
      );
    }

    Promise.all(promises)
      .then((results) => {
        setFeaturedBooks(results[0].books || []);
        setAllBooks(results[1].books || []);
        setCategories(results[2].categories || []);
        if (results[3]) {
          setRecommendedBooks(results[3].books || []);
        }
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

  const displayedBooks = isSearching
    ? searchResults
    : activeCategory
    ? allBooks.filter((b) => b.category.id === activeCategory)
    : allBooks;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent"
        />
        <p className="text-indigo-600 ml-4 text-sm">جاري تحميل المكتبة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* ===== الرأس ===== */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-sm font-medium">الرئيسية</span>
            </button>
            <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
              📚 مكتبة ثقافتنا
            </h1>
            <div className="w-20" />
          </div>

          {/* شريط البحث */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ابحث عن كتاب، مؤلف، أو موضوع..."
              className="w-full h-12 text-base pr-4 pl-12 rounded-2xl border-2 border-indigo-200 focus:border-indigo-400 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* ===== البحث نشط ===== */}
        {isSearching ? (
          <section>
            <h2 className="text-lg font-bold text-stone-700 mb-3">
              نتائج البحث عن "{searchQuery}" ({searchResults.length})
            </h2>
            {searchResults.length > 0 ? (
              <BookGrid books={searchResults} />
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-stone-500">لا توجد نتائج مطابقة</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* ===== كتب مميزة ===== */}
            {featuredBooks.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                  ⭐ كتب مميزة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredBooks.map((book, idx) => (
                    <FeaturedBookCard key={book.id} book={book} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* ===== التصنيفات ===== */}
            <section>
              <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                📂 تصفّح حسب التصنيف
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <CategoryChip
                  active={activeCategory === null}
                  onClick={() => setActiveCategory(null)}
                  icon="📚"
                  label="الكل"
                  count={allBooks.length}
                />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    icon={cat.icon}
                    label={cat.name}
                    count={cat.booksCount}
                  />
                ))}
              </div>
            </section>

            {/* ===== توصيات لك ===== */}
            {recommendedBooks.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                  🎯 توصيات لك
                  <span className="text-xs text-stone-400">بناءً على قراءاتك</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {recommendedBooks.slice(0, 6).map((book, idx) => (
                    <BookCard key={book.id} book={book} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* ===== كل الكتب ===== */}
            <section>
              <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
                {activeCategory ? "📖 كتب هذا التصنيف" : "🔥 كل الكتب"}
                <span className="text-sm text-stone-400">({displayedBooks.length})</span>
              </h2>
              {displayedBooks.length > 0 ? (
                <BookGrid books={displayedBooks} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📚</div>
                  <p className="text-stone-500">لا توجد كتب في هذا التصنيف بعد</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================
// بطاقة كتاب مميز
// ============================================================
function FeaturedBookCard({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/library/${book.id}`}>
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-2 border-indigo-200 hover:border-indigo-400 group">
          <div className="flex gap-4 p-4">
            {/* الغلاف */}
            <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl flex-shrink-0 shadow-md">
              📕
            </div>
            {/* المعلومات */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-stone-800 truncate group-hover:text-indigo-600 transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-stone-500 mb-2">{book.author}</p>
              <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                <span>{book.category.icon} {book.category.name}</span>
                <span>·</span>
                <span>⏱️ {book.readingTimeMin} دقيقة</span>
              </div>
              <p className="text-xs text-stone-600 line-clamp-2">{book.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-amber-500">⭐ {book.ratingAvg || "—"}</span>
                <span className="text-stone-400">👁️ {book.views}</span>
                <span className="text-stone-400">📑 {book._count.chapters} فصول</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// شبكة الكتب
// ============================================================
function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {books.map((book, idx) => (
        <BookCard key={book.id} book={book} index={idx} />
      ))}
    </div>
  );
}

// ============================================================
// بطاقة كتاب عادية
// ============================================================
function BookCard({ book, index }: { book: Book; index: number }) {
  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };
  const difficultyLabels: Record<string, string> = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/library/${book.id}`}>
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group h-full">
          {/* الغلاف */}
          <div className="aspect-[3/4] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl relative">
            📕
            {book.isFeatured && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold">
                ⭐ مميز
              </span>
            )}
            <span className={cn(
              "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
              difficultyColors[book.difficulty]
            )}>
              {difficultyLabels[book.difficulty]}
            </span>
          </div>
          {/* المعلومات */}
          <div className="p-3">
            <h3 className="font-bold text-sm text-stone-800 truncate group-hover:text-indigo-600 transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-stone-500 truncate">{book.author}</p>
            <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
              <span>⏱️ {book.readingTimeMin}د</span>
              <span>📑 {book._count.chapters}</span>
              <span>⭐ {book.ratingAvg || "—"}</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ============================================================
// شريحة تصنيف
// ============================================================
function CategoryChip({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
        active
          ? "bg-indigo-100 border-indigo-400 text-indigo-800"
          : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
      <span className="text-[9px] text-stone-400">{count}</span>
    </button>
  );
}
