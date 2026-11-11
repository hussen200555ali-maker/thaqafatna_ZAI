/// امتدادات مساعدة (Extensions)
///
/// توفّر امتدادات (extensions) على الأنواع المدمجة لتسهيل الكتابة:
/// - [String] extensions (capitalize, truncate, isArabic, ...)
/// - [DateTime] extensions (toTimeAgo, toArabicDate, isToday, ...)
/// - [int] extensions (toCommaString, formatScore)
/// - [BuildContext] extensions (screenWidth, screenHeight, theme, ...)
library;

import 'package:flutter/material.dart';
// intl يُصدّر TextDirection خاصًا به يُظلّل TextDirection من dart:ui،
// لذا نخفيه ونستخدم TextDirection من material.dart (المُعاد تصديره من dart:ui).
import 'package:intl/intl.dart' hide TextDirection;
import 'package:timeago/timeago.dart' as timeago;

// ===== تنشيط لغة timeago العربية =====
// يتم استدعاؤها مرة واحدة عند بدء التطبيق
// (المكالمة آمنة للتكرار - تعيد التسجيل فقط)
// ignore_for_file: cascade_invocations

/// يسجّل لغات timeago المدعومة
void _setupTimeAgo() {
  timeago.setLocaleMessages('ar', timeago.ArMessages());
  timeago.setLocaleMessages('ar_short', timeago.ArShortMessages());
  timeago.setLocaleMessages('en', timeago.EnMessages());
}

// تنفيذ التسجيل فور تحميل المكتبة
final _timeAgoReady = () {
  _setupTimeAgo();
  return true;
}();

// ===== String Extensions =====

/// امتدادات على [String]
extension StringX on String {
  /// يحوّل أول حرف إلى كبير (capitalize)
  ///
  /// يدعم اللغتين العربية والإنجليزية.
  String get capitalize {
    if (isEmpty) return this;
    final first = this[0];
    final rest = substring(1);
    return '${first.toUpperCase()}$rest';
  }

  /// يحوّل كل كلمة إلى capitalize
  String get capitalizeWords {
    if (isEmpty) return this;
    return split(' ')
        .map((word) => word.isEmpty ? word : word.capitalize)
        .join(' ');
  }

  /// يقصّ النص إلى [length] حرفًا مع إضافة "..." إن تجاوز
  String truncate(int length, {String suffix = '…'}) {
    if (this.length <= length) return this;
    return '${substring(0, length)}$suffix';
  }

  /// هل النص عربي؟
  ///
  /// يتحقق من وجود أي حرف عربي في النص.
  bool get isArabic {
    final arabicRegex = RegExp(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]');
    return arabicRegex.hasMatch(this);
  }

  /// هل النص إنجليزي؟
  bool get isEnglish {
    final englishRegex = RegExp(r'[a-zA-Z]');
    return englishRegex.hasMatch(this);
  }

  /// هل النص يحتوي أرقام عربية؟ (٠١٢٣...)
  bool get hasArabicDigits {
    return RegExp(r'[\u0660-\u0669]').hasMatch(this);
  }

  /// يحوّل الأرقام العربية (٠١٢٣) إلى أرقام إنجليزية (0123)
  String get toEnglishDigits {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    final buffer = StringBuffer();
    for (final char in runes) {
      final arabicIndex = arabicDigits.indexOf(String.fromCharCode(char));
      final persianIndex = persianDigits.indexOf(String.fromCharCode(char));
      if (arabicIndex != -1) {
        buffer.write(arabicIndex);
      } else if (persianIndex != -1) {
        buffer.write(persianIndex);
      } else {
        buffer.writeCharCode(char);
      }
    }
    return buffer.toString();
  }

  /// يحوّل الأرقام الإنجليزية (0123) إلى أرقام عربية (٠١٢٣)
  String get toArabicDigits {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    final buffer = StringBuffer();
    for (final char in runes) {
      final digit = int.tryParse(String.fromCharCode(char));
      if (digit != null && digit >= 0 && digit <= 9) {
        buffer.write(arabicDigits[digit]);
      } else {
        buffer.writeCharCode(char);
      }
    }
    return buffer.toString();
  }

  /// يحوّل النص إلى RTL إن كان عربيًا، وإلا LTR
  TextDirection? get textDirectionValue {
    if (isEmpty) return null;
    return isArabic ? TextDirection.rtl : TextDirection.ltr;
  }

  /// هل النص يحتاج تخطيط RTL؟
  bool get needsRtl => isArabic;

  /// يزيل التشكيل من النص العربي
  String get removeDiacritics {
    const diacritics = 'ًٌٍَُِّْ';
    final buffer = StringBuffer();
    for (final char in runes) {
      if (!diacritics.contains(String.fromCharCode(char))) {
        buffer.writeCharCode(char);
      }
    }
    return buffer.toString();
  }

  /// يحيط الكلمات المتجاورة بمسافات RTL صحيحة
  String get withRtlMark {
    const rtlMark = '\u200F'; // Right-to-Left Mark
    return '$rtlMark$this$rtlMark';
  }

  /// هل النص يحتوي على رابط؟
  bool get isUrl {
    return RegExp(
      r'^https?://[^\s/$.?#].[^\s]*$',
      caseSensitive: false,
    ).hasMatch(this);
  }

  /// هل النص رقم؟
  bool get isNumeric {
    if (isEmpty) return false;
    return double.tryParse(this) != null;
  }

  /// يحوّل النص إلى int بأمان
  int? get asInt => int.tryParse(toEnglishDigits);

  /// يحوّل النص إلى double بأمان
  double? get asDouble => double.tryParse(toEnglishDigits);

  /// يزيل HTML tags
  String get stripHtml {
    return replaceAll(RegExp(r'<[^>]*>'), '');
  }

  /// يُنشئ اختصار من النص (الأحرف الأولى من كل كلمة)
  ///
  /// مثال: "أحمد محمد علي" → "أ م ع"
  String get initials {
    final words = trim().split(RegExp(r'\s+'));
    if (words.isEmpty) return '';
    final initials = words
        .where((w) => w.isNotEmpty)
        .map((w) => w[0])
        .take(3)
        .join();
    return initials;
  }

  /// يحوّل snake_case إلى camelCase
  String get toCamelCase {
    if (isEmpty) return this;
    final parts = split('_');
    if (parts.length == 1) return this;
    final first = parts.first;
    final rest = parts.skip(1).map((p) => p.capitalize).join();
    return '$first$rest';
  }

  /// يحوّل camelCase إلى snake_case
  String get toSnakeCase {
    return replaceAllMapped(
      RegExp(r'[A-Z]'),
      (match) => '_${match.group(0)!.toLowerCase()}',
    ).replaceFirst(RegExp(r'^_'), '');
  }
}

// ===== DateTime Extensions =====

/// امتدادات على [DateTime]
extension DateTimeX on DateTime {
  /// يحوّل التاريخ إلى نص "منذ كم" (Time Ago) بالعربية
  ///
  /// مثال: "منذ 5 دقائق"، "منذ ساعة"، "قبل يومين"
  String get toTimeAgo {
    _timeAgoReady; // ضمان التسجيل
    return timeago.format(this, locale: 'ar', allowFromNow: true);
  }

  /// يحوّل التاريخ إلى نص "منذ كم" بصيغة قصيرة
  String get toTimeAgoShort {
    _timeAgoReady;
    return timeago.format(this, locale: 'ar_short', allowFromNow: true);
  }

  /// يحوّل التاريخ إلى تاريخ عربي منسّق
  ///
  /// مثال: "15 مايو 2024"
  String get toArabicDate {
    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    return '$day ${arabicMonths[month - 1]} $year';
  }

  /// يحوّل التاريخ إلى تاريخ ووقت عربي منسّق
  ///
  /// مثال: "15 مايو 2024 - 3:45 م"
  String get toArabicDateTime {
    final hour12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    final period = hour >= 12 ? 'م' : 'ص';
    final minuteStr = minute.toString().padLeft(2, '0');
    return '$toArabicDate - $hour12:$minuteStr $period';
  }

  /// يحوّل التاريخ إلى يوم وشهر بالعربية
  ///
  /// مثال: "15 مايو"
  String get toArabicDayMonth {
    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    return '$day ${arabicMonths[month - 1]}';
  }

  /// يحوّل التاريخ إلى وقت فقط (بالـ AM/PM)
  ///
  /// مثال: "3:45 م"
  String get toArabicTime {
    final hour12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    final period = hour >= 12 ? 'م' : 'ص';
    final minuteStr = minute.toString().padLeft(2, '0');
    return '$hour12:$minuteStr $period';
  }

  /// يحوّل التاريخ إلى ISO 8601 (للـ API)
  String get toIso8601 => toUtc().toIso8601String();

  /// هل التاريخ اليوم؟
  bool get isToday {
    final now = DateTime.now();
    return year == now.year &&
        month == now.month &&
        day == now.day;
  }

  /// هل التاريخ أمس؟
  bool get isYesterday {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return year == yesterday.year &&
        month == yesterday.month &&
        day == yesterday.day;
  }

  /// هل التاريخ غدًا؟
  bool get isTomorrow {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return year == tomorrow.year &&
        month == tomorrow.month &&
        day == tomorrow.day;
  }

  /// هل التاريخ في هذا الأسبوع؟
  bool get isThisWeek {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekEnd = weekStart.add(const Duration(days: 7));
    return isAfter(weekStart.subtract(const Duration(days: 1))) &&
        isBefore(weekEnd);
  }

  /// هل التاريخ في نفس السنة؟
  bool get isThisYear {
    return year == DateTime.now().year;
  }

  /// هل التاريخ في الماضي؟
  bool get isPast => isBefore(DateTime.now());

  /// هل التاريخ في المستقبل؟
  bool get isFuture => isAfter(DateTime.now());

  /// يحسب العمر بالسنين (للتواريخ الميلادية)
  int get ageInYears {
    final now = DateTime.now();
    var age = now.year - year;
    if (now.month < month || (now.month == month && now.day < day)) {
      age--;
    }
    return age;
  }

  /// عدد الأيام منذ هذا التاريخ (موجب للمستقبل، سالب للماضي)
  int get daysFromNow {
    final today = DateTime.now();
    final diff = difference(DateTime(today.year, today.month, today.day));
    return diff.inDays;
  }

  /// اسم اليوم بالعربية
  String get arabicDayName {
    const days = [
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
      'الأحد',
    ];
    // weekday في Dart: 1 = Monday, 7 = Sunday
    return days[weekday - 1];
  }

  /// اسم اليوم المختصر بالعربية
  String get arabicDayShortName {
    const days = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];
    return days[weekday - 1];
  }

  /// يضيف علامة "الـ" قبل يوم معيّن (مثل "اليوم"، "أمس")
  String get relativeDayLabel {
    if (isToday) return 'اليوم';
    if (isYesterday) return 'أمس';
    if (isTomorrow) return 'غدًا';
    if (isThisWeek) return arabicDayName;
    if (isThisYear) return toArabicDayMonth;
    return toArabicDate;
  }

  /// يحوّل التاريخ إلى نص بصيغة yyyy-MM-dd
  String get toSqlDate => DateFormat('yyyy-MM-dd').format(this);
}

// ===== int Extensions =====

/// امتدادات على [int]
extension IntX on int {
  /// يحوّل العدد إلى نص بفواصل الآلاف (مثل 1,234,567)
  String get toCommaString {
    final formatter = NumberFormat.decimalPattern('en_US');
    return formatter.format(this);
  }

  /// يحوّل العدد إلى نص عربي بفواصل الآلاف
  String get toArabicCommaString {
    final formatter = NumberFormat.decimalPattern('ar');
    return formatter.format(this);
  }

  /// يحوّل العدد إلى نص نقاط (لعرض النقاط)
  ///
  /// مثال: 1234 → "1,234 نقطة"
  String get formatScore {
    if (this >= 1000000) {
      final millions = (this / 1000000).toStringAsFixed(1);
      return '${millions}M نقطة';
    }
    if (this >= 1000) {
      final thousands = (this / 1000).toStringAsFixed(1);
      return '${thousands}K نقطة';
    }
    return '$this نقطة';
  }

  /// يحوّل العدد إلى نص مختصر (1.2K، 3.4M)
  String get toCompact {
    if (this >= 1000000) {
      return '${(this / 1000000).toStringAsFixed(1)}M';
    }
    if (this >= 1000) {
      return '${(this / 1000).toStringAsFixed(1)}K';
    }
    return toString();
  }

  /// يحوّل الثواني إلى نص زمني (مثل "1:30")
  String get formatDuration {
    final hours = this ~/ 3600;
    final minutes = (this % 3600) ~/ 60;
    final seconds = this % 60;
    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
    }
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  /// يحوّل الدقائق إلى نص زمني عربي
  ///
  /// مثال: 75 → "ساعة و15 دقيقة"
  String get formatMinutesArabic {
    final hours = this ~/ 60;
    final minutes = this % 60;
    if (hours == 0) return '$minutes دقيقة';
    if (minutes == 0) return '$hours ساعة';
    return '$hours ساعة و $minutes دقيقة';
  }

  /// هل العدد زوجي؟
  bool get isEven => this % 2 == 0;

  /// هل العدد فردي؟
  bool get isOdd => this % 2 != 0;
}

// ===== double Extensions =====

/// امتدادات على [double]
extension DoubleX on double {
  /// يحوّل النسبة (0.0 - 1.0) إلى نسبة مئوية صحيحة (0-100)
  int get toPercent => (this * 100).round();

  /// يحوّل النسبة إلى نص عربي (مثل "75%")
  String get toPercentString => '$toPercent%';

  /// يحوّل إلى نص بعدد محدّد من المنازل العشرية
  String toStringWithPrecision(int precision) {
    return toStringAsFixed(precision);
  }
}

// ===== BuildContext Extensions =====

/// امتدادات على [BuildContext] للوصول السريع لخصائص الـ UI
extension BuildContextX on BuildContext {
  /// عرض الشاشة
  double get screenWidth => MediaQuery.sizeOf(this).width;

  /// ارتفاع الشاشة
  double get screenHeight => MediaQuery.sizeOf(this).height;

  /// أبعاد الشاشة (Size)
  Size get screenSize => MediaQuery.sizeOf(this);

  /// نسبة العرض إلى الارتفاع
  double get aspectRatio => screenSize.aspectRatio;

  /// هل الجهاز هاتف؟ (العرض < 600)
  bool get isPhone => screenWidth < 600;

  /// هل الجهاز لوحي؟ (العرض 600-900)
  bool get isTablet => screenWidth >= 600 && screenWidth < 900;

  /// هل الجهاز كبير (desktop)؟ (العرض ≥ 900)
  bool get isDesktop => screenWidth >= 900;

  /// كثافة البكسل
  double get devicePixelRatio => MediaQuery.devicePixelRatioOf(this);

  /// ارتفاع شريط الحالة
  double get statusBarHeight => MediaQuery.paddingOf(this).top;

  /// ارتفاع شريط التنقّل السفلي
  double get bottomPadding => MediaQuery.paddingOf(this).bottom;

  /// هل التطبيق في وضع الـ RTL؟
  bool get isRtl => Directionality.of(this).name == 'rtl';

  /// ثيم التطبيق الحالي
  ThemeData get theme => Theme.of(this);

  /// ثيم النصوص
  TextTheme get textTheme => Theme.of(this).textTheme;

  /// نظام الألوان الحالي
  ColorScheme get colorScheme => Theme.of(this).colorScheme;

  /// هل الوضع الحالي داكن؟
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;

  /// كائن MediaQuery كامل
  MediaQueryData get mediaQuery => MediaQuery.of(this);

  /// تركيز الـ keyboard
  bool get isKeyboardOpen => MediaQuery.viewInsetsOf(this).bottom > 0;

  /// ارتفاع الـ keyboard الحالي
  double get keyboardHeight => MediaQuery.viewInsetsOf(this).bottom;

  // ===== اختصارات للتنقّل =====

  /// يعرض snackbar مع نص
  ScaffoldMessengerState get scaffoldMessenger =>
      ScaffoldMessenger.of(this);

  /// يعرض snackbar بسرعة
  void showSnackBar(String message, {Color? color}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// يعرض snackbar خطأ
  void showErrorSnackBar(String message) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(this).colorScheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// يعرض snackbar نجاح
  void showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// يفتح dialog
  Future<T?> openDialog<T>(WidgetBuilder builder) {
    return showDialog<T>(
      context: this,
      builder: builder,
    );
  }

  /// يفتح modal bottom sheet
  Future<T?> openBottomSheet<T>(WidgetBuilder builder) {
    return showModalBottomSheet<T>(
      context: this,
      builder: builder,
      isScrollControlled: true,
      backgroundColor: Theme.of(this).colorScheme.surface,
    );
  }
}

// ===== Color Extensions =====

/// امتدادات على [Color]
extension ColorX on Color {
  /// يحوّل اللون إلى نص HEX (مثل "#FF0F4C5C")
  String get toHex {
    return '#${toARGB32().toRadixString(16).padLeft(8, '0').toUpperCase()}';
  }

  /// يحوّل اللون إلى نص HEX بدون alpha (مثل "#0F4C5C")
  String get toHexShort {
    final hex = toARGB32().toRadixString(16).padLeft(8, '0').toUpperCase();
    return '#${hex.substring(2)}';
  }

  /// يفتّح اللون بنسبة معيّنة (0.0 - 1.0)
  Color lighten([double amount = 0.2]) {
    final hsl = HSLColor.fromColor(this);
    return hsl
        .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
        .toColor();
  }

  /// يغمّق اللون بنسبة معيّنة (0.0 - 1.0)
  Color darken([double amount = 0.2]) {
    final hsl = HSLColor.fromColor(this);
    return hsl
        .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
        .toColor();
  }

  /// يحسب لون النص الأنسب (أبيض أو أسود) فوق هذا اللون
  Color get contrastColor {
    // معادلة luminance القياسية W3C
    // نستخدم المكوّنات الجديدة (r,g,b كنسب 0-1)
    final r8 = (r * 255).round();
    final g8 = (g * 255).round();
    final b8 = (b * 255).round();
    final luminance = (0.299 * r8 + 0.587 * g8 + 0.114 * b8) / 255;
    return luminance > 0.5 ? Colors.black : Colors.white;
  }
}

// ===== List Extensions =====

/// امتدادات على [List<T>]
extension ListX<T> on List<T> {
  /// إضافة عنصر بطريقة آمنة (لا تتكرر)
  ///
  /// تتطلب من T تطبيق `==` و `hashCode` بشكل صحيح.
  bool addUnique(T element) {
    if (contains(element)) return false;
    add(element);
    return true;
  }

  /// تجميع العناصر حسب مفتاح
  Map<K, List<T>> groupBy<K>(K Function(T) keySelector) {
    final result = <K, List<T>>{};
    for (final item in this) {
      final key = keySelector(item);
      result.putIfAbsent(key, () => []).add(item);
    }
    return result;
  }

  /// هل القائمة فارغة؟
  bool get isNullOrEmpty => isEmpty;

  /// أول عنصر أو null
  T? get firstOrNull => isEmpty ? null : first;

  /// آخر عنصر أو null
  T? get lastOrNull => isEmpty ? null : last;

  /// فهرس أول عنصر يحقّق الشرط
  int? indexWhereOrNull(bool Function(T) test) {
    final index = indexWhere(test);
    return index == -1 ? null : index;
  }

  /// يستبدل العنصر عند فهرس معيّن
  void replaceAt(int index, T newValue) {
    if (index < 0 || index >= length) {
      throw RangeError('Index out of range: $index');
    }
    this[index] = newValue;
  }

  /// يُقسّم القائمة إلى chunks بحجم [size]
  List<List<T>> chunk(int size) {
    if (size <= 0) return [List<T>.from(this)];
    final chunks = <List<T>>[];
    for (var i = 0; i < length; i += size) {
      chunks.add(sublist(i, (i + size).clamp(0, length)));
    }
    return chunks;
  }
}

// ===== Widget Extensions =====

/// امتدادات على [Widget]
extension WidgetX on Widget {
  /// يضيف padding حول الـ widget
  Padding paddingAll(double value) => Padding(
        padding: EdgeInsets.all(value),
        child: this,
      );

  /// يضيف padding أفقيًا
  Padding paddingHorizontal(double value) => Padding(
        padding: EdgeInsets.symmetric(horizontal: value),
        child: this,
      );

  /// يضيف padding عموديًا
  Padding paddingVertical(double value) => Padding(
        padding: EdgeInsets.symmetric(vertical: value),
        child: this,
      );

  /// يجعل الـ widget قابل للنقر (مع ripple)
  Widget withTap(VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: this,
    );
  }

  /// يجعل الـ widget مرئيًا/مخفيًا
  Widget visibility(bool visible) => visible ? this : const SizedBox.shrink();

  /// يجعل الـ widget يأخذ عرضًا كاملًا
  Widget get fullWidth => SizedBox(
        width: double.infinity,
        child: this,
      );

  /// يجعل الـ widget يأخذ ارتفاعًا كاملًا
  Widget get fullHeight => SizedBox(
        height: double.infinity,
        child: this,
      );

  /// يجعل الـ widget متمركّزًا (Center)
  Center get centered => Center(child: this);
}
