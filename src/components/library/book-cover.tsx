"use client";

import { cn } from "@/lib/utils";

/**
 * غلاف كتاب احترافي مولّد ديناميكياً (SVG)
 * بدلاً من إيموجي بسيط، نولّد غلافاً جميلاً بألوان حسب التصنيف
 */

interface BookCoverProps {
  title: string;
  author: string;
  categoryName?: string;
  difficulty?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const categoryColors: Record<string, { from: string; to: string; icon: string }> = {
  "الأدب العربي": { from: "#3b82f6", to: "#1d4ed8", icon: "📖" },
  "الكتب الدينية": { from: "#10b981", to: "#047857", icon: "🕌" },
  "التاريخ والتراث": { from: "#f59e0b", to: "#d97706", icon: "📜" },
  "العلوم والمعرفة": { from: "#8b5cf6", to: "#6d28d9", icon: "🔬" },
  "الجغرافيا والرحلات": { from: "#06b6d4", to: "#0891b2", icon: "🌍" },
  "الفنون والآداب": { from: "#ec4899", to: "#be185d", icon: "🎨" },
  "أدب الأطفال": { from: "#f97316", to: "#c2410c", icon: "👶" },
  "التطوير المهني": { from: "#64748b", to: "#334155", icon: "💼" },
  default: { from: "#6366f1", to: "#4338ca", icon: "📕" },
};

const sizeMap = {
  sm: { width: 80, height: 112, titleSize: 10, authorSize: 7 },
  md: { width: 120, height: 168, titleSize: 13, authorSize: 9 },
  lg: { width: 160, height: 224, titleSize: 16, authorSize: 11 },
};

export function BookCover({ title, author, categoryName, difficulty, size = "md", className }: BookCoverProps) {
  const colors = (categoryName && categoryColors[categoryName]) || categoryColors.default;
  const dims = sizeMap[size];
  
  // تقصير العنوان إن كان طويلاً
  const displayTitle = title.length > 30 ? title.substring(0, 28) + "..." : title;
  const displayAuthor = author.length > 20 ? author.substring(0, 18) + "..." : author;
  
  // تقسيم العنوان لسطرين
  const titleWords = displayTitle.split(" ");
  let line1 = "";
  let line2 = "";
  for (const word of titleWords) {
    if ((line1 + " " + word).trim().length <= 15) {
      line1 = (line1 + " " + word).trim();
    } else if ((line2 + " " + word).trim().length <= 15) {
      line2 = (line2 + " " + word).trim();
    } else {
      break;
    }
  }

  const gradientId = `grad-${title.replace(/\s/g, "").substring(0, 10)}`;

  return (
    <div
      className={cn("relative rounded-lg overflow-hidden shadow-lg flex-shrink-0", className)}
      style={{ width: dims.width, height: dims.height }}
    >
      <svg width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        
        {/* الخلفية المتدرّجة */}
        <rect width={dims.width} height={dims.height} fill={`url(#${gradientId})`} />
        
        {/* شريط زخرفي علوي */}
        <rect width={dims.width} height={dims.height * 0.06} fill="rgba(255,255,255,0.15)" />
        
        {/* الأيقونة */}
        <text
          x={dims.width / 2}
          y={dims.height * 0.22}
          textAnchor="middle"
          fontSize={dims.titleSize * 1.8}
          fill="rgba(255,255,255,0.9)"
        >
          {colors.icon}
        </text>
        
        {/* خط فاصل */}
        <line
          x1={dims.width * 0.15}
          y1={dims.height * 0.32}
          x2={dims.width * 0.85}
          y2={dims.height * 0.32}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        
        {/* العنوان - سطر 1 */}
        <text
          x={dims.width / 2}
          y={dims.height * 0.42}
          textAnchor="middle"
          fontSize={dims.titleSize}
          fill="white"
          fontWeight="bold"
          fontFamily="Tajawal, sans-serif"
        >
          {line1}
        </text>
        
        {/* العنوان - سطر 2 */}
        {line2 && (
          <text
            x={dims.width / 2}
            y={dims.height * 0.50}
            textAnchor="middle"
            fontSize={dims.titleSize}
            fill="white"
            fontWeight="bold"
            fontFamily="Tajawal, sans-serif"
          >
            {line2}
          </text>
        )}
        
        {/* خط فاصل سفلي */}
        <line
          x1={dims.width * 0.15}
          y1={dims.height * 0.75}
          x2={dims.width * 0.85}
          y2={dims.height * 0.75}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        
        {/* المؤلف */}
        <text
          x={dims.width / 2}
          y={dims.height * 0.83}
          textAnchor="middle"
          fontSize={dims.authorSize}
          fill="rgba(255,255,255,0.7)"
          fontFamily="Tajawal, sans-serif"
        >
          {displayAuthor}
        </text>
        
        {/* شارة الصعوبة */}
        {difficulty && (
          <rect
            x={dims.width * 0.35}
            y={dims.height * 0.90}
            width={dims.width * 0.30}
            height={dims.height * 0.06}
            rx={dims.height * 0.03}
            fill="rgba(255,255,255,0.15)"
          />
        )}
        {difficulty && (
          <text
            x={dims.width / 2}
            y={dims.height * 0.945}
            textAnchor="middle"
            fontSize={dims.authorSize * 0.8}
            fill="rgba(255,255,255,0.6)"
            fontFamily="Tajawal, sans-serif"
          >
            {difficulty === "easy" ? "سهل" : difficulty === "hard" ? "صعب" : "متوسط"}
          </text>
        )}
      </svg>
      
      {/* تأثير لمعان */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
        }}
      />
    </div>
  );
}
