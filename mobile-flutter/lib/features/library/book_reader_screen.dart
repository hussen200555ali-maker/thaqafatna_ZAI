import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة قارئ الكتب PDF
class BookReaderScreen extends ConsumerStatefulWidget {
  final int bookId;

  const BookReaderScreen({super.key, required this.bookId});

  @override
  ConsumerState<BookReaderScreen> createState() => _BookReaderScreenState();
}

class _BookReaderScreenState extends ConsumerState<BookReaderScreen> {
  BookModel? _book;
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  double _fontSize = 1.0;
  bool _isNightMode = false;

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

  void _goToPage(int page) {
    setState(() {
      _currentPage = page.clamp(1, _book?.pages ?? 1);
    });
  }

  void _changeFontSize(double delta) {
    setState(() {
      _fontSize = (_fontSize + delta).clamp(0.8, 1.5);
    });
  }

  void _toggleNightMode() {
    setState(() => _isNightMode = !_isNightMode);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _isNightMode ? AppColors.darkBackground : AppColors.backgroundLight,
      appBar: AppBar(
        title: Text(
          _book?.title ?? 'القارئ',
          style: const TextStyle(fontSize: 16),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.text_decrease),
            onPressed: () => _changeFontSize(-0.1),
          ),
          IconButton(
            icon: const Icon(Icons.text_increase),
            onPressed: () => _changeFontSize(0.1),
          ),
          IconButton(
            icon: Icon(_isNightMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: _toggleNightMode,
          ),
          IconButton(
            icon: const Icon(Icons.bookmark_border),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('🔖 صفحة $_currentPage محفوظة')),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingWidget(text: 'جاري تحميل الكتاب...')
          : _error != null
              ? ErrorStateWidget(message: _error!, onRetry: _loadBook)
              : _buildReader(),
      bottomNavigationBar: _buildPageNavigator(),
    );
  }

  Widget _buildReader() {
    // محتوى تجريبي للقارئ
    // في تطبيق حقيقي سنستخدم syncfusion_flutter_pdfviewer هنا
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSizes.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // عنوان الفصل
          Center(
            child: Text(
              'الفصل $_currentPage',
              style: AppFonts.headlineMedium.copyWith(
                color: _isNightMode ? Colors.white : AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: AppSizes.lg),
          // نص تجريبي
          Text(
            'بسم الله الرحمن الرحيم\n\n'
            'الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين، سيدنا محمد وعلى آله وصحبه أجمعين.\n\n'
            'أما بعد، فهذا محتوى تجريبي لصفحة ${_currentPage} من كتاب ${_book?.title ?? ''}. '
            'في تطبيق حقيقي، سيتم عرض محتوى PDF الفعلي هنا باستخدام syncfusion_flutter_pdfviewer.\n\n'
            'يمكنك التنقل بين الصفحات باستخدام الأزرار بالأسفل، أو تغيير حجم الخط، أو التبديل للوضع الليلي.\n\n'
            'استمتع بالقراءة! 📚',
            style: AppFonts.bodyLarge.copyWith(
              color: _isNightMode ? Colors.white : AppColors.textPrimary,
              height: 1.8,
              fontSize: 16 * _fontSize,
            ),
            textAlign: TextAlign.justify,
          ),
        ],
      ),
    );
  }

  Widget _buildPageNavigator() {
    return Container(
      padding: const EdgeInsets.all(AppSizes.md),
      decoration: BoxDecoration(
        color: _isNightMode ? AppColors.darkSurface : AppColors.backgroundLight,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: _currentPage > 1 ? () => _goToPage(_currentPage - 1) : null,
              color: AppColors.primary,
            ),
            Text(
              '$_currentPage / ${_book?.pages ?? 1}',
              style: AppFonts.bodyMedium.copyWith(
                color: _isNightMode ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _currentPage < (_book?.pages ?? 1)
                  ? () => _goToPage(_currentPage + 1)
                  : null,
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}
