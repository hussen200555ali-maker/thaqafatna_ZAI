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
import { ProfileView } from "@/components/home/profile";
import { useGameStore } from "@/lib/game-store";
import { useNotifications } from "@/hooks/use-notifications";
import { fetchChapters, fetchLevels, Chapter as ApiChapter, Level as ApiLevel } from "@/lib/game-data-api";
import { cn } from "@/lib/utils";
import { KnowledgeMap } from "@/components/game/knowledge-map";
import { LearningAnalytics } from "@/components/game/learning-analytics";

type View = "onboarding" | "home" | "game" | "daily" | "chapters" | "admin" | "profile" | "knowledge-map" | "analytics";

// مكون داخلي لقراءة حالة onboarding بعد التركيب فقط
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
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

  const { completedLevels, unlockedLevels, coins, dailyStreak, initCloudSync, getLevelStars, totalStars, userId } = useGameStore();
  const { permission, enabled, reminder, requestPermission } = useNotifications(userId);

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

  // تعيين العرض بعد التركيب - استخدام useEffect
  useEffect(() => {
    if (mounted && !initialized) {
      setInitialized(true);
      const seen = typeof window !== "undefined" && localStorage.getItem("thaqafatna-onboarding-seen") === "true";
      setView(seen ? "home" : "onboarding");
    }
  }, [mounted, initialized]);

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
    // جميع المراحل مفتوحة للاختبار
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

            {/* زر الملف الشخصي */}
            <button
              onClick={() => setView("profile")}
              title="ملفي الشخصي"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

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
            coins={coins}
            dailyStreak={dailyStreak}
            getLevelStars={getLevelStars}
            totalStars={totalStars}
            userId={userId}
            onLevelClick={handleLevelClick}
            onSelectChapter={handleSelectChapter}
            selectedChapter={selectedChapter}
            todayDate={todayDate}
            onDailyChallenge={() => setView("daily")}
            onNavigate={(v) => setView(v)}
            notificationReminder={reminder}
            notificationEnabled={enabled}
            onRequestNotifications={requestPermission}
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

        {view === "profile" && <ProfileView onBack={() => setView("home")} />}

        {view === "knowledge-map" && (
          <div className="space-y-4">
            <button
              onClick={() => setView("home")}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              رجوع
            </button>
            <KnowledgeMap
              userId={userId}
              onLevelSelect={(levelId) => {
                setSelectedLevelId(levelId);
                setView("game");
              }}
            />
          </div>
        )}

        {view === "analytics" && (
          <div className="space-y-4">
            <button
              onClick={() => setView("home")}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              رجوع
            </button>
            <LearningAnalytics
              userId={userId}
              onLevelSelect={(levelId) => {
                setSelectedLevelId(levelId);
                setView("game");
              }}
            />
          </div>
        )}
      </main>

      {/* شريط سفلي للتنقل (للجوال) */}
      <footer className="sticky bottom-0 z-30 glass border-t border-amber-200/30 lg:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <button
            onClick={() => setView("home")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
              view === "home" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l9-9 9 9M5 10v10h14V10" />
            </svg>
            <span className="text-[10px] font-medium">الرئيسية</span>
          </button>
          <button
            onClick={() => setView("knowledge-map")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
              view === "knowledge-map" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="5" cy="5" r="2" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="19" r="2" />
              <circle cx="19" cy="19" r="2" />
              <line x1="7" y1="6" x2="10" y2="10" />
              <line x1="17" y1="6" x2="14" y2="10" />
              <line x1="7" y1="18" x2="10" y2="14" />
              <line x1="17" y1="18" x2="14" y2="14" />
            </svg>
            <span className="text-[10px] font-medium">خريطتي</span>
          </button>
          <button
            onClick={() => setView("daily")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
              view === "daily" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] font-medium">يومي</span>
          </button>
          <button
            onClick={() => setView("analytics")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
              view === "analytics" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="text-[10px] font-medium">تحليلاتي</span>
          </button>
          <button
            onClick={() => setView("chapters")}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
              view === "chapters" ? "bg-amber-100 text-amber-700" : "text-stone-500"
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="text-[10px] font-medium">الفصول</span>
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
  coins: number;
  dailyStreak: number;
  getLevelStars: (levelId: number) => number;
  totalStars: number;
  userId: string | null;
  onLevelClick: (id: number) => void;
  onSelectChapter: (id: number) => void;
  selectedChapter: number;
  todayDate: string;
  onDailyChallenge: () => void;
  onNavigate: (view: "knowledge-map" | "analytics") => void;
  notificationReminder?: string | null;
  notificationEnabled?: boolean;
  onRequestNotifications?: () => void;
}

function HomeView({
  chapters,
  levels,
  completedLevels,
  unlockedLevels,
  coins,
  dailyStreak,
  getLevelStars,
  totalStars,
  userId,
  onLevelClick,
  onSelectChapter,
  selectedChapter,
  todayDate,
  onDailyChallenge,
  onNavigate,
  notificationReminder,
  notificationEnabled,
  onRequestNotifications,
}: HomeViewProps) {
  const currentChapter = chapters.find((c) => c.id === selectedChapter) || chapters[0];
  const totalCompleted = completedLevels.length;
  const totalLevels = chapters.reduce((sum, c) => sum + c.levelsCount, 0);
  // جلب التوصية الذكية من API
  const [recommendation, setRecommendation] = useState<{
    reason: string;
    type: "next" | "review" | "challenge" | "explore";
    recommendedLevelId: number | null;
  } | null>(null);
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/analytics?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.analytics?.recommendation) {
          setRecommendation(data.analytics.recommendation);
        }
      })
      .catch((e) => console.error("Error fetching recommendation:", e));
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* بطاقة الترحيب المحسّنة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-teal-pro p-6 sm:p-8 shadow-soft-lg"
      >
        {/* زخارف متحركة */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-amber-400/5" />

        {/* شريط التذكير اليومي */}
        {notificationReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center gap-2"
          >
            <span className="text-lg">🔔</span>
            <p className="text-white text-xs flex-1">{notificationReminder}</p>
            {!notificationEnabled && onRequestNotifications && (
              <button
                onClick={onRequestNotifications}
                className="px-2 py-0.5 rounded-lg bg-amber-400 text-stone-900 text-[10px] font-bold"
              >
                تفعيل
              </button>
            )}
          </motion.div>
        )}

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-teal-100 text-sm">{todayDate}</p>
            {/* شارة المستوى */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="text-yellow-300 text-xs">⭐</span>
              <span className="text-white text-xs font-bold">المستوى {Math.floor(totalCompleted / 5) + 1}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-tajawal)" }}>
            أهلاً بك في ثقافتنا
          </h1>
          <p className="text-teal-100/90 text-sm sm:text-base mb-4 max-w-lg">
            اكتشف عالم الكلمات العربية، حل الألغاز، وتعلّم كل يوم
          </p>

          {/* إحصائيات محسّنة */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <div className="text-center">
                <div className="text-xs text-teal-100">مكتمل</div>
                <div className="text-lg font-bold text-white">
                  {totalCompleted}<span className="text-teal-200/60 text-sm">/{totalLevels}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="text-yellow-300 text-sm">🪙</span>
              <span className="text-white font-bold">{coins}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="text-yellow-300 text-sm">⭐</span>
              <span className="text-white font-bold">{totalStars}</span>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs text-teal-100 mb-1">
                <span>التقدم</span>
                <span>{Math.round((totalCompleted / totalLevels) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalCompleted / totalLevels) * 100}%` }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== بطاقة التوصية الذكية الجديدة ===== */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-pro"
        >
          <Card className="p-4 sm:p-5 cursor-pointer hover:shadow-soft-lg transition-all border-purple-300 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 overflow-hidden relative">
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-soft flex-shrink-0">
                {recommendation.type === "review" ? "📚"
                  : recommendation.type === "challenge" ? "🎯"
                  : recommendation.type === "next" ? "🚀"
                  : "🧭"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
                    توصية ذكية لك
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 text-[10px] font-bold">
                    {recommendation.type === "review" ? "مراجعة"
                      : recommendation.type === "challenge" ? "تحدٍّ"
                      : recommendation.type === "next" ? "التالي"
                      : "استكشاف"}
                  </span>
                </div>
                <p className="text-stone-700 text-xs line-clamp-2" style={{ fontFamily: "var(--font-tajawal)" }}>
                  {recommendation.reason}
                </p>
              </div>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ===== بطاقتي خريطة المعرفة + التحليلات ===== */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("knowledge-map")}
          className="relative overflow-hidden rounded-2xl p-4 text-right bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 shadow-md"
        >
          <div className="text-3xl mb-2">🗺️</div>
          <h4 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "var(--font-tajawal)" }}>
            خريطة المعرفة
          </h4>
          <p className="text-[10px] text-stone-400">تتبّع مهاراتك العربية</p>
          <div className="absolute top-3 left-3 text-stone-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("analytics")}
          className="relative overflow-hidden rounded-2xl p-4 text-right bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400 shadow-md"
        >
          <div className="text-3xl mb-2">📊</div>
          <h4 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "var(--font-tajawal)" }}>
            تحليلاتي
          </h4>
          <p className="text-[10px] text-amber-50">نمو تعلّمك أسبوعياً</p>
          <div className="absolute top-3 left-3 text-amber-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </motion.button>
      </div>

      {/* ===== بطاقة المكتبة الجديدة ===== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-pro"
      >
        <a href="/library" className="block">
          <Card className="p-4 sm:p-5 cursor-pointer hover:shadow-soft-lg transition-all border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 overflow-hidden relative">
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-soft flex-shrink-0">
                📚
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-stone-800 mb-0.5" style={{ fontFamily: "var(--font-tajawal)" }}>
                  مكتبة ثقافتنا
                </h3>
                <p className="text-stone-600 text-xs">
                  اقرأ كتب التراث العربي — كل كتاب بألغازه وشهادته
                </p>
              </div>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.div>
            </div>
          </Card>
        </a>
      </motion.div>

      {/* ===== بطاقة المتصدّرين ===== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <a href="/leaderboard" className="block">
          <Card className="p-4 sm:p-5 cursor-pointer hover:shadow-soft-lg transition-all border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 overflow-hidden relative">
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center text-2xl shadow-soft flex-shrink-0">
                🏆
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-stone-800 mb-0.5" style={{ fontFamily: "var(--font-tajawal)" }}>
                  المتصدّرون
                </h3>
                <p className="text-stone-600 text-xs">
                  نافس لاعبين آخرين واصعد للقمة
                </p>
              </div>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className="text-2xl">🥇</span>
              </motion.div>
            </div>
          </Card>
        </a>
      </motion.div>

      {/* بطاقة التحدي اليومي المحسّنة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-pro"
      >
        <Card
          className="p-4 sm:p-5 cursor-pointer hover:shadow-soft-lg transition-all border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 overflow-hidden relative"
          onClick={onDailyChallenge}
        >
          {/* أيقونة متحركة */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-3 left-3 text-3xl opacity-20"
          >
            🎯
          </motion.div>
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center text-2xl shadow-soft">
              🎯
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-stone-800">تحدّ اليوم</h3>
                {dailyStreak > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1">
                    <span>🔥</span> {dailyStreak} يوم
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-600">لغز جديد كل يوم مع مكافآت مضاعفة</p>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* اختيار الفصل - شبكة بطاقات */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>
            📚 الفصول الثقافية
          </h2>
          <span className="text-sm text-stone-500">{chapters.length} فصول</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {chapters.map((chapter) => {
            const isLocked = false; // جميع الفصول مفتوحة
            const isSelected = chapter.id === selectedChapter;
            return (
              <motion.button
                key={chapter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={!isLocked ? { scale: 1.03, y: -2 } : {}}
                whileTap={!isLocked ? { scale: 0.97 } : {}}
                onClick={() => !isLocked && onSelectChapter(chapter.id)}
                disabled={isLocked}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 border-2 transition-all text-right",
                  isSelected
                    ? "bg-white shadow-lg"
                    : isLocked
                    ? "bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed"
                    : "bg-white/70 hover:bg-white border-transparent"
                )}
                style={{ borderColor: isSelected ? chapter.color : "transparent" }}
              >
                {/* خلفية ملونة */}
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: chapter.color }}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: chapter.color + "33" }}
                  >
                    {isLocked ? "🔒" : chapter.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800 text-sm truncate">{chapter.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{chapter.description}</p>
                  </div>
                </div>
              </motion.button>
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
            // جميع المراحل مفتوحة
            const isUnlocked = true;
            const levelStars = getLevelStars(level.id);
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 200 }}
                whileHover={isUnlocked ? { scale: 1.05, y: -4 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => onLevelClick(level.id)}
                disabled={!isUnlocked}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-md",
                  isUnlocked
                    ? "bg-gradient-to-b from-yellow-300 to-amber-400 border-amber-500 text-stone-800"
                    : "bg-gradient-to-b from-stone-700 to-stone-800 border-stone-600 text-stone-400 cursor-not-allowed"
                )}
              >
                {/* الجزء العلوي - الرقم */}
                <div className="flex-1 flex items-center justify-center pt-3 pb-1">
                  {isUnlocked ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-800 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{level.number}</span>
                    </div>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </div>

                {/* الجزء السفلي - النجوم */}
                <div className="bg-stone-800 w-full py-1.5 flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map((star) => {
                    const isEarned = isCompleted && star <= levelStars;
                    return (
                      <svg
                        key={star}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={isEarned ? "#FFD700" : isCompleted ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}
                        className={isEarned ? "drop-shadow-[0_0_3px_rgba(255,215,0,0.8)]" : ""}
                      >
                        <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.4-4.9-2.6L7 17.1l.9-5.4-4-3.9 5.5-.8z" />
                      </svg>
                    );
                  })}
                </div>
              </motion.button>
            );
          })}

          {/* مراحل قادمة */}
          {Array.from({ length: Math.max(0, currentChapter.levelsCount - levels.length) }).map((_, idx) => (
            <div
              key={`locked-${idx}`}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-300 bg-stone-50"
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
          const isLocked = false; // جميع الفصول مفتوحة
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
