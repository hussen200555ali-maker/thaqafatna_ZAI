/**
 * 📂 التصنيفات — /admin/categories
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Category {
  id: number
  name: string
  icon: string
  color: string
  slug: string
  isPublished: boolean
  _count?: { books: number }
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/book-categories')
      .then(r => r.json())
      .then(d => setCats(d.categories || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <AdminLayout
      title="📂 التصنيفات"
      subtitle={`${cats.length} تصنيفات`}
      actions={
        <Button className="gap-2">
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
            <EmptyState icon="📂" title="لا توجد تصنيفات بعد" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-16 text-center">الترتيب</TableHead>
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
                      className="h-6 w-6 rounded"
                      style={{ background: c.color || '#6366f1' }}
                    />
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {c._count?.books ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.isPublished ? 'published' : 'archived'} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
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
      </Card>
    </AdminLayout>
  )
}
