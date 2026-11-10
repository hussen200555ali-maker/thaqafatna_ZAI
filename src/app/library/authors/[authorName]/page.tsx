"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/library/book-cover";
import { useGameStore } from "@/lib/game-store";

interface AuthorStats {
  name: string;
  totalBooks: number;
  totalViews: number;
  totalDownloads: number;
  avgRating: number;
  featuredBooks: number;
}

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
  keywords: string[];
  category: { id: number; name: string; icon: string; color: string };
  _count: { chapters: number; reviews: number };
  createdAt: string;
}

export default function AuthorPage({ params }: { params: Promise<{ authorName: string }> }) {
  const router = useRouter();
  const { userId } = useGameStore();
  const [authorName, setAuthorName] = useState<string>("");
  const [author, setAuthor] = useState<AuthorStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "recent">("popular");

  useEffect(() => {
    params.then((p) => setAuthorName(decodeURIComponent(p.authorName)));
  }, [params]);

  useEffect(() => {
    if (!authorName) return;

    fetch(`/api/books/by-author?name=${encodeURIComponent(authorName)}`)
      .then((r) => {
        if (!r.ok) throw new Error("المؤلف غير موجود");
        return r.json();
      })
      .then((data) => {
        setAuthor(data.author);
        setBooks(data.books);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [authorName]);

  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === "popular") return b.views - a.views;
    if (sortBy === "rating") return b.ratingAvg - a.ratingAvg;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-stone-800" />
              <div className="space-y-2">
                <div className="h-8 bg-stone-800 rounded w-64" />
                <div className="h-4 bg-stone-800 rounded w-48" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-white mb-2">المؤلف غير موجود</h1>
          <p className="text-stone-400 mb-6">لم نعثر على كتب لهذا المؤلف</p>
          <Link
            href="/library"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium"
          >
            العودة للمكتبة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* خلفية متوهّجة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-stone-950/50 backdrop-blur-xl border-b border-stone-800/50 sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-stone-300 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm">المكتبة</span>
          </button>
          <Link
            href="/library/authors"
            className="text-sm text-stone-300 hover:text-white"
          >
            كل المؤلفين
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ===== بطاقة المؤلف ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 backdrop-blur overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* صورة المؤلف (أول حرف من اسمه) */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-50" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
                {author.name.charAt(0)}
              </div>
            </div>

            {/* معلومات المؤلف */}
            <div className="flex-1 text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3">
                <span>✍️</span>
                <span>مؤلف</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{author.name}</h1>
              <p className="text-stone-400 text-sm mb-4">
                {author.totalBooks > 0
                  ? `صاحب ${author.totalBooks} كتاب في المكتبة`
                  : "مؤلف"}
              </p>

              {/* إحصائيات المؤلف */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {[
                  { label: "كتاب", value: author.totalBooks, icon: "📚", color: "text-purple-400" },
                  { label: "قارئ", value: author.totalViews, icon: "👁️", color: "text-blue-400" },
                  { label: "تنزيل", value: author.totalDownloads, icon: "📥", color: "text-emerald-400" },
                  { label: "تقييم", value: author.avgRating.toFixed(1), icon: "⭐", color: "text-amber-400" },
                ].map((stat, i) => (
                  <div key={i} className="p-3 rounded-xl bg-stone-900/50 border border-stone-800 text-center">
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {typeof stat.value === "number" ? stat.value.toLocaleString("ar-EG") : stat.value}
                    </div>
                    <div className="text-xs text-stone-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== أزرار الترتيب ===== */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">📖</span>
            <span>كتب المؤلف</span>
            <span className="text-sm text-stone-500 font-normal">({books.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">ترتيب:</span>
            <div className="flex gap-1 p-1 rounded-lg bg-stone-900/50 border border-stone-800">
              {[
                { value: "popular", label: "🔥 الأشهر" },
                { value: "rating", label: "⭐ الأعلى تقييماً" },
                { value: "recent", label: "🆕 الأحدث" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== شبكة كتب المؤلف ===== */}
        {sortedBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
              >
                <Link href={`/library/${book.id}`} className="block group">
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
                    {book.isFeatured && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs shadow-lg">
                        ⭐
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-1">
                    <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-amber-400">⭐ {book.ratingAvg || "—"}</span>
                      <span className="text-stone-600">·</span>
                      <span className="text-stone-500">👁️ {book.views}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-stone-300 mb-2">لا توجد كتب لهذا المؤلف</h3>
          </div>
        )}

        {/* ===== CTA: اكتشف مؤلفين آخرين ===== */}
        <div className="text-center pt-8">
          <Link
            href="/library/authors"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium transition-all hover:scale-105"
          >
            <span>استكشف مؤلفين آخرين</span>
            <span>←</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
