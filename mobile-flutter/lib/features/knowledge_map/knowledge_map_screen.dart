import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة خريطة المعرفة
class KnowledgeMapScreen extends ConsumerWidget {
  const KnowledgeMapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(userIdProvider) ?? 'guest';
    final mapAsync = ref.watch(knowledgeMapProvider(userId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('🗺️ خريطة المعرفة'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: mapAsync.when(
        data: (domains) {
          if (domains.isEmpty) {
            return const EmptyStateWidget(
              emoji: '🗺️',
              title: 'خريطتك فارغة',
              description: 'ابدأ بحل المراحل لتظهر هنا مجالاتك ومهاراتك.',
            );
          }
          final list = domains.cast<KnowledgeNodeModel>();

          // إحصائيات عامة
          final totalNodes = _countTotal(list);
          final completedNodes = _countCompleted(list);
          final masteryPercent =
              totalNodes > 0 ? (completedNodes * 100 ~/ totalNodes) : 0;

          return CustomScrollView(
            slivers: [
              // إحصائيات عامة
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(AppSizes.md),
                  padding: const EdgeInsets.all(AppSizes.lg),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'إتقانك العام',
                        style:
                            AppFonts.bodyMedium.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$masteryPercent%',
                        style: AppFonts.headlineLarge
                            .copyWith(color: Colors.white, fontSize: 48),
                      ),
                      const SizedBox(height: AppSizes.md),
                      LinearProgressIndicator(
                        value: masteryPercent / 100,
                        backgroundColor: Colors.white.withOpacity(0.3),
                        color: AppColors.accent,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: AppSizes.sm),
                      Text(
                        '$completedNodes من $totalNodes مهارة مكتملة',
                        style:
                            AppFonts.caption.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ),

              // قائمة المجالات
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final domain = list[index];
                    return _DomainCard(domain: domain);
                  },
                  childCount: list.length,
                ),
              ),
            ],
          );
        },
        loading: () => const LoadingWidget(text: 'جاري تحميل الخريطة...'),
        error: (err, _) => ErrorStateWidget(
          message: err.toString(),
          onRetry: () => ref.invalidate(knowledgeMapProvider(userId)),
        ),
      ),
    );
  }

  int _countTotal(List<KnowledgeNodeModel> nodes) {
    int count = 0;
    for (final n in nodes) {
      count += 1 + _countTotal(n.children);
    }
    return count;
  }

  int _countCompleted(List<KnowledgeNodeModel> nodes) {
    int count = 0;
    for (final n in nodes) {
      if (n.mastery >= 1.0) count += 1;
      count += _countCompleted(n.children);
    }
    return count;
  }
}

class _DomainCard extends StatelessWidget {
  final KnowledgeNodeModel domain;

  const _DomainCard({required this.domain});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(
          horizontal: AppSizes.md, vertical: AppSizes.xs),
      decoration: AppDecorations.card(),
      child: ExpansionTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.accent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppSizes.radiusSm),
          ),
          child: Center(
            child: Text(
              '${domain.masteryPercent}%',
              style: AppFonts.caption
                  .copyWith(color: AppColors.accent, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        title: Text(
          domain.name,
          style: AppFonts.titleMedium.copyWith(color: AppColors.textPrimary),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            LinearProgressIndicator(
              value: domain.mastery,
              backgroundColor: AppColors.backgroundDark,
              color: AppColors.accent,
              minHeight: 4,
              borderRadius: BorderRadius.circular(2),
            ),
            if (domain.description.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  domain.description,
                  style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
        ),
        children: domain.children.isEmpty
            ? [
                const Padding(
                  padding: EdgeInsets.all(AppSizes.md),
                  child: Text('لا توجد مهارات فرعية بعد.'),
                ),
              ]
            : domain.children
                .map((child) => ListTile(
                      leading: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: child.mastery >= 1.0
                              ? AppColors.success.withOpacity(0.1)
                              : AppColors.backgroundDark,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            child.mastery >= 1.0
                                ? Icons.check
                                : Icons.circle_outlined,
                            color: child.mastery >= 1.0
                                ? AppColors.success
                                : AppColors.textHint,
                            size: 16,
                          ),
                        ),
                      ),
                      title: Text(
                        child.name,
                        style: AppFonts.bodyMedium
                            .copyWith(color: AppColors.textPrimary),
                      ),
                      trailing: Text(
                        '${child.masteryPercent}%',
                        style: AppFonts.caption
                            .copyWith(color: AppColors.accent, fontWeight: FontWeight.w700),
                      ),
                    ))
                .toList(),
      ),
    );
  }
}
