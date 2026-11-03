/**
 * 🎛️ AdminLayout — تخطيط مشترك لكل صفحات الإدارة
 *
 * المميزات:
 * - Sidebar داكن ثابت على اليمين (RTL) مع navigation كامل
 * - Topbar علوي مع breadcrumb + search + user menu
 * - Content area مرن (main padding)
 * - Mobile: Sidebar قابل للطي عبر Sheet
 * - Active route detection عبر usePathname
 * - Badge ديناميكي للمراجعات المعلّقة + الرسائل الجديدة
 *
 * الاستخدام:
 *   <AdminLayout title="..." subtitle="...">
 *     <children />
 *   </AdminLayout>
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Users, Tags, UserCog, Shield,
  MessageSquare, ScrollText, BarChart3, Settings, LogOut,
  Search, Bell, Menu, X, ChevronLeft, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  badgeVariant?: 'default' | 'secondary' | 'destructive'
}

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/books', label: 'الكتب', icon: BookOpen },
  { href: '/admin/categories', label: 'التصنيفات', icon: Tags },
  { href: '/admin/authors', label: 'المؤلفون', icon: UserCog },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/roles', label: 'الأدوار', icon: Shield },
  { href: '/admin/reviews', label: 'المراجعات', icon: MessageSquare, badge: 7, badgeVariant: 'destructive' },
  { href: '/admin/messages', label: 'الرسائل', icon: MessageSquare, badge: 0, badgeVariant: 'secondary' },
  { href: '/admin/audit-logs', label: 'سجل التدقيق', icon: ScrollText },
  { href: '/admin/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingReviews, setPendingReviews] = useState(0)
  const [newMessages, setNewMessages] = useState(0)

  // جلب عدد المراجعات المعلّقة + الرسائل الجديدة (مرة واحدة)
  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => {
        setPendingReviews(d?.stats?.pendingReviews ?? 0)
        setNewMessages(d?.stats?.newMessages ?? 0)
      })
      .catch(() => {})
  }, [])

  // تحديث الـ nav items بالأرقام الحقيقية
  const navItemsWithBadges = navItems.map(item => {
    if (item.href === '/admin/reviews') return { ...item, badge: pendingReviews }
    if (item.href === '/admin/messages') return { ...item, badge: newMessages }
    return item
  })

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  // ابحث عن الصفحة الحالية في nav
  const currentItem = navItemsWithBadges.find(i => isActive(i.href))

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Sidebar - Desktop (ثابت على اليمين في RTL) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col bg-slate-900 text-slate-300 lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-lg shadow-lg shadow-indigo-500/30">
            📚
          </div>
          <div>
            <div className="font-bold text-white">ثقافتنا</div>
            <div className="text-xs text-slate-500">لوحة الإدارة</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItemsWithBadges.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-white')} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant={item.badgeVariant || 'default'} className="h-5 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs">
                ح
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">حسين علي</div>
              <div className="text-xs text-slate-500 truncate">admin@thaqafatna.com</div>
            </div>
            <LogOut className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 bg-slate-900 p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-lg">
              📚
            </div>
            <div className="font-bold text-white">ثقافتنا</div>
          </div>
          <nav className="px-3 py-4">
            <ul className="space-y-1">
              {navItemsWithBadges.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant={item.badgeVariant || 'default'} className="h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="lg:pr-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur-lg lg:px-6">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="فتح القائمة">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-slate-500 hover:text-primary">
              الإدارة
            </Link>
            {currentItem && (
              <>
                <ChevronLeft className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900">{currentItem.label}</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative mr-auto hidden md:block">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="بحث سريع..."
              className="w-64 pr-9 bg-slate-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" aria-label={`الإشعارات (${pendingReviews} غير مقروءة)`}>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {pendingReviews > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingReviews}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 hover:bg-slate-100">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                      ح
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-slate-700 sm:inline-block">حسين</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">حسين علي</span>
                    <span className="text-xs text-slate-500">admin@thaqafatna.com</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 ml-2" />
                    الإعدادات
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <ChevronLeft className="h-4 w-4 ml-2" />
                    عرض الموقع
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Header */}
        <div className="border-b bg-white px-4 py-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Main content — مع id لـ skip-to-content link */}
        <main id="main-content" tabIndex={-1} className="p-4 lg:p-8 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

// ============== Helper Components ==============

/** زر إجراء أساسي للاستخدام في actions prop */
export function AdminAction({ href, icon: Icon, children }: {
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const content = (
    <Button className="gap-2">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

/** زر إجراء ثانوي */
export function AdminSecondaryAction({ href, icon: Icon, children }: {
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const content = (
    <Button variant="outline" className="gap-2">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
