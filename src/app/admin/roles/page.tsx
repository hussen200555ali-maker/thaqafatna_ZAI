/**
 * 🛡️ الأدوار والصلاحيات — /admin/roles
 */

'use client'

import { Check, X, Shield } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { SectionCard } from '@/components/admin/admin-primitives'
import { Card } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const permissions = [
  { name: 'تصفّح المكتبة', roles: { reader: true, assistant: true, librarian: true, admin: true } },
  { name: 'تنزيل الكتب', roles: { reader: true, assistant: true, librarian: true, admin: true } },
  { name: 'إضافة تقييم/مراجعة', roles: { reader: true, assistant: true, librarian: true, admin: true } },
  { name: 'إنشاء قوائم مفضلة', roles: { reader: true, assistant: true, librarian: true, admin: true } },
  { name: 'رفع PDF/أغلفة', roles: { reader: false, assistant: true, librarian: true, admin: true } },
  { name: 'إضافة/تعديل الكتب', roles: { reader: false, assistant: false, librarian: true, admin: true } },
  { name: 'نشر/إخفاء الكتب', roles: { reader: false, assistant: false, librarian: true, admin: true } },
  { name: 'إدارة التصنيفات', roles: { reader: false, assistant: false, librarian: true, admin: true } },
  { name: 'اعتدال المراجعات', roles: { reader: false, assistant: false, librarian: true, admin: true } },
  { name: 'إدارة المستخدمين', roles: { reader: false, assistant: false, librarian: false, admin: true } },
  { name: 'تعديل الأدوار', roles: { reader: false, assistant: false, librarian: false, admin: true } },
  { name: 'عرض سجل التدقيق', roles: { reader: false, assistant: false, librarian: false, admin: true } },
  { name: 'حذف نهائي', roles: { reader: false, assistant: false, librarian: false, admin: true } },
  { name: 'الإعدادات العامة', roles: { reader: false, assistant: false, librarian: false, admin: true } },
]

const roleInfo = [
  { name: 'reader', label: 'قارئ', color: 'bg-slate-100 text-slate-700' },
  { name: 'assistant', label: 'مساعد', color: 'bg-sky-100 text-sky-700' },
  { name: 'librarian', label: 'أمين مكتبة', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'admin', label: 'مدير', color: 'bg-red-100 text-red-700' },
]

export default function AdminRolesPage() {
  return (
    <AdminLayout
      title="🛡️ الأدوار والصلاحيات"
      subtitle="4 أدوار · للقراءة فقط — التعديل للمدير فقط"
    >
      {/* Info banner */}
      <Card className="mb-6 border-sky-200 bg-sky-50">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 flex-shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="text-sm text-sky-900">
            <p className="font-medium">مصفوفة الصلاحيات الافتراضية</p>
            <p className="mt-1 text-sky-700">
              هذه الأدوار معرّفة كـ <code className="rounded bg-sky-100 px-1 py-0.5 text-xs">isSystem: true</code> ولا يمكن حذفها.
              يمكن للمدير فقط تعديل الأدوار.
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold">الصلاحية</TableHead>
              {roleInfo.map(r => (
                <TableHead key={r.name} className="text-center">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${r.color}`}>
                    {r.label}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((perm, i) => (
              <TableRow key={i} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{perm.name}</TableCell>
                {roleInfo.map(r => (
                  <TableCell key={r.name} className="text-center">
                    {perm.roles[r.name as keyof typeof perm.roles] ? (
                      <Check className="mx-auto h-5 w-5 text-emerald-600" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-slate-300" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  )
}
