import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../app/providers.dart';

/// شاشة تسجيل الدخول
class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isLogin = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // TODO: تنفيذ المصادقة الحقيقية عبر API
      await Future.delayed(const Duration(seconds: 2)); // محاكاة

      if (!mounted) return;
      context.go('/main/home');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _continueAsGuest() {
    context.go('/main/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSizes.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSizes.xl),

                // الشعار
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: AppDecorations.elevatedShadow,
                    ),
                    child: const Center(
                      child: Text('🌟', style: TextStyle(fontSize: 50)),
                    ),
                  ),
                ),
                const SizedBox(height: AppSizes.md),

                Center(
                  child: Text(
                    'ثقافتنا',
                    style: AppFonts.displayLarge.copyWith(
                      color: AppColors.primary,
                      fontSize: 32,
                    ),
                  ),
                ),
                Center(
                  child: Text(
                    _isLogin ? 'أهلًا بعودتك!' : 'انضم إلينا',
                    style: AppFonts.bodyLarge.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),

                const SizedBox(height: AppSizes.xl),

                // البريد الإلكتروني
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'البريد الإلكتروني',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'الرجاء إدخال البريد الإلكتروني';
                    }
                    if (!value.contains('@')) {
                      return 'بريد إلكتروني غير صالح';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: AppSizes.md),

                // كلمة المرور
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'كلمة المرور',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'الرجاء إدخال كلمة المرور';
                    }
                    if (value.length < 6) {
                      return 'كلمة المرور قصيرة جدًا (6 أحرف على الأقل)';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: AppSizes.lg),

                // زر الإرسال
                GradientButton(
                  label: _isLogin ? 'تسجيل الدخول' : 'إنشاء حساب',
                  icon: _isLogin ? Icons.login : Icons.person_add,
                  isLoading: _isLoading,
                  onPressed: _submit,
                  gradient: AppColors.accentGradient,
                ),

                const SizedBox(height: AppSizes.md),

                // التبديل بين تسجيل الدخول وإنشاء حساب
                TextButton(
                  onPressed: () => setState(() => _isLogin = !_isLogin),
                  child: Text(
                    _isLogin
                        ? 'ليس لديك حساب؟ أنشئ حسابًا جديدًا'
                        : 'لديك حساب بالفعل؟ سجّل دخولك',
                  ),
                ),

                const SizedBox(height: AppSizes.md),

                // متابعة كضيف
                OutlinedButton.icon(
                  onPressed: _continueAsGuest,
                  icon: const Icon(Icons.person_outline),
                  label: const Text('المتابعة كضيف'),
                ),

                const SizedBox(height: AppSizes.xl),

                // شروط الاستخدام
                Text(
                  'بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية.',
                  style: AppFonts.caption.copyWith(
                    color: AppColors.textHint,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
