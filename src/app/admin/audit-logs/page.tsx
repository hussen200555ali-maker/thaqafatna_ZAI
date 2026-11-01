/**
 * 📜 سجل التدقيق — /admin/audit-logs
 */

'use client'

import { useState, useEffect } from 'react'
import { FileDown, Package, Eye } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Toolbar, LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  severity: 'info' | 'warning' | 'critical'
  userName: string | null
  ip: string | null
  createdAt: string
  metadata: any
}

const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  LOGIN: { label: 'LOGIN', variant: 'outline' },
  LOGIN_FAILED: { label: 'LOGIN_FAILED', variant: 'destructive' },
  LOGOUT: { label: 'LOGOUT', variant: 'secondary' },
  CREATE: { label: 'CREATE', variant: 'default' },
  UPDATE: { label: 'UPDATE', variant: 'outline' },
  DELETE: { label: 'DELETE', variant: 'destructive' },
  DOWNLOAD: { label: 'DOWNLOAD', variant: 'secondary' },
  ROLE_CHANGE: { label: 'ROLE_CHANGE', variant: 'outline' },
  UPLOAD: { label: 'UPLOAD', variant: 'default' },
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/audit-logs?limit=100')
      .then(r => r.json())
      .then(d => setLogs(Array.isArray(d.logs) ? d.logs : (Array.isArray(d) ? d : [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (l.userName || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.entityType || '').toLowerCase().includes(q)
    const matchesAction = actionFilter === 'all' || l.action === actionFilter
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter
    return matchesSearch && matchesAction && matchesSeverity
  })

  return (
    <AdminLayout
      title="📜 سجل التدقيق"
      subtitle={`آخر 90 يومًا · ${logs.length} سجل · الاحتفاظ: info=90 يوم، critical=1 سنة`}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            أرشيف
          </Button>
        </>
      }
    >
      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <Toolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="🔍 ابحث في السجلات..."
            filters={
              <>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="كل العمليات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل العمليات</SelectItem>
                    <SelectItem value="LOGIN">LOGIN</SelectItem>
                    <SelectItem value="LOGIN_FAILED">LOGIN_FAILED</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="DOWNLOAD">DOWNLOAD</SelectItem>
                    <SelectItem value="ROLE_CHANGE">ROLE_CHANGE</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="كل الخطورة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الخطورة</SelectItem>
                    <SelectItem value="info">info</SelectItem>
                    <SelectItem value="warning">warning</SelectItem>
                    <SelectItem value="critical">critical</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="📜" title="لا توجد سجلات مطابقة" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>الوقت</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>العملية</TableHead>
                <TableHead>الكيان</TableHead>
                <TableHead>الخطورة</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-center">تفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50">
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString('ar-EG')}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {log.userName || 'مجهول'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(actionLabels[log.action]?.variant) || 'secondary'}>
                      {actionLabels[log.action]?.label || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {log.entityType}
                    {log.entityId && <span className="text-slate-400"> #{log.entityId.slice(0, 8)}</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={log.severity as any} />
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-slate-500">
                      {log.ip || '—'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="mx-auto h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="border-t bg-slate-50 px-4 py-3 text-sm text-slate-500">
            عرض {filtered.length} من {logs.length} سجل
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}
