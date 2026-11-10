/**
 * ✍️ المؤلفون — /admin/authors
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { UserPlus, FileDown, Edit, Eye, Search } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Toolbar, LoadingState, ErrorState, EmptyState } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface Book {
  id: number
  title: string
  author: string
  views: number
  downloads: number
  ratingAvg: number
  createdAt: string
}

interface AuthorStat {
  name: string
  booksCount: number
  totalViews: number
  totalDownloads: number
  avgRating: number
  firstAdded: string
}

function avatarColor(name: string) {
  const colors = [
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-500',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export default function AdminAuthorsPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/books?limit=200')
      .then(r => r.json())
      .then(d => setBooks(d.books || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Aggregate by author
  const authors = useMemo<AuthorStat[]>(() => {
    const map = new Map<string, AuthorStat>()
    for (const b of books) {
      if (!b.author) continue
      const existing = map.get(b.author)
      if (existing) {
        existing.booksCount++
        existing.totalViews += b.views || 0
        existing.totalDownloads += b.downloads || 0
        existing.avgRating = (existing.avgRating * (existing.booksCount - 1) + (b.ratingAvg || 0)) / existing.booksCount
        if (new Date(b.createdAt) < new Date(existing.firstAdded)) {
          existing.firstAdded = b.createdAt
        }
      } else {
        map.set(b.author, {
          name: b.author,
          booksCount: 1,
          totalViews: b.views || 0,
          totalDownloads: b.downloads || 0,
          avgRating: b.ratingAvg || 0,
          firstAdded: b.createdAt,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.booksCount - a.booksCount)
  }, [books])

  const filtered = authors.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout
      title="✍️ المؤلفون"
      subtitle={`${authors.length} مؤلف`}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            استيراد
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            إضافة مؤلف
          </Button>
        </>
      }
    >
      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <Toolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="🔍 ابحث عن مؤلف..."
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="✍️" title="لا يوجد مؤلفون" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>المؤلف</TableHead>
                <TableHead className="text-center">عدد الكتب</TableHead>
                <TableHead className="text-center">إجمالي المشاهدات</TableHead>
                <TableHead className="text-center">إجمالي التنزيلات</TableHead>
                <TableHead className="text-center">متوسط التقييم</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((author) => (
                <TableRow key={author.name} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`bg-gradient-to-br ${avatarColor(author.name)} text-white text-xs font-bold`}>
                          {author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">{author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-600">{author.booksCount}</TableCell>
                  <TableCell className="text-center text-slate-600">{author.totalViews.toLocaleString('ar-EG')}</TableCell>
                  <TableCell className="text-center text-emerald-600 font-medium">{author.totalDownloads.toLocaleString('ar-EG')}</TableCell>
                  <TableCell className="text-center text-amber-600 font-medium">⭐ {author.avgRating.toFixed(1)}</TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {new Date(author.firstAdded).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="عرض" aria-label="عرض المؤلف">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="تعديل" aria-label="تعديل المؤلف">
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </Button>
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
