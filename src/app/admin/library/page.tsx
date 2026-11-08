/**
 * 📚 إدارة المكتبة المُدمجة — /admin/library
 *
 * تعرض كل ما يخص المكتبة (كتب، استيراد PDF، تصنيفات، فصول، إحصائيات)
 * ضمن AdminLayout الموحّد بدلاً من كونها منفصلة.
 *
 * التبويبات:
 *   1. 📚 الكتب — قائمة + إدارة
 *   2. 📤 استيراد PDF — رفع + استخراج
 *   3. 📂 التصنيفات — إدارة
 *   4. 📑 الفصول — إدارة فصول كل كتاب
 *   5. 📊 إحصائيات — مشاهدات + تنزيلات + تقييمات
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { LibraryAdminView } from '@/components/library/library-admin'

export default function AdminLibraryPage() {
  return (
    <AdminLayout
      title="إدارة المكتبة"
      subtitle="الكتب · الاستيراد · التصنيفات · الفصول · الإحصائيات"
    >
      <LibraryAdminView embedded />
    </AdminLayout>
  )
}
