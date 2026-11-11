/// أدوات التحقق من المدخلات (Validators)
///
/// توفّر دوال تحقق موحّدة لحقول الإدخال الشائعة:
/// البريد الإلكتروني، كلمة المرور، رقم الهاتف، الاسم.
///
/// كل دالة تعيد `null` إذا كانت القيمة صالحة،
/// أو رسالة خطأ بالعربية إذا كانت غير صالحة.
library;

import 'package:email_validator/email_validator.dart';

/// دوال التحقق من المدخلات
class Validators {
  Validators._();

  // ===== البريد الإلكتروني =====

  /// يتحقق من صحة البريد الإلكتروني
  ///
  /// القواعد:
  /// - غير فارغ
  /// - بصيغة بريد إلكتروني صحيحة (RFC)
  /// - الطول ≤ 254 حرفًا
  ///
  /// يعيد `null` إذا كان صالحًا، أو رسالة خطأ بالعربية.
  static String? validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) {
      return 'البريد الإلكتروني مطلوب';
    }
    if (email.length > 254) {
      return 'البريد الإلكتروني طويل جدًا';
    }
    if (!EmailValidator.validate(email, true)) {
      return 'صيغة البريد الإلكتروني غير صحيحة';
    }
    return null;
  }

  /// هل البريد الإلكتروني صالح؟
  static bool isValidEmail(String email) {
    return validateEmail(email) == null;
  }

  // ===== كلمة المرور =====

  /// يتحقق من صحة كلمة المرور
  ///
  /// القواعد الافتراضية:
  /// - الطول بين 8 و 64 حرفًا
  /// - تحتوي على حرف كبير (A-Z)
  /// - تحتوي على حرف صغير (a-z)
  /// - تحتوي على رقم (0-9)
  ///
  /// يعيد `null` إذا كانت صالحة، أو رسالة خطأ بالعربية.
  static String? validatePassword(
    String? value, {
    int minLength = 8,
    int maxLength = 64,
    bool requireUppercase = true,
    bool requireLowercase = true,
    bool requireDigit = true,
    bool requireSpecialChar = false,
  }) {
    final password = value ?? '';
    if (password.isEmpty) {
      return 'كلمة المرور مطلوبة';
    }
    if (password.length < minLength) {
      return 'كلمة المرور قصيرة جدًا (الحد الأدنى $minLength أحرف)';
    }
    if (password.length > maxLength) {
      return 'كلمة المرور طويلة جدًا (الحد الأقصى $maxLength حرفًا)';
    }
    if (requireUppercase && !password.contains(RegExp(r'[A-Z]'))) {
      return 'يجب أن تحتوي على حرف كبير واحد على الأقل';
    }
    if (requireLowercase && !password.contains(RegExp(r'[a-z]'))) {
      return 'يجب أن تحتوي على حرف صغير واحد على الأقل';
    }
    if (requireDigit && !password.contains(RegExp(r'[0-9]'))) {
      return 'يجب أن تحتوي على رقم واحد على الأقل';
    }
    if (requireSpecialChar &&
        !password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>_]'))) {
      return 'يجب أن تحتوي على رمز خاص واحد على الأقل (!@#\$%^&*)';
    }
    return null;
  }

  /// هل كلمة المرور قوية؟
  static bool isStrongPassword(String password) {
    return validatePassword(password) == null;
  }

  /// يحسب قوة كلمة المرور كنسبة (0.0 - 1.0)
  static double passwordStrength(String password) {
    if (password.isEmpty) return 0.0;
    var score = 0.0;
    if (password.length >= 8) score += 0.25;
    if (password.length >= 12) score += 0.25;
    if (password.contains(RegExp(r'[A-Z]'))) score += 0.15;
    if (password.contains(RegExp(r'[a-z]'))) score += 0.15;
    if (password.contains(RegExp(r'[0-9]'))) score += 0.10;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>_]'))) score += 0.10;
    return score.clamp(0.0, 1.0);
  }

  // ===== رقم الهاتف =====

  /// يتحقق من صحة رقم الهاتف
  ///
  /// القواعد:
  /// - غير فارغ
  /// - يبدأ بـ + أو رقم
  /// - الطول بين 8 و 15 رقمًا (مع/بدون رمز البلد)
  ///
  /// يعيد `null` إذا كان صالحًا، أو رسالة خطأ بالعربية.
  static String? validatePhone(String? value, {String? countryCode}) {
    final phone = value?.trim() ?? '';
    if (phone.isEmpty) {
      return 'رقم الهاتف مطلوب';
    }

    // إزالة المسافات والشرطات
    final cleaned = phone.replaceAll(RegExp(r'[\s-]'), '');

    // التحقق من الأحرف غير الرقمية (باستثناء +)
    if (!RegExp(r'^\+?\d+$').hasMatch(cleaned)) {
      return 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }

    // إزالة الـ + إن وُجد
    final digitsOnly = cleaned.replaceFirst('+', '');
    if (digitsOnly.length < 8) {
      return 'رقم الهاتف قصير جدًا';
    }
    if (digitsOnly.length > 15) {
      return 'رقم الهاتف طويل جدًا';
    }

    // تحقق خاص بالأرقام السعودية إن لم يُحدد country code
    if (countryCode == null || countryCode.isEmpty) {
      // الأرقام السعودية تبدأ بـ 05 أو 5
      if (digitsOnly.startsWith('0')) {
        if (digitsOnly.length != 10 || !digitsOnly.startsWith('05')) {
          return 'رقم الجوال السعودي غير صحيح (يجب أن يبدأ بـ 05)';
        }
      }
    }

    return null;
  }

  /// هل رقم الهاتف صالح؟
  static bool isValidPhone(String phone, {String? countryCode}) {
    return validatePhone(phone, countryCode: countryCode) == null;
  }

  /// يوحّد رقم الهاتف إلى صيغة دولية (مثل +9665XXXXXXXX)
  static String normalizePhone(String phone, {String defaultCountry = '966'}) {
    final cleaned = phone.replaceAll(RegExp(r'[\s-]'), '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.startsWith('00')) {
      return '+${cleaned.substring(2)}';
    }
    if (cleaned.startsWith('0')) {
      return '+$defaultCountry${cleaned.substring(1)}';
    }
    return '+$defaultCountry$cleaned';
  }

  // ===== الاسم =====

  /// يتحقق من صحة الاسم
  ///
  /// القواعد:
  /// - غير فارغ
  /// - الطول بين 2 و 50 حرفًا
  /// - يحتوي على أحرف فقط (عربية أو إنجليزية) ومسافات
  ///
  /// يعيد `null` إذا كان صالحًا، أو رسالة خطأ بالعربية.
  static String? validateName(
    String? value, {
    int minLength = 2,
    int maxLength = 50,
  }) {
    final name = value?.trim() ?? '';
    if (name.isEmpty) {
      return 'الاسم مطلوب';
    }
    if (name.length < minLength) {
      return 'الاسم قصير جدًا (الحد الأدنى $minLength أحرف)';
    }
    if (name.length > maxLength) {
      return 'الاسم طويل جدًا (الحد الأقصى $maxLength حرفًا)';
    }
    // سماح بالأحرف العربية والإنجليزية والمسافات وبعض الرموز
    // نستخدم نقطتين بدل $ في النهاية (matching line end) ثم التحقق اليدوي
    // أو نستخدم string escape لأنّ $ لا يمكن أن يكون في raw string في النهاية
    final nameRegex = RegExp(
      '^[\\u0600-\\u06FFa-zA-Z\\s\\-\\\'.]+\$',
    );
    if (!nameRegex.hasMatch(name)) {
      return 'الاسم يجب أن يحتوي على أحرف فقط';
    }
    return null;
  }

  /// هل الاسم صالح؟
  static bool isValidName(String name) {
    return validateName(name) == null;
  }

  // ===== تحقّقات عامة =====

  /// يتحقق من أن الحقل غير فارغ
  static String? validateRequired(String? value, {String fieldName = 'هذا الحقل'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName مطلوب';
    }
    return null;
  }

  /// يتحقق من طول النص
  static String? validateLength(
    String? value, {
    required int min,
    int? max,
    String fieldName = 'هذا الحقل',
  }) {
    final text = value ?? '';
    if (text.length < min) {
      return '$fieldName قصير جدًا (الحد الأدنى $min أحرف)';
    }
    if (max != null && text.length > max) {
      return '$fieldName طويل جدًا (الحد الأقصى $max حرفًا)';
    }
    return null;
  }

  /// يتحقق من تطابق حقلين (مثل تأكيد كلمة المرور)
  static String? validateMatch(
    String? value,
    String? original, {
    String fieldName = 'هذا الحقل',
  }) {
    if (value == null || value.isEmpty) {
      return '$fieldName مطلوب';
    }
    if (value != original) {
      return '$fieldName غير مطابق';
    }
    return null;
  }

  /// يتحقق من قيمة رقمية ضمن نطاق
  static String? validateNumberRange(
    String? value, {
    required num min,
    required num max,
    String fieldName = 'القيمة',
  }) {
    final number = num.tryParse(value ?? '');
    if (number == null) {
      return '$fieldName يجب أن تكون رقمًا';
    }
    if (number < min) {
      return '$fieldName يجب أن لا تقل عن $min';
    }
    if (number > max) {
      return '$fieldName يجب أن لا تزيد عن $max';
    }
    return null;
  }
}

/// extension على [String] لتسهيل التحقق
extension ValidatorStringExtension on String {
  /// هل البريد الإلكتروني صالح؟
  bool get isValidEmail => Validators.isValidEmail(this);

  /// هل رقم الهاتف صالح؟
  bool get isValidPhone => Validators.isValidPhone(this);

  /// هل الاسم صالح؟
  bool get isValidName => Validators.isValidName(this);

  /// هل كلمة المرور قوية؟
  bool get isStrongPassword => Validators.isStrongPassword(this);

  /// قوة كلمة المرور (0.0 - 1.0)
  double get passwordStrengthScore => Validators.passwordStrength(this);
}
