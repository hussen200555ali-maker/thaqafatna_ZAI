/**
 * ✅ مدقّق الجودة — /admin/game/quality
 * صفحة placeholder لمدقّق الجودة الآلي
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'

export default function GameQualityPage() {
  return (
    <AdminLayout title="مدقّق الجودة" subtitle="فحص آلي للأسئلة والكلمات">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-lg font-bold mb-2">مدقّق الجودة الآلي</h3>
        <p className="text-slate-500">سيُضاف هنا الفحص الآلي للأسئلة لاكتشاف الأخطاء والتكرارات.</p>
      </Card>
    </AdminLayout>
  )
}
