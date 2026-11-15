import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة الإشعارات
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(userIdProvider) ?? 'guest';
    final notificationsAsync = ref.watch(notificationsProvider(userId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('🔔 الإشعارات'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.check_circle_outline),
            onPressed: () {
              // TODO: تعليم الكل كمقروء
            },
          ),
        ],
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          if (notifications.isEmpty) {
            return const EmptyStateWidget(
              emoji: '🔕',
              title: 'لا توجد إشعارات',
              description: 'ستظهر هنا الإشعارات الجديدة.',
            );
          }
          final list = notifications.cast<NotificationModel>();
          return ListView.builder(
            padding: const EdgeInsets.all(AppSizes.md),
            itemCount: list.length,
            itemBuilder: (context, index) {
              final notif = list[index];
              return _NotificationItem(notification: notif);
            },
          );
        },
        loading: () => const LoadingWidget(text: 'جاري تحميل الإشعارات...'),
        error: (err, _) => ErrorStateWidget(
          message: err.toString(),
          onRetry: () => ref.invalidate(notificationsProvider(userId)),
        ),
      ),
    );
  }
}

class _NotificationItem extends StatelessWidget {
  final NotificationModel notification;

  const _NotificationItem({required this.notification});

  @override
  Widget build(BuildContext context) {
    final bg = notification.isRead
        ? AppColors.backgroundLight
        : AppColors.backgroundLight.withOpacity(0.6);

    return Container(
      margin: const EdgeInsets.only(bottom: AppSizes.sm),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        border: notification.isRead
            ? null
            : Border.all(color: AppColors.accent.withOpacity(0.3), width: 1),
      ),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          ),
          child: Center(
            child: Text(
              notification.iconOrEmoji,
              style: const TextStyle(fontSize: 22),
            ),
          ),
        ),
        title: Text(
          notification.title,
          style: AppFonts.bodyMedium.copyWith(
            color: AppColors.textPrimary,
            fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w700,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              notification.body,
              style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(notification.createdAt),
              style: AppFonts.caption.copyWith(color: AppColors.textHint),
            ),
          ],
        ),
        trailing: notification.reward != null
            ? AppBadge(
                text: '+${notification.reward} 🪙',
                backgroundColor: AppColors.gold,
                fontSize: 11,
              )
            : null,
        onTap: () {
          // TODO: تعليم كمقروء + تنفيذ الإجراء
        },
      ),
    );
  }

  String _formatTime(DateTime? time) {
    if (time == null) return '';
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 60) return 'قبل ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'قبل ${diff.inHours} ساعة';
    if (diff.inDays < 7) return 'قبل ${diff.inDays} يوم';
    return '${time.day}/${time.month}/${time.year}';
  }
}
