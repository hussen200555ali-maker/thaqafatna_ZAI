import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'services/api_service.dart';
import 'core/theme/app_colors.dart';

// ===== State Providers =====

/// مزوّد وضع الثيم
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.light) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString('theme_mode') ?? 'light';
    state = value == 'dark' ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggle() async {
    state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('theme_mode', state.name);
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('theme_mode', mode.name);
  }
}

/// مزوّد حالة الـ onboarding
final onboardingSeenProvider = StateNotifierProvider<OnboardingNotifier, bool>(
  (ref) => OnboardingNotifier(),
);

class OnboardingNotifier extends StateNotifier<bool> {
  OnboardingNotifier() : super(false) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool('onboarding_seen') ?? false;
  }

  Future<void> markSeen() async {
    state = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_seen', true);
  }
}

/// مزوّد حالة اللغة
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>(
  (ref) => LocaleNotifier(),
);

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('ar')) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('locale') ?? 'ar';
    state = Locale(code);
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', locale.languageCode);
  }
}

/// مزوّد معرّف المستخدم (للضيوف والمسجّلين)
final userIdProvider = StateNotifierProvider<UserIdNotifier, String?>(
  (ref) => UserIdNotifier(),
);

class UserIdNotifier extends StateNotifier<String?> {
  UserIdNotifier() : super(null) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    String? userId = prefs.getString('user_id');
    if (userId == null) {
      // أنشئ معرّف ضيف فريد
      userId = 'guest-${DateTime.now().millisecondsSinceEpoch}';
      await prefs.setString('user_id', userId);
    }
    state = userId;
  }

  Future<void> setUser(String userId) async {
    state = userId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', userId);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_id');
    state = null;
  }
}

/// مزوّد حالة الشبكة
final isConnectedProvider = StateNotifierProvider<ConnectionNotifier, bool>(
  (ref) => ConnectionNotifier()..checkConnection(),
);

class ConnectionNotifier extends StateNotifier<bool> {
  ConnectionNotifier() : super(true);

  Future<void> checkConnection() async {
    // استخدام connectivity_plus
    try {
      // TODO: استيراد connectivity_plus عند البناء
      state = true; // افتراضي
    } catch (_) {
      state = false;
    }
  }

  void setConnected(bool value) => state = value;
}

// ===== Service Providers =====

/// مزوّد ApiService (مفرد/Singleton)
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

// ===== Data Providers =====

/// مزوّد الفصول
final chaptersProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    return await api.getChapters();
  } catch (e) {
    // ارجع قائمة فارغة عند الخطأ
    return [];
  }
});

/// مزوّد الكتب المميزة
final featuredBooksProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    return await api.getBooks();
  } catch (e) {
    return [];
  }
});

/// مزوّد الإشعارات
final notificationsProvider = FutureProvider.family<List<dynamic>, String>(
  (ref, userId) async {
    final api = ref.watch(apiServiceProvider);
    try {
      return await api.getNotifications(userId);
    } catch (e) {
      return [];
    }
  },
);

/// مزوّد المتصدرين
final leaderboardProvider =
    FutureProvider.family<List<dynamic>, String>((ref, period) async {
  final api = ref.watch(apiServiceProvider);
  try {
    return await api.getLeaderboard(period: period);
  } catch (e) {
    return [];
  }
});

/// مزوّد التحدّي اليومي
final dailyChallengeProvider = FutureProvider((ref) async {
  final api = ref.watch(apiServiceProvider);
  try {
    return await api.getDailyChallenge();
  } catch (e) {
    return null;
  }
});

/// مزوّد خريطة المعرفة
final knowledgeMapProvider = FutureProvider.family<List<dynamic>, String>(
  (ref, userId) async {
    final api = ref.watch(apiServiceProvider);
    try {
      return await api.getKnowledgeMap(userId);
    } catch (e) {
      return [];
    }
  },
);

// ===== UI State Providers =====

/// مؤشر التحميل
final loadingProvider = StateProvider<bool>((ref) => false);

/// رسالة Snackbar
final snackbarProvider = StateProvider<String?>((ref) => null);

/// الفصل المحدّد حاليًا
final selectedChapterProvider = StateProvider<int?>((ref) => null);

/// المرحلة المحدّدة حاليًا
final selectedLevelProvider = StateProvider<int?>((ref) => null);

/// التبويب المحدّد في الشاشة الرئيسية
final selectedTabProvider = StateProvider<int>((ref) => 0);

/// نقاط المستخدم (محلية)
final coinsProvider = StateNotifierProvider<CoinsNotifier, int>(
  (ref) => CoinsNotifier(),
);

class CoinsNotifier extends StateNotifier<int> {
  CoinsNotifier() : super(0) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getInt('coins') ?? 0;
  }

  Future<void> add(int amount) async {
    state += amount;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('coins', state);
  }

  Future<void> subtract(int amount) async {
    state = (state - amount).clamp(0, 1 << 31);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('coins', state);
  }
}

/// سلسلة الأيام المتتالية
final dailyStreakProvider = StateNotifierProvider<StreakNotifier, int>(
  (ref) => StreakNotifier(),
);

class StreakNotifier extends StateNotifier<int> {
  StreakNotifier() : super(0) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getInt('daily_streak') ?? 0;
  }

  Future<void> increment() async {
    state += 1;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('daily_streak', state);
    await prefs.setString('last_streak_date', DateTime.now().toIso8601String());
  }
}

/// المراحل المكتملة
final completedLevelsProvider =
    StateNotifierProvider<CompletedLevelsNotifier, Set<int>>(
  (ref) => CompletedLevelsNotifier(),
);

class CompletedLevelsNotifier extends StateNotifier<Set<int>> {
  CompletedLevelsNotifier() : super({}) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('completed_levels') ?? [];
    state = list.map(int.parse).toSet();
  }

  Future<void> markCompleted(int levelId, {int stars = 1}) async {
    state = {...state, levelId};
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      'completed_levels',
      state.map((e) => e.toString()).toList(),
    );
  }

  bool isCompleted(int levelId) => state.contains(levelId);
}
