import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../app/providers.dart';

/// شاشة الإعدادات
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الإعدادات'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSizes.md),
        children: [
          // المظهر
          _SectionTitle('المظهر'),
          _SettingTile(
            icon: Icons.dark_mode,
            title: 'الوضع الليلي',
            trailing: Switch(
              value: themeMode == ThemeMode.dark,
              onChanged: (value) {
                ref.read(themeModeProvider.notifier).setMode(
                      value ? ThemeMode.dark : ThemeMode.light,
                    );
              },
              activeColor: AppColors.accent,
            ),
          ),
          _SettingTile(
            icon: Icons.language,
            title: 'اللغة',
            subtitle: 'العربية',
            onTap: () {},
          ),

          const SizedBox(height: AppSizes.lg),

          // الإشعارات
          _SectionTitle('الإشعارات'),
          _SettingTile(
            icon: Icons.notifications,
            title: 'إشعارات التحدّي اليومي',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppColors.accent,
            ),
          ),
          _SettingTile(
            icon: Icons.notifications_active,
            title: 'إشعارات الكتب الجديدة',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppColors.accent,
            ),
          ),
          _SettingTile(
            icon: Icons.emoji_events,
            title: 'إشعارات الإنجازات',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppColors.accent,
            ),
          ),

          const SizedBox(height: AppSizes.lg),

          // الحساب
          _SectionTitle('الحساب'),
          _SettingTile(
            icon: Icons.person,
            title: 'تعديل الملف الشخصي',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.logout,
            title: 'تسجيل الخروج',
            textColor: AppColors.error,
            onTap: () {
              _showLogoutDialog(context, ref);
            },
          ),

          const SizedBox(height: AppSizes.lg),

          // عن التطبيق
          _SectionTitle('عن التطبيق'),
          _SettingTile(
            icon: Icons.info,
            title: 'الإصدار',
            subtitle: '2.0.0 (Flutter)',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.code,
            title: 'المطوّرون',
            subtitle: 'فريق ثقافتنا',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.privacy_tip,
            title: 'سياسة الخصوصية',
            onTap: () {},
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأكيد تسجيل الخروج'),
        content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(userIdProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
          bottom: AppSizes.sm, right: AppSizes.md),
      child: Text(
        title,
        style: AppFonts.titleMedium.copyWith(color: AppColors.accent),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? textColor;

  const _SettingTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSizes.xs),
      decoration: AppDecorations.card(radius: AppSizes.radiusMd),
      child: ListTile(
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: (textColor ?? AppColors.primary).withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppSizes.radiusSm),
          ),
          child: Icon(icon, color: textColor ?? AppColors.primary, size: 20),
        ),
        title: Text(
          title,
          style: AppFonts.bodyMedium
              .copyWith(color: textColor ?? AppColors.textPrimary),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style: AppFonts.caption.copyWith(color: AppColors.textSecondary),
              )
            : null,
        trailing: trailing ??
            (onTap != null
                ? const Icon(Icons.chevron_left, color: AppColors.textHint)
                : null),
        onTap: onTap,
      ),
    );
  }
}
