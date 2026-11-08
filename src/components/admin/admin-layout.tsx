/**
 * 🎛️ AdminLayout — تخطيط إداري موحّد احترافي
 *
 * 5 أقسام:
 *   📊 عام      — لوحة التحكم
 *   📚 المكتبة  — كتب، تصنيفات، فصول كتب (لون أزرق عند التفعيل)
 *   🎮 اللعبة   — فصول لعبة، محرر مراحل، جودة، صعوبة (لون أصفر)
 *   👥 المجتمع   — لاعبون، مراجعات، رسائل
 *   ⚙️ النظام    — أدوار، تدقيق، تقارير، إعدادات
 *
 * المميزات:
 * - Sidebar داكن أنيق مع تمييز لوني لكل قسم
 * - Topbar بـ breadcrumb + بحث سريع + إشعارات
 * - Mobile: Sidebar قابل للطي عبر Sheet
 * - شارات ديناميكية للمراجعات/الرسائل
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Library, BookOpen, Tags, BookMarked,
  Gamepad2, Grid3x3, ShieldCheck, Scale, Spline,
  Users, MessageSquare, Mail,
  UserCog, ScrollText, BarChart3, Settings,
  LogOut, Search, Bell, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet'

// ===== أنواع =====
type SectionKey = 'general' | 'library' | 'game' | 'community' | 'system'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  section: SectionKey
  badge?: number
  badgeVariant?: 'default' | 'secondary' | 'destructive'
}

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

// ===== تعريف الأقسام =====
const sections: { key: SectionKey; label: string; icon: string; color: string }[] = [
  { key: 'general', label: 'عام', icon: '📊', color: 'purple' },
  { key: 'library', label: 'المكتبة', icon: '📚', color: 'blue' },
  { key: 'game', label: 'اللعبة', icon: '🎮', color: 'amber' },
  { key: 'community', label: 'المجتمع', icon: '👥', color: 'emerald' },
  { key: 'system', label: 'النظام', icon: '⚙️', color: 'slate' },
]

// ===== عناصر التنقّل =====
const navItems: NavItem[] = [
  // 📊 عام
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, section: 'general' },

  // 📚 المكتبة
  { href: '/admin/library', label: 'إدارة المكتبة', icon: Library, section: 'library' },
  { href: '/admin/books', label: 'الكتب', icon: BookOpen, section: 'library' },
  { href: '/admin/categories', label: 'تصنيفات الكتب', icon: Tags, section: 'library' },
  { href: '/admin/book-chapters', label: 'فصول الكتب', icon: BookMarked, section: 'library' },

  // 🎮 اللعبة
  { href: '/admin/game/chapters', label: 'فصول اللعبة', icon: Gamepad2, section: 'game' },
  { href: '/admin/game/levels', label: 'محرر المراحل', icon: Grid3x3, section: 'game' },
  { href: '/admin/game/quality', label: 'مدقّق الجودة', icon: ShieldCheck, section: 'game', badge: 3, badgeVariant: 'destructive' },
  { href: '/admin/game/difficulty', label: 'موازنة الصعوبة', icon: Scale, section: 'game' },
  { href: '/admin/game/skills', label: 'شجرة المهارات', icon: Spline, section: 'game' },

  // 👥 المجتمع
  { href: '/admin/users', label: 'اللاعبون والقرّاء', icon: Users, section: 'community' },
  { href: '/admin/reviews', label: 'المراجعات', icon: MessageSquare, section: 'community', badge: 7, badgeVariant: 'destructive' },
  { href: '/admin/messages', label: 'الرسائل', icon: Mail, section: 'community', badge: 0, badgeVariant: 'secondary' },

  // ⚙️ النظام
  { href: '/admin/roles', label: 'الأدوار والصلاحيات', icon: UserCog, section: 'system' },
  { href: '/admin/audit-logs', label: 'سجل التدقيق', icon: ScrollText, section: 'system' },
  { href: '/admin/reports', label: 'التقارير', icon: BarChart3, section: 'system' },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings, section: 'system' },
]

// ===== خريطة الألوان لكل قسم =====
const sectionColors: Record<SectionKey, { active: string; hover: string; border: string }> = {
  general: { active: 'bg-purple-500/15 text-purple-300 border-purple-500', hover: 'hover:bg-purple-500/10 hover:text-purple-300', border: 'border-r-purple-500' },
  library: { active: 'bg-blue-500/15 text-blue-300 border-blue-500', hover: 'hover:bg-blue-500/10 hover:text-blue-300', border: 'border-r-blue-500' },
  game: { active: 'bg-amber-500/15 text-amber-300 border-amber-500', hover: 'hover:bg-amber-500/10 hover:text-amber-300', border: 'border-r-amber-500' },
  community: { active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500', hover: 'hover:bg-emerald-500/10 hover:text-emerald-300', border: 'border-r-emerald-500' },
  system: { active: 'bg-slate-500/15 text-slate-300 border-slate-500', hover: 'hover:bg-slate-500/10 hover:text-slate-300', border: 'border-r-slate-500' },
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingReviews, setPendingReviews] = useState(0)
  const [newMessages, setNewMessages] = useState(0)

  // 🚪 تسجيل الخروج
  const handleLogout = async () => {
    try {
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json()
      const formData = new URLSearchParams()
      formData.append('csrfToken', csrfToken)
      formData.append('callbackUrl', window.location.origin + '/admin/login')
      formData.append('json', 'true')
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      window.location.href = '/admin/login'
    }
  }

  // جلب أعداد المراجعات المعلّقة + الرسائل الجديدة
  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d?.stats) {
          setPendingReviews(d.stats.pendingReviews || 0)
          setNewMessages(d.stats.newMessages || 0)
        }
      })
      .catch(() => {})
  }, [])

  const navItemsWithBadges = navItems.map(item => {
    if (item.href === '/admin/reviews') return { ...item, badge: pendingReviews }
    if (item.href === '/admin/messages') return { ...item, badge: newMessages }
    return item
  })

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    // أعمق match: /admin/books يطابق /admin/books/123
    return pathname === href || pathname.startsWith(href + '/')
  }

  const currentItem = navItemsWithBadges.find(i => isActive(i.href))

  // ===== Render Sidebar Nav (مشترك بين desktop + mobile) =====
  const renderNav = () => {
    let lastSection: SectionKey | null = null
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {navItemsWithBadges.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const showSectionHeader = item.section !== lastSection
            lastSection = item.section
            const sectionMeta = sections.find(s => s.key === item.section)!
            const colors = sectionColors[item.section]

            return (
              <li key={item.href}>
                {showSectionHeader && (
                  <p className={cn(
                    'px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-wider',
                    'text-slate-600 flex items-center gap-1.5'
                  )}>
                    <span className="text-sm">{sectionMeta.icon}</span>
                    <span>{sectionMeta.label}</span>
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border-r-2 px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? colors.active + ' ' + colors.border
                      : 'border-r-transparent text-slate-400 ' + colors.hover
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active ? '' : 'text-slate-500 group-hover:current')} />
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
    )
  }

  // ===== Logo (مشترك) =====
  const renderLogo = () => (
    <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-blue-500 to-amber-500 text-lg shadow-lg shadow-purple-500/30">
        ث
      </div>
      <div>
        <div className="font-bold text-white">ثقافتنا</div>
        <div className="text-xs text-slate-500">لوحة الإدارة الموحّدة</div>
      </div>
    </div>
  )

  // ===== User footer (مشترك) =====
  const renderUserFooter = () => (
    <div className="border-t border-slate-800 p-3">
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="تسجيل الخروج"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs">
            ح
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm font-medium text-white truncate">حسن علي</div>
          <div className="text-xs text-slate-500 truncate">مدير النظام</div>
        </div>
        <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 flex-col bg-slate-900 text-slate-300 lg:flex">
        {renderLogo()}
        {renderNav()}
        {renderUserFooter()}
      </aside>

      {/* Sidebar - Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 bg-slate-900 p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          {renderLogo()}
          {renderNav()}
          {renderUserFooter()}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pr-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur-lg lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">القائمة</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumb + title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>الرئيسية</span>
              <span>›</span>
              <span className="truncate">{title}</span>
            </div>
            <h1 className="truncate text-base font-bold text-slate-800">{title}</h1>
          </div>

          {/* Search (desktop) */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="بحث سريع..."
              className="w-64 pr-9 bg-slate-100 border-slate-200 focus:border-purple-400"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {(pendingReviews + newMessages) > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>

          {/* Actions */}
          {actions}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
