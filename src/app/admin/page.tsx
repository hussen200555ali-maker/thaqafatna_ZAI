/**
 * 📊 لوحة التحكم — /admin
 * تستخدم AdminLayout + shadcn/ui components
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Download, Users, Star, Plus, FileDown, UserPlus, Package } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatCard, SectionCard, LoadingState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalBooks: number
    publishedBooks: number
    totalUsers: number
    pendingReviews: number
    newMessages: number
    totalDownloads: number
    criticalLogs: number
  }
  recentActivity: Array<{
    action: string
    entityType: string
    severity: string
    userName: string
    time: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <AdminLayout title="لوحة التحكم" subtitle="نظرة عامة على المكتبة">
        <LoadingState />
      </AdminLayout>
    )
  }

  const s = data.stats

  return (
    <AdminLayout
      title="لوحة التحكم"
      subtitle="نظرة عامة على المكتبة"
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            تصدير تقرير
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
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الكتب"
          value={s.totalBooks}
          sublabel={`${s.publishedBooks} منشور`}
          icon={<BookOpen className="h-6 w-6" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          trend={{ value: '3 هذا الأسبوع', direction: 'up' }}
        />
        <StatCard
          label="إجمالي التنزيلات"
          value={s.totalDownloads.toLocaleString('ar-EG')}
          icon={<Download className="h-6 w-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '18% عن الأمس', direction: 'up' }}
        />
        <StatCard
          label="المستخدمون"
          value={s.totalUsers}
          sublabel="مسجلون"
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ value: '87 هذا الأسبوع', direction: 'up' }}
        />
        <StatCard
          label="مراجعات معلّقة"
          value={s.pendingReviews}
          sublabel="بانتظار الاعتدال"
          icon={<Star className="h-6 w-6" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          trend={{ value: '2 عن الأمس', direction: 'down' }}
        />
      </div>

      {/* Critical alert */}
      {s.criticalLogs > 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              🚨
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                {s.criticalLogs} تنبيهات حرجة في سجل التدقيق
              </p>
              <p className="text-xs text-red-700">يرجى مراجعة سجل التدقيق فورًا</p>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link href="/admin/audit-logs">عرض السجل</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity + Quick Actions */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <SectionCard
            title="النشاط الأخير"
            description="آخر الأحداث في النظام"
          >
            {data.recentActivity?.length ? (
              <div className="space-y-1">
                {data.recentActivity.slice(0, 6).map((a, i) => (
                  <ActivityItem key={i} activity={a} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">لا يوجد نشاط حديث</p>
            )}
          </SectionCard>
        </div>

        {/* Quick Actions + Pending Tasks */}
        <div className="space-y-6">
          <SectionCard title="إجراءات سريعة">
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/books/new">
                  <Plus className="h-4 w-4" />
                  إضافة كتاب جديد
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/reviews">
                  <Star className="h-4 w-4" />
                  مراجعة {s.pendingReviews} مراجعة
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/users">
                  <UserPlus className="h-4 w-4" />
                  إضافة مستخدم
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/admin/books">
                  <Package className="h-4 w-4" />
                  تصدير الكتالوج
                </Link>
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="مهام معلّقة">
            <div className="space-y-2 text-sm">
              <PendingTask label="كتب بانتظار النشر" count={3} href="/admin/books" />
              <PendingTask label="مراجعات بانتظار الاعتدال" count={s.pendingReviews} href="/admin/reviews" />
              <PendingTask label="رسائل جديدة" count={s.newMessages} href="/admin/messages" />
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  )
}

// ============== Helper Components ==============

function ActivityItem({ activity }: { activity: DashboardData['recentActivity'][0] }) {
  const severity = activity.severity as 'critical' | 'warning' | 'info'
  const iconConfig = {
    critical: { icon: '🚨', bg: 'bg-red-50', color: 'text-red-600' },
    warning: { icon: '⚠️', bg: 'bg-amber-50', color: 'text-amber-600' },
    info: { icon: '📋', bg: 'bg-slate-100', color: 'text-slate-600' },
  }
  const config = iconConfig[severity] || iconConfig.info

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-base', config.bg, config.color)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900">
          <span className="font-semibold">{activity.userName}</span>
          {' — '}
          {activity.action} على {activity.entityType}
        </p>
        <p className="text-xs text-slate-400">
          {new Date(activity.time).toLocaleString('ar-EG')}
        </p>
      </div>
      <StatusBadge status={severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info'} />
    </div>
  )
}

function PendingTask({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
    >
      <span className="text-slate-600">{label}</span>
      <span className={cn(
        'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold',
        count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400',
      )}>
        {count}
      </span>
    </Link>
  )
}
