"use client";

/**
 * قسم البدايات (Beginners Section)
 * بطاقات صغيرة مرقمة (١، ٢) للمبتدئين — تدرج ذهبي رملي
 * مع مؤشر نجوم وخط شريط سفلي داكن
 * النجوم ضمن التدفق (mt-auto) لا طبقة مطلقة — حتى لا يتصادم
 * الوصف الطويل معها أبداً مهما طال النص
 */

import { motion } from "framer-motion";
import { Star, Sun } from "lucide-react";
import { beginnerLevels, type BeginnerLevel } from "./data";
import { SectionHeader } from "./section-header";

interface BeginnersSectionProps {
  onSelect?: (level: BeginnerLevel) => void;
}

export function BeginnersSection({ onSelect }: BeginnersSectionProps) {
  return (
    <section aria-label="قسم البدايات" className="space-y-3">
      <SectionHeader title="البدايات" sideText="للمبتدئين" />

      <div className="grid grid-cols-2 gap-3">
        {beginnerLevels.map((level, index) => (
          <motion.button
            key={level.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.07 * index, ease: "easeOut" }}
            onClick={() => onSelect?.(level)}
            className="group relative flex h-36 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-gold-100 via-gold-100 to-sand-dark p-3 text-right shadow-card transition-all duration-150 hover:shadow-card-lg active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            aria-label={`${level.title}: ${level.description}`}
          >
            {/* زخرفة شمسية خلفية */}
            <Sun
              className="pointer-events-none absolute -bottom-4 -left-4 size-20 text-gold-500/15 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              aria-hidden="true"
            />

            {/* الشارة المرقّمة — يمين أعلى (بداية RTL) */}
            <span
              className="grid size-7 place-items-center rounded-full bg-heritage-900 font-heading text-sm font-extrabold text-white shadow-card"
              aria-hidden="true"
            >
              {level.id.toLocaleString("ar-EG")}
            </span>

            {/* النصوص — الوصف حتى سطرين */}
            <div className="relative mt-2.5 text-right">
              <h3 className="font-heading text-sm font-extrabold text-heritage-900">
                {level.title}
              </h3>
              <p className="mt-0.5 line-clamp-2 pe-1 text-[11px] font-medium leading-snug text-heritage-700/80">
                {level.description}
              </p>
            </div>

            {/* مؤشر النجوم — ضمن التدفق أسفل البطاقة (نهاية RTL = يسار) */}
            <div
              className="mt-auto flex items-center justify-end gap-0.5 pb-0.5"
              aria-label={`النجوم: ${level.stars} من ${level.totalStars}`}
            >
              {Array.from({ length: level.totalStars }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  className={`size-3.5 ${
                    starIndex < level.stars
                      ? "fill-gold-500 text-gold-500"
                      : "fill-sand-darker/40 text-sand-darker/40"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* الشريط السفلي الداكن */}
            <span
              className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-l from-heritage-900 to-heritage-700"
              aria-hidden="true"
            />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
