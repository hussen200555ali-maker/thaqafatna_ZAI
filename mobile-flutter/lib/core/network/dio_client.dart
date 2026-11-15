import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../errors/exceptions.dart';
import '../theme/app_colors.dart';

/// عميل HTTP احترافي للتواصل مع API ثقافتنا
class DioClient {
  late final Dio _dio;
  final Connectivity _connectivity = Connectivity();

  DioClient() {
    _dio = Dio(_baseOptions);
    _setupInterceptors();
  }

  static BaseOptions get _baseOptions => BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: AppConstants.apiTimeout,
        receiveTimeout: AppConstants.apiTimeout,
        sendTimeout: AppConstants.apiTimeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'thaqafatna-flutter',
        },
        responseType: ResponseType.json,
      );

  void _setupInterceptors() {
    // Interceptor للـ logging (في development فقط)
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // تحقق من الاتصال قبل الطلب
          final hasConnection = await _hasNetworkConnection();
          if (!hasConnection) {
            handler.reject(
              DioException(
                requestOptions: options,
                type: DioExceptionType.connectionError,
                error: 'لا يوجد اتصال بالإنترنت',
              ),
            );
            return;
          }

          // أضف Authorization header إن وُجد token
          final token = await _getAuthToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // أضف Origin للمساعدة في CORS
          options.headers['Origin'] = 'thaqafatna-flutter-app';

          handler.next(options);
        },
        onError: (error, handler) {
          // تحويل الأخطاء لرسائل عربية واضحة
          final message = ErrorMessages.getForDioError(error);
          handler.next(
            DioException(
              requestOptions: error.requestOptions,
              type: error.type,
              response: error.response,
              error: message,
              message: message,
            ),
          );
        },
      ),
    );

    // Retry interceptor
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onError: (error, handler) async {
          final maxRetries = AppConstants.apiRetryCount;
          final retryCount = error.requestOptions.extra['retryCount'] ?? 0;

          // أعد المحاولة فقط للأخطاء المتعلقة بالشبكة
          final shouldRetry = retryCount < maxRetries &&
              (error.type == DioExceptionType.connectionTimeout ||
                  error.type == DioExceptionType.receiveTimeout ||
                  error.type == DioExceptionType.connectionError);

          if (shouldRetry) {
            error.requestOptions.extra['retryCount'] = retryCount + 1;
            await Future.delayed(Duration(seconds: retryCount + 1));
            try {
              final response = await _dio.fetch(error.requestOptions);
              handler.resolve(response);
              return;
            } catch (e) {
              handler.next(error);
              return;
            }
          }

          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _hasNetworkConnection() async {
    final result = await _connectivity.checkConnectivity();
    return result.any((c) => c != ConnectivityResult.none);
  }

  Future<String?> _getAuthToken() async {
    // TODO: استرجع الـ token من Hive/SharedPreferences
    // مؤقتًا، نرجع null (للضيوف)
    return null;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  AppException _mapDioError(DioException e) {
    final statusCode = e.response?.statusCode;
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutException();
      case DioExceptionType.connectionError:
        return const NetworkException();
      case DioExceptionType.badResponse:
        if (statusCode == 401 || statusCode == 403) {
          return const UnauthorizedException();
        } else if (statusCode == 404) {
          return NotFoundException(e.requestOptions.path);
        }
        return ServerException(
          e.response?.data?['error']?.toString() ?? 'خطأ في الخادم',
          statusCode: statusCode,
        );
      default:
        return AppException(e.message ?? 'خطأ غير معروف',
            userMessage: e.error?.toString());
    }
  }
}

/// مسار الـ API endpoints
class ApiEndpoints {
  ApiEndpoints._();

  // الفصول والمراحل
  static const chapters = '/chapters';
  static const levels = '/levels';

  // الكتب
  static const books = '/books';
  static const featuredBooks = '/books/featured';

  // الإشعارات
  static const notifications = '/notifications';

  // المتصدرين
  static const leaderboard = '/leaderboard';

  // المساعد الذكي
  static const aiTutor = '/ai-tutor';

  // خريطة المعرفة
  static const knowledgeMap = '/knowledge-map';

  // التحليلات
  static const analytics = '/analytics';

  // التحدّي اليومي
  static const dailyChallenge = '/daily-challenge';

  // المصادقة
  static const auth = '/auth';
  static const authLogin = '/auth/login';
  static const authRegister = '/auth/register';
  static const authLogout = '/auth/logout';

  // المستخدم
  static const user = '/user';
  static const userProgress = '/user/progress';
  static const userBadges = '/user/badges';
}
