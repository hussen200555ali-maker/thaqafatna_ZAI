import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../app/providers.dart';

/// الشاشة الرئيسية - لوحة تحكم المستخدم
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(chaptersProvider);
    final booksAsync = ref.watch(featuredBooksProvider);
    final coins = ref.watch(coinsProvider);
    final dailyChallengeAsync = ref.watch(dailyChallengeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(chaptersProvider);
            ref.invalidate(featuredBooksProvider);
            ref.invalidate(dailyChallengeProvider);
          },
          color: AppColors.accent,
          child: CustomScrollView(
            slivers: [
              // رأس الشاشة
              SliverToBoxAdapter(
                child: _HomeHeader(coins: coins),
              ),

              // التحدّي اليومي
              SliverToBoxAdapter(
                child: dailyChallengeAsync.when(
                  data: (challenge) => challenge != null
                      ? _DailyChallengeCard(onTap: () {
                          context.push('/daily-challenge');
                        })
                      : const SizedBox.shrink(),
                  loading: () => const Padding(
                    padding: EdgeInsets.all(AppSizes.md),
                    child: LoadingWidget(text: 'جاري تحميل التحدّي اليومي...'),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSizes.md)),

              // إحصائيات سريعة
              SliverToBoxAdapter(
                child: _QuickStats(),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSizes.lg)),

              // الفصول (استكشف)
              SliverToBoxAdapter(
                child: _SectionHeader(
                  title: 'استكشف الفصول',
                  onSeeAll: () => context.push('/main/game'),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 140,
                  child: chaptersAsync.when(
                    data: (chapters) => ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSizes.md),
                      itemCount: chapters.length,
                      itemBuilder: (context, index) {
                        final chapter = chapters[index];
                        return _ChapterCard(
                          title: chapter.title,
                          icon: chapter.icon,
                          description: chapter.description,
                          onTap: () {
                            ref.read(selectedChapterProvider.notifier).state =
                                chapter.id;
                            context.push('/main/game');
                          },
                        );
                      },
                    ),
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.accent),
                    ),
                    error: (_, __) => const Center(
                      child: Text('تعذّر تحميل الفصول'),
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSizes.lg)),

              // الكتب المميزة
              SliverToBoxAdapter(
                child: _SectionHeader(
                  title: 'كتب مميزة',
                  onSeeAll: () => context.push('/main/library'),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 220,
                  child: booksAsync.when(
                    data: (books) => ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSizes.md),
                      itemCount: books.take(10).length,
                      itemBuilder: (context, index) {
                        final book = books[index];
                        return _BookCard(
                          title: book.title,
                          author: book.author,
                          onTap: () => context.push('/book/${book.id}'),
                        );
                      },
                    ),
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.accent),
                    ),
                    error: (_, __) => const Center(
                      child: Text('تعذّر تحميل الكتب'),
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSizes.xl)),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  final int coins;

  const _HomeHeader({required this.coins});

  @override
  Widget build(BuildContext context) {
    return Container(
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('🌟', style: TextStyle(fontSize: 32)),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ثقافتنا',
                        style: AppFonts.titleLarge.copyWith(color: Colors.white),
                      ),
                      Text(
                        'تعلّم بمرح',
                        style: AppFonts.bodySmall
                            .copyWith(color: Colors.white.withOpacity(0.8)),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  CoinIndicator(coins: coins),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined,
                        color: Colors.white),
                    onPressed: () => context.push('/notifications'),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DailyChallengeCard extends StatelessWidget {
  final VoidCallback onTap;

  const _DailyChallengeCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(AppSizes.md),
      decoration: BoxDecoration(
        gradient: AppColors.accentGradient,
        borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        boxShadow: AppDecorations.elevatedShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
          child: Padding(
            padding: const EdgeInsets.all(AppSizes.lg),
            child: Row(
              children: [
                const Text('🎯', style: TextStyle(fontSize: 48)),
                const SizedBox(width: AppSizes.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'التحدّي اليومي',
                        style: AppFonts.titleLarge.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'أكمله الآن واحصل على 100 نقطة! 🪙',
                        style: AppFonts.bodyMedium
                            .copyWith(color: Colors.white.withOpacity(0.9)),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    color: Colors.white, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              emoji: '🔥',
              value: '7',
              label: 'أيام متتالية',
            ),
          ),
          const SizedBox(width: AppSizes.sm),
          Expanded(
            child: _StatCard(
              emoji: '⭐',
              value: '12',
              label: 'مراحل مكتملة',
            ),
          ),
          const SizedBox(width: AppSizes.sm),
          Expanded(
            child: _StatCard(
              emoji: '📚',
              value: '3',
              label: 'كتب مقروءة',
            ),
          ),
        ],
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
      padding: const EdgeInsets.symmetric(vertical: AppSizes.md, horizontal: 8),
      decoration: AppDecorations.card(),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
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
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;

  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.md,
        vertical: AppSizes.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppFonts.titleLarge.copyWith(color: AppColors.textPrimary),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              child: Text(
                'عرض الكل',
                style: AppFonts.bodySmall.copyWith(color: AppColors.accent),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChapterCard extends StatelessWidget {
  final String title;
  final String icon;
  final String description;
  final VoidCallback onTap;

  const _ChapterCard({
    required this.title,
    required this.icon,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      margin: const EdgeInsets.only(left: AppSizes.sm),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppSizes.md),
          decoration: AppDecorations.card(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(icon, style: const TextStyle(fontSize: 28)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: AppFonts.titleMedium
                          .copyWith(color: AppColors.textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: AppFonts.bodySmall
                    .copyWith(color: AppColors.textSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                  ),
                  child: Text(
                    'ابدأ →',
                    style: AppFonts.caption
                        .copyWith(color: AppColors.accent, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final String title;
  final String author;
  final VoidCallback onTap;

  const _BookCard({
    required this.title,
    required this.author,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(left: AppSizes.sm),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              height: 160,
              decoration: BoxDecoration(
                gradient: AppColors.secondaryGradient,
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                boxShadow: AppDecorations.softShadow,
              ),
              child: const Center(
                child: Text('📖', style: TextStyle(fontSize: 48)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppFonts.bodyMedium
                  .copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              author,
              style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
