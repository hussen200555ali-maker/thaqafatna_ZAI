"use client";

/**
 * الشريط العلوي (App Header)
 * الشعار في اليمين (بداية RTL) — العملات والإعدادات وصورة المستخدم في اليسار (نهاية RTL)
 */

import { Coins, Settings, UserRound } from "lucide-react";

interface AppHeaderProps {
  /** رصيد العملات الحالي */
  coins: number;
  /** اسم المستخدم لعرضه في صورة الحساب */
  userName?: string;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

export function AppHeader({
  coins,
  userName = "زائر",
  onSettingsClick,
  onProfileClick,
}: AppHeaderProps) {
  return (
    <header className="glass-header sticky top-0 z-40 border-b border-heritage-900/5">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        {/* الشعار — بداية RTL (يمين) */}
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-heritage-900 to-heritage-700 shadow-card"
            aria-hidden="true"
          >
            {/* علامة ثقافتنا: كتاب مفتوح بلمسة ذهبية */}
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 7v14"
                className="text-gold-500"
                stroke="#D4AF37"
              />
              <path
                d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
                className="text-white"
                stroke="rgba(255,255,255,0.95)"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="font-heading text-lg font-extrabold text-heritage-900">
              ثقافتنا
            </h1>
            <p className="text-[10px] font-medium text-heritage-700/70">
              منصة الثقافة العربية
            </p>
          </div>
        </div>

        {/* الإجراءات — نهاية RTL (يسار) */}
        <div className="flex items-center gap-2">
          {/* العملات */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-100/70 px-3 py-1.5"
            aria-label={`رصيد العملات: ${coins} عملة`}
          >
            <Coins className="size-4 text-gold-600" aria-hidden="true" />
            <span className="font-heading text-sm font-bold text-gold-700">
              {coins.toLocaleString("ar-EG")}
            </span>
          </div>

          {/* الإعدادات */}
          <button
            type="button"
            onClick={onSettingsClick}
            aria-label="الإعدادات"
            className="grid size-10 place-items-center rounded-full bg-white text-heritage-700 shadow-card transition-transform duration-150 hover:bg-heritage-50 active:scale-95"
          >
            <Settings className="size-4.5" aria-hidden="true" />
          </button>

          {/* صورة المستخدم */}
          <button
            type="button"
            onClick={onProfileClick}
            aria-label={`حساب المستخدم: ${userName}`}
            className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-heritage-100 to-sand-dark text-heritage-700 shadow-card ring-2 ring-white transition-transform duration-150 active:scale-95"
          >
            <UserRound className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
