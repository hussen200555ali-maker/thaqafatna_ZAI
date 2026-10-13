"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * مكوّن خريطة المعرفة البصرية
 *
 * يعرض شبكة المهارات الهرمية:
 *   - 5 مهارات جذرية (Roots) كنجوم رئيسية
 *   - تحت كل جذر: فروعها مع نسبة الإتقان
 *   - كل مهارة لها لون يعكس الإتقان:
 *     🔴 0-30% (لم يبدأ)
 *     🟡 30-60% (في التقدم)
 *     🟢 60-80% (متقن)
 *     🟣 80-100% (إتقان كامل)
 *
 * يحوي وضعين للعرض:
 *   - "tree" (افتراضي): شجرة هرمية
 *   - "grid": شبكة مسطحة لرؤية كل المهارات
 */

export interface KnowledgeMapSkill {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  level: number;
  mastery: number;
  isRoot: boolean;
  children?: KnowledgeMapSkill[];
  relatedLevels?: {
    levelId: number;
    levelNumber: number;
    levelTitle: string;
    chapterTitle: string;
    chapterIcon: string;
    chapterColor: string;
    weight: number;
    isCompleted: boolean;
    stars: number;
  }[];
  stats?: {
    attempts: number;
    correct: number;
    incorrect: number;
    masteredAt: string | null;
    lastPracticedAt: string | null;
  };
}

interface KnowledgeMapProps {
  userId: string | null;
  onLevelSelect?: (levelId: number) => void;
}

// خريطة الألوان حسب نسبة الإتقان
function getMasteryColor(mastery: number): {
  bg: string;
  border: string;
  text: string;
  glow: string;
} {
  if (mastery >= 80) {
    return {
      bg: "bg-gradient-to-br from-purple-500 to-pink-600",
      border: "border-purple-300",
      text: "text-purple-100",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    };
  } else if (mastery >= 60) {
    return {
      bg: "bg-gradient-to-br from-green-500 to-emerald-600",
      border: "border-green-300",
      text: "text-green-100",
      glow: "shadow-[0_0_15px_rgba(34,197,94,0.4)]",
    };
  } else if (mastery >= 30) {
    return {
      bg: "bg-gradient-to-br from-amber-500 to-orange-600",
      border: "border-amber-300",
      text: "text-amber-100",
      glow: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    };
  } else {
    return {
      bg: "bg-gradient-to-br from-stone-500 to-stone-700",
      border: "border-stone-400",
      text: "text-stone-100",
      glow: "",
    };
  }
}

// وصف نصي للإتقان
function getMasteryLabel(mastery: number): string {
  if (mastery >= 95) return "إتقان كامل";
  if (mastery >= 80) return "مُتقن";
  if (mastery >= 60) return "متقدم";
  if (mastery >= 30) return "في التقدم";
  if (mastery > 0) return "مبتدئ";
  return "لم يبدأ";
}

export function KnowledgeMap({ userId, onLevelSelect }: KnowledgeMapProps) {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<{
    knowledgeMap: KnowledgeMapSkill[];
    stats: {
      totalSkills: number;
      masteredSkills: number;
      masteryRate: number;
      totalLevels: number;
      completedLevels: number;
    };
  } | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [expandedRoot, setExpandedRoot] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/knowledge-map?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && data.knowledgeMap) {
          setMapData(data);
          // افتح أول جذر افتراضياً
          if (data.knowledgeMap.length > 0 && expandedRoot === null) {
            setExpandedRoot(data.knowledgeMap[0].id);
          }
        }
      })
      .catch((e) => console.error("Error fetching knowledge map:", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent"
        />
        <p className="text-amber-200 ml-4 text-sm" style={{ fontFamily: "var(--font-tajawal)" }}>
          جاري بناء خريطة معرفتك...
        </p>
      </div>
    );
  }

  if (!mapData || mapData.knowledgeMap.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/5 border-white/10">
        <p className="text-white/60">لا توجد مهارات متاحة بعد</p>
      </Card>
    );
  }

  const { knowledgeMap, stats } = mapData;

  return (
    <div className="space-y-6">
      {/* رأس الخريطة + إحصائيات سريعة */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-800 via-stone-900 to-black p-6 sm:p-8 shadow-xl"
      >
        {/* زخارف خلفية */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-400/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple-400/5 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-tajawal)" }}>
              🗺️ خريطة المعرفة
            </h2>
            <p className="text-stone-300 text-sm">
              تتبّع رحلتك في إتقان المهارات العربية
            </p>
          </div>

          {/* إحصائيات سريعة */}
          <div className="flex items-center gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-stone-400 mb-1">المهارات المُتقنة</div>
              <div className="text-2xl font-bold text-amber-300">
                {stats.masteredSkills}
                <span className="text-stone-500 text-sm">/{stats.totalSkills}</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-stone-400 mb-1">نسبة الإتقان</div>
              <div className="text-2xl font-bold text-green-300">{stats.masteryRate}%</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
              <div className="text-xs text-stone-400 mb-1">المراحل المكتملة</div>
              <div className="text-2xl font-bold text-purple-300">
                {stats.completedLevels}
                <span className="text-stone-500 text-sm">/{stats.totalLevels}</span>
              </div>
            </div>
          </div>
        </div>

        {/* مفتاح الألوان */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 ml-2">المفتاح:</span>
          {[
            { color: "bg-stone-500", label: "لم يبدأ" },
            { color: "bg-amber-500", label: "في التقدم" },
            { color: "bg-green-500", label: "متقدم" },
            { color: "bg-purple-500", label: "مُتقن" },
          ].map((k) => (
            <span key={k.label} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-full", k.color)} />
              <span className="text-stone-300">{k.label}</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* مبدّل وضع العرض */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === "tree" ? "default" : "outline"}
          onClick={() => setViewMode("tree")}
          className={cn(
            viewMode === "tree" && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          🌳 شجرة هرمية
        </Button>
        <Button
          size="sm"
          variant={viewMode === "grid" ? "default" : "outline"}
          onClick={() => setViewMode("grid")}
          className={cn(
            viewMode === "grid" && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          🔲 شبكة مسطحة
        </Button>
      </div>

      {/* محتوى الخريطة */}
      <AnimatePresence mode="wait">
        {viewMode === "tree" ? (
          <motion.div
            key="tree"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {knowledgeMap.map((rootSkill, idx) => (
              <RootSkillCard
                key={rootSkill.id}
                skill={rootSkill}
                isExpanded={expandedRoot === rootSkill.id}
                onToggle={() =>
                  setExpandedRoot(
                    expandedRoot === rootSkill.id ? null : rootSkill.id
                  )
                }
                onLevelSelect={onLevelSelect}
                index={idx}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {knowledgeMap.flatMap((root) => [
              <SkillChip key={root.id} skill={root} onLevelSelect={onLevelSelect} />,
              ...(root.children || []).map((child) => (
                <SkillChip key={child.id} skill={child} onLevelSelect={onLevelSelect} />
              )),
            ])}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// مكوّن بطاقة المهارة الجذرية (في وضع الشجرة)
// ============================================================
function RootSkillCard({
  skill,
  isExpanded,
  onToggle,
  onLevelSelect,
  index,
}: {
  skill: KnowledgeMapSkill;
  isExpanded: boolean;
  onToggle: () => void;
  onLevelSelect?: (levelId: number) => void;
  index: number;
}) {
  const color = getMasteryColor(skill.mastery);
  const childrenList = skill.children || [];
  const childrenMasteryAvg =
    childrenList.length > 0
      ? Math.round(
          childrenList.reduce((s, c) => s + c.mastery, 0) / childrenList.length
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 shadow-xl transition-all",
        color.border,
        color.glow,
        isExpanded ? "bg-stone-900/95" : "bg-stone-900/70"
      )}
    >
      {/* رأس البطاقة */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-right hover:bg-white/5 transition-colors"
      >
        {/* أيقونة المهارة */}
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg",
            color.bg
          )}
        >
          {skill.icon}
        </div>

        {/* العنوان والإتقان */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-tajawal)" }}>
              {skill.title}
            </h3>
            {skill.mastery >= 80 && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                ⭐ مُتقن
              </span>
            )}
          </div>
          <p className="text-stone-400 text-xs line-clamp-1 mb-2">{skill.description}</p>

          {/* شريط الإتقان */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${skill.mastery}%` }}
                transition={{ duration: 1, type: "spring" }}
                className={cn("h-full rounded-full", color.bg)}
              />
            </div>
            <span className={cn("text-xs font-bold", color.text)}>
              {skill.mastery}%
            </span>
          </div>
        </div>

        {/* سهم التوسيع */}
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-stone-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      {/* تفاصيل الفروع (عند التوسيع) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-white/10">
              {/* ملخص الفروع */}
              <div className="flex items-center justify-between mb-4 text-xs">
                <span className="text-stone-400">
                  {childrenList.length} مهارة فرعية
                </span>
                <span className="text-stone-400">
                  متوسط الإتقان: <span className="font-bold text-white">{childrenMasteryAvg}%</span>
                </span>
              </div>

              {/* قائمة الفروع */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childrenList.map((child, idx) => (
                  <ChildSkillCard
                    key={child.id}
                    skill={child}
                    onLevelSelect={onLevelSelect}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// مكوّن بطاقة المهارة الفرعية
// ============================================================
function ChildSkillCard({
  skill,
  onLevelSelect,
  index,
}: {
  skill: KnowledgeMapSkill;
  onLevelSelect?: (levelId: number) => void;
  index: number;
}) {
  const color = getMasteryColor(skill.mastery);
  const [showLevels, setShowLevels] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl">{skill.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate" style={{ fontFamily: "var(--font-tajawal)" }}>
            {skill.title}
          </h4>
          <p className="text-[10px] text-stone-400 line-clamp-1">{skill.description}</p>
        </div>
      </div>

      {/* شريط الإتقان */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${skill.mastery}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            className={cn("h-full rounded-full", color.bg)}
          />
        </div>
        <span className={cn("text-[10px] font-bold", color.text)}>
          {skill.mastery}%
        </span>
      </div>

      {/* الإحصائيات السريعة */}
      {skill.stats && skill.stats.attempts > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-stone-400 mb-2">
          <span>📊 {skill.stats.attempts} محاولة</span>
          <span>✓ {skill.stats.correct}</span>
          <span>✗ {skill.stats.incorrect}</span>
        </div>
      )}

      {/* المراحل المرتبطة */}
      {skill.relatedLevels && skill.relatedLevels.length > 0 && (
        <button
          onClick={() => setShowLevels(!showLevels)}
          className="w-full text-[10px] text-stone-400 hover:text-stone-200 flex items-center justify-between"
        >
          <span>{skill.relatedLevels.length} مراحل</span>
          <motion.span animate={{ rotate: showLevels ? 180 : 0 }}>▼</motion.span>
        </button>
      )}

      <AnimatePresence>
        {showLevels && skill.relatedLevels && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="space-y-1">
              {skill.relatedLevels.map((lvl) => (
                <button
                  key={lvl.levelId}
                  onClick={() => onLevelSelect?.(lvl.levelId)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-right"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{lvl.chapterIcon}</span>
                    <span className="text-[11px] text-white truncate">
                      {lvl.chapterTitle} — {lvl.levelNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {lvl.isCompleted ? (
                      <span className="text-yellow-300 text-[10px]">
                        {"⭐".repeat(lvl.stars)}
                      </span>
                    ) : (
                      <span className="text-stone-500 text-[10px]">🔒</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// مكوّن رقاقة المهارة (في وضع الشبكة)
// ============================================================
function SkillChip({
  skill,
  onLevelSelect,
}: {
  skill: KnowledgeMapSkill;
  onLevelSelect?: (levelId: number) => void;
}) {
  const color = getMasteryColor(skill.mastery);
  const label = getMasteryLabel(skill.mastery);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 border-2 cursor-pointer transition-all",
        color.border,
        color.bg,
        color.glow
      )}
      title={skill.description}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl mb-1">{skill.icon}</div>
        <h4 className="text-sm font-bold text-white line-clamp-1 mb-0.5" style={{ fontFamily: "var(--font-tajawal)" }}>
          {skill.title}
        </h4>
        <Badge className="bg-white/20 text-white text-[10px] border-0 mb-1">
          {label}
        </Badge>
        <div className="text-2xl font-bold text-white">{skill.mastery}%</div>
        {skill.isRoot && (
          <span className="absolute top-1 left-1 text-[8px] text-white/60">
            جذر
          </span>
        )}
      </div>
    </motion.div>
  );
}
