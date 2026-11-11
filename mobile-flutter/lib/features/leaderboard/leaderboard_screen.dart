import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة المتصدرين
class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _period = 'weekly';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _period = ['daily', 'weekly', 'monthly'][_tabController.index];
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final leaderboardAsync = ref.watch(leaderboardProvider(_period));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('🏆 المتصدرون'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'يومي'),
            Tab(text: 'أسبوعي'),
            Tab(text: 'شهري'),
          ],
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: AppColors.accent,
        ),
      ),
      body: leaderboardAsync.when(
        data: (entries) {
          if (entries.isEmpty) {
            return const EmptyStateWidget(
              emoji: '🏆',
              title: 'لا يوجد متصدرون بعد',
              description: 'ابدأ اللعب الآن لتكون أول المتصدرين!',
            );
          }
          final list = entries.cast<LeaderboardEntryModel>();
          final top3 = list.take(3).toList();
          final rest = list.skip(3).toList();

          return CustomScrollView(
            slivers: [
              // منصة المتصدرين الثلاثة
              SliverToBoxAdapter(
                child: _PodiumSection(top3: top3),
              ),

              // قائمة بقية المتصدرين
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final entry = rest[index];
                    return _LeaderboardItem(
                      entry: entry,
                      rank: index + 4,
                    );
                  },
                  childCount: rest.length,
                ),
              ),
            ],
          );
        },
        loading: () => const LoadingWidget(text: 'جاري تحميل المتصدرين...'),
        error: (err, _) => ErrorStateWidget(
          message: err.toString(),
          onRetry: () => ref.invalidate(leaderboardProvider(_period)),
        ),
      ),
    );
  }
}

class _PodiumSection extends StatelessWidget {
  final List<LeaderboardEntryModel> top3;

  const _PodiumSection({required this.top3});

  @override
  Widget build(BuildContext context) {
    if (top3.isEmpty) return const SizedBox.shrink();

    // ترتيب: 2، 1، 3
    final order = <int>[];
    if (top3.length > 1) order.add(1);
    if (top3.isNotEmpty) order.add(0);
    if (top3.length > 2) order.add(2);

    final heights = [80.0, 110.0, 70.0];
    final colors = [
      const Color(0xFFC0C0C0), // فضة
      const Color(0xFFFFD700), // ذهب
      const Color(0xFFCD7F32), // برونز
    ];
    final emojis = ['🥈', '🥇', '🥉'];

    return Container(
      padding: const EdgeInsets.all(AppSizes.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: order.map((idx) {
          final entry = top3[idx];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: colors[idx],
                  child: Text(
                    entry.name.isNotEmpty ? entry.name[0] : '?',
                    style: AppFonts.headlineMedium.copyWith(color: Colors.white),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  entry.name,
                  style: AppFonts.bodyMedium
                      .copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${entry.xp} XP',
                  style: AppFonts.caption.copyWith(color: AppColors.accent),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 80,
                  height: heights[idx],
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [colors[idx], colors[idx].withOpacity(0.7)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(AppSizes.radiusMd),
                      topRight: Radius.circular(AppSizes.radiusMd),
                    ),
                  ),
                  child: Center(
                    child: Text(emojis[idx], style: const TextStyle(fontSize: 32)),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _LeaderboardItem extends StatelessWidget {
  final LeaderboardEntryModel entry;
  final int rank;

  const _LeaderboardItem({required this.entry, required this.rank});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(
          horizontal: AppSizes.md, vertical: AppSizes.xs),
      padding: const EdgeInsets.all(AppSizes.md),
      decoration: AppDecorations.card(),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                rank.toString(),
                style: AppFonts.bodyMedium.copyWith(
                    color: AppColors.primary, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(width: AppSizes.md),
          CircleAvatar(
            backgroundColor: AppColors.accent,
            child: Text(
              entry.name.isNotEmpty ? entry.name[0] : '?',
              style: AppFonts.bodyMedium.copyWith(color: Colors.white),
            ),
          ),
          const SizedBox(width: AppSizes.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.name,
                  style: AppFonts.bodyMedium
                      .copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${entry.xp} نقطة خبرة',
                  style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          const Text('⭐', style: TextStyle(fontSize: 16)),
        ],
      ),
    );
  }
}
