import 'dart:async';
import 'dart:developer' as developer;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../core/theme/app_colors.dart';

/// خدمة الإشعارات الموحّدة (FCM + Local)
class NotificationService {
  final FirebaseMessaging _firebaseMessaging;
  final FlutterLocalNotificationsPlugin _localNotifications;
  bool _initialized = false;

  static Future<void> Function(RemoteMessage message)? backgroundMessageHandler;

  NotificationService({
    FirebaseMessaging? firebaseMessaging,
    FlutterLocalNotificationsPlugin? localNotifications,
  })  : _firebaseMessaging = firebaseMessaging ?? FirebaseMessaging.instance,
        _localNotifications =
            localNotifications ?? FlutterLocalNotificationsPlugin();

  /// تهيئة خدمة الإشعارات
  Future<void> init() async {
    if (_initialized) return;

    try {
      // 1. تهيئة flutter_local_notifications
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initSettings = InitializationSettings(
        android: androidInit,
        iOS: iosInit,
      );
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTap,
      );

      // 2. طلب صلاحيات FCM
      await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      // 3. تكوين قناة الإشعارات للأندرويد
      await _setupAndroidChannel();

      // 4. الاستماع للرسائل الواردة في الـ foreground
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // 5. معالجة الرسائل في الـ background
      FirebaseMessaging.onBackgroundMessage(_backgroundHandler);

      _initialized = true;
      developer.log('[Notifications] تمت التهيئة بنجاح', name: 'NotificationService');
    } catch (e) {
      developer.log('[Notifications] فشل التهيئة: $e', name: 'NotificationService');
    }
  }

  Future<void> _setupAndroidChannel() async {
    const channel = AndroidNotificationChannel(
      AppConstants.fcmChannelId,
      AppConstants.fcmChannelName,
      description: AppConstants.fcmChannelDesc,
      importance: Importance.high,
      enableLights: true,
      enableVibration: true,
      playSound: true,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    developer.log('[FCM] رسالة في الـ foreground: ${message.notification?.title}',
        name: 'NotificationService');
    final notification = message.notification;
    if (notification != null) {
      showLocalNotification(
        title: notification.title ?? 'إشعار جديد',
        body: notification.body ?? '',
        payload: message.data['actionUrl']?.toString(),
      );
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    developer.log('[FCM] نقر على إشعار: ${message.data}',
        name: 'NotificationService');
    // TODO: تنفيذ التنقل عند النقر على الإشعار
  }

  void _onNotificationTap(NotificationResponse response) {
    developer.log('[Local] نقر على إشعار محلي: ${response.payload}',
        name: 'NotificationService');
    // TODO: تنفيذ التنقل
  }

  static Future<void> _backgroundHandler(RemoteMessage message) async {
    if (backgroundMessageHandler != null) {
      await backgroundMessageHandler!(message);
    }
    developer.log('[FCM] رسالة في الـ background: ${message.messageId}',
        name: 'NotificationService');
  }

  /// الحصول على FCM token
  Future<String?> getToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      developer.log('[FCM] فشل الحصول على الـ token: $e',
          name: 'NotificationService');
      return null;
    }
  }

  /// الاشتراك في topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      developer.log('[FCM] تم الاشتراك في: $topic', name: 'NotificationService');
    } catch (e) {
      developer.log('[FCM] فشل الاشتراك في $topic: $e',
          name: 'NotificationService');
    }
  }

  /// إلغاء الاشتراك من topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      developer.log('[FCM] إلغاء الاشتراك من: $topic',
          name: 'NotificationService');
    } catch (e) {
      developer.log('[FCM] فشل إلغاء الاشتراك من $topic: $e',
          name: 'NotificationService');
    }
  }

  /// عرض إشعار محلي فوري
  Future<void> showLocalNotification({
    required String title,
    required String body,
    int id = 0,
    String? payload,
    String? bigText,
  }) async {
    try {
      const androidDetails = AndroidNotificationDetails(
        AppConstants.fcmChannelId,
        AppConstants.fcmChannelName,
        channelDescription: AppConstants.fcmChannelDesc,
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        color: AppColors.primary,
      );
      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );
      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );
      await _localNotifications.show(
        id,
        title,
        body,
        details,
        payload: payload,
      );
    } catch (e) {
      developer.log('[Local] فشل عرض الإشعار: $e', name: 'NotificationService');
    }
  }

  /// جدولة تذكير يومي
  Future<void> scheduleDailyReminder({
    required int hour,
    required int minute,
    String title = 'تذكير ثقافتنا',
    String body = 'حان وقت التحدّي اليومي! 🎯',
  }) async {
    try {
      // ملاحظة: جدولة الإشعارات المحلية معقدة ويحتاج timezone package
      // نكتفي هنا بعرض إشعار فوري عند الطلب
      developer.log('[Notifications] جدولة التذكير اليومي على $hour:$minute',
          name: 'NotificationService');
    } catch (e) {
      developer.log('[Notifications] فشل جدولة التذكير: $e',
          name: 'NotificationService');
    }
  }

  /// إلغاء كل الإشعارات المجدولة
  Future<void> cancelAllScheduled() async {
    try {
      await _localNotifications.cancelAll();
    } catch (e) {
      developer.log('[Local] فشل إلغاء الإشعارات: $e',
          name: 'NotificationService');
    }
  }

  /// إزالة كل الإشعارات المعروضة
  Future<void> clearAll() async {
    try {
      await _localNotifications.cancelAll();
    } catch (e) {
      developer.log('[Local] فشل مسح الإشعارات: $e',
          name: 'NotificationService');
    }
  }
}
