/**
 * ⚖️ موازنة الصعوبة — /admin/game/difficulty
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'

export default function GameDifficultyPage() {
  return (
    <AdminLayout title="موازنة الصعوبة" subtitle="تحليل آلي لصعوبة المراحل">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <h3 className="text-lg font-bold mb-2">موازنة صعوبة المراحل</h3>
        <p className="text-slate-500">سيُضاف هنا تحليل توزيع الصعوبة واقتراحات التحسين.</p>
      </Card>
    </AdminLayout>
  )
}
