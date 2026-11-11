import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة تفاصيل المرحلة - عرض شبكة الكلمات المتقاطعة
class LevelDetailScreen extends ConsumerStatefulWidget {
  final int levelId;

  const LevelDetailScreen({super.key, required this.levelId});

  @override
  ConsumerState<LevelDetailScreen> createState() => _LevelDetailScreenState();
}

class _LevelDetailScreenState extends ConsumerState<LevelDetailScreen> {
  LevelModel? _level;
  bool _isLoading = true;
  String? _error;
  final Map<String, String> _userAnswers = {}; // "row,col" → letter

  @override
  void initState() {
    super.initState();
    _loadLevel();
  }

  Future<void> _loadLevel() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      _level = await api.getLevel(widget.levelId);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _checkAnswer() {
    // TODO: التحقق من الإجابات
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ تم التحقّق من إجابتك!')),
    );
  }

  void _useHint() {
    final coins = ref.read(coinsProvider);
    final hintCost = _level?.hintCost ?? 10;
    if (coins < hintCost) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('🪙 لا تملك نقاطًا كافية! تحتاج $hintCost نقطة.')),
      );
      return;
    }
    ref.read(coinsProvider.notifier).subtract(hintCost);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('💡 تلميح: راجع التلميحات بالأعلى!')),
    );
  }

  void _clearAnswers() {
    setState(() => _userAnswers.clear());
  }

  void _submitLevel() async {
    if (_level == null) return;
    await ref
        .read(completedLevelsProvider.notifier)
        .markCompleted(_level!.id, stars: 1);
    ref.read(coinsProvider.notifier).add(_level!.reward);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 أحسنت! حصلت على ${_level!.reward} نقطة'),
        backgroundColor: AppColors.success,
      ),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_level?.title ?? 'المرحلة'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_level != null)
            Padding(
              padding: const EdgeInsets.only(left: AppSizes.md),
              child: Center(
                child: CoinIndicator(coins: _level!.reward),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const LoadingWidget(text: 'جاري تحميل المرحلة...')
          : _error != null
              ? ErrorStateWidget(
                  message: _error!,
                  onRetry: _loadLevel,
                )
              : _level != null
                  ? _buildCrosswordView()
                  : const EmptyStateWidget(
                      emoji: '❓',
                      title: 'المرحلة غير موجودة',
                    ),
    );
  }

  Widget _buildCrosswordView() {
    final level = _level!;
    final grid = level.normalizedCells;
    final rows = grid.length;
    final cols = rows > 0 ? grid[0].length : 0;
    final acrossWords = level.acrossWords;
    final downWords = level.downWords;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSizes.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // معلومات المرحلة
          Container(
            padding: const EdgeInsets.all(AppSizes.md),
            decoration: AppDecorations.card(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildInfoBadge(
                    level.difficulty == 'easy'
                        ? 'سهل'
                        : level.difficulty == 'medium'
                            ? 'متوسط'
                            : 'صعب',
                    AppColors.success),
                _buildInfoBadge('🪙 ${level.reward}', AppColors.gold),
                _buildInfoBadge('🔠 ${rows}×$cols', AppColors.primary),
              ],
            ),
          ),

          const SizedBox(height: AppSizes.md),

          // شبكة الكلمات المتقاطعة
          if (grid.isNotEmpty)
            Center(
              child: Container(
                padding: const EdgeInsets.all(AppSizes.sm),
                decoration: BoxDecoration(
                  color: AppColors.backgroundLight,
                  borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                  border: Border.all(
                      color: AppColors.primary.withOpacity(0.2), width: 2),
                ),
                child: _buildCrosswordGrid(grid),
              ),
            ),

          const SizedBox(height: AppSizes.lg),

          // تلميحات أفقي
          _buildCluesList('↔ أفقي', acrossWords, isAcross: true),

          const SizedBox(height: AppSizes.md),

          // تلميحات رأسي
          _buildCluesList('↕ رأسي', downWords, isAcross: false),

          const SizedBox(height: AppSizes.lg),

          // أزرار الإجراءات
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _checkAnswer,
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('تحقّق'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: AppSizes.sm),
              IconButton(
                onPressed: _useHint,
                icon: const Icon(Icons.lightbulb_outline),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.accent.withOpacity(0.1),
                  foregroundColor: AppColors.accent,
                ),
              ),
              IconButton(
                onPressed: _clearAnswers,
                icon: const Icon(Icons.clear),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.error.withOpacity(0.1),
                  foregroundColor: AppColors.error,
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSizes.md),

          // زر إكمال المرحلة
          SizedBox(
            width: double.infinity,
            child: GradientButton(
              label: 'إكمال المرحلة',
              icon: Icons.celebration,
              onPressed: _submitLevel,
              gradient: AppColors.accentGradient,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
      ),
      child: Text(
        text,
        style: AppFonts.bodySmall.copyWith(
            color: Colors.white, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildCrosswordGrid(List<List<Map<String, dynamic>?>> grid) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: grid.map((row) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: row.map((cell) {
            if (cell == null) {
              return Container(
                width: 36,
                height: 36,
                margin: const EdgeInsets.all(1),
                decoration: BoxDecoration(
                  color: AppColors.darkBackground,
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }
            final letter = cell['letter'] as String? ?? '';
            final num = cell['num'] as int?;
            final key = '${grid.indexOf(row)},${row.indexOf(cell)}';
            return GestureDetector(
              onTap: () {
                // وضع التركيز على الخلية
              },
              child: Container(
                width: 36,
                height: 36,
                margin: const EdgeInsets.all(1),
                decoration: BoxDecoration(
                  color: AppColors.backgroundLight,
                  border: Border.all(
                      color: AppColors.primary.withOpacity(0.3), width: 1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Stack(
                  children: [
                    if (num != null)
                      Positioned(
                        top: 1,
                        right: 2,
                        child: Text(
                          num.toString(),
                          style: const TextStyle(
                            fontSize: 9,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    Center(
                      child: TextField(
                        textAlign: TextAlign.center,
                        textAlignVertical: TextAlignVertical.center,
                        maxLength: 1,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        decoration: const InputDecoration(
                          counterText: '',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onChanged: (value) {
                          setState(() {
                            if (value.isEmpty) {
                              _userAnswers.remove(key);
                            } else {
                              _userAnswers[key] = value;
                            }
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      }).toList(),
    );
  }

  Widget _buildCluesList(
      String title, List<WordModel> words, {required bool isAcross}) {
    return Container(
      padding: const EdgeInsets.all(AppSizes.md),
      decoration: AppDecorations.card(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppFonts.titleMedium.copyWith(color: AppColors.primary),
          ),
          const SizedBox(height: AppSizes.sm),
          if (words.isEmpty)
            Text(
              'لا توجد كلمات ${isAcross ? 'أفقية' : 'رأسية'}',
              style: AppFonts.bodyMedium.copyWith(color: AppColors.textHint),
            )
          else
            Column(
              children: words.map((word) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            (word.number ?? 0).toString(),
                            style: AppFonts.caption
                                .copyWith(color: Colors.white, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: AppFonts.bodyMedium
                                .copyWith(color: AppColors.textPrimary),
                            children: [
                              TextSpan(text: word.clue),
                              TextSpan(
                                text: ' (${word.text.length} حروف)',
                                style: AppFonts.caption
                                    .copyWith(color: AppColors.textHint),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}
