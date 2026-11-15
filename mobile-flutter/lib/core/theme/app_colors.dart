import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// نظام الألوان التراثي العربي
/// مستوحى من الزخارف الإسلامية والتراث العربي الأصيل
class AppColors {
  AppColors._();

  // ===== الألوان الأساسية =====
  /// أزرق تراثي عميق - اللون الرئيسي
  static const Color primary = Color(0xFF0F4C5C);

  /// أزرق تراثي فاتح
  static const Color primaryLight = Color(0xFF2A6F7F);

  /// أزرق تراثي داكن
  static const Color primaryDark = Color(0xFF08323D);

  /// برتقالي تراثي - لون مميز للأزرار والإجراءات
  static const Color accent = Color(0xFFE36414);

  /// برتقالي فاتح
  static const Color accentLight = Color(0xFFF59E0B);

  /// برتقالي داكن
  static const Color accentDark = Color(0xFFB84F0F);

  // ===== خلفيات تراثية =====
  /// كريمي تراثي - الخلفية الرئيسية
  static const Color background = Color(0xFFFDF0D5);

  /// كريمي فاتح
  static const Color backgroundLight = Color(0xFFFFFAEB);

  /// كريمي داكن (للبطاقات)
  static const Color backgroundDark = Color(0xFFF5E6C8);

  // ===== ألوان ثانوية تراثية =====
  /// أحمر تراثي (للأخطاء)
  static const Color error = Color(0xFF9A031E);

  /// خمري تراثي (للإنجازات)
  static const Color secondary = Color(0xFF5F0F40);

  /// ذهبي تراثي (للنقاط والمكافآت)
  static const Color gold = Color(0xFFD4AF37);

  /// أخضر زيتي (للنجاح)
  static const Color success = Color(0xFF4A6741);

  /// بني ترابي (للنصوص الثانوية)
  static const Color brown = Color(0xFF6B4226);

  // ===== ألوان النصوص =====
  /// نص أساسي داكن
  static const Color textPrimary = Color(0xFF1C1917);

  /// نص ثانوي
  static const Color textSecondary = Color(0xFF57534E);

  /// نص باهت
  static const Color textHint = Color(0xFFA8A29E);

  /// نص على خلفية داكنة
  static const Color textOnPrimary = Color(0xFFFDF0D5);

  /// نص على خلفية برتقالية
  static const Color textOnAccent = Color(0xFFFFFFFF);

  // ===== ألوان الـ Dark Mode =====
  static const Color darkBackground = Color(0xFF1A1614);
  static const Color darkSurface = Color(0xFF292524);
  static const Color darkCard = Color(0xFF44403C);

  // ===== تدرجات تراثية =====
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0F4C5C), Color(0xFF2A6F7F)],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFE36414), Color(0xFFF59E0B)],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFD4AF37), Color(0xFFFFD700)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [Color(0xFF5F0F40), Color(0xFF9A031E)],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );
}

/// نظام الخطوط
class AppFonts {
  AppFonts._();

  static const String cairo = 'Cairo';
  static const String tajawal = 'Tajawal';

  /// عناوين كبيرة
  static const TextStyle displayLarge = TextStyle(
    fontFamily: cairo,
    fontSize: 32,
    fontWeight: FontWeight.w900,
  );

  /// عناوين
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: cairo,
    fontSize: 28,
    fontWeight: FontWeight.w800,
  );

  /// عناوين فرعية
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: cairo,
    fontSize: 24,
    fontWeight: FontWeight.w700,
  );

  /// عناوين صغيرة
  static const TextStyle titleLarge = TextStyle(
    fontFamily: cairo,
    fontSize: 20,
    fontWeight: FontWeight.w700,
  );

  /// عناوين البطاقات
  static const TextStyle titleMedium = TextStyle(
    fontFamily: cairo,
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );

  /// نصوص أساسية
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: tajawal,
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );

  /// نصوص متوسطة
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: tajawal,
    fontSize: 14,
    fontWeight: FontWeight.w400,
  );

  /// نصوص صغيرة
  static const TextStyle bodySmall = TextStyle(
    fontFamily: tajawal,
    fontSize: 12,
    fontWeight: FontWeight.w400,
  );

  /// تسميات الأزرار
  static const TextStyle button = TextStyle(
    fontFamily: cairo,
    fontSize: 16,
    fontWeight: FontWeight.w700,
  );

  /// تسميات صغيرة
  static const TextStyle caption = TextStyle(
    fontFamily: tajawal,
    fontSize: 11,
    fontWeight: FontWeight.w500,
  );
}

/// أحجام متسقة
class AppSizes {
  AppSizes._();

  // المسافات
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  // أنصاف الأقطار
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusXl = 24;
  static const double radiusFull = 999;

  // أحجام الأيقونات
  static const double iconSm = 16;
  static const double iconMd = 24;
  static const double iconLg = 32;
  static const double iconXl = 48;

  // ارتفاعات الأزرار
  static const double buttonHeight = 52;
  static const double buttonHeightSm = 40;

  // أحجام الشاشة
  static const double mobileBreakpoint = 600;
  static const double tabletBreakpoint = 900;
}

/// زخارف تراثية
class AppDecorations {
  AppDecorations._();

  /// بطاقة بظل ناعم
  static BoxDecoration card({
    Color? color,
    double radius = AppSizes.radiusLg,
    double blurRadius = 12,
    Color shadowColor = const Color(0x1A000000),
  }) =>
      BoxDecoration(
        color: color ?? AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: shadowColor,
            blurRadius: blurRadius,
            offset: const Offset(0, 4),
          ),
        ],
      );

  /// بطاقة متدرجة
  static BoxDecoration gradientCard({
    required Gradient gradient,
    double radius = AppSizes.radiusLg,
    double blurRadius = 16,
  }) =>
      BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: gradient.colors.last.withOpacity(0.3),
            blurRadius: blurRadius,
            offset: const Offset(0, 6),
          ),
        ],
      );

  /// زر بحدود
  static BoxDecoration outlinedButton({
    Color borderColor = AppColors.primary,
    double radius = AppSizes.radiusMd,
    Color? backgroundColor,
  }) =>
      BoxDecoration(
        color: backgroundColor ?? Colors.transparent,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor, width: 2),
      );

  /// خلفية بزخرفة عربية
  static BoxDecoration arabicPattern = BoxDecoration(
    color: AppColors.background,
    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
    border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 1.5),
  );

  /// ظل ناعم للبطاقات العائمة
  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: AppColors.primary.withOpacity(0.08),
      blurRadius: 20,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];

  /// ظل قوي للعناصر المرتفعة
  static List<BoxShadow> elevatedShadow = [
    BoxShadow(
      color: AppColors.primary.withOpacity(0.15),
      blurRadius: 30,
      offset: const Offset(0, 8),
      spreadRadius: 2,
    ),
  ];
}

/// الثوابت العامة
class AppConstants {
  AppConstants._();

  // معلومات التطبيق
  static const String appName = 'ثقافتنا';
  static const String appVersion = '2.0.0';
  static const String appDescription = 'منصة ثقافية تفاعلية عربية';

  // الـ API
  static const String apiBaseUrl = 'https://thaqafatna-qr.vercel.app/api';
  static const Duration apiTimeout = Duration(seconds: 15);
  static const int apiRetryCount = 3;

  // الـ Storage
  static const String hiveBoxName = 'thaqafatna_db';
  static const String prefsKeyOnboardingSeen = 'onboarding_seen';
  static const String prefsKeyThemeMode = 'theme_mode';
  static const String prefsKeyUserId = 'user_id';
  static const String prefsKeyGuestId = 'guest_id';
  static const String prefsKeyLocale = 'locale';

  // الإشعارات
  static const String fcmChannelId = 'thaqafatna_notifications';
  static const String fcmChannelName = 'إشعارات ثقافتنا';
  static const String fcmChannelDesc = 'إشعارات التطبيق: التحدّيات اليومية، الكتب الجديدة، الإنجازات';

  // الـ Navigation
  static const Duration pageTransitionDuration = Duration(milliseconds: 300);

  // أحجام الشبكة
  static const int crosswordCellSize = 36;
  static const double crosswordGap = 2;

  // صور الشاشة الفارغة
  static const String noDataEmoji = '📭';
  static const String errorEmoji = '⚠️';
  static const String loadingEmoji = '⏳';
}
