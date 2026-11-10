/**
 * 🎮 محرر المراحل المرئي — /admin/game/levels
 *
 * محرر كامل لشبكة الكلمات المتقاطعة:
 * - إنشاء مرحلة جديدة (يختار فصلها)
 * - تعديل مرحلة موجودة (?id=N)
 * - شريط أدوات: إضافة/حذف كلمات، تغيير الاتجاه، معاينة
 * - حفظ تلقائي
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LevelEditor } from '@/components/admin/level-editor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/admin/admin-primitives'
import Link from 'next/link'

function LevelsPageContent() {
  const searchParams = useSearchParams()
  const levelIdParam = searchParams.get('id')
  const isNew = searchParams.get('new') === '1'
  const chapterIdParam = searchParams.get('chapterId')

  const [levelId, setLevelId] = useState<number | null>(null)
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (levelIdParam) {
      setLevelId(parseInt(levelIdParam))
      setLoading(false)
    } else if (isNew) {
      // مرحلة جديدة — نحتاج chapterId
      if (chapterIdParam) {
        setChapterId(parseInt(chapterIdParam))
        setLoading(false)
      } else {
        // محاولة قراءة آخر فصل من API
        fetch('/api/admin/chapters')
          .then(r => r.json())
          .then(data => {
            const chapters = data.chapters || []
            if (chapters.length > 0) {
              setChapterId(chapters[0].id)
            }
            setLoading(false)
          })
          .catch(() => setLoading(false))
      }
    } else {
      setLoading(false)
    }
  }, [levelIdParam, isNew, chapterIdParam])

  if (loading) {
    return (
      <AdminLayout title="محرر المراحل" subtitle="جاري التحميل...">
        <LoadingState />
      </AdminLayout>
    )
  }

  // ===== عرض محرر مرحلة موجودة =====
  if (levelId !== null) {
    return (
      <LevelEditorWrapper levelId={levelId} chapterId={chapterId} />
    )
  }

  // ===== عرض مرحلة جديدة =====
  if (isNew) {
    if (chapterId === null) {
      return (
        <AdminLayout title="محرر المراحل" subtitle="مرحلة جديدة">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-bold mb-2">لا توجد فصول لعبة بعد</h3>
            <p className="text-slate-500 mb-4">يجب إنشاء فصل لعبة أولًا قبل إضافة مراحل</p>
            <Link href="/admin/game/chapters">
              <Button>→ إنشاء فصل لعبة</Button>
            </Link>
          </Card>
        </AdminLayout>
      )
    }
    return (
      <LevelEditorWrapper levelId={null} chapterId={chapterId} isNew />
    )
  }

  // ===== الصفحة الافتراضية: قائمة المراحل للاختيار =====
  return <LevelsListPage />
}

// ===== Wrapper حول LevelEditor =====
function LevelEditorWrapper({
  levelId,
  chapterId,
  isNew = false,
}: {
  levelId: number | null
  chapterId: number | null
  isNew?: boolean
}) {
  return (
    <LevelEditor
      levelId={levelId}
      chapterId={chapterId || 0}
      onBack={() => window.history.back()}
    />
  )
}

// ===== قائمة المراحل للاختيار =====
function LevelsListPage() {
  return (
    <AdminLayout
      title="محرر المراحل"
      subtitle="اختر مرحلة للتعديل أو أنشئ مرحلة جديدة"
      actions={
        <Link href="/admin/game/levels?new=1">
          <Button className="gap-2">
            <span>+</span>
            مرحلة جديدة
          </Button>
        </Link>
      }
    >
      <LevelsBrowser />
    </AdminLayout>
  )
}

import { useState as useState2, useEffect as useEffect2 } from 'react'

function LevelsBrowser() {
  const [chapters, setChapters] = useState2<any[]>([])
  const [selectedChapter, setSelectedChapter] = useState2<number | null>(null)
  const [levels, setLevels] = useState2<any[]>([])
  const [loading, setLoading] = useState2(true)

  useEffect2(() => {
    fetch('/api/admin/chapters')
      .then(r => r.json())
      .then(data => {
        const chs = data.chapters || []
        setChapters(chs)
        if (chs.length > 0) setSelectedChapter(chs[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect2(() => {
    if (!selectedChapter) return
    fetch(`/api/admin/levels?chapterId=${selectedChapter}`)
      .then(r => r.json())
      .then(data => setLevels(data.levels || []))
      .catch(() => setLevels([]))
  }, [selectedChapter])

  if (loading) return <LoadingState />

  if (chapters.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">📂</div>
        <h3 className="text-lg font-bold mb-2">لا توجد فصول لعبة</h3>
        <p className="text-slate-500 mb-4">أنشئ فصل لعبة أولًا</p>
        <Link href="/admin/game/chapters">
          <Button>→ إنشاء فصل لعبة</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div>
      {/* اختيار الفصل */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-3">اختر الفصل</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapter(ch.id)}
              className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all min-w-[220px] ${
                selectedChapter === ch.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{ch.icon}</span>
                <span className="font-bold text-slate-800">{ch.title}</span>
              </div>
              <p className="text-xs text-slate-500">{ch._count?.levels || 0} مرحلة</p>
            </button>
          ))}
        </div>
      </div>

      {/* قائمة المراحل */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-700">
          مراحل {chapters.find(c => c.id === selectedChapter)?.title}
        </h2>
        {selectedChapter && (
          <Link href={`/admin/game/levels?new=1&chapterId=${selectedChapter}`}>
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600">
              <span>+</span>
              مرحلة جديدة
            </Button>
          </Link>
        )}
      </div>

      {levels.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-bold mb-2">لا توجد مراحل بعد</h3>
          <p className="text-slate-500 mb-4">ابدأ بإنشاء أول مرحلة</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => (
            <Card key={level.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                  {level.number}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{level.title}</p>
                  <p className="text-xs text-slate-500">
                    {level._count?.words || 0} كلمة · {level.reward} عملة
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  level.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  level.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {level.difficulty === 'easy' ? 'سهل' : level.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  level.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {level.isPublished ? 'منشور' : 'مسودة'}
                </span>
              </div>
              <Link href={`/admin/game/levels?id=${level.id}&chapterId=${selectedChapter}`}>
                <Button className="w-full gap-2">
                  ✏️ تحرير المرحلة
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GameLevelsPage() {
  return (
    <Suspense fallback={<AdminLayout title="محرر المراحل"><LoadingState /></AdminLayout>}>
      <LevelsPageContent />
    </Suspense>
  )
}
