/**
 * ✅ مدقّق الجودة الآلي — /admin/game/quality
 * فحص آلي لجودة الأسئلة وفق 10 معايير تربوية
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'
import { LoadingState } from '@/components/admin/admin-primitives'
import { cn } from '@/lib/utils'

export default function QualityCheckPage() {
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [levels, setLevels] = useState<any[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [levelData, setLevelData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/chapters')
      .then(r => r.json())
      .then(data => {
        setChapters(data.chapters || [])
        if (data.chapters?.length > 0) setSelectedChapterId(data.chapters[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedChapterId) return
    setLoading(true)
    fetch(`/api/admin/levels?chapterId=${selectedChapterId}`)
      .then(r => r.json())
      .then(data => {
        setLevels(data.levels || [])
        if (data.levels?.length > 0) setSelectedLevelId(data.levels[0].id)
      })
      .finally(() => setLoading(false))
  }, [selectedChapterId])

  useEffect(() => {
    if (!selectedLevelId) return
    fetch(`/api/levels?id=${selectedLevelId}`)
      .then(r => r.json())
      .then(data => setLevelData(data.level))
  }, [selectedLevelId])

  const qualityReport = useMemo(() => {
    if (!levelData?.words) return null
    try {
      const { validateLevelQuestions } = require('@/lib/question-validator')
      return validateLevelQuestions(levelData.words, levelData.difficulty) as any
    } catch {
      return null
    }
  }, [levelData])

  return (
    <AdminLayout
      title="✅ مدقّق الجودة"
      subtitle="فحص آلي لجودة الأسئلة وفق 10 معايير تربوية"
    >
      {/* اختيار الفصل والمرحلة */}
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الفصل</label>
            <select
              value={selectedChapterId ?? ''}
              onChange={(e) => setSelectedChapterId(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المرحلة</label>
            <select
              value={selectedLevelId ?? ''}
              onChange={(e) => setSelectedLevelId(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>
                  {l.number}. {l.title} ({l.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading && <LoadingState />}

      {!loading && !qualityReport && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-slate-500">اختر مرحلة لعرض تقرير الجودة</p>
        </Card>
      )}

      {qualityReport && (
        <div className="space-y-4">
          {/* التقرير الإجمالي */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">تقرير الجودة الإجمالي</h2>
                <p className="text-sm text-slate-500">{qualityReport.questionReports.length} سؤال تم تحليله</p>
              </div>
              <div className="text-center">
                <div className={cn(
                  'text-5xl font-bold',
                  qualityReport.severity === 'good' ? 'text-green-600'
                    : qualityReport.severity === 'warning' ? 'text-amber-600' : 'text-red-600'
                )}>
                  {qualityReport.totalScore}%
                </div>
                <div className={cn(
                  'text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block',
                  qualityReport.severity === 'good' ? 'bg-green-100 text-green-700'
                    : qualityReport.severity === 'warning' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                )}>
                  {qualityReport.severity === 'good' ? '✅ جودة ممتازة'
                    : qualityReport.severity === 'warning' ? '⚠️ يحتاج تحسين' : '❌ جودة منخفضة'}
                </div>
              </div>
            </div>

            {qualityReport.topIssues?.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-slate-700 mb-2">⚠️ أبرز المشاكل</h3>
                <ul className="space-y-1">
                  {qualityReport.topIssues.map((issue: any, i: number) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center justify-between">
                      <span>• {issue.issue}</span>
                      <span className="font-bold text-red-600">{issue.count}×</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {qualityReport.recommendations?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-bold text-blue-700 mb-2">💡 توصيات ذكية</h3>
                <ul className="space-y-1">
                  {qualityReport.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-blue-900">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* تفاصيل كل سؤال */}
          <h3 className="text-lg font-bold text-slate-800 mt-6">تفاصيل كل سؤال</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qualityReport.questionReports.map((q: any, i: number) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-1">سؤال #{i + 1}</div>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {levelData.words[i]?.clue || '—'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">✓ الإجابة: {levelData.words[i]?.text || '—'}</p>
                  </div>
                  <div className="text-center mr-2">
                    <div className={cn(
                      'text-2xl font-bold',
                      q.severity === 'good' ? 'text-green-600'
                        : q.severity === 'warning' ? 'text-amber-600' : 'text-red-600'
                    )}>{q.score}%</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.checks.filter((c: any) => !c.passed).slice(0, 3).map((c: any) => (
                    <span key={c.id} className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full',
                      c.severity === 'critical' ? 'bg-red-100 text-red-700'
                        : c.severity === 'warning' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    )}>{c.title}</span>
                  ))}
                  {q.checks.filter((c: any) => c.passed).length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      ✓ {q.checks.filter((c: any) => c.passed).length} معايير ناجحة
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
