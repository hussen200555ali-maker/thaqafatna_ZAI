// تعريف أنواع الألغاز الـ 12 المدعومة في المنصة

export type PuzzleType =
  | "text"         // 1. سؤال نصي مباشر
  | "image"        // 2. صورة واحدة
  | "images4"      // 2. 4 صور
  | "emoji"        // 3. إيموجي
  | "scrambled"    // 4. حروف مبعثرة
  | "crossword"    // 5. شبكة متقاطعة
  | "fillblank"    // 6. فراغات
  | "matching"     // 7. توصيل وربط
  | "multiple"     // 8. اختيار من متعدد
  | "audio"        // 9. أصوات
  | "logic"        // 10. ألغاز ذهنية
  | "progressive"  // 11. تلميحات متدرجة
  | "mixed";       // 12. مرحلة مختلطة (بوس)

export interface PuzzleTypeDef {
  type: PuzzleType;
  label: string;
  icon: string;
  description: string;
  color: string;
  difficulty: string;
}

export const PUZZLE_TYPES: PuzzleTypeDef[] = [
  {
    type: "text",
    label: "سؤال نصي",
    icon: "📝",
    description: "سؤال أو تعريف مكتوب مباشرة",
    color: "oklch(0.60 0.13 240)",
    difficulty: "سهل",
  },
  {
    type: "image",
    label: "صورة واحدة",
    icon: "🖼️",
    description: "صورة واحدة تدل على الكلمة",
    color: "oklch(0.70 0.14 145)",
    difficulty: "متوسط",
  },
  {
    type: "images4",
    label: "أربع صور",
    icon: "📷",
    description: "4 صور تجمع لتكوين كلمة",
    color: "oklch(0.65 0.18 30)",
    difficulty: "متوسط",
  },
  {
    type: "emoji",
    label: "إيموجي",
    icon: "😎",
    description: "رموز تعبيرية تخمّن منها الكلمة",
    color: "oklch(0.78 0.13 80)",
    difficulty: "سهل",
  },
  {
    type: "scrambled",
    label: "حروف مبعثرة",
    icon: "🔤",
    description: "حروف غير مرتبة تُرتب لتكوين كلمة",
    color: "oklch(0.60 0.09 195)",
    difficulty: "سهل",
  },
  {
    type: "crossword",
    label: "شبكة متقاطعة",
    icon: "🧩",
    description: "شبكة مربعات مع أسئلة أفقية ورأسية",
    color: "oklch(0.55 0.20 350)",
    difficulty: "صعب",
  },
  {
    type: "fillblank",
    label: "إكمال فراغات",
    icon: "✏️",
    description: "نص فيه فراغات يجب إكمالها",
    color: "oklch(0.65 0.10 290)",
    difficulty: "متوسط",
  },
  {
    type: "matching",
    label: "توصيل وربط",
    icon: "🔗",
    description: "ربط كل كلمة بما يناسبها",
    color: "oklch(0.58 0.20 200)",
    difficulty: "متوسط",
  },
  {
    type: "multiple",
    label: "اختيار من متعدد",
    icon: "☑️",
    description: "سؤال مع عدة خيارات",
    color: "oklch(0.70 0.14 145)",
    difficulty: "سهل",
  },
  {
    type: "audio",
    label: "لغز صوتي",
    icon: "🔊",
    description: "صوت يجب تخمين مصدره",
    color: "oklch(0.55 0.15 280)",
    difficulty: "صعب",
  },
  {
    type: "logic",
    label: "لغز منطقي",
    icon: "🧩",
    description: "ألغاز ذهنية ومنطقية",
    color: "oklch(0.50 0.20 260)",
    difficulty: "صعب",
  },
  {
    type: "progressive",
    label: "تلميحات متدرجة",
    icon: "💡",
    description: "لغز واحد مع تلميحات تظهر تدريجياً",
    color: "oklch(0.75 0.15 65)",
    difficulty: "متوسط",
  },
  {
    type: "mixed",
    label: "مرحلة البوس",
    icon: "👑",
    description: "مرحلة مختلطة تجمع أنواعاً متعددة",
    color: "oklch(0.45 0.20 350)",
    difficulty: "صعب",
  },
];

export function getPuzzleTypeDef(type: string): PuzzleTypeDef | undefined {
  return PUZZLE_TYPES.find((p) => p.type === type);
}
