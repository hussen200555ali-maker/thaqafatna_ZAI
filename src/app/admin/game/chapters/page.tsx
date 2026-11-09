/**
 * 🎮 فصول اللعبة ومراحلها — /admin/game/chapters
 *
 * تعرض قائمة الفصول + المراحل + إدارة كاملة (إنشاء، تعديل، حذف)
 * تستخدم AdminLayout الموحّد الجديد
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LevelEditor } from '@/components/admin/level-editor'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface AdminLevel {
  id: number
  number: number
  title: string
  difficulty: string
  status: string
  isPublished: boolean
  reward: number
  hintCost: number
  chapter: { id: number; title: string }
  _count: { words: number }
}

interface AdminChapter {
  id: number
  title: string
  description: string
  icon: string
  color: string
  order: number
  isPublished: boolean
  _count: { levels: number }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-stone-100 text-stone-600' },
  review: { label: 'مراجعة', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'منشور', color: 'bg-green-100 text-green-700' },
  archived: { label: 'مؤرشف', color: 'bg-stone-100 text-stone-500' },
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'سهل', color: 'bg-green-100 text-green-700' },
  medium: { label: 'متوسط', color: 'bg-amber-100 text-amber-700' },
  hard: { label: 'صعب', color: 'bg-red-100 text-red-700' },
}

export default function GameChaptersPage() {
  const [chapters, setChapters] = useState<AdminChapter[]>([])
  const [levels, setLevels] = useState<AdminLevel[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchChapters = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chapters')
      const data = await response.json()
      const chs = data.chapters || []
      setChapters(chs)
      if (chs.length > 0 && !selectedChapterId) {
        setSelectedChapterId(chs[0].id)
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast({ title: 'خطأ', description: 'فشل تحميل الفصول', variant: 'destructive' })
    }
  }, [selectedChapterId, toast])

  const fetchLevels = useCallback(async () => {
    if (!selectedChapterId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/levels?chapterId=${selectedChapterId}`)
      const data = await response.json()
      setLevels(data.levels || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedChapterId])

  useEffect(() => { fetchChapters() }, [fetchChapters])
  useEffect(() => { fetchLevels() }, [fetchLevels])

  const handleCreateLevel = () => {
    setEditingLevelId(null)
    // توجيه لمحرر المراحل
    window.location.href = '/admin/game/levels?new=1'
  }

  const handleEditLevel = (id: number) => {
    window.location.href = `/admin/game/levels?id=${id}`
  }

  const handleDeleteLevel = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return
    try {
      const response = await fetch(`/api/admin/levels/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('فشل الحذف')
      toast({ title: '✅ تم الحذف', description: 'تم حذف المرحلة' })
      fetchLevels()
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    }
  }

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/levels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      })
      if (!response.ok) throw new Error('فشل التحديث')
      toast({ title: '✅ تم التحديث', description: isPublished ? 'أُخفيت المرحلة' : 'نُشرت المرحلة' })
      fetchLevels()
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    }
  }

  // محرر المراحل (يظهر عند التعديل)
  if (editingLevelId !== null && selectedChapterId !== null) {
    return (
      <LevelEditor
        levelId={editingLevelId}
        chapterId={selectedChapterId}
        onBack={() => setEditingLevelId(null)}
      />
    )
  }

  const selectedChapter = chapters.find(c => c.id === selectedChapterId)

  return (
    <AdminLayout
      title="فصول اللعبة ومراحلها"
      subtitle="إدارة فصول اللعبة ومراحلها وألغازها"
      actions={
        <>
          <Button
            onClick={() => window.location.href = '/admin/game/quality'}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >✅ مدقّق الجودة</Button>
          <Button
            onClick={() => window.location.href = '/admin/game/difficulty'}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >⚖️ موازنة الصعوبة</Button>
          <Button
            onClick={() => window.location.href = '/admin/game/levels?new=1'}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            disabled={!selectedChapterId}
          >+ مرحلة جديدة</Button>
        </>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* فصول اللعبة */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-stone-700 mb-3">الفصول</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {chapters.length === 0 ? (
              <Card className="p-8 text-center text-stone-500 flex-shrink-0 min-w-[300px]">
                لا توجد فصول بعد. يمكن إضافتها من API الإدارة.
              </Card>
            ) : (
              chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={cn(
                    'flex-shrink-0 p-4 rounded-xl border-2 transition-all min-w-[220px]',
                    selectedChapterId === chapter.id
                      ? 'bg-white border-amber-400 shadow-md'
                      : 'bg-white/60 border-transparent hover:bg-white'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{chapter.icon}</span>
                    <span className="font-bold text-stone-800">{chapter.title}</span>
                  </div>
                  <p className="text-xs text-stone-500 mb-2 line-clamp-1">{chapter.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">{chapter._count.levels} مرحلة</span>
                    {chapter.isPublished ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">منشور</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">مسودة</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* قائمة المراحل */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-700">
              المراحل{selectedChapter && ` — ${selectedChapter.title}`}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-stone-500 mt-2 text-sm">جاري التحميل...</p>
            </div>
          ) : levels.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-stone-700 mb-2">لا توجد مراحل بعد</h3>
              <p className="text-stone-500 mb-4">ابدأ بإنشاء أول مرحلة في هذا الفصل</p>
              <Button onClick={handleCreateLevel} className="bg-gradient-to-r from-amber-500 to-amber-600">
                + إنشاء مرحلة
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levels.map((level, idx) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                            {level.number}
                          </span>
                          <h3 className="font-bold text-stone-800">{level.title}</h3>
                        </div>
                        <p className="text-xs text-stone-500">
                          {level._count.words} كلمة · {level.reward} عملة
                        </p>
                      </div>
                      <Badge className={statusConfig[level.status]?.color}>
                        {statusConfig[level.status]?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={difficultyConfig[level.difficulty]?.color}>
                        {difficultyConfig[level.difficulty]?.label}
                      </Badge>
                      <span className="text-xs text-stone-500">
                        تكلفة التلميح: {level.hintCost}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLevel(level.id)}
                      >✏️ تعديل</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(level.id, level.isPublished)}
                      >{level.isPublished ? '👁️ إخفاء' : '✅ نشر'}</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteLevel(level.id)}
                      >🗑️</Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
