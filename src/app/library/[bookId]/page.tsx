"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/game-store";
import { CertificateDisplay } from "@/components/library/certificate-display";

/**
 * صفحة الكتاب التفصيلية
 * تعرض: معلومات الكتاب + الفصول + التقييمات + أزرار القراءة
 */

interface Chapter {
  id: number;
  number: number;
  title: string;
  readingTimeMin: number;
  isFree: boolean;
  relatedLevelId: number | null;
}

interface BookDetail {
  id: number;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  contentType: string;
  pdfUrl: string;
  difficulty: string;
  readingTimeMin: number;
  pages: number;
  language: string;
  keywords: string[];
  relatedLevels: number[];
  views: number;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isPremium: boolean;
  category: { id: number; name: string; icon: string; color: string };
  chapters: Chapter[];
  reviews: any[];
  _count: { reviews: number; bookmarks: number };
}

export default function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const router = useRouter();
  const { userId } = useGameStore();
  const [bookId, setBookId] = useState<number | null>(null);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    params.then((p) => setBookId(parseInt(p.bookId)));
  }, [params]);

  useEffect(() => {
    if (!bookId) return;
    const url = userId
      ? `/api/books/${bookId}?userId=${userId}`
      : `/api/books/${bookId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setBook(data.book);
        setReadingProgress(data.readingProgress);
        setIsBookmarked(data.isBookmarked);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId, userId]);

  const handleBookmark = async () => {
    if (!userId || !bookId) return;
    try {
      const response = await fetch(`/api/books/${bookId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentChapter: readingProgress?.currentChapter || 1 }),
      });
      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitRating = async (rating: number) => {
    if (!userId || !bookId) return;
    setUserRating(rating);
    try {
      const response = await fetch(`/api/books/${bookId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rating }),
      });
      if (response.ok) {
        const data = await response.json();
        // تحديث الكتاب بالتقييم الجديد
        if (book) {
          setBook({
            ...book,
            ratingAvg: data.avgRating,
            ratingCount: data.ratingCount,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent"
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <Card className="p-8 text-center">
          <p className="text-stone-600 mb-4">الكتاب غير موجود</p>
          <Button onClick={() => router.push("/library")}>العودة للمكتبة</Button>
        </Card>
      </div>
    );
  }

  const difficultyInfo: Record<string, { label: string; color: string; icon: string }> = {
    easy: { label: "مبتدئ", color: "text-green-600 bg-green-100", icon: "🟢" },
    medium: { label: "متوسط", color: "text-amber-600 bg-amber-100", icon: "🟡" },
    hard: { label: "متقدم", color: "text-red-600 bg-red-100", icon: "🔴" },
  };
  const diff = difficultyInfo[book.difficulty] || difficultyInfo.medium;
  const completedChapters = readingProgress?.completedChapters || [];
  const completionRate = book.chapters.length > 0
    ? Math.round((completedChapters.length / book.chapters.length) * 100)
    : 0;
  const nextChapter = readingProgress?.currentChapter || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* الرأس */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-medium">المكتبة</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                isBookmarked ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              )}
              title="إشارة مرجعية"
            >
              {isBookmarked ? "🔖" : "📑"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ===== معلومات الكتاب ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 sm:gap-6"
        >
          {/* الغلاف */}
          <div className="w-28 h-40 sm:w-36 sm:h-52 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl flex-shrink-0 shadow-lg">
            📕
          </div>
          {/* المعلومات */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: "var(--font-tajawal)" }}>
              {book.title}
            </h1>
            <p className="text-sm text-stone-500 mb-3">{book.author}</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-amber-500 text-sm font-bold">⭐ {book.ratingAvg || "—"}</span>
              <span className="text-xs text-stone-400">({book.ratingCount} تقييم)</span>
              <span className="text-xs text-stone-400">👁️ {book.views} قارئ</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {book.category.icon} {book.category.name}
              </Badge>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", diff.color)}>
                {diff.icon} {diff.label}
              </span>
              <span className="text-xs text-stone-400">⏱️ {book.readingTimeMin} دقيقة</span>
              {book.pages > 0 && <span className="text-xs text-stone-400">📄 {book.pages} صفحة</span>}
            </div>
          </div>
        </motion.div>

        {/* ===== شريط التقدّم ===== */}
        {readingProgress && (
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-indigo-700">📊 تقدّمك في القراءة</span>
              <span className="text-sm text-indigo-600">{completionRate}%</span>
            </div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
              />
            </div>
            <p className="text-xs text-indigo-400 mt-1">
              {completedChapters.length} من {book.chapters.length} فصل مكتمل
            </p>
          </Card>
        )}

        {/* ===== الوصف ===== */}
        <div>
          <h2 className="text-lg font-bold text-stone-700 mb-2">📝 الوصف</h2>
          <p className="text-sm text-stone-600 leading-relaxed">{book.description}</p>
        </div>

        {/* ===== الكلمات المفتاحية ===== */}
        {book.keywords.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-stone-500 mb-2">🏷️ الكلمات المفتاحية</h2>
            <div className="flex flex-wrap gap-2">
              {book.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== أزرار الإجراء ===== */}
        <div className="flex gap-3">
          <Link href={`/library/reader/${book.id}/${nextChapter}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg">
              {readingProgress ? "📖 متابعة القراءة" : "📖 ابدأ القراءة"}
            </Button>
          </Link>
          {book.pdfUrl && (
            <a href={book.pdfUrl} download className="flex-1">
              <Button variant="outline" className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50 py-3 rounded-xl">
                ⬇️ تنزيل PDF
              </Button>
            </a>
          )}
        </div>

        {/* ===== الفصول ===== */}
        <div>
          <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
            📑 الفصول ({book.chapters.length})
          </h2>
          <div className="space-y-2">
            {book.chapters.map((chapter, idx) => {
              const isCompleted = completedChapters.includes(chapter.number);
              const isCurrent = readingProgress?.currentChapter === chapter.number;
              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/library/reader/${book.id}/${chapter.number}`}>
                    <Card className={cn(
                      "p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-3",
                      isCurrent ? "border-indigo-400 bg-indigo-50" : "border-stone-200",
                      isCompleted && "border-green-300 bg-green-50"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                        isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-indigo-500 text-white" : "bg-stone-200 text-stone-600"
                      )}>
                        {isCompleted ? "✓" : chapter.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-stone-800 truncate">{chapter.title}</h3>
                        <p className="text-xs text-stone-400">⏱️ {chapter.readingTimeMin} دقيقة</p>
                      </div>
                      {chapter.relatedLevelId && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">
                          🎮 لغز
                        </Badge>
                      )}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ===== شهادة الإتقان ===== */}
        {readingProgress?.completedAt && (
          <div>
            <CertificateDisplay
              bookId={book.id}
              userId={userId}
              bookTitle={book.title}
              bookAuthor={book.author}
            />
          </div>
        )}

        {/* ===== التقييم ===== */}
        <Card className="p-5">
          <h2 className="font-bold text-stone-700 mb-3">⭐ تقييمك</h2>
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-transform hover:scale-110"
              >
                <span className={cn(
                  (hoverRating || userRating) >= star ? "text-amber-400" : "text-stone-300"
                )}>
                  ★
                </span>
              </button>
            ))}
            {userRating > 0 && (
              <span className="text-sm text-stone-500 mr-2">شكراً لتقييمك!</span>
            )}
          </div>
          {book.reviews.length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t border-stone-100">
              <h3 className="text-sm font-bold text-stone-600">آخر المراجعات</h3>
              {book.reviews.map((review: any, i: number) => (
                <div key={i} className="bg-stone-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-700">{review.user.name || "قارئ"}</span>
                    <span className="text-amber-400 text-xs">{"★".repeat(review.rating)}</span>
                  </div>
                  {review.review && <p className="text-xs text-stone-600">{review.review}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
