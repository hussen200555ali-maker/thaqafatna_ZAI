/**
 * 🧩 مكونات Admin المشتركة — لإعادة الاستخدام في كل الصفحات
 *
 * المكونات:
 * - StatCard: بطاقة KPI مع icon + value + trend
 * - StatusBadge: badge ملون حسب status
 * - EmptyState: حالة فارغة مع icon + message + action
 * - LoadingState: حالة تحميل
 * - ErrorState: حالة خطأ مع retry
 * - SectionCard: card بعنوان + content
 * - Toolbar: شريط أدوات (search + filters)
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'

// ============== StatCard ==============

type Trend = { value: string; direction: 'up' | 'down' | 'neutral' }

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  iconBg?: string
  iconColor?: string
  trend?: Trend
  sublabel?: string
}

export function StatCard({
  label, value, icon, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600',
  trend, sublabel,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            {sublabel && (
              <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
            )}
            {trend && (
              <div className={cn(
                'mt-3 flex items-center gap-1 text-xs font-medium',
                trend.direction === 'up' && 'text-emerald-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-slate-500',
              )}>
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.direction === 'neutral' && '→'}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl text-xl',
              iconBg, iconColor,
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============== StatusBadge ==============

type StatusType = 'draft' | 'in_review' | 'published' | 'archived' |
  'pending' | 'approved' | 'rejected' | 'active' | 'suspended' | 'info' |
  'warning' | 'critical' | 'success' | 'neutral'

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  in_review: { label: 'قيد المراجعة', variant: 'outline' },
  published: { label: 'منشور', variant: 'default' },
  archived: { label: 'مؤرشف', variant: 'secondary' },
  pending: { label: 'بانتظار', variant: 'outline' },
  approved: { label: 'موافق عليه', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  active: { label: 'نشط', variant: 'default' },
  suspended: { label: 'موقوف', variant: 'destructive' },
  info: { label: 'معلومة', variant: 'outline' },
  warning: { label: 'تحذير', variant: 'outline' },
  critical: { label: 'حرج', variant: 'destructive' },
  success: { label: 'نجاح', variant: 'default' },
  neutral: { label: 'محايد', variant: 'secondary' },
}

export function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const config = statusConfig[status] || statusConfig.neutral
  return (
    <Badge variant={config.variant} className="font-medium">
      {label || config.label}
    </Badge>
  )
}

// ============== EmptyState ==============

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

// ============== LoadingState ==============

export function LoadingState({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-slate-500">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ============== ErrorState ==============

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-900">حدث خطأ</p>
      <p className="max-w-md text-center text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2 gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  )
}

// ============== SectionCard ==============

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ============== Toolbar ==============

interface ToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  actions?: ReactNode
}

export function Toolbar({
  searchValue, onSearchChange, searchPlaceholder = 'بحث...',
  filters, actions,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pr-9"
          />
        </div>
        {filters}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

// ============== Data not found (for tables) ==============

export function TableRowEmpty({ colSpan, message = 'لا توجد بيانات' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-slate-400">
        {message}
      </td>
    </tr>
  )
}
