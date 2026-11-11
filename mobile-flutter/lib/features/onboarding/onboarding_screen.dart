import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../app/providers.dart';

/// شاشة التعريف بالتطبيق - 3 شرائح
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingData> _pages = [
    _OnboardingData(
      emoji: '🎮',
      title: 'تعلّم بمرح',
      description: 'ألعاب ثقافية متنوّعة: كلمات متقاطعة، ألغاز، وتحدّيات يومية تزيد معرفتك بينما تستمتع.',
      gradient: const LinearGradient(
        colors: [Color(0xFF0F4C5C), Color(0xFF2A6F7F)],
      ),
    ),
    _OnboardingData(
      emoji: '📚',
      title: 'اقرأ وارتقِ',
      description: 'مكتبة كتب إسلامية وأدبية مع قارئ PDF مدمج. تتبّع تقدّمك واحفظ مكانك بسهولة.',
      gradient: const LinearGradient(
        colors: [Color(0xFF5F0F40), Color(0xFF9A031E)],
      ),
    ),
    _OnboardingData(
      emoji: '🤖',
      title: 'تحدّى نفسك',
      description: 'مساعد ذكي يجيب على أسئلتك، خريطة معرفة تتبع مهاراتك، ومتصدرون يحدّونك للتقدّم.',
      gradient: const LinearGradient(
        colors: [Color(0xFFE36414), Color(0xFFF59E0B)],
      ),
    ),
  ];

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _completeOnboarding() async {
    await ref.read(onboardingSeenProvider.notifier).markSeen();
    if (!mounted) return;
    context.go('/main/home');
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // شريط الأعلى مع زر التخطّي
            Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.md),
                child: TextButton(
                  onPressed: _completeOnboarding,
                  child: Text(
                    'تخطّي',
                    style: AppFonts.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),

            // شرائح الـ Onboarding
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (page) {
                  setState(() => _currentPage = page);
                },
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.all(AppSizes.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // الأيقونة
                        Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            gradient: page.gradient,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: page.gradient.colors.last.withOpacity(0.4),
                                blurRadius: 30,
                                spreadRadius: 8,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              page.emoji,
                              style: const TextStyle(fontSize: 80),
                            ),
                          ),
                        ).animate().scale(
                              delay: 200.ms,
                              duration: 600.ms,
                              curve: Curves.elasticOut,
                            ),

                        const SizedBox(height: 48),

                        // العنوان
                        Text(
                          page.title,
                          style: AppFonts.headlineLarge.copyWith(
                            color: AppColors.textPrimary,
                          ),
                        ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.3),

                        const SizedBox(height: 16),

                        // الوصف
                        Text(
                          page.description,
                          style: AppFonts.bodyLarge.copyWith(
                            color: AppColors.textSecondary,
                            height: 1.6,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3),
                      ],
                    ),
                  );
                },
              ),
            ),

            // مؤشرات الصفحات
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSizes.lg),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? AppColors.accent
                          : AppColors.backgroundDark,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
            ),

            // زر التالي
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSizes.xl,
                0,
                AppSizes.xl,
                AppSizes.xl,
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _nextPage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _pages[_currentPage].gradient.colors.first,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    _currentPage == _pages.length - 1 ? 'ابدأ الآن' : 'التالي',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingData {
  final String emoji;
  final String title;
  final String description;
  final Gradient gradient;

  const _OnboardingData({
    required this.emoji,
    required this.title,
    required this.description,
    required this.gradient,
  });
}
