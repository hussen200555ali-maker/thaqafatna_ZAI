/**
 * ⚖️ موازنة الصعوبة — /admin/game/difficulty
 * تحليل توزيع الصعوبة في كل فصل + توصيات ذكية
 */

'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'
import { LoadingState } from '@/components/admin/admin-primitives'
import { cn } from '@/lib/utils'

function DifficultyBar({
  label, actual, recommended, color,
}: {
  label: string; actual: number; recommended: number; color: string;
}) {
  const variance = actual - recommended
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className={cn(
          'font-bold',
          Math.abs(variance) <= 10 ? 'text-green-600'
            : Math.abs(variance) <= 20 ? 'text-amber-600' : 'text-red-600'
        )}>{actual}% (الموصى: {recommended}%)</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${actual}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-slate-400 opacity-60" style={{ right: `${recommended}%` }} />
      </div>
    </div>
  )
}

export default function DifficultyBalancePage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/difficulty-check')
      .then(r => r.json())
      .then(data => {
        if (data.report) setReport(data.report)
        else if (data.error) setError(data.error)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout title="⚖️ موازنة الصعوبة">
        <LoadingState />
      </AdminLayout>
    )
  }

  if (!report) {
    return (
      <AdminLayout
        title="⚖️ موازنة الصعوبة"
        subtitle="تحليل توزيع الصعوبة في كل فصل"
      >
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-bold mb-2">لا توجد فصول منشورة</h3>
          <p className="text-slate-500">
            {error ? `الخطأ: ${error}` : 'أنشئ فصول لعبة ومراحل منشورة لتحليلها'}
          </p>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="⚖️ موازنة الصعوبة"
      subtitle="تحليل توزيع الصعوبة في كل فصل + توصيات ذكية"
    >
      {/* الإحصائيات العامة */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">متوسط الصحة</div>
            <div className={cn(
              'text-3xl font-bold',
              report.overallStatus === 'balanced' ? 'text-green-600'
                : report.overallStatus === 'needs-attention' ? 'text-amber-600' : 'text-red-600'
            )}>{report.averageHealthScore}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">فصول متوازنة</div>
            <div className="text-3xl font-bold text-green-600">{report.healthyChapters}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">تحتاج انتباه</div>
            <div className="text-3xl font-bold text-amber-600">{report.warningChapters}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">حرجة</div>
            <div className="text-3xl font-bold text-red-600">{report.criticalChapters}</div>
          </div>
        </div>
      </Card>

      {/* أهم التوصيات */}
      {report.topRecommendations?.length > 0 && (
        <Card className="p-5 mb-6 bg-purple-50 border-purple-200">
          <h3 className="text-base font-bold text-purple-700 mb-3">💡 أهم التوصيات</h3>
          <ul className="space-y-2">
            {report.topRecommendations.map((rec: string, i: number) => (
              <li key={i} className="text-sm text-purple-900">• {rec}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* تفاصيل كل فصل */}
      <h3 className="text-lg font-bold text-slate-800 mb-3">تفاصيل كل فصل</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.chapterReports?.map((ch: any) => (
          <Card key={ch.chapterId} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ch.chapterIcon}</span>
                <div>
                  <h4 className="font-bold text-slate-800">{ch.chapterTitle}</h4>
                  <p className="text-xs text-slate-500">{ch.totalLevels} مرحلة</p>
                </div>
              </div>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-bold',
                ch.status === 'balanced' ? 'bg-green-100 text-green-700'
                  : ch.status === 'needs-attention' ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              )}>{ch.healthScore}%</div>
            </div>

            <div className="space-y-2 mb-3">
              <DifficultyBar label="سهل" actual={ch.actual.easy} recommended={ch.recommended.easy} color="bg-green-500" />
              <DifficultyBar label="متوسط" actual={ch.actual.medium} recommended={ch.recommended.medium} color="bg-amber-500" />
              <DifficultyBar label="صعب" actual={ch.actual.hard} recommended={ch.recommended.hard} color="bg-red-500" />
            </div>

            {ch.issues?.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">⚠️ المشاكل:</p>
                <ul className="space-y-1">
                  {ch.issues.slice(0, 3).map((issue: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {(!report.chapterReports || report.chapterReports.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          لا توجد فصول لتحليلها بعد
        </Card>
      )}
    </AdminLayout>
  )
}
