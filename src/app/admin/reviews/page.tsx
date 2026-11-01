/**
 * 💬 طابور الاعتدال — /admin/reviews
 */

'use client'

import { useState, useEffect } from 'react'
import { Check, X, Ban, AlertTriangle } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LoadingState, ErrorState, EmptyState, SectionCard } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Review {
  id: number
  rating: number
  content: string
  status: string
  createdAt: string
  user: { id: string; name: string | null }
  book?: { id: number; title: string }
}

type Tab = 'pending' | 'approved' | 'rejected' | 'all'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pending')

  useEffect(() => {
    fetch('/api/admin/reviews')
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d.reviews) ? d.reviews : (Array.isArray(d) ? d : [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = reviews.filter(r => tab === 'all' || r.status === tab)
  const counts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    all: reviews.length,
  }

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'pending', label: 'بانتظار', count: counts.pending },
    { key: 'approved', label: 'موافق عليها', count: counts.approved },
    { key: 'rejected', label: 'مرفوضة', count: counts.rejected },
    { key: 'all', label: 'الكل', count: counts.all },
  ]

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
    ))
    // API call would go here
  }

  return (
    <AdminLayout
      title="💬 طابور الاعتدال"
      subtitle={`${counts.pending} مراجعات بانتظار الاعتدال`}
    >
      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
            className="gap-2"
          >
            {t.label}
            <Badge variant={tab === t.key ? 'secondary' : 'outline'} className="text-xs">
              {t.count}
            </Badge>
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💬"
          title={`لا توجد مراجعات ${tab === 'pending' ? 'بانتظار الاعتدال' : tab === 'approved' ? 'موافق عليها' : tab === 'rejected' ? 'مرفوضة' : ''}`}
          description="ستظهر المراجعات الجديدة هنا فور إضافتها من القرّاء"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => {
            const initial = (review.user?.name || '?').charAt(0).toUpperCase()
            const isPending = review.status === 'pending'
            // حماية من undefined/null — بعض المراجعات قد لا تحتوي على محتوى
            const content = review.content || ''
            const isSuspicious = content.includes('http') || content.includes('www.')
            return (
              <Card key={review.id} className={cn(
                'overflow-hidden transition-all',
                isPending && 'border-r-4 border-r-amber-400',
                isSuspicious && isPending && 'border-r-red-400',
              )}>
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900">
                          {review.user?.name || 'مجهول'}
                          {review.book && (
                            <span className="text-slate-400"> على «{review.book.title}»</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleString('ar-EG')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuspicious && isPending && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          مشبوهة
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        ⭐ {review.rating}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {content || <span className="text-slate-400 italic">(لا يوجد محتوى)</span>}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(review.id, 'approve')}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" />
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(review.id, 'reject')}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        رفض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        حظر المستخدم
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
