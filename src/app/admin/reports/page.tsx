/**
 * 📈 التقارير — /admin/reports
 */

'use client'

import { useState, useEffect } from 'react'
import { FileDown, TrendingUp, TrendingDown, Users, Download, Clock, CheckCircle } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatCard, SectionCard, LoadingState } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ReportData {
  stats: {
    totalBooks: number
    publishedBooks: number
    totalUsers: number
    totalDownloads: number
    pendingReviews: number
  }
  recentActivity: Array<{ action: string; time: string }>
}

const weekDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
const mockChartData = [
  { day: 'السبت', value: 142, percent: 60 },
  { day: 'الأحد', value: 187, percent: 75 },
  { day: 'الإثنين', value: 234, percent: 90 },
  { day: 'الثلاثاء', value: 165, percent: 70 },
  { day: 'الأربعاء', value: 198, percent: 85 },
  { day: 'الخميس', value: 247, percent: 95 },
  { day: 'الجمعة', value: 187, percent: 80 },
]

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <AdminLayout title="📈 التقارير">
        <LoadingState />
      </AdminLayout>
    )
  }

  const s = data.stats

  return (
    <AdminLayout
      title="📈 التقارير والتحليلات"
      subtitle="آخر 30 يومًا"
      actions={
        <>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يومًا</SelectItem>
              <SelectItem value="90d">آخر 90 يومًا</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            تصدير PDF
          </Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي التنزيلات"
          value={s.totalDownloads.toLocaleString('ar-EG')}
          icon={<Download className="h-6 w-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '23% عن الشهر الماضي', direction: 'up' }}
        />
        <StatCard
          label="مستخدمون جدد"
          value={87}
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ value: '12% عن الشهر الماضي', direction: 'up' }}
        />
        <StatCard
          label="متوسط وقت القراءة"
          value="18 د"
          icon={<Clock className="h-6 w-6" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          trend={{ value: '3 دقائق', direction: 'up' }}
        />
        <StatCard
          label="معدل الإكمال"
          value="42%"
          icon={<CheckCircle className="h-6 w-6" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          trend={{ value: '2% عن الشهر الماضي', direction: 'down' }}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Downloads Chart */}
        <div className="lg:col-span-2">
          <SectionCard title="📊 التنزيلات اليومية" description="آخر 7 أيام">
            <div className="flex items-end justify-between gap-3 pt-6" style={{ height: '240px' }}>
              {mockChartData.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-500 transition-all hover:opacity-80"
                      style={{ height: `${d.percent}%` }}
                      title={`${d.value} تنزيل`}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700">
                        {d.value}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{d.day}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Top Books */}
        <SectionCard title="🏆 الكتب الأكثر تنزيلاً">
          <div className="space-y-3">
            {[
              { rank: 1, title: 'مقدمة ابن خلدون', count: 3287 },
              { rank: 2, title: 'رياض الصالحين', count: 2156 },
              { rank: 3, title: 'البلاء والتبين', count: 1892 },
              { rank: 4, title: 'الأغاني', count: 1432 },
              { rank: 5, title: 'مقامات الحريري', count: 987 },
            ].map((book) => (
              <div key={book.rank} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    book.rank === 1 ? 'bg-amber-100 text-amber-700' :
                    book.rank === 2 ? 'bg-slate-200 text-slate-700' :
                    book.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  )}>
                    {book.rank}
                  </span>
                  <span className="text-slate-700">{book.title}</span>
                </div>
                <span className="font-semibold text-emerald-600">{book.count.toLocaleString('ar-EG')}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Distribution */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories Distribution */}
        <SectionCard title="📂 التوزيع حسب التصنيف">
          <div className="space-y-3">
            {[
              { name: '📖 الأدب', count: 17, percent: 50, color: 'bg-indigo-500' },
              { name: '🕌 الدينية', count: 5, percent: 15, color: 'bg-emerald-500' },
              { name: '📜 التاريخ', count: 4, percent: 12, color: 'bg-amber-500' },
              { name: '🔬 العلوم', count: 3, percent: 9, color: 'bg-purple-500' },
              { name: '🧸 الأطفال', count: 5, percent: 15, color: 'bg-orange-500' },
            ].map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm text-slate-600">{cat.name}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all', cat.color)}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-sm font-semibold text-slate-700">{cat.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Users by Country */}
        <SectionCard title="🌍 المستخدمون حسب الدولة">
          <div className="space-y-2 text-sm">
            {[
              { flag: '🇸🇦', country: 'السعودية', count: 423 },
              { flag: '🇪🇬', country: 'مصر', count: 287 },
              { flag: '🇦🇪', country: 'الإمارات', count: 156 },
              { flag: '🇲🇦', country: 'المغرب', count: 89 },
              { flag: '🌍', country: 'أخرى', count: 288 },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span className="text-slate-700">{c.flag} {c.country}</span>
                <span className="font-semibold text-slate-900">{c.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  )
}
