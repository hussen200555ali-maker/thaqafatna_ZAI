/**
 * 🎮 محرر المراحل — /admin/game/levels
 * صفحة placeholder لمحرر الشبكة المرئي (سيُطبّق لاحقًا)
 */

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GameLevelsPage() {
  return (
    <AdminLayout title="محرر المراحل" subtitle="محرر مرئي للشبكة والكلمات والألغاز">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-lg font-bold mb-2">محرر المراحل المرئي</h3>
        <p className="text-slate-500 mb-4">سيُضاف هنا المحرر المرئي الكامل للشبكة والكلمات</p>
        <Button
          onClick={() => window.location.href = '/admin/game/chapters'}
          variant="outline"
        >→ العودة لقائمة المراحل</Button>
      </Card>
    </AdminLayout>
  )
}
