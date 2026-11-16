"use client";

/**
 * الصفحة الرئيسية — النسخة الأولية (Prototype)
 * =============================================
 * لوحة تحكم (Dashboard) بأسلوب تطبيق جوال — Mobile-First
 * العمود الرئيسي بعرض max-w-md ليبدو كتطبيق حتى على شاشات الكمبيوتر
 *
 * الأقسام: الشريط العلوي ← البطاقة الترحيبية ← البطاقات المزدوجة ←
 *          الروابط السريعة ← المحاور الثقافية ← قسم البدايات ← شريط التنقل السفلي
 *
 * المسافات: padding-bottom = 128px (pb-32) — أعلى من ارتفاع شريط التنقل
 *          (68px + المنطقة الآمنة iOS) حتى لا يغطي الشريط آخر البطاقات
 *
 * البيانات: Mock Data من src/components/home/data.ts
 *           (جاهزة للاستبدال بنداءات API فعلية لاحقاً)
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/home/app-header";
import { HeroCard } from "@/components/home/hero-card";
import { DualCards } from "@/components/home/dual-cards";
import { QuickLinks } from "@/components/home/quick-links";
import { CulturalChips } from "@/components/home/cultural-chips";
import { BeginnersSection } from "@/components/home/beginners-section";
import { BottomTabBar } from "@/components/home/bottom-tab-bar";
import {
  culturalAxes,
  heroStats,
  type BeginnerLevel,
  type CulturalAxis,
  type DualCardItem,
  type QuickLink,
} from "@/components/home/data";

/** عناوين شريط التنقل — لعرض شاشة مؤقتة عند تبديل التبويبات */
const tabPlaceholders: Record<string, string> = {
  home: "الرئيسية",
  game: "اللعبة",
  library: "المكتبة",
  leaderboard: "المتصدرون",
  profile: "حسابي",
};

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [activeAxis, setActiveAxis] = useState(culturalAxes[0].id);

  /** إشعار موحّد للأقسام قيد التطوير في النسخة الأولية */
  const notifyComingSoon = (sectionTitle: string) => {
    toast({
      title: `${sectionTitle} — قريباً`,
      description: "هذه النسخة أولية (Prototype) — القسم قيد التطوير",
    });
  };

  /** اختيار محور ثقافي — تبديل فوري للحالة النشطة */
  const handleAxisChange = (axis: CulturalAxis) => {
    setActiveAxis(axis.id);
    toast({
      title: `اخترت محور ${axis.title}`,
      description: axis.subtitle,
    });
  };

  /** اختيار مرحلة من قسم البدايات */
  const handleLevelSelect = (level: BeginnerLevel) => {
    toast({
      title: level.title,
      description: "بدء المرحلة سيتاح بعد ربط واجهة اللعبة",
    });
  };

  /** اختيار بطاقة مزدوجة */
  const handleDualCardSelect = (card: DualCardItem) => {
    notifyComingSoon(card.title);
  };

  /** اختيار رابط سريع */
  const handleQuickLinkSelect = (link: QuickLink) => {
    notifyComingSoon(link.title);
  };

  /** تبديل تبويبات شريط التنقل */
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== "home") {
      notifyComingSoon(tabPlaceholders[tabId] ?? tabId);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-dark">
      {/* إطار التطبيق — عمود بعرض جوال يتوسّط الشاشة */}
      <div className="app-frame relative mx-auto w-full max-w-md flex-1 bg-sand">
        <AppHeader
          coins={heroStats.points}
          onSettingsClick={() => notifyComingSoon("الإعدادات")}
          onProfileClick={() => notifyComingSoon("حسابي")}
        />

        <main className="space-y-6 px-4 pb-32 pt-4">
          {/* 1) البطاقة الترحيبية */}
          <HeroCard stats={heroStats} />

          {/* 2) البطاقات المزدوجة */}
          <DualCards onSelect={handleDualCardSelect} />

          {/* 3) الروابط السريعة */}
          <QuickLinks onSelect={handleQuickLinkSelect} />

          {/* 4) المحاور الثقافية */}
          <CulturalChips activeId={activeAxis} onChange={handleAxisChange} />

          {/* 5) قسم البدايات */}
          <BeginnersSection onSelect={handleLevelSelect} />

          {/* 6) تذييل مصغّر */}
          <footer className="pt-2 text-center">
            <p className="text-[10px] font-medium leading-relaxed text-heritage-900/45">
              ثقافتنا — منصة الثقافة العربية
              <span className="mx-1.5" aria-hidden="true">
                •
              </span>
              نسخة أولية 1.0
            </p>
          </footer>
        </main>

        {/* شاشة التبويبات غير الرئيسية — عرض مؤقت أنيق */}
        <AnimatePresence mode="wait">
          {activeTab !== "home" && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-sand/95 px-8 text-center backdrop-blur-sm"
            >
              <div className="grid size-16 place-items-center rounded-3xl bg-white shadow-card">
                <Sparkles className="size-7 text-gold-600" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-lg font-extrabold text-heritage-900">
                {tabPlaceholders[activeTab]}
              </h2>
              <p className="max-w-[30ch] text-xs leading-relaxed text-muted-foreground">
                هذا القسم قيد التطوير في النسخة الأولية — عد إلى الرئيسية
                لمتابعة استكشاف النموذج
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="mt-2 rounded-full bg-heritage-900 px-6 py-2.5 font-heading text-xs font-bold text-white shadow-card transition-transform duration-150 hover:bg-heritage-800 active:scale-95"
              >
                العودة للرئيسية
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 7) شريط التنقل السفلي — ثابت */}
      <BottomTabBar activeId={activeTab} onChange={handleTabChange} />
    </div>
  );
}
