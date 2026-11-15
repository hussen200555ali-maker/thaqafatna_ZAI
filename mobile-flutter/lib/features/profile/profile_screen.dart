import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../app/providers.dart';

/// شاشة الملف الشخصي
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coins = ref.watch(coinsProvider);
    final streak = ref.watch(dailyStreakProvider);
    final completedLevels = ref.watch(completedLevelsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // رأس الملف الشخصي
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(
                  AppSizes.md,
                  AppSizes.lg,
                  AppSizes.md,
                  AppSizes.xl,
                ),
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(AppSizes.radiusXl),
                    bottomRight: Radius.circular(AppSizes.radiusXl),
                  ),
                ),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: AppColors.backgroundLight,
                          child: const Text('👤', style: TextStyle(fontSize: 50)),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: Colors.white, width: 2),
                            ),
                            child: const Icon(Icons.edit,
                                size: 16, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSizes.md),
                    Text(
                      'مستخدم ثقافتنا',
                      style: AppFonts.headlineMedium
                          .copyWith(color: Colors.white),
                    ),
                    Text(
                      'المستوى 1',
                      style: AppFonts.bodyMedium
                          .copyWith(color: Colors.white.withOpacity(0.8)),
                    ),
                    const SizedBox(height: AppSizes.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSizes.md, vertical: AppSizes.sm),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🪙', style: TextStyle(fontSize: 18)),
                          const SizedBox(width: 4),
                          Text(
                            '$coins نقطة',
                            style: AppFonts.bodyMedium
                                .copyWith(color: Colors.white, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSizes.lg),

              // الإحصائيات
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 3,
                  crossAxisSpacing: AppSizes.sm,
                  mainAxisSpacing: AppSizes.sm,
                  childAspectRatio: 1,
                  children: [
                    _StatCard(
                      emoji: '🎯',
                      value: completedLevels.length.toString(),
                      label: 'مراحل مكتملة',
                    ),
                    _StatCard(
                      emoji: '📚',
                      value: '0',
                      label: 'كتب مقروءة',
                    ),
                    _StatCard(
                      emoji: '⭐',
                      value: '0',
                      label: 'نجوم',
                    ),
                    _StatCard(
                      emoji: '🏆',
                      value: '0',
                      label: 'شارات',
                    ),
                    _StatCard(
                      emoji: '🔥',
                      value: streak.toString(),
                      label: 'أيام متتالية',
                    ),
                    _StatCard(
                      emoji: '📈',
                      value: '${coins * 10}',
                      label: 'نقطة خبرة',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSizes.lg),

              // قائمة الإعدادات
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
                child: Column(
                  children: [
                    _MenuItem(
                      icon: Icons.emoji_events,
                      title: 'الشارات',
                      onTap: () {},
                    ),
                    _MenuItem(
                      icon: Icons.timeline,
                      title: 'سجل النشاط',
                      onTap: () {},
                    ),
                    _MenuItem(
                      icon: Icons.bookmark,
                      title: 'المفضلة',
                      onTap: () {},
                    ),
                    _MenuItem(
                      icon: Icons.settings,
                      title: 'الإعدادات',
                      onTap: () => context.push('/settings'),
                    ),
                    _MenuItem(
                      icon: Icons.info_outline,
                      title: 'عن التطبيق',
                      onTap: () {},
                      isLast: true,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSizes.xl),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String emoji;
  final String value;
  final String label;

  const _StatCard({
    required this.emoji,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppDecorations.card(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppFonts.titleLarge
                .copyWith(color: AppColors.primary, fontWeight: FontWeight.w900),
          ),
          Text(
            label,
            style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;
  final bool isLast;

  const _MenuItem({
    required this.icon,
    required this.title,
    this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSizes.radiusSm),
            ),
            child: Icon(icon, color: AppColors.primary, size: 20),
          ),
          title: Text(
            title,
            style: AppFonts.bodyMedium.copyWith(color: AppColors.textPrimary),
          ),
          trailing: const Icon(Icons.chevron_left, color: AppColors.textHint),
          onTap: onTap,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: 4),
        ),
        if (!isLast) const Divider(height: 1),
      ],
    );
  }
}
