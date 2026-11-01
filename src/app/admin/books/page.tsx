/**
 * 📚 إدارة الكتب — /admin
 * قائمة الكتب مع بحث + تصفية + إجراءات
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileDown, Edit, Copy, Package, Trash2, Eye } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Toolbar, LoadingState, ErrorState, StatusBadge, EmptyState, TableRowEmpty } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
  status: string
  isPublished: boolean
  createdAt: string
  pdfUrl?: string | null
  category?: { name: string; icon: string }
  _count?: { chapters: number; reviews: number }
}

type StatusType = 'draft' | 'in_review' | 'published' | 'archived' | 'all'

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType>('all')

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

  useEffect(() => { loadBooks() }, [])

  const filtered = books.filter(b => {
    const matchesSearch = !search ||
      (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
        {/* Toolbar */}
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

        {/* Table */}
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Copy className="h-4 w-4 ml-2" />
                            نسخ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600">
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

        {/* Pagination (mock) */}
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
    </AdminLayout>
  )
}
