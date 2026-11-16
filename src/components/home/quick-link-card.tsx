"use client";

/**
 * بطاقة الرابط السريع الأفقية (Quick Link Card)
 * ارتفاع أساسي 76px — الأيقونة في اليمين، النص في الوسط، السهم في اليسار
 * تمتد تلقائياً حتى 88px عند التفاف النصوص الطويلة (سطران كحد أقصى)
 * بدون أي فراغات ميتة: flex يضمن توزيع المساحات بالكامل
 */

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { QuickLink } from "./data";

interface QuickLinkCardProps {
  link: QuickLink;
  index: number;
  onSelect?: (link: QuickLink) => void;
}

export function QuickLinkCard({ link, index, onSelect }: QuickLinkCardProps) {
  const Icon = link.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: "easeOut" }}
      onClick={() => onSelect?.(link)}
      className="flex min-h-[76px] w-full items-center gap-3 rounded-2xl bg-white py-2.5 pr-3 pl-2.5 text-right shadow-card transition-all duration-150 hover:shadow-card-lg active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      aria-label={`${link.title} — ${link.subtitle}`}
    >
      {/* مربع الأيقونة — يمين (بداية RTL) */}
      <div
        className={`grid size-12 shrink-0 place-items-center rounded-xl ${link.iconClass}`}
        aria-hidden="true"
      >
        <Icon className="size-5.5" />
      </div>

      {/* النصوص — المنتصف، تمتد لكامل المساحة المتبقية */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-[15px] font-bold text-heritage-900">
            {link.title}
          </h3>
          {link.badge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${link.badgeClass}`}
            >
              {link.badge}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">
          {link.subtitle}
        </p>
      </div>

      {/* السهم — يسار (نهاية RTL) */}
      <div
        className="grid size-8 shrink-0 place-items-center rounded-full bg-heritage-50 text-heritage-700"
        aria-hidden="true"
      >
        <ChevronLeft className="size-4.5" />
      </div>
    </motion.button>
  );
}
