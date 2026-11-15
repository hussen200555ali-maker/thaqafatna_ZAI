import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/splash_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/home/home_screen.dart';
import 'features/game/game_screen.dart';
import 'features/game/level_detail_screen.dart';
import 'features/library/library_screen.dart';
import 'features/library/book_detail_screen.dart';
import 'features/library/book_reader_screen.dart';
import 'features/ai_tutor/ai_tutor_screen.dart';
import 'features/knowledge_map/knowledge_map_screen.dart';
import 'features/leaderboard/leaderboard_screen.dart';
import 'features/notifications/notifications_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/daily_challenge/daily_challenge_screen.dart';
import 'features/main/main_navigation.dart';

/// التطبيق الرئيسي لثقافتنا
class ThaqafatnaApp extends ConsumerWidget {
  const ThaqafatnaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      // الهوية
      title: 'ثقافتنا',
      debugShowCheckedModeBanner: false,

      // الثيم
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,

      // الـ RTL والعربية
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },

      // التوجيه
      routerConfig: router,
    );
  }
}

/// مزوّد الـ Router
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/main',
        name: 'main',
        builder: (context, state) => const MainNavigation(),
        routes: [
          GoRoute(
            path: 'home',
            name: 'home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: 'game',
            name: 'game',
            builder: (context, state) => const GameScreen(),
          ),
          GoRoute(
            path: 'library',
            name: 'library',
            builder: (context, state) => const LibraryScreen(),
          ),
          GoRoute(
            path: 'ai-tutor',
            name: 'ai_tutor',
            builder: (context, state) => const AiTutorScreen(),
          ),
          GoRoute(
            path: 'profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/level/:id',
        name: 'level_detail',
        builder: (context, state) => LevelDetailScreen(
          levelId: int.tryParse(state.pathParameters['id'] ?? '0') ?? 0,
        ),
      ),
      GoRoute(
        path: '/book/:id',
        name: 'book_detail',
        builder: (context, state) => BookDetailScreen(
          bookId: int.tryParse(state.pathParameters['id'] ?? '0') ?? 0,
        ),
      ),
      GoRoute(
        path: '/book/:id/read',
        name: 'book_reader',
        builder: (context, state) => BookReaderScreen(
          bookId: int.tryParse(state.pathParameters['id'] ?? '0') ?? 0,
        ),
      ),
      GoRoute(
        path: '/knowledge-map',
        name: 'knowledge_map',
        builder: (context, state) => const KnowledgeMapScreen(),
      ),
      GoRoute(
        path: '/leaderboard',
        name: 'leaderboard',
        builder: (context, state) => const LeaderboardScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/daily-challenge',
        name: 'daily_challenge',
        builder: (context, state) => const DailyChallengeScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('الصفحة غير موجودة')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('⚠️', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text(
              'الصفحة غير موجودة',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error?.toString() ?? 'حدث خطأ غير معروف',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/main/home'),
              child: const Text('العودة للرئيسية'),
            ),
          ],
        ),
      ),
    ),
  );
});
