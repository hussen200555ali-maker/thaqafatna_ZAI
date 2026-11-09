/**
 * ✏️ تعديل الكتاب وفصوله — /admin/books/[id]/edit
 *
 * تعرض تبويب الفصول المخصص لتحرير:
 * - عنوان الفصل
 * - نطاق صفحات البداية والنهاية في PDF
 *
 * يُستخدم للوصول السريع من صفحة فصول الكتب
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Save, Loader2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ChapterRow {
  id?: number
  title: string
  pageStart: string
  pageEnd: string
  order: number
  isPublished: boolean
}

export default function EditBookChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const [bookId, setBookId] = useState<number | null>(null)
  const [book, setBook] = useState<any>(null)
  const [chapters, setChapters] = useState<ChapterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    params.then(p => setBookId(parseInt(p.id)))
  }, [params])

  // تحميل الكتاب + الفصول
  useEffect(() => {
    if (!bookId) return
    Promise.all([
      fetch(`/api/books/${bookId}`).then(r => r.json()),
      fetch(`/api/books/${bookId}/chapters`).then(r => r.json()),
    ])
      .then(([bookData, chData]) => {
        setBook(bookData.book || null)
        const list: ChapterRow[] = (chData.chapters || []).map((c: any) => ({
          id: c.id,
          title: c.title || '',
          pageStart: c.pageStart != null ? String(c.pageStart) : '',
          pageEnd: c.pageEnd != null ? String(c.pageEnd) : '',
          order: c.order || 0,
          isPublished: c.isPublished !== false,
        }))
        setChapters(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookId])

  // تحديث خلية في جدول الفصول
  const updateRow = (idx: number, field: keyof ChapterRow, value: string | boolean) => {
    setChapters(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setSavedAt(null)
  }

  // إضافة فصل جديد
  const addChapter = () => {
    const nextOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) + 1 : 1
    setChapters(prev => [...prev, {
      title: `الفصل ${nextOrder}`,
      pageStart: '',
      pageEnd: '',
      order: nextOrder,
      isPublished: true,
    }])
    setSavedAt(null)
  }

  // حذف فصل
  const removeChapter = (idx: number) => {
    if (!confirm(`حذف الفصل "${chapters[idx].title}"؟`)) return
    setChapters(prev => prev.filter((_, i) => i !== idx))
    setSavedAt(null)
  }

  // حفظ كل الفصول (استبدال كامل)
  const handleSave = async () => {
    if (!bookId) return
    // تحقق من صحة المدخلات
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      if (!ch.title.trim()) {
        toast({ title: 'خطأ', description: `الفصل ${i + 1}: العنوان مطلوب`, variant: 'destructive' })
        return
      }
      const hasStart = ch.pageStart.trim() !== ''
      const hasEnd = ch.pageEnd.trim() !== ''
      if (hasStart !== hasEnd) {
        toast({ title: 'خطأ', description: `الفصل ${i + 1}: يجب تحديد صفحة البداية والنهاية معًا أو تركهما فارغين`, variant: 'destructive' })
        return
      }
      if (hasStart && hasEnd) {
        const s = parseInt(ch.pageStart)
        const e = parseInt(ch.pageEnd)
        if (isNaN(s) || isNaN(e) || s < 1 || e < s) {
          toast({ title: 'خطأ', description: `الفصل ${i + 1}: قيم صفحات غير صالحة`, variant: 'destructive' })
          return
        }
      }
    }
    // تحقق من عدم تداخل النطاقات
    const ranges = chapters
      .filter(ch => ch.pageStart.trim() && ch.pageEnd.trim())
      .map(ch => ({ title: ch.title, s: parseInt(ch.pageStart), e: parseInt(ch.pageEnd) }))
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i], b = ranges[j]
        if (a.s <= b.e && b.s <= a.e) {
          toast({
            title: 'تداخل في النطاقات',
            description: `«${a.title}» و «${b.title}» لهما نطاقات متداخلة`,
            variant: 'destructive',
          })
          return
        }
      }
    }
    setSaving(true)
    setError(null)
    try {
      const payload = chapters.map(ch => ({
        title: ch.title.trim(),
        pageStart: ch.pageStart.trim() ? parseInt(ch.pageStart) : null,
        pageEnd: ch.pageEnd.trim() ? parseInt(ch.pageEnd) : null,
      }))
      const res = await fetch(`/api/books/${bookId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: payload, replace: true }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      toast({
        title: '✅ تم الحفظ',
        description: `تم حفظ ${data.count || chapters.length} فصل بنجاح`,
      })
      setSavedAt(Date.now())
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400'

  if (loading) {
    return (
      <AdminLayout title="تعديل الفصول" subtitle="جاري التحميل...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AdminLayout>
    )
  }

  if (!book) {
    return (
      <AdminLayout title="تعديل الفصول">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-bold mb-2">الكتاب غير موجود</h3>
          <Link href="/admin/book-chapters">
            <Button variant="outline">→ العودة لقائمة الكتب</Button>
          </Link>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={`✏️ فصول: ${book.title}`}
      subtitle={`${chapters.length} فصل · PDF: ${book.pdfPageCount || 0} صفحة`}
      actions={
        <>
          <Link href={`/admin/books/${bookId}/versions`}>
            <Button variant="outline" className="gap-2">
              📦 الإصدارات
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                💾 حفظ الفصول
              </>
            )}
          </Button>
        </>
      }
    >
      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </Card>
      )}

      {/* تنبيه توضيحي */}
      <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800 leading-relaxed">
          📑 حدّد عنوان كل فصل ونطاق صفحاته في ملف PDF.
          عند قراءة الكتاب، سيقتصر القارئ على نطاق صفحات الفصل المحدد.
        </p>
      </Card>

      {/* جدول الفصول */}
      {chapters.length > 0 && (
        <Card className="overflow-hidden mb-4">
          {/* رأس الجدول */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3 text-xs font-bold text-slate-600 uppercase">
            <div className="w-10 text-center">#</div>
            <div className="flex-1">عنوان الفصل</div>
            <div className="w-24 text-center">من صفحة</div>
            <div className="w-6 text-center">←</div>
            <div className="w-24 text-center">إلى صفحة</div>
            <div className="w-20 text-center">عدد</div>
            <div className="w-10 text-center">🗑️</div>
          </div>
          {/* صفوف الفصول */}
          {chapters.map((ch, i) => {
            const start = parseInt(ch.pageStart) || 0
            const end = parseInt(ch.pageEnd) || 0
            const count = start > 0 && end >= start ? (end - start + 1) : 0
            const rangeError = ch.pageStart && ch.pageEnd && end < start
            return (
              <div
                key={i}
                className={cn(
                  'px-4 py-2 flex items-center gap-3 border-b border-slate-100 last:border-b-0',
                  i % 2 === 1 && 'bg-slate-50/30'
                )}
              >
                <div className="w-10 text-center">
                  <span className="inline-flex w-7 h-7 rounded-full bg-blue-100 text-blue-700 items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <Input
                    className={inputStyle}
                    value={ch.title}
                    onChange={(e) => updateRow(i, 'title', e.target.value)}
                    placeholder={`الفصل ${i + 1}`}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={1}
                    className={cn(inputStyle, rangeError && 'border-red-300 bg-red-50')}
                    value={ch.pageStart}
                    onChange={(e) => updateRow(i, 'pageStart', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="w-6 text-center text-slate-400">←</div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={1}
                    className={cn(inputStyle, rangeError && 'border-red-300 bg-red-50')}
                    value={ch.pageEnd}
                    onChange={(e) => updateRow(i, 'pageEnd', e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div className="w-20 text-center text-sm font-bold text-slate-600">
                  {count > 0 ? `${count} ص` : '—'}
                </div>
                <div className="w-10 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => removeChapter(i)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )
          })}
          {/* تذييل بالإجمالي */}
          <div className="bg-slate-50 px-4 py-3 flex items-center gap-3 border-t-2 border-slate-200">
            <div className="w-10"></div>
            <div className="flex-1 font-bold text-slate-700">الإجمالي</div>
            <div className="w-24"></div>
            <div className="w-6"></div>
            <div className="w-24"></div>
            <div className="w-20 text-center font-bold text-blue-600">
              {chapters.reduce((sum, ch) => {
                const s = parseInt(ch.pageStart) || 0
                const e = parseInt(ch.pageEnd) || 0
                return sum + (s > 0 && e >= s ? (e - s + 1) : 0)
              }, 0)} ص
            </div>
            <div className="w-10"></div>
          </div>
        </Card>
      )}

      {/* زر إضافة فصل */}
      <Button onClick={addChapter} variant="outline" className="gap-2 mb-4 w-full">
        + إضافة فصل
      </Button>

      {/* رسالة نجاح */}
      {savedAt && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-700">
            ✅ تم حفظ الفصول بنجاح. القارئ سيعرض كل فصل ضمن نطاق صفحاته المحدد.
          </p>
        </Card>
      )}
    </AdminLayout>
  )
}
