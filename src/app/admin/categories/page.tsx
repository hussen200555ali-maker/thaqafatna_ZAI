/**
 * 📂 التصنيفات — /admin/categories
 * إدارة كاملة: إضافة، تعديل، حذف، نشر/إخفاء
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MoreHorizontal, X, Save, Eye, EyeOff } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: number
  name: string
  icon: string
  color: string
  slug: string
  description: string
  order: number
  isPublished: boolean
  booksCount?: number
  _count?: { books: number }
}

interface CategoryForm {
  name: string
  slug: string
  icon: string
  color: string
  description: string
  order: number
  isPublished: boolean
}

const emptyForm: CategoryForm = {
  name: '', slug: '', icon: '📚', color: '#3b82f6',
  description: '', order: 0, isPublished: true,
}

const emojiOptions = ['📚', '📖', '🕌', '📜', '🔬', '🌍', '🎨', '🧸', '🌱', '⚡', '🎯', '💎', '🏛️', '🎭']
const colorOptions = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    setError(null)
    fetch('/api/book-categories')
      .then(r => r.json())
      .then(d => setCats(d.categories || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ===== فتح Modal للإضافة =====
  const handleAdd = () => {
    setForm({ ...emptyForm, order: cats.length })
    setEditingId(null)
    setShowModal(true)
  }

  // ===== فتح Modal للتعديل =====
  const handleEdit = (c: Category) => {
    setForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon || '📚',
      color: c.color || '#3b82f6',
      description: c.description || '',
      order: c.order || 0,
      isPublished: c.isPublished,
    })
    setEditingId(c.id)
    setShowModal(true)
  }

  // ===== توليد slug تلقائيًا من الاسم =====
  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: editingId === null ? name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '') : f.slug,
    }))
  }

  // ===== حفظ (إضافة/تعديل) =====
  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'خطأ', description: 'الاسم والـ Slug مطلوبان', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = editingId !== null
        ? `/api/book-categories/${editingId}`
        : '/api/book-categories'
      const method = editingId !== null ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

      toast({
        title: '✅ تم الحفظ',
        description: editingId !== null ? 'تم تحديث التصنيف' : 'تم إنشاء التصنيف',
      })
      setShowModal(false)
      load()
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ===== حذف =====
  const handleDelete = async (c: Category) => {
    const booksCount = c._count?.books ?? c.booksCount ?? 0
    const msg = booksCount > 0
      ? `⚠️ هذا التصنيف يحتوي على ${booksCount} كتاب. يجب نقلها لتصنيف آخر قبل الحذف.\n\nهل تريد المتابعة؟`
      : `هل أنت متأكد من حذف التصنيف "${c.name}"؟`
    if (!confirm(msg)) return

    try {
      const res = await fetch(`/api/book-categories/${c.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast({ title: '✅ تم الحذف', description: `حُذف التصنيف "${c.name}"` })
      load()
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    }
  }

  // ===== تبديل النشر =====
  const handleTogglePublish = async (c: Category) => {
    try {
      const res = await fetch(`/api/book-categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !c.isPublished }),
      })
      if (!res.ok) throw new Error('فشل التحديث')
      toast({
        title: '✅ تم التحديث',
        description: c.isPublished ? 'أُخفي التصنيف' : 'نُشر التصنيف',
      })
      load()
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
    }
  }

  const inputStyle = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400'

  return (
    <AdminLayout
      title="📂 التصنيفات"
      subtitle={`${cats.length} تصنيفات`}
      actions={
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          تصنيف جديد
        </Button>
      }
    >
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : cats.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="📂"
              title="لا توجد تصنيفات بعد"
              description="ابدأ بإنشاء أول تصنيف للكتب"
              action={
                <Button onClick={handleAdd} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء تصنيف
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead className="w-16 text-center">الأيقونة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الـ Slug</TableHead>
                <TableHead>اللون</TableHead>
                <TableHead className="text-center">عدد الكتب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c, i) => (
                <TableRow key={c.id} className="hover:bg-slate-50">
                  <TableCell className="text-center text-slate-400">{i + 1}</TableCell>
                  <TableCell className="text-center text-2xl">{c.icon}</TableCell>
                  <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {c.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded border border-slate-200"
                      style={{ background: c.color || '#6366f1' }}
                    />
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {c._count?.books ?? c.booksCount ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.isPublished ? 'published' : 'archived'} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="إجراءات">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(c)}>
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleTogglePublish(c)}>
                            {c.isPublished ? (
                              <>
                                <EyeOff className="h-4 w-4 ml-2" />
                                إخفاء
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 ml-2" />
                                نشر
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-700"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ===== Modal: إضافة/تعديل ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editingId !== null ? '✏️ تعديل تصنيف' : '➕ تصنيف جديد'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* الاسم */}
              <div>
                <Label className="text-xs">الاسم *</Label>
                <Input
                  className={inputStyle}
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: الأدب العربي"
                />
              </div>

              {/* Slug */}
              <div>
                <Label className="text-xs">الـ Slug (رابط فريد) *</Label>
                <Input
                  className={inputStyle}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="adab-arabi"
                  dir="ltr"
                />
              </div>

              {/* الأيقونة */}
              <div>
                <Label className="text-xs">الأيقونة</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, icon: emoji })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                        form.icon === emoji
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* اللون */}
              <div>
                <Label className="text-xs">اللون</Label>
                <div className="flex flex-wrap gap-2 mt-1 items-center">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        form.color === color ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* الوصف */}
              <div>
                <Label className="text-xs">الوصف</Label>
                <Textarea
                  className={inputStyle}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر للتصنيف..."
                  rows={2}
                />
              </div>

              {/* الترتيب */}
              <div>
                <Label className="text-xs">الترتيب</Label>
                <Input
                  type="number"
                  className={inputStyle}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* منشور */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublished" className="text-sm cursor-pointer">
                  منشور (يظهر للقرّاء)
                </Label>
              </div>
            </div>

            {/* أزرار */}
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingId !== null ? '💾 حفظ التعديلات' : '➕ إنشاء التصنيف'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                إلغاء
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}
