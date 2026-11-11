import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة التحدّي اليومي
class DailyChallengeScreen extends ConsumerWidget {
  const DailyChallengeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengeAsync = ref.watch(dailyChallengeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('🎯 التحدّي اليومي'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: challengeAsync.when(
        data: (challenge) {
          if (challenge == null) {
            return const EmptyStateWidget(
              emoji: '🎯',
              title: 'لا يوجد تحدٍّ اليوم',
              description: 'عُد غدًا لتحدٍّ جديد!',
            );
          }
          return _buildChallenge(context, ref, challenge as DailyChallengeModel);
        },
        loading: () => const LoadingWidget(text: 'جاري تحميل التحدّي...'),
        error: (err, _) => ErrorStateWidget(
          message: err.toString(),
          onRetry: () => ref.invalidate(dailyChallengeProvider),
        ),
      ),
    );
  }

  Widget _buildChallenge(
    BuildContext context,
    WidgetRef ref,
    DailyChallengeModel challenge,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSizes.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // بطاقة السؤال
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSizes.lg),
            decoration: BoxDecoration(
              gradient: AppColors.accentGradient,
              borderRadius: BorderRadius.circular(AppSizes.radiusXl),
              boxShadow: AppDecorations.elevatedShadow,
            ),
            child: Column(
              children: [
                const Text('🎯', style: TextStyle(fontSize: 64)),
                const SizedBox(height: AppSizes.md),
                Text(
                  'تحدّي اليوم',
                  style: AppFonts.headlineMedium.copyWith(color: Colors.white),
                ),
                const SizedBox(height: AppSizes.md),
                Container(
                  padding: const EdgeInsets.all(AppSizes.md),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  ),
                  child: Text(
                    challenge.question,
                    style: AppFonts.bodyLarge
                        .copyWith(color: Colors.white, height: 1.6),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSizes.lg),

          // المكافأة
          Container(
            padding: const EdgeInsets.all(AppSizes.md),
            decoration: AppDecorations.card(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('🪙', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 8),
                    Text(
                      '${challenge.reward} نقطة',
                      style: AppFonts.titleLarge.copyWith(color: AppColors.gold),
                    ),
                  ],
                ),
                Text(
                  'ينتهي خلال ${challenge.timeRemaining.inHours} ساعة',
                  style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSizes.lg),

          // خيارات الإجابة
          if (challenge.options.isNotEmpty) ...[
            Text(
              'الخيارات:',
              style: AppFonts.titleMedium.copyWith(color: AppColors.textPrimary),
            ),
            const SizedBox(height: AppSizes.sm),
            ...challenge.options.map((option) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSizes.sm),
                child: _OptionCard(
                  text: option,
                  onTap: () => _answerChallenge(context, ref, challenge, option),
                ),
              );
            }),
          ] else ...[
            // سؤال مفتوح - حقل إدخال
            Text(
              'اكتب إجابتك:',
              style: AppFonts.titleMedium.copyWith(color: AppColors.textPrimary),
            ),
            const SizedBox(height: AppSizes.sm),
            TextField(
              decoration: const InputDecoration(
                hintText: 'اكتب إجابتك هنا...',
              ),
              onSubmitted: (answer) =>
                  _answerChallenge(context, ref, challenge, answer),
            ),
          ],

          const SizedBox(height: AppSizes.xl),

          // حالة الإكمال
          if (challenge.isCompleted)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSizes.lg),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                border: Border.all(color: AppColors.success, width: 2),
              ),
              child: const Column(
                children: [
                  Text('✅', style: TextStyle(fontSize: 48)),
                  SizedBox(height: 8),
                  Text(
                    'أحسنت! لقد أكملت تحدّي اليوم',
                    style: AppFonts.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _answerChallenge(
    BuildContext context,
    WidgetRef ref,
    DailyChallengeModel challenge,
    String answer,
  ) async {
    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.completeDailyChallenge(answer);
      final isCorrect = result['correct'] == true;

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isCorrect
                ? '🎉 إجابة صحيحة! حصلت على ${challenge.reward} نقطة'
                : '❌ إجابة غير صحيحة. حاول مرة أخرى غدًا.',
          ),
          backgroundColor: isCorrect ? AppColors.success : AppColors.error,
        ),
      );

      if (isCorrect) {
        ref.read(coinsProvider.notifier).add(challenge.reward);
        ref.read(dailyStreakProvider.notifier).increment();
        ref.invalidate(dailyChallengeProvider);
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('حدث خطأ: $e')),
      );
    }
  }
}

class _OptionCard extends StatelessWidget {
  final String text;
  final VoidCallback onTap;

  const _OptionCard({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      child: Container(
        padding: const EdgeInsets.all(AppSizes.md),
        decoration: AppDecorations.card(radius: AppSizes.radiusMd),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
              ),
            ),
            const SizedBox(width: AppSizes.md),
            Expanded(
              child: Text(
                text,
                style: AppFonts.bodyMedium.copyWith(color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
