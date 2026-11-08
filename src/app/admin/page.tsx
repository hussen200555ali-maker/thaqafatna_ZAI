/**
 * 📊 لوحة التحكم الموحّدة — /admin
 * إحصائيات شاملة: المكتبة + اللعبة + المجتمع
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Download, Users, Star, Plus, FileDown, UserPlus, Package, Gamepad2, Grid3x3, ShieldCheck, Library } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatCard, SectionCard, LoadingState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

interface GameStats {
  chaptersCount: number
  levelsCount: number
  publishedLevels: number
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [gameStats, setGameStats] = useState<GameStats>({ chaptersCount: 0, levelsCount: 0, publishedLevels: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dashboard').then(r => r.json()).catch(() => null),
      fetch('/api/admin/chapters').then(r => r.json()).catch(() => ({ chapters: [] })),
    ])
      .then(([dashData, chaptersData]) => {
        if (dashData && dashData.stats) setData(dashData)
        else {
          // Fallback: بيانات افتراضية لو فشل الـ API (مثلاً بدون تسجيل دخول)
          setData({
            stats: {
              totalBooks: 0, publishedBooks: 0, totalUsers: 0,
              pendingReviews: 0, newMessages: 0, totalDownloads: 0, criticalLogs: 0,
            },
            recentActivity: [],
          })
        }
        const chapters = chaptersData?.chapters || []
        const totalLevels = chapters.reduce((s: number, c: any) => s + (c._count?.levels || 0), 0)
        setGameStats({
          chaptersCount: chapters.length,
          levelsCount: totalLevels,
          publishedLevels: chapters.filter((c: any) => c.isPublished).length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <AdminLayout title="لوحة التحكم" subtitle="نظرة عامة شاملة">
        <LoadingState />
      </AdminLayout>
    )
  }

  const s = data.stats

  return (
    <AdminLayout
      title="لوحة التحكم"
      subtitle="نظرة عامة شاملة — مكتبة + لعبة + مجتمع"
      actions={
        <>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/game/chapters">
              <Gamepad2 className="h-4 w-4" />
              إدارة اللعبة
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/library">
              <Library className="h-4 w-4" />
              إدارة المكتبة
            </Link>
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
      {/* KPIs — 4 بطاقات شاملة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* المكتبة */}
        <StatCard
          label="كتب منشورة"
          value={s.publishedBooks}
          sublabel={`من أصل ${s.totalBooks}`}
          icon={<BookOpen className="h-6 w-6" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={{ value: '3 هذا الأسبوع', direction: 'up' }}
        />
        {/* اللعبة */}
        <StatCard
          label="فصول اللعبة"
          value={gameStats.chaptersCount}
          sublabel={`${gameStats.levelsCount} مرحلة`}
          icon={<Gamepad2 className="h-6 w-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ value: `${gameStats.publishedLevels} منشورة`, direction: 'up' }}
        />
        {/* المجتمع */}
        <StatCard
          label="اللاعبون والقرّاء"
          value={s.totalUsers}
          sublabel="مسجلون"
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: '87 هذا الأسبوع', direction: 'up' }}
        />
        {/* مهام معلّقة */}
        <StatCard
          label="مهام معلّقة"
          value={s.pendingReviews + s.newMessages}
          sublabel={`${s.pendingReviews} مراجعة + ${s.newMessages} رسالة`}
          icon={<Star className="h-6 w-6" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          trend={{ value: 'تحتاج إجراء', direction: 'down' }}
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

      {/* Quick Links لكل قسم */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* المكتبة */}
        <Link href="/admin/library" className="block">
          <Card className="p-5 hover:shadow-md transition-all border-r-4 border-r-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Library className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">📚 قسم المكتبة</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">إدارة الكتب والتصنيفات وفصول الكتب</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-blue-600 font-bold">{s.publishedBooks} كتاب منشور</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{s.totalDownloads} تنزيل</span>
            </div>
          </Card>
        </Link>

        {/* اللعبة */}
        <Link href="/admin/game/chapters" className="block">
          <Card className="p-5 hover:shadow-md transition-all border-r-4 border-r-amber-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">🎮 قسم اللعبة</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">فصول اللعبة ومراحلها وألغازها</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-amber-600 font-bold">{gameStats.chaptersCount} فصل</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{gameStats.levelsCount} مرحلة</span>
            </div>
          </Card>
        </Link>

        {/* المجتمع */}
        <Link href="/admin/users" className="block">
          <Card className="p-5 hover:shadow-md transition-all border-r-4 border-r-emerald-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">👥 قسم المجتمع</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">اللاعبون والقرّاء والمراجعات والرسائل</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-600 font-bold">{s.totalUsers} مستخدم</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{s.pendingReviews} مراجعة معلّقة</span>
            </div>
          </Card>
        </Link>
      </div>

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

        {/* Pending Tasks */}
        <SectionCard title="مهام معلّقة">
          <div className="space-y-2 text-sm">
            <PendingTask label="كتب بانتظار النشر" count={3} href="/admin/books" />
            <PendingTask label="مراحل لعبة مسودة" count={Math.max(0, gameStats.levelsCount - gameStats.publishedLevels)} href="/admin/game/chapters" />
            <PendingTask label="مراجعات بانتظار الاعتدال" count={s.pendingReviews} href="/admin/reviews" />
            <PendingTask label="رسائل جديدة" count={s.newMessages} href="/admin/messages" />
          </div>
        </SectionCard>
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
