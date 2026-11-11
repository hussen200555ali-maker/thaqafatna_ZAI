import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../app/providers.dart';

/// شاشة البداية - تعرض الشعار ثم تنتقل
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;

  @override
  void initState() {
    super.initState();
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _logoController.forward();

    // انتقال للشاشة التالية بعد 2 ثانية
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (!mounted) return;
      final onboardingSeen = ref.read(onboardingSeenProvider);
      context.go(onboardingSeen ? '/main/home' : '/onboarding');
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // الشعار
                ScaleTransition(
                  scale: _logoController,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppColors.backgroundLight,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withOpacity(0.5),
                          blurRadius: 30,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        '🌟',
                        style: TextStyle(fontSize: 64),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // العنوان
                Text(
                  'ثقافتنا',
                  style: AppFonts.displayLarge.copyWith(
                    color: Colors.white,
                    fontSize: 40,
                  ),
                )
                    .animate()
                    .fadeIn(delay: 500.ms, duration: 600.ms)
                    .slideY(begin: 0.5),

                const SizedBox(height: 8),

                // الوصف
                Text(
                  'منصة ثقافية تفاعلية',
                  style: AppFonts.bodyLarge.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 1000.ms, duration: 600.ms)
                    .slideY(begin: 0.5),

                const SizedBox(height: 64),

                // مؤشر التحميل
                SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    color: AppColors.accent,
                    strokeWidth: 3,
                  ),
                ).animate().fadeIn(delay: 1500.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
