/// خدمة التخزين المحلي (Storage Service)
///
/// توفّر هذه الخدمة واجهة موحّدة للتخزين المحلي عبر Hive،
/// لتخزين الكاش (cache) وبيانات المستخدم والـ token.
///
/// المزايا:
/// - تخزين الفصول والمستويات مؤقتًا (offline-first)
/// - تخزين بيانات المستخدم والـ token
/// - مسح الكاش بالكامل عند الخروج
library;

import 'dart:convert';
import 'dart:developer' as developer;

import 'package:hive_flutter/hive_flutter.dart';

import '../core/errors/exceptions.dart';
import '../core/theme/app_colors.dart';
import '../models/models.dart';

/// خدمة التخزين المحلي
class StorageService {
  /// صندوق Hive الرئيسي
  late final Box<dynamic> _box;

  /// صندوق المستخدم (منفصل لتنظيم أفضل)
  late final Box<dynamic> _userBox;

  /// هل تمّ تهيئة الخدمة؟
  bool _initialized = false;

  /// يُنشئ خدمة تخزين جديدة
  StorageService();

  /// يهيّئ الخدمة (يجب استدعاؤها قبل أي عملية)
  Future<void> init() async {
    if (_initialized) return;

    try {
      await Hive.initFlutter();

      _box = await Hive.openBox<dynamic>(AppConstants.hiveBoxName);
      _userBox = await Hive.openBox<dynamic>(
        '${AppConstants.hiveBoxName}_user',
      );

      _initialized = true;
      developer.log(
        '✓ تم تهيئة StorageService بنجاح',
        name: 'StorageService',
      );
    } catch (e, stackTrace) {
      developer.log(
        'فشل في تهيئة StorageService',
        error: e,
        stackTrace: stackTrace,
        name: 'StorageService',
      );
      throw const CacheException(
        message: 'تعذّر تهيئة قاعدة البيانات المحلية',
      );
    }
  }

  /// يتحقق من تهيئة الخدمة
  void _ensureInitialized() {
    if (!_initialized) {
      throw const CacheException(
        message: 'StorageService غير مهيّأ. استدعِ init() أولاً.',
      );
    }
  }

  // ===== كاش الفصول (Chapters Cache) =====

  /// يجلب الفصول المخزّنة محليًا
  ///
  /// يعيد `null` إذا لم يوجد كاش أو منتهي الصلاحية.
  List<ChapterModel>? getChaptersCache() {
    _ensureInitialized();
    try {
      final raw = _box.get(_Keys.chapters);
      if (raw == null || raw is! String) return null;

      final decoded = jsonDecode(raw);
      if (decoded is! List) return null;

      return decoded
          .whereType<Map<String, dynamic>>()
          .map(ChapterModel.fromJson)
          .toList();
    } catch (e) {
      developer.log('فشل في قراءة كاش الفصول: $e', name: 'StorageService');
      return null;
    }
  }

  /// يخزّن قائمة الفصول محليًا
  Future<void> setChaptersCache(List<ChapterModel> chapters) async {
    _ensureInitialized();
    try {
      final jsonList = chapters.map((c) => c.toJson()).toList();
      final encoded = jsonEncode(jsonList);
      await _box.put(_Keys.chapters, encoded);
      await _box.put(_Keys.chaptersCachedAt, DateTime.now().toIso8601String());
    } catch (e) {
      developer.log('فشل في تخزين كاش الفصول: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر تخزين الفصول محليًا',
      );
    }
  }

  /// يعيد وقت آخر تحديث لكاش الفصول
  DateTime? getChaptersCachedAt() {
    _ensureInitialized();
    try {
      final raw = _box.get(_Keys.chaptersCachedAt);
      if (raw is String) {
        return DateTime.tryParse(raw);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ===== كاش المستويات (Levels Cache) =====

  /// يجلب مستويات فصل من الكاش
  List<LevelModel>? getLevelsCache(String chapterId) {
    _ensureInitialized();
    try {
      final raw = _box.get('${_Keys.levelsPrefix}$chapterId');
      if (raw == null || raw is! String) return null;

      final decoded = jsonDecode(raw);
      if (decoded is! List) return null;

      return decoded
          .whereType<Map<String, dynamic>>()
          .map(LevelModel.fromJson)
          .toList();
    } catch (e) {
      developer.log('فشل في قراءة كاش المستويات: $e', name: 'StorageService');
      return null;
    }
  }

  /// يخزّن مستويات فصل محليًا
  Future<void> setLevelsCache(
    String chapterId,
    List<LevelModel> levels,
  ) async {
    _ensureInitialized();
    try {
      final jsonList = levels.map((l) => l.toJson()).toList();
      final encoded = jsonEncode(jsonList);
      await _box.put('${_Keys.levelsPrefix}$chapterId', encoded);
      await _box.put(
        '${_Keys.levelsCachedAtPrefix}$chapterId',
        DateTime.now().toIso8601String(),
      );
    } catch (e) {
      developer.log('فشل في تخزين كاش المستويات: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر تخزين المستويات محليًا',
      );
    }
  }

  /// يجلب مستوى واحد من الكاش
  LevelModel? getLevelCache(String levelId) {
    _ensureInitialized();
    try {
      final raw = _box.get('${_Keys.levelPrefix}$levelId');
      if (raw == null || raw is! String) return null;

      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;

      return LevelModel.fromJson(decoded);
    } catch (e) {
      developer.log('فشل في قراءة كاش المستوى: $e', name: 'StorageService');
      return null;
    }
  }

  /// يخزّن مستوى واحد محليًا
  Future<void> setLevelCache(LevelModel level) async {
    _ensureInitialized();
    try {
      final encoded = jsonEncode(level.toJson());
      await _box.put('${_Keys.levelPrefix}$level.id', encoded);
    } catch (e) {
      developer.log('فشل في تخزين المستوى: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر تخزين المستوى محليًا',
      );
    }
  }

  // ===== بيانات المستخدم (User) =====

  /// يجلب بيانات المستخدم المخزّنة
  UserModel? getUser() {
    _ensureInitialized();
    try {
      final raw = _userBox.get(_Keys.user);
      if (raw == null || raw is! String) return null;

      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;

      return UserModel.fromJson(decoded);
    } catch (e) {
      developer.log('فشل في قراءة المستخدم: $e', name: 'StorageService');
      return null;
    }
  }

  /// يخزّن بيانات المستخدم
  Future<void> setUser(UserModel user) async {
    _ensureInitialized();
    try {
      final encoded = jsonEncode(user.toJson());
      await _userBox.put(_Keys.user, encoded);
    } catch (e) {
      developer.log('فشل في تخزين المستخدم: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر تخزين بيانات المستخدم',
      );
    }
  }

  /// يحذف بيانات المستخدم
  Future<void> clearUser() async {
    _ensureInitialized();
    try {
      await _userBox.delete(_Keys.user);
    } catch (e) {
      developer.log('فشل في حذف المستخدم: $e', name: 'StorageService');
    }
  }

  // ===== الـ token (Auth) =====

  /// يجلب الـ token المخزّن
  String? getAuthToken() {
    _ensureInitialized();
    try {
      final raw = _userBox.get(_Keys.authToken);
      if (raw is String && raw.isNotEmpty) return raw;
      return null;
    } catch (_) {
      return null;
    }
  }

  /// يخزّن الـ token
  Future<void> setAuthToken(String token) async {
    _ensureInitialized();
    try {
      await _userBox.put(_Keys.authToken, token);
    } catch (e) {
      developer.log('فشل في تخزين الـ token: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر تخزين الـ token',
      );
    }
  }

  /// يحذف الـ token
  Future<void> clearAuthToken() async {
    _ensureInitialized();
    try {
      await _userBox.delete(_Keys.authToken);
    } catch (e) {
      developer.log('فشل في حذف الـ token: $e', name: 'StorageService');
    }
  }

  /// هل يوجد token محفوظ؟
  bool get hasAuthToken => getAuthToken() != null;

  // ===== إعدادات التطبيق =====

  /// هل رأى المستخدم شاشة الـ onboarding؟
  bool get hasSeenOnboarding {
    _ensureInitialized();
    return _box.get(_Keys.onboardingSeen, defaultValue: false) as bool;
  }

  /// يضع علامة أنّ المستخدم شاهد الـ onboarding
  Future<void> setOnboardingSeen() async {
    _ensureInitialized();
    try {
      await _box.put(_Keys.onboardingSeen, true);
    } catch (e) {
      developer.log('فشل في حفظ حالة onboarding: $e', name: 'StorageService');
    }
  }

  /// يجلب وضع الثيم المحفوظ
  String getThemeMode() {
    _ensureInitialized();
    return _box.get(_Keys.themeMode, defaultValue: 'system') as String;
  }

  /// يخزّن وضع الثيم
  Future<void> setThemeMode(String mode) async {
    _ensureInitialized();
    try {
      await _box.put(_Keys.themeMode, mode);
    } catch (e) {
      developer.log('فشل في حفظ وضع الثيم: $e', name: 'StorageService');
    }
  }

  // ===== كاش عام (Generic Key-Value) =====

  /// يقرأ قيمة عامة من الكاش
  T? getValue<T>(String key) {
    _ensureInitialized();
    try {
      final value = _box.get(key);
      if (value is T) return value;
      return null;
    } catch (_) {
      return null;
    }
  }

  /// يكتب قيمة عامة إلى الكاش
  Future<void> setValue<T>(String key, T value) async {
    _ensureInitialized();
    try {
      await _box.put(key, value);
    } catch (e) {
      developer.log('فشل في كتابة $key: $e', name: 'StorageService');
    }
  }

  /// يحذف قيمة عامة
  Future<void> removeValue(String key) async {
    _ensureInitialized();
    try {
      await _box.delete(key);
    } catch (e) {
      developer.log('فشل في حذف $key: $e', name: 'StorageService');
    }
  }

  // ===== التنظيف (Cleanup) =====

  /// يمسح كل الكاش (للاستخدام عند تسجيل الخروج أو إعادة ضبط التطبيق)
  ///
  /// يحافظ على إعدادات المستخدم (مثل onboarding و theme).
  Future<void> clearAll() async {
    _ensureInitialized();
    try {
      await _box.clear();
      await _userBox.clear();
      developer.log('✓ تم مسح كل البيانات المحلية', name: 'StorageService');
    } catch (e) {
      developer.log('فشل في مسح البيانات: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر مسح البيانات المحلية',
      );
    }
  }

  /// يمسح فقط الكاش (يحافظ على بيانات المستخدم والـ token)
  Future<void> clearCacheOnly() async {
    _ensureInitialized();
    try {
      await _box.delete(_Keys.chapters);
      await _box.delete(_Keys.chaptersCachedAt);
      // مسح كل مفاتيح المستويات (باستخدام نمط levels_*)
      final keysToDelete = _box.keys
          .whereType<String>()
          .where(
            (k) => k.startsWith(_Keys.levelsPrefix) ||
                k.startsWith(_Keys.levelsCachedAtPrefix) ||
                k.startsWith(_Keys.levelPrefix),
          )
          .toList();
      for (final key in keysToDelete) {
        await _box.delete(key);
      }
      developer.log(
        '✓ تم مسح الكاش (الفصول/المستويات)',
        name: 'StorageService',
      );
    } catch (e) {
      developer.log('فشل في مسح الكاش: $e', name: 'StorageService');
      throw const CacheException(
        message: 'تعذّر مسح الكاش',
      );
    }
  }

  /// يحذف صندوق Hive (للاختبارات أو إعادة الضبط الكامل)
  Future<void> deleteBox() async {
    _ensureInitialized();
    try {
      await _box.deleteFromDisk();
      await _userBox.deleteFromDisk();
      _initialized = false;
    } catch (e) {
      developer.log('فشل في حذف الصندوق: $e', name: 'StorageService');
    }
  }

  /// إغلاق الخدمة (يُستدعى عند إغلاق التطبيق)
  Future<void> close() async {
    if (!_initialized) return;
    try {
      await _box.close();
      await _userBox.close();
      _initialized = false;
    } catch (e) {
      developer.log('فشل في إغلاق الخدمة: $e', name: 'StorageService');
    }
  }
}

/// مفاتيح التخزين (Storage Keys)
class _Keys {
  _Keys._();

  static const chapters = 'cache_chapters';
  static const chaptersCachedAt = 'cache_chapters_at';

  static const levelsPrefix = 'cache_levels_';
  static const levelsCachedAtPrefix = 'cache_levels_at_';
  static const levelPrefix = 'cache_level_';

  static const user = 'user_data';
  static const authToken = 'auth_token';

  static const onboardingSeen = AppConstants.prefsKeyOnboardingSeen;
  static const themeMode = AppConstants.prefsKeyThemeMode;
}
