/**
 * 📚 إدارة الكتب — /admin
 * قائمة الكتب مع بحث + تصفية + إجراءات كاملة (تعديل، نسخ، حذف)
 *
 * الإجراءات:
 * - 👁️ عرض: redirect لصفحة الكتاب العامة
 * - 📦 الإصدارات: redirect لصفحة الإصدارات (مع رفع PDF)
 * - ✏️ تعديل: يفتح modal لتعديل البيانات الأساسية
 * - 📋 نسخ: ينشئ نسخة via POST /api/books
 * - 🗑️ حذف: يحذف via DELETE /api/books/[id]
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileDown, Edit, Copy, Package, Trash2, Eye, X, Save, Loader2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Toolbar, LoadingState, ErrorState, StatusBadge, EmptyState } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

interface Book {
  id: number
  title: string
  author: string
  description?: string
  status: string
  isPublished: boolean
  createdAt: string
  pdfUrl?: string | null
  difficulty?: string
  language?: string
  pages?: number
  readingTimeMin?: number
  keywords?: string
  category?: { id?: number; name: string; icon: string }
  _count?: { chapters: number; reviews: number }
}

type StatusType = 'draft' | 'in_review' | 'published' | 'archived' | 'all'

interface EditForm {
  title: string
  author: string
  description: string
  categoryId: string
  difficulty: string
  pages: number
  readingTimeMin: number
  language: string
  keywords: string
  status: string
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType>('all')

  // Modal state للتعديل
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string }>>([])

  const loadBooks = () => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/books')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setBooks(Array.isArray(d.books) ? d.books : (Array.isArray(d) ? d : []))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const loadCategories = () => {
    fetch('/api/book-categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
  }

  useEffect(() => {
    loadBooks()
    loadCategories()
  }, [])

  const filtered = books.filter(b => {
    const matchesSearch = !search ||
      (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 🗑️ حذف كتاب
  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الكتاب ${book.title}؟\n\nلا يمكن التراجع عن هذا الإجراء.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setBooks(prev => prev.filter(b => b.id !== book.id))
      alert('✅ تم حذف الكتاب بنجاح')
    } catch (e: any) {
      alert('❌ فشل الحذف: ' + e.message)
    }
  }

  // 📋 نسخ كتاب — يستخدم POST /api/books (الـ endpoint الصحيح)
  const handleCopy = async (book: Book) => {
    const newTitle = `${book.title} (نسخة)`
    const confirmed = window.confirm(
      `سيتم إنشاء نسخة من ${book.title} بعنوان ${newTitle}. هل تريد المتابعة؟`
    )
    if (!confirmed) return

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          author: book.author,
          description: book.description || '',
          categoryId: book.category?.id || 1,
          difficulty: book.difficulty || 'medium',
          status: 'draft',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      alert('✅ تم إنشاء نسخة بنجاح (كمسودة)')
      loadBooks()
    } catch (e: any) {
      alert('❌ فشل النسخ: ' + e.message)
    }
  }

  // ✏️ فتح modal التعديل
  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      categoryId: book.category?.id?.toString() || '1',
      difficulty: book.difficulty || 'medium',
      pages: book.pages || 0,
      readingTimeMin: book.readingTimeMin || 15,
      language: book.language || 'ar',
      keywords: book.keywords || '',
      status: book.status || 'draft',
    })
  }

  // 💾 حفظ التعديل
  const handleSaveEdit = async () => {
    if (!editingBook || !editForm) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          author: editForm.author,
          description: editForm.description,
          categoryId: parseInt(editForm.categoryId),
          difficulty: editForm.difficulty,
          pages: editForm.pages,
          readingTimeMin: editForm.readingTimeMin,
          language: editForm.language,
          keywords: editForm.keywords,
          status: editForm.status,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      // تحديث الكتاب في القائمة محليًا
      setBooks(prev => prev.map(b =>
        b.id === editingBook.id
          ? { ...b, ...editForm, category: categories.find(c => c.id === parseInt(editForm.categoryId)) }
          : b
      ))
      setEditingBook(null)
      setEditForm(null)
      alert('✅ تم حفظ التعديلات بنجاح')
    } catch (e: any) {
      alert('❌ فشل الحفظ: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="📚 إدارة الكتب"
      subtitle={`${books.length} كتاب في المكتبة`}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/books/new">
              <Plus className="h-4 w-4" />
              كتاب جديد
            </Link>
          </Button>
        </>
      }
    >
      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <Toolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="🔍 ابحث بالعنوان أو المؤلف..."
            filters={
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusType)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="in_review">قيد المراجعة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadBooks} />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="📭"
              title="لا توجد كتب مطابقة"
              description={search || statusFilter !== 'all'
                ? 'جرّب تعديل معايير البحث أو التصفية'
                : 'ابدأ بإضافة أول كتاب إلى المكتبة'}
              action={
                <Button asChild className="gap-2">
                  <Link href="/admin/books/new">
                    <Plus className="h-4 w-4" />
                    أضف كتابًا
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>الكتاب</TableHead>
                <TableHead>المؤلف</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">الفصول</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((book, i) => (
                <TableRow key={book.id} className="hover:bg-slate-50">
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{book.title}</div>
                        {book.pdfUrl && (
                          <Badge variant="outline" className="mt-1 text-xs">PDF</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{book.author}</TableCell>
                  <TableCell>
                    {book.category ? (
                      <span className="text-sm text-slate-600">
                        {book.category.icon} {book.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={book.status as any} />
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {book._count?.chapters ?? 0}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {new Date(book.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="إجراءات إدارية">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/library/${book.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 ml-2" />
                              عرض
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/books/${book.id}/versions`} className="cursor-pointer">
                              <Package className="h-4 w-4 ml-2" />
                              الإصدارات
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleEdit(book)}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل البيانات
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleCopy(book)}
                          >
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600"
                            onClick={() => handleDelete(book)}
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

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">
              عرض {filtered.length} من {books.length} كتاب
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled>السابق</Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" size="sm" disabled>التالي</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal التعديل */}
      {editingBook && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setEditingBook(null); setEditForm(null) }}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                ✏️ تعديل الكتاب: {editingBook.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setEditingBook(null); setEditForm(null) }}
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">العنوان *</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">المؤلف *</Label>
                <Input
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium">الوصف</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">التصنيف</Label>
                <Select
                  value={editForm.categoryId}
                  onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">الصعوبة</Label>
                <Select
                  value={editForm.difficulty}
                  onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">عدد الصفحات</Label>
                <Input
                  type="number"
                  value={editForm.pages}
                  onChange={(e) => setEditForm({ ...editForm, pages: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">وقت القراءة (دقيقة)</Label>
                <Input
                  type="number"
                  value={editForm.readingTimeMin}
                  onChange={(e) => setEditForm({ ...editForm, readingTimeMin: parseInt(e.target.value) || 15 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">اللغة</Label>
                <Select
                  value={editForm.language}
                  onValueChange={(v) => setEditForm({ ...editForm, language: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">الإنجليزية</SelectItem>
                    <SelectItem value="fr">الفرنسية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">الحالة</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 مسودة</SelectItem>
                    <SelectItem value="published">✅ منشور</SelectItem>
                    <SelectItem value="archived">📦 مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium">الكلمات المفتاحية (مفصولة بفواصل)</Label>
                <Input
                  value={editForm.keywords}
                  onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                  className="mt-1"
                  placeholder="تاريخ, فلسفة, أدب"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setEditingBook(null); setEditForm(null) }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
