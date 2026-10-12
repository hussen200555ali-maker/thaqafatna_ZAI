"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameScreen } from "@/components/game/game-screen";
import { OnboardingScreen } from "@/components/home/onboarding";
import { AdminPanel } from "@/components/admin/admin-panel";
import { useGameStore } from "@/lib/game-store";
import { fetchChapters, fetchLevels, Chapter as ApiChapter, Level as ApiLevel } from "@/lib/game-data-api";
import { cn } from "@/lib/utils";

type View = "onboarding" | "home" | "game" | "daily" | "chapters" | "admin";

// مكون داخلي لقراءة حالة onboarding بعد التركيب فقط
function useMounted() {
  const [mounted, setMounted] = useState(false);
  // استخدام useInsertionEffect أو قراءة مباشرة
  if (typeof window !== "undefined" && !mounted) {
    // تعيين مباشر بدون useEffect
    queueMicrotask(() => setMounted(true));
  }
  return mounted;
}

export default function HomePage() {
  const mounted = useMounted();

  // قراءة localStorage بعد التركيب فقط
  const onboardingSeen = mounted
    ? typeof window !== "undefined" && localStorage.getItem("thaqafatna-onboarding-seen") === "true"
    : false;

  const [view, setView] = useState<View>("onboarding");
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [initialized, setInitialized] = useState(false);
  const [apiChapters, setApiChapters] = useState<ApiChapter[]>([]);
  const [apiLevels, setApiLevels] = useState<ApiLevel[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { completedLevels, unlockedLevels, coins, dailyStreak, initCloudSync } = useGameStore();

  // تحميل البيانات من API عند التركيب
  useEffect(() => {
    const loadData = async () => {
      try {
        // تهيئة المزامنة السحابية
        await initCloudSync();

        // تحميل الفصول
        const chaptersData = await fetchChapters();
        setApiChapters(chaptersData);

        if (chaptersData.length > 0) {
          // تحميل مراحل الفصل الأول
          const levelsData = await fetchLevels(chaptersData[0].id);
          setApiLevels(levelsData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, [initCloudSync]);

  // تحميل المراحل عند تغيير الفصل
  const handleSelectChapter = async (chapterId: number) => {
    setSelectedChapter(chapterId);
    const levelsData = await fetchLevels(chapterId);
    setApiLevels(levelsData);
  };

  // تعيين العرض بعد التركيب
  if (mounted && !initialized) {
    setInitialized(true);
    setView(onboardingSeen ? "home" : "onboarding");
  }

  // فحص إذا كان المستخدم يريد وضع الإدارة عبر URL hash
  if (typeof window !== "undefined") {
    const hash = window.location.hash;
    if (hash === "#admin" && view !== "admin") {
      setView("admin");
    }
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem("thaqafatna-onboarding-seen", "true");
    setView("home");
  };

  // عرض لوحة الإدارة
  if (view === "admin") {
    return <AdminPanel />;
  }

  const todayDate = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLevelClick = (levelId: number) => {
    if (!unlockedLevels.includes(levelId)) return;
    setSelectedLevelId(levelId);
    setView("game");
  };

  const handleExitGame = () => {
    setSelectedLevelId(null);
    setView("home");
  };

  if (view === "game" && selectedLevelId) {
    return <GameScreen levelId={selectedLevelId} onExit={handleExitGame} />;
  }

  if (view === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen pattern-arabic flex flex-col">
      {/* شريط علوي */}
      <header className="sticky top-0 z-30 glass border-b border-amber-200/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size={36} />

          <div className="flex items-center gap-2">
            {/* العرض اليومي */}
            <button
              onClick={() => setView("daily")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white transition-all shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-xs font-bold hidden sm:inline">تحدّ يومي</span>
              {dailyStreak > 0 && (
                <span className="text-[10px] bg-white/20 px-1 rounded">🔥 {dailyStreak}</span>
              )}
            </button>

            {/* العملات */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-200">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="oklch(0.78 0.13 80)" />
                <circle cx="12" cy="12" r="7" fill="none" stroke="oklch(0.62 0.14 65)" strokeWidth="1.5" />
                <text x="12" y="16" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">★</text>
              </svg>
              <span className="font-bold text-amber-700">{coins}</span>
            </div>

            {/* زر لوحة الإدارة */}
            <button
              onClick={() => setView("admin")}
              title="لوحة الإدارة"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-8">
        {!dataLoaded && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {dataLoaded && view === "home" && (
          <HomeView
            chapters={apiChapters.length > 0 ? apiChapters : []}
            levels={apiLevels}
            completedLevels={completedLevels}
            unlockedLevels={unlockedLevels}
            onLevelClick={handleLevelClick}
            onSelectChapter={handleSelectChapter}
            selectedChapter={selectedChapter}
            todayDate={todayDate}
            onDailyChallenge={() => setView("daily")}
          />
        )}

        {view === "daily" && <DailyChallengeView onBack={() => setView("home")} />}

        {view === "chapters" && (
          <ChaptersView
            chapters={apiChapters}
            completedLevels={completedLevels}
            onSelectChapter={(id) => {
              handleSelectChapter(id);
              setView("home");
            }}
          />
        )}
      </main>

      {/* شريط سفلي للتنقل (للجوال) */}
      <footer className="sticky bottom-0 z-30 glass border-t border-amber-200/30 lg:hidden">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          <button
            onClick={() => setView("home")}
            className={cn(
              "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
              view === "home" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l9-9 9 9M5 10v10h14V10" />
            </svg>
            <span className="text-xs font-medium">الرئيسية</span>
          </button>
          <button
            onClick={() => setView("daily")}
            className={cn(
              "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
              view === "daily" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-medium">يومي</span>
          </button>
          <button
            onClick={() => setView("chapters")}
            className={cn(
              "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
              view === "chapters" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="text-xs font-medium">الفصول</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

interface HomeViewProps {
  chapters: ApiChapter[];
  levels: ApiLevel[];
  completedLevels: number[];
  unlockedLevels: number[];
  onLevelClick: (id: number) => void;
  onSelectChapter: (id: number) => void;
  selectedChapter: number;
  todayDate: string;
  onDailyChallenge: () => void;
}

function HomeView({
  chapters,
  levels,
  completedLevels,
  unlockedLevels,
  onLevelClick,
  onSelectChapter,
  selectedChapter,
  todayDate,
  onDailyChallenge,
}: HomeViewProps) {
  const currentChapter = chapters.find((c) => c.id === selectedChapter) || chapters[0];
  const totalCompleted = completedLevels.length;
  const totalLevels = chapters.reduce((sum, c) => sum + c.levelsCount, 0);

  return (
    <div className="space-y-6">
      {/* بطاقة الترحيب */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-6 sm:p-8 shadow-gold-lg"
      >
        {/* زخارف */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-300/20" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-400/10" />

        <div className="relative">
          <p className="text-amber-100 text-sm mb-2">{todayDate}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-tajawal)" }}>
            أهلاً بك في ثقافتنا
          </h1>
          <p className="text-amber-50/90 text-sm sm:text-base mb-4 max-w-lg">
            اكتشف عالم الكلمات العربية، حل الألغاز، وتعلّم كل يوم
          </p>

          {/* إحصائيات */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="text-xs text-amber-100">تقدمك</span>
              <div className="text-lg font-bold text-white">
                {totalCompleted} / {totalLevels}
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalCompleted / totalLevels) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* بطاقة التحدي اليومي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          className="p-4 sm:p-5 cursor-pointer hover:shadow-gold transition-all border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
          onClick={onDailyChallenge}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl shadow-md">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-stone-800 mb-1">تحدّ اليوم</h3>
              <p className="text-sm text-stone-600">لغز جديد كل يوم مع مكافآت مضاعفة</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* اختيار الفصل */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
            الفصول
          </h2>
          <span className="text-sm text-stone-500">{chapters.length} فصول</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {chapters.map((chapter) => {
            const isLocked = totalCompleted < chapter.unlockAt;
            const isSelected = chapter.id === selectedChapter;
            return (
              <button
                key={chapter.id}
                onClick={() => !isLocked && onSelectChapter(chapter.id)}
                disabled={isLocked}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2",
                  isSelected
                    ? "bg-white shadow-md"
                    : "bg-white/60 hover:bg-white",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
                style={{ borderColor: isSelected ? chapter.color : "transparent" }}
              >
                <span className="text-lg">{chapter.icon}</span>
                <span className="font-bold text-sm text-stone-700">{chapter.title}</span>
                {isLocked && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* المراحل */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 mb-3" style={{ fontFamily: "var(--font-tajawal)" }}>
          {currentChapter.icon} {currentChapter.title}
        </h2>
        <p className="text-stone-600 text-sm mb-4">{currentChapter.description}</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {levels.map((level, idx) => {
            const isCompleted = completedLevels.includes(level.id);
            const isUnlocked = unlockedLevels.includes(level.id);
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => onLevelClick(level.id)}
                disabled={!isUnlocked}
                className={cn(
                  "relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all",
                  isCompleted
                    ? "bg-gradient-to-br from-amber-300 to-amber-500 border-amber-500 text-white shadow-gold"
                    : isUnlocked
                    ? "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-stone-700 shadow-sm"
                    : "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
                )}
                style={isCompleted ? { backgroundColor: currentChapter.color } : {}}
              >
                {isCompleted && (
                  <div className="absolute top-1 right-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                    </svg>
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                )}
                {isUnlocked && (
                  <>
                    <span className="text-2xl font-bold mb-1">{level.number}</span>
                    <span className="text-[10px] opacity-70">
                      {level.difficulty === "easy" ? "سهل" : level.difficulty === "medium" ? "متوسط" : "صعب"}
                    </span>
                  </>
                )}
              </motion.button>
            );
          })}

          {/* مراحل قادمة */}
          {Array.from({ length: Math.max(0, currentChapter.levelsCount - levels.length) }).map((_, idx) => (
            <div
              key={`locked-${idx}`}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300"
            >
              <span className="text-2xl">🔒</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyChallengeView({ onBack }: { onBack: () => void }) {
  const { lastDailyChallenge, dailyStreak, completeDailyChallenge, addCoins } = useGameStore();
  const today = new Date().toISOString().split("T")[0];
  const isCompletedToday = lastDailyChallenge === today;

  const handleComplete = () => {
    if (isCompletedToday) return;
    completeDailyChallenge(today, 100);
    addCoins(50);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        رجوع
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
            🎯
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">تحدّ اليوم</h2>
            <p className="text-purple-100 text-sm">
              {new Date().toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/10">
            <p className="text-purple-100 text-xs mb-1">المكافأة</p>
            <p className="text-2xl font-bold">+100 🪙</p>
          </div>
          <div className="p-3 rounded-xl bg-white/10">
            <p className="text-purple-100 text-xs mb-1">السلسلة</p>
            <p className="text-2xl font-bold">🔥 {dailyStreak} يوم</p>
          </div>
        </div>

        {isCompletedToday ? (
          <div className="p-4 rounded-xl bg-white/15 text-center">
            <p className="text-xl font-bold mb-1">✅ أكملت تحدّ اليوم!</p>
            <p className="text-purple-100 text-sm">عُد غداً لتحدٍّ جديد</p>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold py-3 rounded-xl text-lg"
          >
            ابدأ التحدّي
          </Button>
        )}
      </motion.div>

      {/* المكافآت الأسبوعية */}
      <Card className="p-5">
        <h3 className="font-bold text-stone-800 mb-3">مكافآت الأسبوع</h3>
        <div className="grid grid-cols-7 gap-2">
          {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day, idx) => {
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - dayDate.getDay() + idx + 1);
            const dateStr = dayDate.toISOString().split("T")[0];
            const isDone = dateStr <= today && dailyStreak > 0;
            return (
              <div
                key={day}
                className={cn(
                  "p-2 rounded-lg text-center text-xs border",
                  isDone
                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white border-amber-500"
                    : "bg-stone-50 text-stone-500 border-stone-200"
                )}
              >
                <div className="font-bold mb-1">{day.slice(0, 3)}</div>
                <div className="text-lg">{isDone ? "★" : "○"}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ChaptersView({
  chapters,
  completedLevels,
  onSelectChapter,
}: {
  chapters: ApiChapter[];
  completedLevels: number[];
  onSelectChapter: (id: number) => void;
}) {
  const totalCompleted = completedLevels.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
        الفصول
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {chapters.map((chapter, idx) => {
          const isLocked = totalCompleted < chapter.unlockAt;
          return (
            <motion.button
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
              onClick={() => !isLocked && onSelectChapter(chapter.id)}
              disabled={isLocked}
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-right transition-all border-2",
                isLocked
                  ? "bg-stone-100 border-stone-200 cursor-not-allowed"
                  : "bg-white border-stone-200 hover:shadow-lg"
              )}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ backgroundColor: chapter.color, transform: "translate(40%, -40%)" }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: isLocked ? "#E5E7EB" : chapter.color + "33" }}
                >
                  {isLocked ? "🔒" : chapter.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-stone-800 mb-1">{chapter.title}</h3>
                  <p className="text-sm text-stone-600 mb-2">{chapter.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-500">{chapter.levelsCount} مرحلة</span>
                    {!isLocked && (
                      <span
                        className="px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: chapter.color }}
                      >
                        مفتوح
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
