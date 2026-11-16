"use client";

/**
 * قسم الروابط السريعة الأفقية (Quick Links)
 * 4 بطاقات أفقية بارتفاع موحد 76px:
 * توصية ذكية — المكتبة — المتصدرون — تحدي اليوم
 */

import { quickLinks, type QuickLink } from "./data";
import { QuickLinkCard } from "./quick-link-card";
import { SectionHeader } from "./section-header";

interface QuickLinksProps {
  onSelect?: (link: QuickLink) => void;
}

export function QuickLinks({ onSelect }: QuickLinksProps) {
  return (
    <section aria-label="روابط سريعة" className="space-y-3">
      <SectionHeader title="روابط سريعة" sideText="٤ أقسام" />
      <div className="space-y-2.5">
        {quickLinks.map((link, index) => (
          <QuickLinkCard
            key={link.id}
            link={link}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
