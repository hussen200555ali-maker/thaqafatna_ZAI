import { ReactNode } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "default" | "light" | "dark";
}

export function Logo({ size = 40, className = "", showText = true, variant = "default" }: LogoProps) {
  const textColor = variant === "light" ? "#FFFFFF" : variant === "dark" ? "#1F2937" : "oklch(0.36 0.05 40)";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.85 0.12 85)" />
            <stop offset="50%" stopColor="oklch(0.72 0.14 75)" />
            <stop offset="100%" stopColor="oklch(0.55 0.14 60)" />
          </linearGradient>
          <linearGradient id="logoInnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="oklch(0.96 0.03 80)" />
          </linearGradient>
        </defs>
        {/* الإطار الخارجي السداسي */}
        <path
          d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z"
          fill="url(#logoGradient)"
          stroke="oklch(0.62 0.14 65)"
          strokeWidth="1.5"
        />
        {/* الإطار الداخلي */}
        <path
          d="M32 8 L52 20 L52 44 L32 56 L12 44 L12 20 Z"
          fill="url(#logoInnerGradient)"
          opacity="0.95"
        />
        {/* شبكة الكلمات المتقاطعة */}
        <g fill="oklch(0.36 0.05 40)" stroke="oklch(0.78 0.13 80)" strokeWidth="0.5">
          <rect x="22" y="20" width="7" height="7" rx="1" fill="oklch(0.78 0.13 80)" />
          <rect x="30" y="20" width="7" height="7" rx="1" fill="url(#logoGradient)" />
          <rect x="38" y="20" width="7" height="7" rx="1" />
          <rect x="22" y="28" width="7" height="7" rx="1" />
          <rect x="30" y="28" width="7" height="7" rx="1" fill="oklch(0.36 0.05 40)" />
          <rect x="38" y="28" width="7" height="7" rx="1" fill="url(#logoGradient)" />
          <rect x="22" y="36" width="7" height="7" rx="1" fill="url(#logoGradient)" />
          <rect x="30" y="36" width="7" height="7" rx="1" />
          <rect x="38" y="36" width="7" height="7" rx="1" fill="oklch(0.78 0.13 80)" />
        </g>
        {/* نقطة ذهبية في المنتصف للزخرفة */}
        <circle cx="33.5" cy="31.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
      </svg>
      {showText && (
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: textColor, fontFamily: "var(--font-tajawal)" }}
        >
          ثقافتنا
        </span>
      )}
    </div>
  );
}
