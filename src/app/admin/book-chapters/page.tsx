/**
 * 📑 فصول الكتب — /admin/book-chapters
 * إدارة فصول الكتب ونطاقات الصفحات (PDF)
 */

'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Book {
  id: number
  title: string
  pdfUrl: string
  pdfPageCount: number
  _count: { chapters: number }
}

interface BookChapter {
  id: number
  order: number
  title: string
  pageStart: number | null
  pageEnd: number | null
  isPublished: boolean
}

export default function BookChaptersPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [chapters, setChapters] = useState<BookChapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/books?limit=100')
      .then(r => r.json())
      .then(data => setBooks(data.books || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedBookId) return
    fetch(`/api/books/${selectedBookId}/chapters`)
      .then(r => r.json())
      .then(data => setChapters(data.chapters || []))
      .catch(() => {})
  }, [selectedBookId])

  return (
    <AdminLayout title="فصول الكتب" subtitle="إدارة فصول الكتب ونطاقات صفحات PDF">
      <div className="max-w-7xl mx-auto">
        {/* قائمة الكتب */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-stone-700 mb-3">اختر كتابًا</h2>
          {loading ? (
            <div className="text-center py-8 text-stone-500">جاري التحميل...</div>
          ) : books.length === 0 ? (
            <Card className="p-8 text-center text-stone-500">
              <div className="text-4xl mb-3">📚</div>
              لا توجد كتب بعد
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`text-right p-4 rounded-xl border-2 transition-all ${
                    selectedBookId === book.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <p className="font-bold text-sm truncate">{book.title}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    {book._count.chapters} فصل · {book.pdfPageCount || 0} صفحة
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* فصول الكتاب المختار */}
        {selectedBookId && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-stone-700">
                فصول {books.find(b => b.id === selectedBookId)?.title}
              </h2>
              <Button
                onClick={() => window.location.href = `/admin/books/${selectedBookId}/edit`}
                variant="outline"
              >✏️ تعديل الفصول</Button>
            </div>
            {chapters.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">📑</div>
                <p className="font-bold mb-1">لا توجد فصول</p>
                <p className="text-xs text-stone-500">
                  اذهب لصفحة الكتاب لتحدد فصوله ونطاقات صفحاته
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {chapters.map((ch, i) => (
                  <Card key={ch.id} className="p-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold">{ch.title}</p>
                      <p className="text-xs text-stone-500">
                        {ch.pageStart && ch.pageEnd
                          ? `📄 ص.${ch.pageStart}–${ch.pageEnd} (${ch.pageEnd - ch.pageStart + 1} صفحة)`
                          : '📄 بدون نطاق صفحات'}
                      </p>
                    </div>
                    <Badge variant={ch.isPublished ? 'default' : 'secondary'}>
                      {ch.isPublished ? '✅ منشور' : '📝 مسودة'}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
