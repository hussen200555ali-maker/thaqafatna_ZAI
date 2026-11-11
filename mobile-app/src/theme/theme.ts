/**
 * 🎨 ثيم التطبيق - ألوان وخطوط ثقافتنا
 * مطابق للهوية البصرية للموقع الحالي
 */

export const Colors = {
  // الألوان الأساسية
  primary: '#9333EA',      // بنفسجي
  primaryLight: '#C084FC',
  primaryDark: '#7E22CE',

  secondary: '#2563EB',    // أزرق
  secondaryLight: '#60A5FA',

  accent: '#F59E0B',        // برتقالي ذهبي
  accentLight: '#FBBF24',

  // الخلفيات
  background: '#0c0a09',    // أسود داكن
  surface: '#1C1917',      // ستون داكن
  surfaceLight: '#292524',
  card: '#1F1B17',

  // النصوص
  text: '#F5F5F4',         // أبيض مائل للكريمي
  textMuted: '#A8A29E',
  textDim: '#78716C',

  // الحدود
  border: 'rgba(68, 64, 60, 0.6)',
  borderLight: 'rgba(168, 162, 158, 0.2)',

  // الحالات
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // ألوان إضافية
  purple: '#A855F7',
  pink: '#EC4899',
  emerald: '#10B981',
  teal: '#14B8A6',
  cyan: '#06B6D4',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 36,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const Gradients = {
  primary: ['#9333EA', '#2563EB'],
  warm: ['#F59E0B', '#EC4899', '#9333EA'],
  success: ['#10B981', '#059669'],
  dark: ['#1C1917', '#0c0a09'],
} as const;
