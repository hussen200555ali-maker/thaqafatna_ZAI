"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Author {
  name: string;
  booksCount: number;
  totalViews: number;
  totalDownloads: number;
  avgRating: number;
  featuredCount: number;
}

export default function AuthorsListPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "books" | "rating" | "downloads">("popular");

  useEffect(() => {
    fetch("/api/books/authors")
      .then((r) => r.json())
      .then((data) => setAuthors(data.authors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAuthors = authors
    .filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      if (sortBy === "popular") return b.totalViews - a.totalViews;
      if (sortBy === "books") return b.booksCount - a.booksCount;
      if (sortBy === "rating") return b.avgRating - a.avgRating;
      if (sortBy === "downloads") return b.totalDownloads - a.totalDownloads;
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-stone-800 rounded-xl w-64" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800">
                  <div className="w-16 h-16 rounded-full bg-stone-800 mx-auto mb-3" />
                  <div className="h-4 bg-stone-800 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-stone-800 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-stone-300 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm">المكتبة</span>
          </button>
          <div className="text-sm text-stone-300">
            ✍️ {authors.length} مؤلف
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">✍️</span>
            <span>مؤلفو المكتبة</span>
          </h1>
          <p className="text-stone-400 text-sm">
            اكتشف {authors.length} مؤلفاً يثرون المكتبة العربية
          </p>
        </motion.div>

        {/* شريط البحث والترتيب */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ابحث عن مؤلف..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-white placeholder-stone-500 focus:border-purple-500 outline-none transition-colors"
          />

          <div className="flex gap-1 p-1 rounded-xl bg-stone-900/50 border border-stone-800">
            {[
              { value: "popular", label: "🔥 الأشهر" },
              { value: "books", label: "📚 الأكثر كتباً" },
              { value: "rating", label: "⭐ الأعلى تقييماً" },
              { value: "downloads", label: "📥 الأكثر تنزيلاً" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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

        {/* شبكة المؤلفين */}
        {filteredAuthors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAuthors.map((author, idx) => (
              <motion.div
                key={author.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.5) }}
              >
                <Link
                  href={`/library/authors/${encodeURIComponent(author.name)}`}
                  className="block p-5 rounded-2xl bg-stone-900/50 border border-stone-800 hover:border-purple-500/50 transition-all group"
                >
                  {/* صورة المؤلف */}
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {author.name.charAt(0)}
                    </div>
                    {author.featuredCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-xs shadow-lg">
                        ⭐
                      </div>
                    )}
                  </div>

                  {/* اسم المؤلف */}
                  <h3 className="text-center font-bold text-stone-200 truncate mb-3 group-hover:text-purple-300 transition-colors">
                    {author.name}
                  </h3>

                  {/* إحصائيات مصغّرة */}
                  <div className="grid grid-cols-3 gap-1 text-xs text-center">
                    <div>
                      <div className="font-bold text-purple-400">{author.booksCount}</div>
                      <div className="text-stone-600">كتاب</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-400">
                        {author.totalViews > 999 ? `${(author.totalViews / 1000).toFixed(1)}K` : author.totalViews}
                      </div>
                      <div className="text-stone-600">قارئ</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-400">{author.avgRating.toFixed(1)}</div>
                      <div className="text-stone-600">⭐</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-300 mb-2">لا يوجد مؤلفون مطابقون</h3>
            <p className="text-stone-500 mb-6">جرّب اسماً آخر</p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium"
            >
              عرض كل المؤلفين
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
