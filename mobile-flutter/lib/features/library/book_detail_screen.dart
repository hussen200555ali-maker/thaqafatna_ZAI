import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة تفاصيل الكتاب
class BookDetailScreen extends ConsumerStatefulWidget {
  final int bookId;

  const BookDetailScreen({super.key, required this.bookId});

  @override
  ConsumerState<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends ConsumerState<BookDetailScreen> {
  BookModel? _book;
  bool _isLoading = true;
  String? _error;
  bool _isBookmarked = false;

  @override
  void initState() {
    super.initState();
    _loadBook();
  }

  Future<void> _loadBook() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      _book = await api.getBook(widget.bookId);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _shareBook() {
    if (_book == null) return;
    Share.share(
      '${_book!.title}\nبقلم: ${_book!.author}\n\nتطبيق ثقافتنا - اقرأ المزيد',
      subject: _book!.title,
    );
  }

  void _toggleBookmark() {
    setState(() => _isBookmarked = !_isBookmarked);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isBookmarked ? '🔖 أُضيف للمفضلة' : 'أُزيل من المفضلة'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const LoadingWidget(text: 'جاري تحميل الكتاب...')
          : _error != null
              ? ErrorStateWidget(message: _error!, onRetry: _loadBook)
              : _book != null
                  ? _buildBookDetail()
                  : const EmptyStateWidget(
                      emoji: '📭',
                      title: 'الكتاب غير موجود',
                    ),
    );
  }

  Widget _buildBookDetail() {
    final book = _book!;
    return CustomScrollView(
      slivers: [
        // الصورة الكبيرة + زر الرجوع
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          backgroundColor: AppColors.primary,
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            IconButton(
              icon: Icon(_isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                  color: Colors.white),
              onPressed: _toggleBookmark,
            ),
            IconButton(
              icon: const Icon(Icons.share, color: Colors.white),
              onPressed: _shareBook,
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.secondaryGradient,
              ),
              child: const Center(
                child: Text('📖', style: TextStyle(fontSize: 100)),
              ),
            ),
          ),
        ),

        // التفاصيل
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSizes.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // العنوان والمؤلف
                Text(
                  book.title,
                  style: AppFonts.headlineMedium
                      .copyWith(color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  'بقلم: ${book.author}',
                  style: AppFonts.bodyMedium
                      .copyWith(color: AppColors.textSecondary),
                ),

                const SizedBox(height: AppSizes.md),

                // الأوسمة (badges)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    AppBadge(
                      text: book.category ?? 'غير مصنف',
                      backgroundColor: AppColors.primary,
                    ),
                    AppBadge(
                      text: book.difficulty == 'easy'
                          ? 'سهل'
                          : book.difficulty == 'medium'
                              ? 'متوسط'
                              : 'صعب',
                      backgroundColor: AppColors.success,
                    ),
                    AppBadge(
                      text: '📄 ${book.pages} صفحة',
                      backgroundColor: AppColors.brown,
                    ),
                    AppBadge(
                      text: '⏱️ ${book.readingTimeMin} دقيقة',
                      backgroundColor: AppColors.secondary,
                    ),
                    AppBadge(
                      text: '👁️ ${book.views} مشاهدة',
                      backgroundColor: AppColors.gold,
                      textColor: Colors.white,
                    ),
                  ],
                ),

                const SizedBox(height: AppSizes.lg),

                // الوصف
                Text(
                  'نبذة عن الكتاب',
                  style:
                      AppFonts.titleLarge.copyWith(color: AppColors.textPrimary),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(AppSizes.md),
                  decoration: AppDecorations.card(),
                  child: Text(
                    book.description.isEmpty
                        ? 'لا يوجد وصف لهذا الكتاب.'
                        : book.description,
                    style: AppFonts.bodyMedium
                        .copyWith(color: AppColors.textPrimary, height: 1.6),
                  ),
                ),

                const SizedBox(height: AppSizes.lg),

                // التقييم
                if (book.rating != null)
                  Container(
                    padding: const EdgeInsets.all(AppSizes.md),
                    decoration: AppDecorations.card(),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'التقييم',
                              style: AppFonts.caption
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                            Text(
                              '${book.rating!.toStringAsFixed(1)} / 5.0',
                              style: AppFonts.titleLarge
                                  .copyWith(color: AppColors.accent),
                            ),
                          ],
                        ),
                        Row(
                          children: List.generate(
                            5,
                            (index) => Icon(
                              index < book.rating!.round()
                                  ? Icons.star
                                  : Icons.star_border,
                              color: AppColors.gold,
                              size: 24,
                            ),
                          ),
                        ),
                        Text(
                          '${book.ratingCount} تقييم',
                          style: AppFonts.caption
                              .copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: AppSizes.xl),

                // أزرار الإجراءات
                Row(
                  children: [
                    Expanded(
                      child: GradientButton(
                        label: 'ابدأ القراءة',
                        icon: Icons.menu_book,
                        onPressed: () =>
                            context.push('/book/${book.id}/read'),
                        gradient: AppColors.accentGradient,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSizes.sm),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _toggleBookmark,
                        icon: Icon(_isBookmarked
                            ? Icons.bookmark
                            : Icons.bookmark_border),
                        label: Text(_isBookmarked ? 'في المفضلة' : 'أضف للمفضلة'),
                      ),
                    ),
                    const SizedBox(width: AppSizes.sm),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _shareBook,
                        icon: const Icon(Icons.share),
                        label: const Text('مشاركة'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
