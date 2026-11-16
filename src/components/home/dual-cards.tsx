"use client";

/**
 * البطاقات المزدوجة (Dual Cards)
 * بطاقتان متجاورتان بنفس الحجم تماماً:
 * تحدياتي (برتقالية) — خريطة المعرفة (تراثية داكنة)
 * الالتزام باتجاه RTL: الأيقونة يميناً، النص محاذى لليمين، السهم يساراً
 */

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { dualCards, type DualCardItem } from "./data";

const variantStyles: Record<
  DualCardItem["variant"],
  { card: string; iconBox: string }
> = {
  flame: {
    card: "bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600",
    iconBox: "bg-white/20",
  },
  heritage: {
    card: "bg-gradient-to-br from-heritage-950 via-heritage-900 to-heritage-800",
    iconBox: "bg-white/15",
  },
};

interface DualCardsProps {
  onSelect?: (card: DualCardItem) => void;
}

export function DualCards({ onSelect }: DualCardsProps) {
  return (
    <section
      aria-label="اختصارات رئيسية"
      className="grid grid-cols-2 gap-3"
    >
      {dualCards.map((card, index) => {
        const Icon = card.icon;
        const styles = variantStyles[card.variant];
        return (
          <motion.button
            key={card.id}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * index, ease: "easeOut" }}
            onClick={() => onSelect?.(card)}
            className={`${styles.card} group relative flex h-36 flex-col overflow-hidden rounded-2xl p-4 text-right text-white shadow-card transition-transform duration-150 hover:shadow-card-lg active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500`}
            aria-label={`${card.title} — ${card.subtitle}`}
          >
            {/* توهج زخرفي */}
            <div
              className="pointer-events-none absolute -bottom-8 -end-8 size-24 rounded-full bg-white/10 blur-xl"
              aria-hidden="true"
            />

            {/* الصف العلوي: الأيقونة يميناً (بداية) والسهم يساراً (نهاية) */}
            <div className="relative flex items-start justify-between">
              <div
                className={`grid size-11 place-items-center rounded-xl ${styles.iconBox} backdrop-blur-sm`}
                aria-hidden="true"
              >
                <Icon className="size-5.5" />
              </div>
              <ChevronLeft
                className="size-5 text-white/60 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-white"
                aria-hidden="true"
              />
            </div>

            {/* النصوص — أسفل البطاقة محاذاة لليمين (حتى سطرين للنصوص الطويلة) */}
            <div className="relative mt-auto text-right">
              <h3 className="font-heading text-base font-extrabold">
                {card.title}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-white/80">
                {card.subtitle}
              </p>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
}
