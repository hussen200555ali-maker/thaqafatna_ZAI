import 'package:dio/dio.dart';
import '../theme/app_colors.dart';

/// استثناءات مخصصة للتطبيق
class AppException implements Exception {
  final String message;
  final String? userMessage;
  final int? statusCode;
  final dynamic originalError;

  const AppException(
    this.message, {
    this.userMessage,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => userMessage ?? message;
}

class ServerException extends AppException {
  const ServerException(String message, {int? statusCode, dynamic originalError})
      : super(
          message,
          userMessage: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.',
          statusCode: statusCode,
          originalError: originalError,
        );
}

class NetworkException extends AppException {
  const NetworkException([String? message])
      : super(
          message ?? 'لا يوجد اتصال بالإنترنت',
          userMessage: 'تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.',
        );
}

class TimeoutException extends AppException {
  const TimeoutException()
      : super(
          'انتهت مهلة الطلب',
          userMessage: 'استغرق الطلب وقتًا طويلاً. تحقّق من الاتصال وحاول.',
        );
}

class NotFoundException extends AppException {
  const NotFoundException(String resource)
      : super(
          'لم يتم العثور على: $resource',
          userMessage: 'المحتوى غير موجود.',
        );
}

class UnauthorizedException extends AppException {
  const UnauthorizedException()
      : super(
          'غير مصرّح',
          userMessage: 'انتهت الجلسة. سجّل دخولك مرة أخرى.',
        );
}

class CacheException extends AppException {
  const CacheException(String message)
      : super(
          message,
          userMessage: 'تعذّر الوصول للبيانات المحلية.',
        );
}

/// نتيجة موحدة للطلبات
class Result<T> {
  final T? data;
  final AppException? error;

  const Result.success(this.data) : error = null;
  const Result.failure(this.error) : data = null;

  bool get isSuccess => error == null;
  bool get isFailure => error != null;

  T getOrElse(T Function() defaultValue) =>
      isSuccess ? data as T : defaultValue();

  Result<R> map<R>(R Function(T data) mapper) =>
      isSuccess ? Result.success(mapper(data as T)) : Result.failure(error!);
}

/// رسائل الأخطاء بالعربية
class ErrorMessages {
  ErrorMessages._();

  static String getForDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'انتهت مهلة الاتصال. تحقّق من الإنترنت وحاول.';
      case DioExceptionType.connectionError:
        return 'لا يوجد اتصال بالإنترنت. تأكّد من الشبكة.';
      case DioExceptionType.badCertificate:
        return 'مشكلة في شهادة الأمان للخادم.';
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? 0;
        return _getForStatusCode(statusCode);
      case DioExceptionType.cancel:
        return 'تم إلغاء الطلب.';
      case DioExceptionType.unknown:
      default:
        return error.error?.toString() ?? 'حدث خطأ غير متوقّع.';
    }
  }

  static String _getForStatusCode(int statusCode) {
    if (statusCode >= 500) {
      return 'الخادم يواجه مشكلة. حاول لاحقًا.';
    } else if (statusCode == 404) {
      return 'المحتوى غير موجود.';
    } else if (statusCode == 401 || statusCode == 403) {
      return 'انتهت الجلسة. سجّل دخولك مرة أخرى.';
    } else if (statusCode == 429) {
      return 'طلبات كثيرة جدًا. انتظر قليلاً.';
    } else if (statusCode >= 400) {
      return 'طلب غير صالح. تحقّق من البيانات.';
    }
    return 'حدث خطأ غير معروف.';
  }
}
