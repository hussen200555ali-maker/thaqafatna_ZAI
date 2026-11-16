"use client";

/**
 * المحاور الثقافية (Cultural Chips)
 * شبكة من 4 أعمدة: الآداب — الطبيعة — العلوم — التاريخ
 * المحور النشط يأخذ إطاراً ذهبياً واضحاً
 * الارتفاع مرن (min-h) ليتحمّل التفاف العناوين الثانوية الطويلة
 */

import { motion } from "framer-motion";
import { culturalAxes, type CulturalAxis } from "./data";
import { SectionHeader } from "./section-header";

interface CulturalChipsProps {
  /** معرّف المحور النشط */
  activeId: string;
  onChange?: (axis: CulturalAxis) => void;
}

export function CulturalChips({ activeId, onChange }: CulturalChipsProps) {
  return (
    <section aria-label="المحاور الثقافية" className="space-y-3">
      <SectionHeader title="المحاور الثقافية" sideText="٤ محاور" />

      <div className="grid grid-cols-4 gap-2.5">
        {culturalAxes.map((axis, index) => {
          const Icon = axis.icon;
          const isActive = axis.id === activeId;

          return (
            <motion.button
              key={axis.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index, ease: "easeOut" }}
              onClick={() => onChange?.(axis)}
              aria-pressed={isActive}
              aria-label={`محور ${axis.title}`}
              className={`group relative flex min-h-[104px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-white pb-2 pt-4 shadow-card transition-all duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                isActive
                  ? "border-2 border-gold-500 shadow-glow-gold"
                  : "border-2 border-transparent hover:shadow-card-lg"
              }`}
            >
              {/* الشريط العلوي الملون المميز */}
              <span
                className={`absolute inset-x-3 top-0 h-1 rounded-b-full ${axis.accentClass} ${
                  isActive ? "opacity-100" : "opacity-70"
                }`}
                aria-hidden="true"
              />

              <div
                className={`grid size-9 place-items-center rounded-xl transition-colors ${
                  isActive
                    ? "bg-heritage-50 text-heritage-700"
                    : "bg-sand text-heritage-700/80 group-hover:bg-heritage-50"
                }`}
                aria-hidden="true"
              >
                <Icon className="size-4.5" />
              </div>

              <span className="font-heading text-[13px] font-bold text-heritage-900">
                {axis.title}
              </span>
              <span className="line-clamp-2 px-1 text-center text-[9px] font-medium leading-snug text-muted-foreground">
                {axis.subtitle}
              </span>

              {/* مؤشر النشاط الذهبي */}
              {isActive && (
                <motion.span
                  layoutId="axis-active-dot"
                  className="absolute bottom-1.5 size-1.5 rounded-full bg-gold-500"
                  aria-hidden="true"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
