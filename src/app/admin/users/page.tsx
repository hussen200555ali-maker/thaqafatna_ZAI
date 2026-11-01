/**
 * 👥 إدارة المستخدمون — /admin/users
 */

'use client'

import { useState, useEffect } from 'react'
import { UserPlus, FileDown, MoreHorizontal, Edit, Shield, Trash2, Search } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Toolbar, LoadingState, ErrorState, StatusBadge, EmptyState } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: string
  email: string | null
  name: string | null
  image: string | null
  userRoles: Array<{ role: { name: string; displayName: string } }>
  lastLoginAt: string | null
  createdAt: string
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 hover:bg-red-100',
  librarian: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  assistant: 'bg-sky-100 text-sky-700 hover:bg-sky-100',
  reader: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
}

const roleLabels: Record<string, string> = {
  admin: 'مدير',
  librarian: 'أمين مكتبة',
  assistant: 'مساعد',
  reader: 'قارئ',
}

function avatarColor(name: string) {
  const colors = [
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-500',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const loadUsers = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d.users) ? d.users : (Array.isArray(d) ? d : [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    const matchesRole = roleFilter === 'all' ||
      u.userRoles.some(ur => ur.role.name === roleFilter)
    return matchesSearch && matchesRole
  })

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.userRoles.some(ur => ur.role.name === 'admin')).length,
    librarians: users.filter(u => u.userRoles.some(ur => ur.role.name === 'librarian')).length,
    readers: users.filter(u => u.userRoles.every(ur => ur.role.name === 'reader')).length,
  }

  return (
    <AdminLayout
      title="👥 المستخدمون"
      subtitle={`${stats.total} مستخدم · ${stats.admins} مدير · ${stats.librarians} أمين · ${stats.readers} قارئ`}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            استيراد CSV
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            مستخدم جديد
          </Button>
        </>
      }
    >
      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <Toolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="🔍 ابحث بالاسم أو البريد..."
            filters={
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="كل الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأدوار</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="librarian">أمين مكتبة</SelectItem>
                  <SelectItem value="assistant">مساعد</SelectItem>
                  <SelectItem value="reader">قارئ</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="📭" title="لا يوجد مستخدمون مطابقون" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const role = user.userRoles[0]?.role.name || 'reader'
                const initial = (user.name || user.email || '?').charAt(0).toUpperCase()
                return (
                  <TableRow key={user.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`bg-gradient-to-br ${avatarColor(user.name || user.email || 'U')} text-white text-xs font-bold`}>
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">
                            {user.name || 'بدون اسم'}
                          </div>
                          <div className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{user.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roleColors[role]}>
                        {roleLabels[role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="active" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('ar-EG')
                        : 'لم يسجّل بعد'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Shield className="h-4 w-4 ml-2" />
                              تغيير الدور
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-600">
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-500">
              عرض {filtered.length} من {users.length} مستخدم
            </p>
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}
