/**
 * 🔒 تعقيم المدخلات — Sprint 5 A.3
 *
 * يمنع XSS في رسائل التواصل وأي مدخلات نصية من المستخدم
 * يستخدم طريقة بسيطة بدون DOMPurify (لتجنب مشاكل التثبيت)
 */

/**
 * تعقيم نص من أي HTML/JavaScript (يمنع XSS)
 * يزيل كل وسوم HTML ويبقي النص فقط
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  return input
    // إزالة وسوم HTML
    .replace(/<[^>]*>/g, '')
    // إزالة JavaScript: protocol
    .replace(/javascript:/gi, '')
    // إزالة on* event handlers
    .replace(/on\w+\s*=/gi, '')
    // ترميز الأحرف الخاصة
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // تقليم المسافات
    .trim()
}

/**
 * تعقيم وتحقق من البريد الإلكتروني
 */
export function sanitizeEmail(input: string): string {
  const clean = sanitizeText(input)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return ''
  }
  return clean
}

/**
 * تعقيم URL (للروابط الخارجية في رسائل التواصل)
 */
export function sanitizeUrl(input: string): string {
  const clean = sanitizeText(input)
  // السماح فقط بـ http/https
  if (!/^https?:\/\//i.test(clean)) {
    return ''
  }
  return clean
}
