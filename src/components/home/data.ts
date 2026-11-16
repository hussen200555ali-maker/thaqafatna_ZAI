/**
 * بيانات تجريبية (Mock Data) للصفحة الرئيسية — نسخة أولية
 * ------------------------------------------------------------------
 * البنية مصممة لتطابق شكل استجابات الـ APIs المستقبلية،
 * بحيث يكفي استبدال الاستيراد من هذا الملف بنداءات API فعلية
 * دون تغيير أي مكون من مكونات الواجهة.
 *
 * ملاحظة الاختبار: النصوص أدناه طويلة ومقصودة الطول —
 * لمحاكاة المحتوى الحقيقي والتأكد من تحمّل التصميم للنصوص الطويلة
 * (الالتفاف، الاقتطاع بـ line-clamp، وأرقام كبيرة منسّقة بالعربية).
 */

import {
  BookOpenText,
  Feather,
  FlaskConical,
  Landmark,
  Leaf,
  LibraryBig,
  Sparkles,
  Swords,
  Trophy,
  Flame,
  type LucideIcon,
} from "lucide-react";

/* ======== الأنواع (Types) ======== */

/** إحصائيات البطاقة الترحيبية */
export interface HeroStats {
  /** المراحل المُحصّلة (مكتملة / الإجمالي) */
  completedLevels: number;
  totalLevels: number;
  /** النقاط الحالية */
  points: number;
  /** عدد الأوسمة */
  badges: number;
  /** نسبة التقدم نحو المستوى التالي (0-100) */
  progressPercent: number;
  /** رقم المستوى الحالي */
  levelNumber: number;
}

/** بطاقة مزدوجة (تحدياتي / خريطة المعرفة) */
export interface DualCardItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** نمط الألوان: برتقالي أو تراثي داكن */
  variant: "flame" | "heritage";
}

/** رابط سريع أفقي */
export interface QuickLink {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** ألوان مربع الأيقونة */
  iconClass: string;
  /** شارة اختيارية (مثل: جديد) */
  badge?: string;
  badgeClass?: string;
}

/** محور ثقافي (شبكة المحاور) */
export interface CulturalAxis {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** لون الشريط العلوي المميز */
  accentClass: string;
}

/** بطاقة مرحلة للمبتدئين */
export interface BeginnerLevel {
  id: number;
  title: string;
  description: string;
  stars: number;
  totalStars: number;
}

/** زر شريط التنقل السفلي */
export interface TabItem {
  id: string;
  title: string;
  icon: LucideIcon;
}

/* ======== البيانات ======== */

export const heroStats: HeroStats = {
  completedLevels: 12,
  totalLevels: 45,
  points: 12500,
  badges: 8,
  progressPercent: 67,
  levelNumber: 4,
};

export const heroTexts = {
  greeting: "أهلاً بك في ثقافتنا",
  description:
    "استكشف عالم المعرفة العربية من الآداب إلى العلوم، والعب ألغازاً تكيّفية صُممت خصيصاً لمستواك، واجمع النقاط والأوسمة في رحلتك اليومية نحو قمة المتصدرين.",
  progressLabel: "التقدم نحو المستوى الخامس",
};

export const dualCards: DualCardItem[] = [
  {
    id: "challenges",
    title: "تحدياتي",
    subtitle: "تحدٍّ جديد كل يوم ومهام أسبوعية بمكافآت مضاعفة",
    icon: Swords,
    variant: "flame",
  },
  {
    id: "knowledge-map",
    title: "خريطة المعرفة",
    subtitle: "تابع رحلتك التعليمية واكتشف المحطات القادمة",
    icon: BookOpenText,
    variant: "heritage",
  },
];

export const quickLinks: QuickLink[] = [
  {
    id: "smart-recommendation",
    title: "توصية ذكية",
    subtitle: "خمسة أسئلة مختارة بعناية وفق مستواك واهتماماتك الأخيرة",
    icon: Sparkles,
    iconClass: "bg-flame-100 text-flame-500",
    badge: "جديد",
    badgeClass: "bg-heritage-100 text-heritage-700",
  },
  {
    id: "library",
    title: "المكتبة",
    subtitle:
      "من «مقدمة ابن خلدون» إلى «كليلة ودمنة» — أكثر من 120 كتاباً بانتظارك",
    icon: LibraryBig,
    iconClass: "bg-heritage-100 text-heritage-700",
  },
  {
    id: "leaderboard",
    title: "المتصدرون",
    subtitle: "أنت في المركز 42 من أصل 3,208 لاعباً هذا الأسبوع",
    icon: Trophy,
    iconClass: "bg-gold-100 text-gold-600",
  },
  {
    id: "daily-challenge",
    title: "تحدي اليوم",
    subtitle: "أكمل لغز اليوم قبل منتصف الليل واربح 50 عملة إضافية",
    icon: Flame,
    iconClass: "bg-flame-100 text-flame-600",
  },
];

export const culturalAxes: CulturalAxis[] = [
  {
    id: "literature",
    title: "الآداب",
    subtitle: "شعر ونثر وحكمة",
    icon: Feather,
    accentClass: "bg-heritage-700",
  },
  {
    id: "nature",
    title: "الطبيعة",
    subtitle: "نبات وأعشاب",
    icon: Leaf,
    accentClass: "bg-emerald-600",
  },
  {
    id: "science",
    title: "العلوم",
    subtitle: "اكتشافات واختراعات",
    icon: FlaskConical,
    accentClass: "bg-flame-500",
  },
  {
    id: "history",
    title: "التاريخ",
    subtitle: "حضارات ودول",
    icon: Landmark,
    accentClass: "bg-violet-600",
  },
];

export const beginnerLevels: BeginnerLevel[] = [
  {
    id: 1,
    title: "المرحلة الأولى",
    description: "أساسيات المفردات والمترادفات الشائعة في اللغة العربية",
    stars: 2,
    totalStars: 3,
  },
  {
    id: 2,
    title: "المرحلة الثانية",
    description: "ألغاز مصورة تربط الصورة بالكلمة المناسبة في وقت محدود",
    stars: 1,
    totalStars: 3,
  },
];

export const bottomTabs: TabItem[] = [
  { id: "home", title: "الرئيسية", icon: Sparkles },
  { id: "game", title: "اللعبة", icon: Swords },
  { id: "library", title: "المكتبة", icon: LibraryBig },
  { id: "leaderboard", title: "المتصدرون", icon: Trophy },
  { id: "profile", title: "حسابي", icon: Feather },
];
