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
import { BookCover } from "@/components/library/book-cover";
import { PDFViewer } from "@/components/library/pdf-viewer";

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
  pdfFileName: string;
  pdfSize: number;
  pdfPageCount: number;
  coverImageFileName: string;
  coverImageSize: number;
  uploadedAt: string | null;
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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
  const [showPdfPreview, setShowPdfPreview] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* خلفية متوهّجة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* الرأس */}
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                isBookmarked ? "bg-amber-500/20 text-amber-400" : "bg-stone-800/50 text-stone-400 hover:bg-stone-800"
              )}
              title="إشارة مرجعية"
            >
              {isBookmarked ? "🔖" : "📑"}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: book.title, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("📋 تم نسخ الرابط");
                }
              }}
              className="w-9 h-9 rounded-lg bg-stone-800/50 hover:bg-stone-800 text-stone-400 flex items-center justify-center transition-colors"
              title="مشاركة"
            >
              🔗
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ===== معلومات الكتاب - تخطيط احترافي ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8"
        >
          {/* الغلاف + شارة PDF */}
          <div className="flex-shrink-0 mx-auto md:mx-0 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-2xl" />
            <div className="relative">
              <BookCover
                title={book.title}
                author={book.author}
                categoryName={book.category.name}
                difficulty={book.difficulty}
                size="lg"
                coverImageUrl={book.coverImage}
                showPdfBadge={!!book.pdfUrl}
              />
            </div>
            {/* أزرار سريعة تحت الغلاف */}
            <div className="mt-4 flex flex-col gap-2">
              {book.pdfUrl && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span>📄</span>
                  <span>متاح كـ PDF</span>
                </div>
              )}
              {book.isFeatured && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <span>⭐</span>
                  <span>كتاب مميز</span>
                </div>
              )}
            </div>
          </div>

          {/* المعلومات الأساسية */}
          <div className="flex-1 min-w-0">
            {/* التصنيف */}
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/library?category=${book.category.id}`}
                className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors"
              >
                {book.category.icon} {book.category.name}
              </Link>
              {book.isPremium && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  💎 Premium
                </span>
              )}
            </div>

            {/* العنوان */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
              {book.title}
            </h1>

            {/* المؤلف */}
            <Link
              href={`/library/authors/${encodeURIComponent(book.author)}`}
              className="inline-flex items-center gap-2 text-stone-400 hover:text-purple-300 transition-colors mb-4"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {book.author.charAt(0)}
              </span>
              <span className="text-base font-medium">{book.author}</span>
              <span className="text-xs text-stone-600">·</span>
              <span className="text-xs text-stone-500">صفحة المؤلف ←</span>
            </Link>

            {/* التقييم + الإحصائيات */}
            <div className="flex items-center gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={star <= Math.round(book.ratingAvg) ? "#fbbf24" : "none"}
                      stroke={star <= Math.round(book.ratingAvg) ? "#fbbf24" : "#52525b"}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-amber-400">{book.ratingAvg || "—"}</span>
                  <span className="text-stone-500"> ({book.ratingCount} تقييم)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-400">
                <span className="flex items-center gap-1">👁️ {book.views} قارئ</span>
                {book.downloads > 0 && <span className="flex items-center gap-1">📥 {book.downloads} تنزيل</span>}
                {book._count?.reviews > 0 && <span className="flex items-center gap-1">💬 {book._count.reviews} مراجعة</span>}
              </div>
            </div>

            {/* معلومات إضافية أنيقة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "الصعوبة", value: diff.label, icon: diff.icon, color: "text-purple-400" },
                { label: "وقت القراءة", value: `${book.readingTimeMin} د`, icon: "⏱️", color: "text-blue-400" },
                { label: "عدد الصفحات", value: book.pages || "—", icon: "📄", color: "text-emerald-400" },
                { label: "اللغة", value: book.language === "ar" ? "عربي" : book.language, icon: "🌐", color: "text-amber-400" },
              ].map((info, i) => (
                <div key={i} className="p-3 rounded-xl bg-stone-900/50 border border-stone-800">
                  <div className="text-xs text-stone-500 mb-1">{info.icon} {info.label}</div>
                  <div className={cn("text-sm font-bold", info.color)}>{info.value}</div>
                </div>
              ))}
            </div>

            {/* أزرار الإجراء الرئيسية */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-600 hover:via-pink-600 hover:to-amber-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.02]"
                  onClick={() => {
                    if (book.pdfUrl) {
                      setShowPdfPreview(true);
                    } else {
                      router.push(`/library/reader/${book.id}/${nextChapter}`);
                    }
                  }}
                >
                  {book.pdfUrl ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xl">📄</span>
                      <span>{readingProgress ? "📖 متابعة القراءة" : "📖 اقرأ الآن"}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-xl">📖</span>
                      <span>{readingProgress ? "متابعة القراءة" : "ابدأ القراءة"}</span>
                    </span>
                  )}
                </Button>

                {book.pdfUrl && (
                  <Button
                    variant="outline"
                    className="h-14 px-6 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-2xl bg-transparent"
                    onClick={async () => {
                      if (!userId) {
                        alert('⚠️ يجب تسجيل الدخول لتنزيل الكتاب\n\nسجّل دخولك من الصفحة الرئيسية للحصول على معرّف مستخدم.');
                        return;
                      }
                      window.location.href = `/api/books/${book.id}/download?userId=${encodeURIComponent(userId)}`;
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xl">⬇️</span>
                      <span>تنزيل</span>
                    </span>
                  </Button>
                )}
              </div>

              {book.pdfUrl && !showPdfPreview && (
                <Button
                  variant="ghost"
                  className="w-full text-stone-400 hover:text-purple-300 hover:bg-purple-500/10 text-sm"
                  onClick={() => setShowPdfPreview(true)}
                >
                  👁️ معاينة الكتاب داخل الصفحة
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ===== شريط التقدّم ===== */}
        {readingProgress && (
          <Card className="p-5 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <span>📊</span>
                <span>تقدّمك في القراءة</span>
              </span>
              <span className="text-lg font-bold text-purple-300">{completionRate}%</span>
            </div>
            <div className="h-2.5 bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 rounded-full shadow-lg shadow-purple-500/50"
              />
            </div>
            <p className="text-xs text-stone-400 mt-2">
              {completedChapters.length} من {book.chapters.length} فصل مكتمل · {Math.round((Date.now() - new Date(readingProgress.lastReadAt).getTime()) / (1000 * 60 * 60 * 24))} يوم منذ آخر قراءة
            </p>
          </Card>
        )}

        {/* ===== الوصف ===== */}
        <div>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-purple-400">📝</span>
            <span>عن الكتاب</span>
          </h2>
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800">
            <p className="text-stone-300 leading-relaxed">{book.description}</p>
          </div>
        </div>

        {/* ===== معاينة PDF داخلية ===== */}
        {showPdfPreview && book.pdfUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-blue-400">📖</span>
                <span>معاينة الكتاب</span>
              </h2>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors"
              >
                ✕ إغلاق المعاينة
              </button>
            </div>
            <PDFViewer
              pdfUrl={book.pdfUrl}
              pdfFileName={book.pdfFileName || 'كتاب PDF'}
              pdfSize={book.pdfSize || 0}
              pageCount={book.pdfPageCount || 0}
              title={book.title}
              isDarkMode={true}
            />
          </motion.div>
        )}

        {/* ===== بطاقة معلومات الملف ===== */}
        {book.pdfUrl && (
          <Card className="p-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-red-500/30">
                  PDF
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">
                    {book.pdfFileName || 'ملف PDF'}
                  </div>
                  <div className="text-xs text-stone-400 flex gap-3 flex-wrap">
                    {book.pdfSize > 0 && <span>💾 {formatBytes(book.pdfSize)}</span>}
                    {book.pdfPageCount > 0 && <span>📑 {book.pdfPageCount} صفحة</span>}
                    {book.downloads > 0 && <span>📥 {book.downloads} تنزيل</span>}
                    {book.uploadedAt && <span>📅 {new Date(book.uploadedAt).toLocaleDateString('ar-EG')}</span>}
                  </div>
                </div>
              </div>
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/20"
              >
                🔗 فتح في نافذة
              </a>
            </div>
          </Card>
        )}

        {/* ===== الكلمات المفتاحية ===== */}
        {book.keywords.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>🏷️</span>
              <span>الكلمات المفتاحية</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {book.keywords.map((kw, i) => (
                <Link
                  key={i}
                  href={`/library?search=${encodeURIComponent(kw)}`}
                  className="px-3 py-1.5 rounded-lg bg-stone-800/50 hover:bg-purple-500/20 border border-stone-700 hover:border-purple-500/50 text-stone-300 hover:text-purple-300 text-xs transition-colors"
                >
                  #{kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== الفصول ===== */}
        {book.chapters.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">📑</span>
              <span>فهرس الكتاب</span>
              <span className="text-sm text-stone-500 font-normal">({book.chapters.length} فصل)</span>
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
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Link
                      href={`/library/reader/${book.id}/${chapter.number}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all group",
                        isCurrent
                          ? "bg-purple-500/10 border-purple-500/30"
                          : isCompleted
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                          : "bg-stone-900/50 border-stone-800 hover:bg-stone-800/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0",
                        isCurrent ? "bg-purple-500 text-white" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-stone-800 text-stone-400"
                      )}>
                        {isCompleted ? "✓" : chapter.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-bold text-sm truncate",
                          isCurrent ? "text-purple-300" : isCompleted ? "text-emerald-300" : "text-stone-200"
                        )}>
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          ⏱️ {chapter.readingTimeMin} دقيقة
                          {chapter.isFree === false && " · 🔒 Premium"}
                        </p>
                      </div>
                      <div className="text-stone-600 group-hover:text-purple-400 transition-colors">
                        ←
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== التقييم ===== */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">⭐</span>
            <span>قيّم هذا الكتاب</span>
          </h2>
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800 text-center">
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125"
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill={star <= (hoverRating || userRating) ? "#fbbf24" : "none"}
                    stroke={star <= (hoverRating || userRating) ? "#fbbf24" : "#52525b"}
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-sm text-stone-400">
              {userRating > 0 ? `شكراً! تقييمك: ${userRating} نجوم` : "اضغط على النجوم للتقييم"}
            </p>
          </div>
        </div>

        {/* ===== المراجعات ===== */}
        {book.reviews && book.reviews.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">💬</span>
              <span>مراجعات القرّاء</span>
              <span className="text-sm text-stone-500 font-normal">({book._count.reviews})</span>
            </h2>
            <div className="space-y-3">
              {book.reviews.slice(0, 5).map((review: any, i: number) => (
                <motion.div
                  key={review.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-stone-900/50 border border-stone-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {review.user?.name?.charAt(0) || "م"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-stone-200 text-sm">{review.user?.name || "قارئ"}</h4>
                        <span className="text-xs text-stone-500">
                          {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= review.rating ? "#fbbf24" : "none"} stroke={s <= review.rating ? "#fbbf24" : "#52525b"} strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-stone-400 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ===== كتب ذات صلة ===== */}
        <RelatedBooks bookId={book.id} categoryId={book.category.id} />
      </main>
    </div>
  );
}


// ============================================================
// كتب ذات صلة (من نفس التصنيف)
// ============================================================
function RelatedBooks({ bookId, categoryId }: { bookId: number; categoryId: number }) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books?categoryId=${categoryId}&limit=6`)
      .then(r => r.json())
      .then(data => {
        // استبعاد الكتاب الحالي
        setRelated((data.books || []).filter((b: any) => b.id !== bookId).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId, categoryId]);

  if (loading || related.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-stone-700 mb-3 flex items-center gap-2">
        📚 كتب ذات صلة
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {related.map((book, idx) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link href={`/library/${book.id}`}>
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group p-3 border-stone-200 hover:border-indigo-300 h-full">
                <div className="flex justify-center mb-2">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    categoryName={book.category?.name}
                    difficulty={book.difficulty}
                    size="sm"
                  />
                </div>
                <h3 className="font-bold text-xs text-stone-800 truncate group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                <p className="text-[10px] text-stone-500 truncate">{book.author}</p>
                <div className="flex items-center justify-between text-[9px] text-stone-400 mt-1 border-t border-stone-100 pt-1">
                  <span>⭐ {book.ratingAvg || "—"}</span>
                  <span>⏱️ {book.readingTimeMin}د</span>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
