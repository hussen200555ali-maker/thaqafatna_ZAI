import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة الألعاب - عرض الفصول والمراحل
class GameScreen extends ConsumerWidget {
  const GameScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(chaptersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // الرأس
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(
                AppSizes.md,
                AppSizes.md,
                AppSizes.md,
                AppSizes.lg,
              ),
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(AppSizes.radiusXl),
                  bottomRight: Radius.circular(AppSizes.radiusXl),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🎮 اللعبة',
                    style: AppFonts.headlineLarge.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'تعلّم الثقافة العربية بالألغاز',
                    style: AppFonts.bodyMedium
                        .copyWith(color: Colors.white.withOpacity(0.9)),
                  ),
                ],
              ),
            ),

            // قائمة الفصول
            Expanded(
              child: chaptersAsync.when(
                data: (chapters) => chapters.isEmpty
                    ? const EmptyStateWidget(
                        emoji: '📭',
                        title: 'لا توجد فصول بعد',
                        description: 'سيتم إضافة فصول قريبًا.',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(AppSizes.md),
                        itemCount: chapters.length,
                        itemBuilder: (context, index) {
                          final chapter = chapters[index] as ChapterModel;
                          return _ChapterAccordion(chapter: chapter);
                        },
                      ),
                loading: () => const LoadingWidget(text: 'جاري تحميل الفصول...'),
                error: (err, _) => ErrorStateWidget(
                  message: err.toString(),
                  onRetry: () => ref.invalidate(chaptersProvider),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChapterAccordion extends ConsumerStatefulWidget {
  final ChapterModel chapter;

  const _ChapterAccordion({required this.chapter});

  @override
  ConsumerState<_ChapterAccordion> createState() => _ChapterAccordionState();
}

class _ChapterAccordionState extends ConsumerState<_ChapterAccordion> {
  bool _isExpanded = false;
  List<LevelModel>? _levels;
  bool _isLoading = false;
  String? _error;

  Future<void> _loadLevels() async {
    if (_levels != null) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      _levels = await api.getLevels(widget.chapter.id);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _toggle() {
    setState(() => _isExpanded = !_isExpanded);
    if (_isExpanded) {
      _loadLevels();
    }
  }

  @override
  Widget build(BuildContext context) {
    final completedLevels = ref.watch(completedLevelsProvider);

    return Container(
      margin: const EdgeInsets.only(bottom: AppSizes.sm),
      decoration: AppDecorations.card(),
      child: Column(
        children: [
          // رأس الفصل
          InkWell(
            onTap: _toggle,
            borderRadius: BorderRadius.circular(AppSizes.radiusLg),
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.md),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                    child: Center(
                      child: Text(
                        widget.chapter.icon,
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.chapter.title,
                          style: AppFonts.titleMedium
                              .copyWith(color: AppColors.textPrimary),
                        ),
                        Text(
                          widget.chapter.description,
                          style: AppFonts.caption
                              .copyWith(color: AppColors.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: _isExpanded ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(Icons.chevron_left,
                        color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),

          // المراحل (عند التوسيع)
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 250),
            crossFadeState: _isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: _buildLevelsList(completedLevels),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelsList(Set<int> completedLevels) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(AppSizes.lg),
        child: LoadingWidget(text: 'جاري تحميل المراحل...'),
      );
    }
    if (_error != null) {
      return ErrorStateWidget(
        message: _error!,
        onRetry: () {
          _levels = null;
          _loadLevels();
        },
      );
    }
    if (_levels == null || _levels!.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(AppSizes.lg),
        child: EmptyStateWidget(
          emoji: '📭',
          title: 'لا توجد مراحل في هذا الفصل',
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.md,
        0,
        AppSizes.md,
        AppSizes.md,
      ),
      child: Column(
        children: _levels!.map((level) {
          final isCompleted = completedLevels.contains(level.id);
          return _LevelItem(
            level: level,
            isCompleted: isCompleted,
            onTap: () => context.push('/level/${level.id}'),
          );
        }).toList(),
      ),
    );
  }
}

class _LevelItem extends StatelessWidget {
  final LevelModel level;
  final bool isCompleted;
  final VoidCallback onTap;

  const _LevelItem({
    required this.level,
    required this.isCompleted,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSizes.md, vertical: AppSizes.sm),
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: isCompleted
              ? AppColors.success.withOpacity(0.1)
              : AppColors.backgroundDark.withOpacity(0.5),
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.success : AppColors.accent,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                    : Text(
                        level.number.toString(),
                        style: AppFonts.bodyMedium.copyWith(
                            color: Colors.white, fontWeight: FontWeight.w700),
                      ),
              ),
            ),
            const SizedBox(width: AppSizes.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    level.title,
                    style: AppFonts.bodyMedium
                        .copyWith(color: AppColors.textPrimary),
                  ),
                  Text(
                    '🪙 ${level.reward} نقطة',
                    style: AppFonts.caption
                        .copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            if (isCompleted)
              const Text('⭐', style: TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
