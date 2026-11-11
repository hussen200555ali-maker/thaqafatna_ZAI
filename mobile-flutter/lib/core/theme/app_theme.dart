import 'package:flutter/material.dart';
import 'app_colors.dart';

/// الثيم الكامل للتطبيق (Light + Dark)
class AppTheme {
  AppTheme._();

  /// الثيم الفاتح
  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      // الألوان الأساسية
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.background,
      canvasColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        onPrimary: AppColors.textOnPrimary,
        secondary: AppColors.accent,
        onSecondary: AppColors.textOnAccent,
        surface: AppColors.backgroundLight,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
        onError: Colors.white,
        background: AppColors.background,
        onBackground: AppColors.textPrimary,
        outline: AppColors.brown,
        primaryContainer: AppColors.primaryLight,
        secondaryContainer: AppColors.accentLight,
      ),

      // خط التطبيق
      fontFamily: AppFonts.tajawal,
      textTheme: const TextTheme(
        displayLarge: AppFonts.displayLarge,
        displayMedium: AppFonts.headlineLarge,
        displaySmall: AppFonts.headlineMedium,
        headlineLarge: AppFonts.headlineLarge,
        headlineMedium: AppFonts.headlineMedium,
        headlineSmall: AppFonts.titleLarge,
        titleLarge: AppFonts.titleLarge,
        titleMedium: AppFonts.titleMedium,
        titleSmall: AppFonts.titleMedium,
        bodyLarge: AppFonts.bodyLarge,
        bodyMedium: AppFonts.bodyMedium,
        bodySmall: AppFonts.bodySmall,
        labelLarge: AppFonts.button,
        labelMedium: AppFonts.bodyMedium,
        labelSmall: AppFonts.caption,
      ),

      // الأشرطة
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: AppFonts.cairo,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        iconTheme: IconThemeData(color: AppColors.primary, size: 24),
      ),

      // الأزرار
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: AppColors.textOnAccent,
          elevation: 4,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          ),
          textStyle: AppFonts.button,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: AppFonts.button,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 2),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          ),
        ),
      ),

      // البطاقات
      cardTheme: CardTheme(
        color: AppColors.backgroundLight,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        ),
        margin: const EdgeInsets.all(AppSizes.sm),
      ),

      // حقول الإدخال
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundLight,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          borderSide: BorderSide(color: AppColors.brown.withOpacity(0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          borderSide: BorderSide(color: AppColors.brown.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: AppFonts.bodyMedium.copyWith(color: AppColors.textSecondary),
        hintStyle: AppFonts.bodyMedium.copyWith(color: AppColors.textHint),
      ),

      // الـ Bottom Navigation
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.backgroundLight,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textHint,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        selectedLabelStyle:
            TextStyle(fontFamily: AppFonts.cairo, fontWeight: FontWeight.w700, fontSize: 12),
        unselectedLabelStyle:
            TextStyle(fontFamily: AppFonts.tajawal, fontSize: 11),
      ),

      // الأشرطة العلوية للتبويبات
      tabBarTheme: const TabBarTheme(
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.textHint,
        labelStyle: TextStyle(fontFamily: AppFonts.cairo, fontWeight: FontWeight.w700),
        unselectedLabelStyle: TextStyle(fontFamily: AppFonts.tajawal),
        indicatorColor: AppColors.accent,
        indicatorSize: TabBarIndicatorSize.tab,
      ),

      // الأيقونات
      iconTheme: const IconThemeData(
        color: AppColors.primary,
        size: AppSizes.iconMd,
      ),

      // الشريط السفلي للقوائم
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE7E5E4),
        thickness: 1,
        space: 1,
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkBackground,
        contentTextStyle: AppFonts.bodyMedium.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        ),
      ),

      // Chip
      chipTheme: const ChipThemeData(
        backgroundColor: AppColors.backgroundDark,
        selectedColor: AppColors.accent,
        labelStyle: AppFonts.bodySmall,
        secondaryLabelStyle: AppFonts.bodySmall,
        secondarySelectedColor: AppColors.accent,
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),

      // شريط التحميل
      progressIndicatorTheme:
          const ProgressIndicatorThemeData(color: AppColors.accent),

      // أشرطة التمرير
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(AppColors.brown.withOpacity(0.4)),
        radius: const Radius.circular(4),
        thickness: WidgetStateProperty.all(6),
      ),
    );
  }

  /// الثيم الداكن
  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      primaryColor: AppColors.primaryLight,
      scaffoldBackgroundColor: AppColors.darkBackground,
      canvasColor: AppColors.darkBackground,
      colorScheme: ColorScheme.dark(
        primary: AppColors.primaryLight,
        onPrimary: AppColors.textOnPrimary,
        secondary: AppColors.accent,
        onSecondary: AppColors.textOnAccent,
        surface: AppColors.darkSurface,
        onSurface: Colors.white,
        error: AppColors.error,
        onError: Colors.white,
        background: AppColors.darkBackground,
        onBackground: Colors.white,
        outline: AppColors.brown.withOpacity(0.6),
        primaryContainer: AppColors.primary,
        secondaryContainer: AppColors.accentDark,
      ),
      fontFamily: AppFonts.tajawal,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: AppFonts.cairo,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      cardTheme: CardTheme(
        color: AppColors.darkSurface,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        ),
        margin: const EdgeInsets.all(AppSizes.sm),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: Colors.white54,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
    );
  }
}

/// معالجة الألوان على Material 3
extension ColorExtension on Color {}
