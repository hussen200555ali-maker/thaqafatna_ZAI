/**
 * 📧 الرسائل — /admin/messages
 */

'use client'

import { useState, useEffect } from 'react'
import { Mail, MailOpen, Trash2, Reply, MoreHorizontal } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
  convertedBookId?: string | null
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/messages')
      .then(r => r.json())
      .then(d => setMessages(Array.isArray(d.messages) ? d.messages : (Array.isArray(d) ? d : [])))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  }

  return (
    <AdminLayout
      title="📧 الرسائل"
      subtitle={`${stats.total} رسالة · ${stats.new} جديدة · ${stats.replied} تم الرد عليها`}
    >
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : messages.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="📧"
              title="لا توجد رسائل"
              description="ستظهر رسائل التواصل من المستخدمين هنا"
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-12"></TableHead>
                <TableHead>المرسِل</TableHead>
                <TableHead>الموضوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => {
                const isNew = msg.status === 'new'
                const initial = (msg.name || msg.email || '?').charAt(0).toUpperCase()
                return (
                  <TableRow key={msg.id} className={isNew ? 'bg-blue-50/30 hover:bg-blue-50' : 'hover:bg-slate-50'}>
                    <TableCell className="text-center">
                      {isNew ? (
                        <Mail className="mx-auto h-4 w-4 text-blue-600" />
                      ) : (
                        <MailOpen className="mx-auto h-4 w-4 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={isNew ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}>
                            {msg.name || 'مجهول'}
                          </div>
                          <div className="text-xs text-slate-400">{msg.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={isNew ? 'font-medium text-slate-900' : 'text-slate-700'}>
                        {msg.subject || '(بدون موضوع)'}
                      </div>
                      <div className="mt-1 max-w-md truncate text-xs text-slate-400">
                        {msg.message?.substring(0, 80)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={msg.status as any} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="إجراءات إدارية">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            <DropdownMenuItem className="cursor-pointer">
                              <Reply className="h-4 w-4 ml-2" />
                              رد
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <MailOpen className="h-4 w-4 ml-2" />
                              تحديد كمقروء
                            </DropdownMenuItem>
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
      </Card>
    </AdminLayout>
  )
}
