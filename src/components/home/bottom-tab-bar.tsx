"use client";

/**
 * شريط التنقل السفلي (Bottom Tab Bar)
 * ثابت أسفل الشاشة — شفاف بتأثير Blur — 5 أيقونات
 * التبويب النشط بلون ذهبي مع شريط تمييز علوي
 */

import { motion } from "framer-motion";
import { bottomTabs } from "./data";

interface BottomTabBarProps {
  activeId: string;
  onChange?: (tabId: string) => void;
}

export function BottomTabBar({ activeId, onChange }: BottomTabBarProps) {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="glass-tabbar fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-md border-t border-heritage-900/8 md:border-x"
    >
      <div className="mx-auto flex h-[68px] max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeId;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.title}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              {/* شريط التمييز الذهبي أعلى التبويب النشط */}
              {isActive && (
                <motion.span
                  layoutId="tab-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute top-0 h-1 w-10 rounded-full bg-gradient-to-l from-gold-500 to-gold-400"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={`size-5.5 transition-colors duration-200 ${
                  isActive ? "text-gold-600" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.4 : 2}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] leading-none transition-colors duration-200 ${
                  isActive
                    ? "font-bold text-gold-700"
                    : "font-medium text-muted-foreground"
                }`}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
