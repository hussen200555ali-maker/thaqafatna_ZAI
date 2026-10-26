"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/library/book-cover";
import { useGameStore } from "@/lib/game-store";
import { cn } from "@/lib/utils";

type Tab = "bookmarks" | "reading" | "completed" | "reviews" | "certificates";

interface BookData {
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

interface LibraryData {
  user: { id: string; name: string; coins: number };
  stats: {
    totalBookmarks: number;
    totalReading: number;
    totalCompleted: number;
    totalReviews: number;
    totalCertificates: number;
    totalReadingMinutes: number;
  };
  bookmarks: Array<{ id: number; createdAt: string; book: BookData }>;
  inProgress: Array<{ id: number; currentChapter: number; currentScroll: number; timeSpentSec: number; lastReadAt: string; book: BookData }>;
  completed: Array<{ id: number; currentChapter: number; currentScroll: number; timeSpentSec: number; completedAt: string | null; book: BookData }>;
  reviews: Array<{ id: number; rating: number; comment: string; createdAt: string; book: { id: number; title: string; author: string; coverImage: string } }>;
  certificates: Array<{ id: number; certificateNumber: string; issuedAt: string; book: { id: number; title: string; author: string } }>;
}

export default function MyLibraryPage() {
  const router = useRouter();
  const { userId } = useGameStore();
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bookmarks");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`/api/books/my-library?userId=${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load library");
        return r.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "bookmarks", label: "المفضلة", icon: "🔖", count: data?.stats.totalBookmarks || 0 },
    { id: "reading", label: "قيد القراءة", icon: "📖", count: data?.stats.totalReading || 0 },
    { id: "completed", label: "مكتملة", icon: "✅", count: data?.stats.totalCompleted || 0 },
    { id: "reviews", label: "تقييماتي", icon: "⭐", count: data?.stats.totalReviews || 0 },
    { id: "certificates", label: "شهاداتي", icon: "🏆", count: data?.stats.totalCertificates || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-stone-800 rounded-3xl" />
            <div className="h-12 bg-stone-800 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-7xl mb-6">🔐</div>
          <h1 className="text-3xl font-bold text-white mb-3">سجّل دخولك أولاً</h1>
          <p className="text-stone-400 mb-8">
            للوصول إلى مكتبتك الشخصية يجب تسجيل الدخول. ابدأ رحلتك مع المكتبة من الصفحة الرئيسية.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium transition-all hover:scale-105"
          >
            <span>الصفحة الرئيسية</span>
            <span>←</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl text-stone-300 mb-2">تعذّر تحميل المكتبة</h1>
          <p className="text-stone-500">حاول مرة أخرى لاحقاً</p>
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
          <h1 className="text-lg font-bold text-white">⭐ مكتبتي</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ===== بطاقة المستخدم + إحصائيات ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-3xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 backdrop-blur overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* صورة المستخدم */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-50" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                {data.user.name?.charAt(0) || "م"}
              </div>
            </div>

            {/* الاسم + العملات */}
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-2xl font-bold text-white mb-1">
                {data.user.name || "قارئ"}
              </h1>
              <p className="text-stone-400 text-sm mb-2">📚 مكتبتي الشخصية</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                <span>💰</span>
                <span>{data.user.coins} عملة</span>
              </div>
            </div>

            {/* إحصائيات */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "مفضلة", value: data.stats.totalBookmarks, icon: "🔖", color: "text-purple-400" },
                { label: "قيد القراءة", value: data.stats.totalReading, icon: "📖", color: "text-blue-400" },
                { label: "مكتملة", value: data.stats.totalCompleted, icon: "✅", color: "text-emerald-400" },
              ].map((stat, i) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-stone-900/50 border border-stone-800 text-center min-w-[80px]">
                  <div className="text-lg">{stat.icon}</div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* إحصائية وقت القراءة */}
          <div className="mt-4 pt-4 border-t border-stone-800/50 flex items-center justify-between text-sm">
            <span className="text-stone-400">⏱️ إجمالي وقت القراءة</span>
            <span className="font-bold text-white">
              {Math.floor(data.stats.totalReadingMinutes)} دقيقة
              <span className="text-stone-500 mr-2">·</span>
              <span className="text-emerald-400">
                ({Math.floor(data.stats.totalReadingMinutes / 60)} ساعة)
              </span>
            </span>
          </div>
        </motion.div>

        {/* ===== تبويبات ===== */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900/50 border border-stone-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                  : "text-stone-400 hover:text-white"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.id ? "bg-white/20" : "bg-stone-800"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ===== المحتوى حسب التبويب ===== */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* المفضلة */}
          {activeTab === "bookmarks" && (
            <div>
              {data.bookmarks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {data.bookmarks.map((b, idx) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={`/library/${b.book.id}`} className="block group">
                        <BookCover
                          title={b.book.title}
                          author={b.book.author}
                          categoryName={b.book.category.name}
                          difficulty={b.book.difficulty}
                          size="md"
                          coverImageUrl={b.book.coverImage}
                          showPdfBadge={!!b.book.pdfUrl}
                          className="group-hover:scale-105 transition-transform"
                        />
                        <div className="mt-2 px-1">
                          <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                            {b.book.title}
                          </h3>
                          <p className="text-xs text-stone-500 truncate">{b.book.author}</p>
                          <p className="text-[10px] text-stone-600 mt-1">
                            🔖 {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🔖"
                  title="لا توجد كتب في مفضلتك"
                  message="اضغط على علامة 📑 في صفحة أي كتاب لإضافته للمفضلة"
                />
              )}
            </div>
          )}

          {/* قيد القراءة */}
          {activeTab === "reading" && (
            <div>
              {data.inProgress.length > 0 ? (
                <div className="space-y-3">
                  {data.inProgress.map((rp, idx) => (
                    <motion.div
                      key={rp.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={`/library/reader/${rp.book.id}/${rp.currentChapter}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800 hover:border-purple-500/50 transition-all group"
                      >
                        <BookCover
                          title={rp.book.title}
                          author={rp.book.author}
                          categoryName={rp.book.category.name}
                          difficulty={rp.book.difficulty}
                          size="sm"
                          coverImageUrl={rp.book.coverImage}
                          showPdfBadge={!!rp.book.pdfUrl}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                            {rp.book.title}
                          </h3>
                          <p className="text-xs text-stone-500 mb-2">{rp.book.author}</p>

                          {/* شريط التقدّم */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                                style={{ width: `${Math.round(rp.currentScroll || 0)}%` }}
                              />
                            </div>
                            <span className="text-xs text-purple-400 font-bold">
                              {Math.round(rp.currentScroll || 0)}%
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500">
                            <span>📖 الفصل {rp.currentChapter}</span>
                            <span>⏱️ {Math.round(rp.timeSpentSec / 60)} دقيقة</span>
                          </div>
                        </div>
                        <div className="text-stone-600 group-hover:text-purple-400 transition-colors">
                          ←
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📖"
                  title="لا توجد كتب قيد القراءة"
                  message="ابدأ بقراءة كتاب من المكتبة وستجده هنا"
                />
              )}
            </div>
          )}

          {/* مكتملة */}
          {activeTab === "completed" && (
            <div>
              {data.completed.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {data.completed.map((rp, idx) => (
                    <motion.div
                      key={rp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={`/library/${rp.book.id}`} className="block group">
                        <div className="relative">
                          <BookCover
                            title={rp.book.title}
                            author={rp.book.author}
                            categoryName={rp.book.category.name}
                            difficulty={rp.book.difficulty}
                            size="md"
                            coverImageUrl={rp.book.coverImage}
                            showPdfBadge={!!rp.book.pdfUrl}
                            className="group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                            ✓
                          </div>
                        </div>
                        <div className="mt-2 px-1">
                          <h3 className="text-sm font-bold text-stone-200 truncate group-hover:text-purple-300 transition-colors">
                            {rp.book.title}
                          </h3>
                          <p className="text-xs text-emerald-400">✅ مكتمل</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="✅"
                  title="لم تكمل أي كتاب بعد"
                  message="أكمل قراءة كتاب (90%+) لتجده هنا"
                />
              )}
            </div>
          )}

          {/* التقييمات */}
          {activeTab === "reviews" && (
            <div>
              {data.reviews.length > 0 ? (
                <div className="space-y-3">
                  {data.reviews.map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800"
                    >
                      <div className="flex items-start gap-3">
                        <Link href={`/library/${review.book.id}`} className="flex-shrink-0">
                          {review.book.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={review.book.coverImage}
                              alt={review.book.title}
                              className="w-14 h-20 rounded-lg object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                              📕
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/library/${review.book.id}`}
                            className="font-bold text-stone-200 hover:text-purple-300 transition-colors block truncate"
                          >
                            {review.book.title}
                          </Link>
                          <p className="text-xs text-stone-500 mb-2">{review.book.author}</p>
                          <div className="flex mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= review.rating ? "#fbbf24" : "none"} stroke={s <= review.rating ? "#fbbf24" : "#52525b"} strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                            <span className="text-xs text-stone-500 mr-2">
                              · {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-stone-400">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="⭐"
                  title="لم تُقيّم أي كتاب"
                  message="قيّم الكتب التي قرأتها لمساعدة الآخرين"
                />
              )}
            </div>
          )}

          {/* الشهادات */}
          {activeTab === "certificates" && (
            <div>
              {data.certificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.certificates.map((cert, idx) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">🏆</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-sm">
                            {cert.book.title}
                          </h3>
                          <p className="text-xs text-stone-400">{cert.book.author}</p>
                        </div>
                      </div>
                      <div className="text-xs text-amber-400 font-mono">
                        #{cert.certificateNumber}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        📅 {new Date(cert.issuedAt).toLocaleDateString('ar-EG')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🏆"
                  title="لا توجد شهادات"
                  message="أكمل قراءة كتاب للحصول على شهادة إتقان"
                />
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-xl font-bold text-stone-300 mb-2">{title}</h3>
      <p className="text-stone-500 mb-6">{message}</p>
      <Link
        href="/library"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium transition-all hover:scale-105"
      >
        <span>تصفّح المكتبة</span>
        <span>←</span>
      </Link>
    </motion.div>
  );
}
