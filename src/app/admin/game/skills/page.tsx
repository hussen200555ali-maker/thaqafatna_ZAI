/**
 * 🌳 شجرة المهارات — /admin/game/skills
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'

export default function GameSkillsPage() {
  return (
    <AdminLayout title="شجرة المهارات" subtitle="محرر شجرة المهارات التعليمية">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🌳</div>
        <h3 className="text-lg font-bold mb-2">شجرة المهارات</h3>
        <p className="text-slate-500">سيُضاف هنا محرر شجرة المهارات المرئي.</p>
      </Card>
    </AdminLayout>
  )
}
