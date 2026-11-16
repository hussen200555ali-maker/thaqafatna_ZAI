"use client";

/**
 * البطاقة الترحيبية (Hero Card)
 * خلفية متدرجة تراثية (Teal) — التاريخ والترحيب في اليمين،
 * شارة المستوى في الأعلى يساراً، ثم الإحصائيات الثلاث وشريط التقدم
 */

import { motion } from "framer-motion";
import { BadgeCheck, BookCheck, Medal, Star } from "lucide-react";
import { heroTexts, type HeroStats } from "./data";

/** تنسيق التاريخ الهجري/الميلادي بالعربية */
function formatArabicDate(): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

interface HeroCardProps {
  stats: HeroStats;
}

export function HeroCard({ stats }: HeroCardProps) {
  const progress = Math.min(100, Math.max(0, stats.progressPercent));

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-label="بطاقة الترحيب"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-heritage-900 via-heritage-800 to-heritage-700 p-5 text-white shadow-card-lg"
    >
      {/* نقش تراثي منقّط — طبقة تراكب لا تتعارض مع التدرج */}
      <div
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.13)_1px,transparent_0)] [background-size:18px_18px]"
        aria-hidden="true"
      />
      {/* توهج زخرفي */}
      <div
        className="pointer-events-none absolute -bottom-12 -start-12 size-44 rounded-full bg-gold-500/15 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-16 -end-10 size-36 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />

      {/* الصف العلوي: التاريخ (يمين) + شارة المستوى (يسار) */}
      <div className="relative flex items-start justify-between gap-3">
        <p className="pt-1 text-[11px] font-medium leading-5 text-white/75">
          {formatArabicDate()}
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
          <Star className="size-3.5 fill-gold-500 text-gold-500" aria-hidden="true" />
          المستوى {stats.levelNumber.toLocaleString("ar-EG")}
        </span>
      </div>

      {/* الترحيب والوصف — محاذاة يمين */}
      <h2 className="relative mt-4 font-heading text-[26px] font-extrabold leading-snug">
        {heroTexts.greeting}
      </h2>
      <p className="relative mt-2 max-w-[34ch] text-[13px] leading-relaxed text-white/80">
        {heroTexts.description}
      </p>

      {/* الإحصائيات الثلاث */}
      <dl className="relative mt-5 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm">
          <BookCheck className="size-5 shrink-0 text-gold-400" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <dt className="text-[10px] text-white/70">المحصل</dt>
            <dd className="font-heading text-sm font-bold">
              {stats.completedLevels.toLocaleString("ar-EG")}/
              {stats.totalLevels.toLocaleString("ar-EG")}
            </dd>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm">
          <BadgeCheck className="size-5 shrink-0 text-gold-400" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <dt className="text-[10px] text-white/70">النقاط</dt>
            <dd className="font-heading text-sm font-bold">
              {stats.points.toLocaleString("ar-EG")}
            </dd>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 backdrop-blur-sm">
          <Medal className="size-5 shrink-0 text-gold-400" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <dt className="text-[10px] text-white/70">الأوسمة</dt>
            <dd className="font-heading text-sm font-bold">
              {stats.badges.toLocaleString("ar-EG")}
            </dd>
          </div>
        </div>
      </dl>

      {/* شريط التقدم */}
      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium text-white/80">{heroTexts.progressLabel}</span>
          <span className="font-heading font-bold text-gold-400">
            {progress.toLocaleString("ar-EG")}%
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={heroTexts.progressLabel}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-400"
          />
        </div>
      </div>
    </motion.section>
  );
}
