'use client'
import { useState, useEffect } from 'react'

interface Message { id: number; name: string; email: string; bookTitle: string | null; message: string; status: string; createdAt: string }

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('new')

  useEffect(() => { fetchMessages() }, [tab])
  const fetchMessages = async () => { setLoading(true); try { const res = await fetch(`/api/admin/messages?status=${tab}`); const d = await res.json(); setMessages(d.messages || []) } catch {} finally { setLoading(false) } }

  const statusColors: Record<string, {bg:string;text:string;label:string}> = { new:{bg:'#fffbeb',text:'#92400e',label:'جديد'}, read:{bg:'#f0f9ff',text:'#075985',label:'مقروء'}, replied:{bg:'#eef2ff',text:'#3730a3',label:'تم الرد'}, converted:{bg:'#ecfdf5',text:'#065f46',label:'تحويل'}, rejected:{bg:'#fef2f2',text:'#991b1b',label:'مرفوض'} }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>📧 صندوق الرسائل</h1>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[{id:'new',l:'جديدة'},{id:'read',l:'مقروءة'},{id:'replied',l:'تم الرد'},{id:'converted',l:'تحويل لكتاب'},{id:'rejected',l:'مرفوضة'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid', borderColor: tab === t.id ? '#4f46e5' : '#e2e8f0', background: tab === t.id ? '#4f46e5' : 'white', color: tab === t.id ? 'white' : '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>{t.l}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳</div> :
         messages.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>📭 لا توجد رسائل</div> :
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map(m => { const sc = statusColors[m.status] || statusColors.new; return (
            <div key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', borderRight: m.status === 'new' ? '4px solid #f59e0b' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div><strong style={{ fontSize: '14px' }}>{m.name}</strong><span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}> · {m.email}</span></div>
                <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
              </div>
              {m.bookTitle && <div style={{ fontSize: '12px', color: '#4f46e5', marginBottom: '8px' }}>📚 {m.bookTitle}</div>}
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>{m.message}</p>
            </div>
          )})}
         </div>}
      </div>
    </div>
  )
}
