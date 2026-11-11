import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'app/providers.dart';
import 'app/app.dart';

/// نقطة بداية تطبيق ثقافتنا - Flutter
void main() async {
  // ضمان تهيئة الـ bindings قبل أي async
  WidgetsFlutterBinding.ensureInitialized();

  // ضبط اتجاه الشاشة للهواتف فقط (portrait)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // ضبط لون شريط الحالة
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: AppColors.primary,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
      systemNavigationBarColor: AppColors.background,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // تشغيل التطبيق مع Riverpod
  runApp(
    const ProviderScope(
      child: ThaqafatnaApp(),
    ),
  );
}
