"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/game-store";

/**
 * قارئ الكتب الذكي
 * - قارئ ويب متجاوب
 * - وضع ليلي
 * - تكبير/تصغير الخط
 * - تتبّع التقدّم تلقائياً
 * - تنقّل بين الفصول
 */

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const router = useRouter();
  const { userId } = useGameStore();
  const [bookId, setBookId] = useState<number | null>(null);
  const [chapterNumber, setChapterNumber] = useState<number | null>(null);
  const [book, setBook] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // إعدادات القراءة
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // تتبّع القراءة
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const scrollUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    params.then((p) => {
      setBookId(parseInt(p.bookId));
      setChapterNumber(parseInt(p.chapterId));
    });
  }, [params]);

  // تحميل الكتاب + الفصول
  useEffect(() => {
    if (!bookId) return;
    Promise.all([
      fetch(`/api/books/${bookId}`).then((r) => r.json()),
      fetch(`/api/books/${bookId}/chapters`).then((r) => r.json()),
    ])
      .then(([bookData, chaptersData]) => {
        setBook(bookData.book);
        setAllChapters(chaptersData.chapters || []);
      })
      .catch(console.error);
  }, [bookId]);

  // تحميل الفصل الحالي
  useEffect(() => {
    if (!bookId || !chapterNumber || allChapters.length === 0) return;
    const found = allChapters.find((c) => c.number === chapterNumber);
    if (found) {
      // جلب محتوى الفصل الكامل
      fetch(`/api/books/${bookId}/chapters`)
        .then((r) => r.json())
        .then(() => {
          // الفصل موجود في قائمة الفصول لكن بدون content
          // نحتاج جلب المحتوى الكامل من API منفصل
          // مؤقتاً نستخدم found مباشرة
          setChapter({ ...found, content: found.content || "" });
          setLoading(false);
          startTimeRef.current = Date.now();
          window.scrollTo(0, 0);
        });
    } else {
      setLoading(false);
    }
  }, [bookId, chapterNumber, allChapters]);

  // تتبّع القراءة (update progress periodically)
  useEffect(() => {
    if (!userId || !bookId || !chapterNumber) return;
    const timer = setInterval(() => {
      const scrollPercent = contentRef.current
        ? Math.round(
            (window.scrollY /
              (document.documentElement.scrollHeight - window.innerHeight)) *
              100
          )
        : 0;
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      fetch(`/api/books/${bookId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentChapter: chapterNumber,
          currentScroll: scrollPercent,
          timeSpentSec: 5,
        }),
      }).catch(() => {});
    }, 5000); // كل 5 ثوانٍ

    return () => clearInterval(timer);
  }, [userId, bookId, chapterNumber]);

  // عند مغادرة الصفحة — إكمال الفصل إن كان scroll 90%+
  useEffect(() => {
    if (!userId || !bookId || !chapterNumber) return;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );
      if (scrollPercent >= 90) {
        // إكمال الفصل
        fetch(`/api/books/${bookId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            currentChapter: chapterNumber,
            currentScroll: scrollPercent,
            timeSpentSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
            completedChapter: chapterNumber,
          }),
        }).catch(() => {});
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [userId, bookId, chapterNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent"
        />
      </div>
    );
  }

  if (!book || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <Card className="p-8 text-center">
          <p className="text-stone-600 mb-4">الفصل غير موجود</p>
          <Button onClick={() => router.push(`/library/${bookId}`)}>العودة للكتاب</Button>
        </Card>
      </div>
    );
  }

  const currentIdx = allChapters.findIndex((c) => c.number === chapterNumber);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;
  const isLastChapter = currentIdx === allChapters.length - 1;

  return (
    <div
      className={cn(
        "min-h-screen transition-colors",
        isDarkMode ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-800"
      )}
    >
      {/* ===== شريط التحكم العلوي ===== */}
      <header
        className={cn(
          "sticky top-0 z-30 backdrop-blur-md border-b",
          isDarkMode ? "bg-stone-800/80 border-stone-700" : "bg-white/80 border-stone-200"
        )}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/library/${bookId}`}
            className={cn(
              "flex items-center gap-2 text-sm hover:opacity-80",
              isDarkMode ? "text-stone-300" : "text-stone-600"
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="hidden sm:inline">{book.title}</span>
          </Link>

          {/* شريط التقدّم */}
          <div className="flex-1 mx-4">
            <div className={cn(
              "h-1.5 rounded-full overflow-hidden",
              isDarkMode ? "bg-stone-700" : "bg-stone-200"
            )}>
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                animate={{ width: `${((currentIdx + 1) / allChapters.length) * 100}%` }}
              />
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                isDarkMode ? "hover:bg-stone-700" : "hover:bg-stone-100"
              )}
              title="تصغير الخط"
            >
              A−
            </button>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                isDarkMode ? "hover:bg-stone-700" : "hover:bg-stone-100"
              )}
              title="تكبير الخط"
            >
              A+
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors",
                isDarkMode ? "hover:bg-stone-700" : "hover:bg-stone-100"
              )}
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <main ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
        {/* عنوان الفصل */}
        <div className="text-center mb-8">
          <p className={cn(
            "text-xs mb-1",
            isDarkMode ? "text-stone-400" : "text-stone-400"
          )}>
            الفصل {chapter.number} من {allChapters.length}
          </p>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-tajawal)" }}>
            {chapter.title}
          </h1>
          <p className={cn(
            "text-xs",
            isDarkMode ? "text-stone-500" : "text-stone-400"
          )}>
            ⏱️ {chapter.readingTimeMin} دقيقة قراءة
          </p>
        </div>

        {/* محتوى الفصل */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "prose prose-lg max-w-none leading-loose",
            isDarkMode ? "prose-invert" : ""
          )}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.9,
            fontFamily: "var(--font-tajawal), serif",
          }}
          dangerouslySetInnerHTML={{ __html: chapter.content || "<p>لا يوجد محتوى لهذا الفصل.</p>" }}
        />

        {/* ===== أزرار التنقّل ===== */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-stone-200">
          {prevChapter ? (
            <Link href={`/library/reader/${bookId}/${prevChapter.number}`}>
              <Button variant="outline" className="gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-xs">السابق</span>
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <div className="text-center">
            <p className={cn(
              "text-xs",
              isDarkMode ? "text-stone-500" : "text-stone-400"
            )}>
              {currentIdx + 1} / {allChapters.length}
            </p>
          </div>

          {nextChapter ? (
            <Link href={`/library/reader/${bookId}/${nextChapter.number}`}>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 gap-2">
                <span className="text-xs">التالي</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>
            </Link>
          ) : isLastChapter ? (
            <Link href={`/library/${bookId}`}>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 gap-2">
                <span className="text-xs">🎉 إكمال</span>
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* ===== لغز مرتبط بالفصل ===== */}
        {chapter.relatedLevelId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className={cn(
              "p-4 border-2",
              isDarkMode ? "bg-amber-900/20 border-amber-700" : "bg-amber-50 border-amber-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎮</div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">لغز هذا الفصل</h3>
                  <p className="text-xs opacity-70">أكملت قراءة الفصل! حلّ اللغز لتفتح الفصل التالي</p>
                </div>
                <Link href={`/?level=${chapter.relatedLevelId}`}>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600">
                    ابدأ اللغز ←
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
