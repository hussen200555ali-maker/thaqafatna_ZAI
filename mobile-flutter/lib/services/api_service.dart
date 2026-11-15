import 'package:dio/dio.dart';
import '../core/network/dio_client.dart';
import '../core/network/api_endpoints.dart';
import '../core/errors/exceptions.dart';
import '../models/models.dart';

/// خدمة الـ API الرئيسية - تتكفل بكل التواصل مع خادم ثقافتنا
class ApiService {
  final DioClient _client;

  ApiService({DioClient? client}) : _client = client ?? DioClient();

  // ============ الفصول ============

  /// جلب كل الفصول
  Future<List<ChapterModel>> getChapters() async {
    try {
      final response = await _client.get(ApiEndpoints.chapters);
      final data = response.data as Map<String, dynamic>;
      final chaptersJson = data['chapters'] as List? ?? [];
      return chaptersJson
          .whereType<Map<String, dynamic>>()
          .map((e) => ChapterModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحميل الفصول', userMessage: 'تعذّر تحميل الفصول.');
    }
  }

  // ============ المراحل ============

  /// جلب مراحل فصل معيّن
  Future<List<LevelModel>> getLevels(int chapterId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.levels,
        queryParameters: {'chapterId': chapterId},
      );
      final data = response.data as Map<String, dynamic>;
      final levelsJson = data['levels'] as List? ?? [];
      return levelsJson
          .whereType<Map<String, dynamic>>()
          .map((e) => LevelModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحميل المراحل', userMessage: 'تعذّر تحميل المراحل.');
    }
  }

  /// جلب تفاصيل مرحلة (مع words و cells)
  Future<LevelModel> getLevel(int levelId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.levels,
        queryParameters: {'id': levelId},
      );
      final data = response.data as Map<String, dynamic>;
      final levelJson = data['level'] as Map<String, dynamic>?;
      if (levelJson == null) {
        throw const NotFoundException('المرحلة غير موجودة');
      }
      return LevelModel.fromJson(levelJson);
    } on AppException {
      rethrow;
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('فشل تحميل المرحلة', userMessage: 'تعذّر تحميل تفاصيل المرحلة.');
    }
  }

  /// تسجيل تقدّم المستخدم في مرحلة
  Future<Map<String, dynamic>> submitLevelProgress({
    required int levelId,
    required int score,
    required int stars,
    required int timeSpent,
  }) async {
    try {
      final response = await _client.post(
        '/user/progress',
        data: {
          'levelId': levelId,
          'score': score,
          'stars': stars,
          'timeSpent': timeSpent,
        },
      );
      return response.data as Map<String, dynamic>;
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل حفظ التقدّم', userMessage: 'تعذّر حفظ تقدّمك.');
    }
  }

  // ============ الكتب ============

  /// جلب كل الكتب
  Future<List<BookModel>> getBooks({String? category, String? search}) async {
    try {
      final response = await _client.get(
        ApiEndpoints.books,
        queryParameters: {
          if (category != null) 'category': category,
          if (search != null) 'search': search,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final booksJson = data['books'] as List? ?? [];
      return booksJson
          .whereType<Map<String, dynamic>>()
          .map((e) => BookModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحميل الكتب', userMessage: 'تعذّر تحميل الكتب.');
    }
  }

  /// جلب كتاب محدّد
  Future<BookModel> getBook(int id) async {
    try {
      final response = await _client.get('${ApiEndpoints.books}/$id');
      final data = response.data as Map<String, dynamic>;
      final bookJson = data['book'] as Map<String, dynamic>?;
      if (bookJson == null) {
        throw const NotFoundException('الكتاب غير موجود');
      }
      return BookModel.fromJson(bookJson);
    } on AppException {
      rethrow;
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('فشل تحميل الكتاب', userMessage: 'تعذّر تحميل الكتاب.');
    }
  }

  // ============ الإشعارات ============

  /// جلب إشعارات المستخدم
  Future<List<NotificationModel>> getNotifications(String userId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.notifications,
        queryParameters: {'userId': userId},
      );
      final data = response.data as Map<String, dynamic>;
      final notificationsJson = data['notifications'] as List? ?? [];
      return notificationsJson
          .whereType<Map<String, dynamic>>()
          .map((e) => NotificationModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحميل الإشعارات', userMessage: 'تعذّر تحميل الإشعارات.');
    }
  }

  /// تعليم إشعار كمقروء
  Future<void> markNotificationAsRead(int notificationId) async {
    try {
      await _client.put(
        '${ApiEndpoints.notifications}/$notificationId/read',
      );
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحديث الإشعار', userMessage: 'تعذّر تحديث الإشعار.');
    }
  }

  // ============ المتصدرين ============

  /// جلب قائمة المتصدرين
  Future<List<LeaderboardEntryModel>> getLeaderboard({String period = 'weekly'}) async {
    try {
      final response = await _client.get(
        ApiEndpoints.leaderboard,
        queryParameters: {'period': period},
      );
      final data = response.data as Map<String, dynamic>;
      final leaderboardJson = data['leaderboard'] as List? ?? [];
      return leaderboardJson
          .whereType<Map<String, dynamic>>()
          .map((e) => LeaderboardEntryModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل تحميل المتصدرين', userMessage: 'تعذّر تحميل قائمة المتصدرين.');
    }
  }

  // ============ المساعد الذكي ============

  /// سؤال المساعد الذكي
  Future<String> askAiTutor(String question, {Map<String, dynamic>? context}) async {
    try {
      final response = await _client.post(
        ApiEndpoints.aiTutor,
        data: {
          'question': question,
          'context': context ?? {},
        },
      );
      final data = response.data as Map<String, dynamic>;
      return data['answer']?.toString() ?? data['response']?.toString() ?? 'عذرًا، لم أتمكن من فهم سؤالك.';
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل المساعد الذكي', userMessage: 'تعذّر الاتصال بالمساعد الذكي.');
    }
  }

  // ============ خريطة المعرفة ============

  /// جلب خريطة المعرفة للمستخدم
  Future<List<KnowledgeNodeModel>> getKnowledgeMap(String userId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.knowledgeMap,
        queryParameters: {'userId': userId},
      );
      final data = response.data as Map<String, dynamic>;
      final nodesJson = data['domains'] as List? ?? data['nodes'] as List? ?? [];
      return nodesJson
          .whereType<Map<String, dynamic>>()
          .map((e) => KnowledgeNodeModel.fromJson(e))
          .toList();
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل خريطة المعرفة', userMessage: 'تعذّر تحميل خريطة المعرفة.');
    }
  }

  // ============ التحليلات ============

  /// جلب تحليلات المستخدم
  Future<Map<String, dynamic>> getAnalytics(String userId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.analytics,
        queryParameters: {'userId': userId},
      );
      final data = response.data as Map<String, dynamic>;
      return data['analytics'] as Map<String, dynamic>? ?? data;
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل التحليلات', userMessage: 'تعذّر تحميل التحليلات.');
    }
  }

  // ============ التحدّي اليومي ============

  /// جلب التحدّي اليومي
  Future<DailyChallengeModel> getDailyChallenge() async {
    try {
      final response = await _client.get(ApiEndpoints.dailyChallenge);
      final data = response.data as Map<String, dynamic>;
      final challengeJson = data['challenge'] as Map<String, dynamic>?;
      if (challengeJson == null) {
        throw const NotFoundException('التحدّي اليومي غير متاح');
      }
      return DailyChallengeModel.fromJson(challengeJson);
    } on AppException {
      rethrow;
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException('فشل تحميل التحدّي', userMessage: 'تعذّر تحميل التحدّي اليومي.');
    }
  }

  /// إكمال التحدّي اليومي
  Future<Map<String, dynamic>> completeDailyChallenge(String answer, {int? timeSpent}) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.dailyChallenge}/complete',
        data: {
          'answer': answer,
          'timeSpent': timeSpent,
        },
      );
      return response.data as Map<String, dynamic>;
    } on AppException {
      rethrow;
    } catch (e) {
      throw AppException('فشل إكمال التحدّي', userMessage: 'تعذّر تسجيل إجابة التحدّي.');
    }
  }
}
