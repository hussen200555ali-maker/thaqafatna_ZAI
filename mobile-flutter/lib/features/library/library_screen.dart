import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة مكتبة الكتب
class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  String? _selectedCategory;

  final _categories = ['الكل', 'أدب', 'تاريخ', 'دين', 'فلسفة', 'علم'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                    '📚 المكتبة',
                    style: AppFonts.headlineLarge.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'اكتشف كنوز المعرفة العربية',
                    style: AppFonts.bodyMedium
                        .copyWith(color: Colors.white.withOpacity(0.9)),
                  ),
                  const SizedBox(height: AppSizes.md),
                  // حقل البحث
                  TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _search = value),
                    decoration: InputDecoration(
                      hintText: 'ابحث عن كتاب أو مؤلف...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                      filled: true,
                      fillColor: AppColors.backgroundLight,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // الفئات
            SizedBox(
              height: 50,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(AppSizes.sm),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  final isSelected = _selectedCategory == category ||
                      (category == 'الكل' && _selectedCategory == null);
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: FilterChip(
                      label: Text(category),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedCategory =
                              selected && category != 'الكل' ? category : null;
                        });
                      },
                      selectedColor: AppColors.accent,
                      backgroundColor: AppColors.backgroundLight,
                      labelStyle: AppFonts.bodyMedium.copyWith(
                        color: isSelected ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                },
              ),
            ),

            // قائمة الكتب
            Expanded(
              child: _buildBooksList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBooksList() {
    return Consumer(
      builder: (context, ref, _) {
        final booksAsync = ref.watch(featuredBooksProvider);
        return booksAsync.when(
          data: (books) {
            var filtered = books.cast<BookModel>();
            if (_search.isNotEmpty) {
              filtered = filtered
                  .where((b) =>
                      b.title.contains(_search) ||
                      b.author.contains(_search))
                  .toList();
            }
            if (_selectedCategory != null) {
              filtered = filtered
                  .where((b) => b.category?.contains(_selectedCategory!) ?? false)
                  .toList();
            }
            if (filtered.isEmpty) {
              return const EmptyStateWidget(
                emoji: '📭',
                title: 'لا توجد كتب مطابقة',
                description: 'جرّب تغيير البحث أو الفئة.',
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.all(AppSizes.md),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: AppSizes.md,
                mainAxisSpacing: AppSizes.md,
                childAspectRatio: 0.65,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final book = filtered[index];
                return _BookGridItem(
                  book: book,
                  onTap: () => context.push('/book/${book.id}'),
                );
              },
            );
          },
          loading: () => const LoadingWidget(text: 'جاري تحميل الكتب...'),
          error: (err, _) => ErrorStateWidget(
            message: err.toString(),
            onRetry: () => ref.invalidate(featuredBooksProvider),
          ),
        );
      },
    );
  }
}

class _BookGridItem extends StatelessWidget {
  final BookModel book;
  final VoidCallback onTap;

  const _BookGridItem({required this.book, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: AppDecorations.card(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: AppColors.secondaryGradient,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppSizes.radiusLg),
                  ),
                ),
                child: Stack(
                  children: [
                    const Center(
                      child: Text('📖', style: TextStyle(fontSize: 48)),
                    ),
                    if (book.isFeatured)
                      const Positioned(
                        top: 8,
                        right: 8,
                        child: AppBadge(
                          text: 'مميز',
                          backgroundColor: AppColors.gold,
                          fontSize: 10,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSizes.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    style: AppFonts.bodyMedium.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.author,
                    style: AppFonts.caption
                        .copyWith(color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Text('👁️', style: TextStyle(fontSize: 12)),
                      const SizedBox(width: 4),
                      Text(
                        '${book.views}',
                        style: AppFonts.caption
                            .copyWith(color: AppColors.textSecondary),
                      ),
                      const Spacer(),
                      if (book.rating != null)
                        Row(
                          children: [
                            const Text('⭐', style: TextStyle(fontSize: 12)),
                            const SizedBox(width: 2),
                            Text(
                              book.rating!.toStringAsFixed(1),
                              style: AppFonts.caption
                                  .copyWith(color: AppColors.accent, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
