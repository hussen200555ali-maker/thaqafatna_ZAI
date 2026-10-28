'use client'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const [section, setSection] = useState('general')
  const sections = [{id:'general',l:'🌐 عام'},{id:'security',l:'🛡️ الأمان'},{id:'integrations',l:'🔌 التكاملات'},{id:'danger',l:'⚠️ منطقة الخطر'}]
  const inputStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>⚙️ الإعدادات</h1>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {sections.map(s => <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid', borderColor: section === s.id ? '#4f46e5' : '#e2e8f0', background: section === s.id ? '#4f46e5' : 'white', color: section === s.id ? 'white' : '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>{s.l}</button>)}
        </div>
        {section === 'general' && <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🌐 إعدادات عامة</h2>
          {[{l:'اسم الموقع',v:'ثقافتنا'},{l:'الوصف',v:'منصة عربية تعليمية'}].map((i,idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ fontWeight: 600, fontSize: '14px' }}>{i.l}</span><input defaultValue={i.v} style={inputStyle} /></div>
          ))}
        </div>}
        {section === 'security' && <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🛡️ الأمان</h2>
          {[{l:'2FA إلزامي للأدمن',d:'يجب تفعيله لكل إداري'},{l:'حد المحاولات',d:'3 قبل القفل'},{l:'مدة القفل (دقيقة)',d:'15 دقيقة'}].map((i,idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}><div><div style={{ fontWeight: 600, fontSize: '14px' }}>{i.l}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{i.d}</div></div><div style={{ width: '44px', height: '24px', background: '#10b981', borderRadius: '12px', position: 'relative' }}><div style={{ position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%' }} /></div></div>
          ))}
        </div>}
        {section === 'integrations' && <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🔌 التكاملات</h2>
          {[{l:'Vercel Blob',s:'مفعّل',i:'1 GB',ok:true},{l:'Upstash Redis',s:'مفعّل',i:'4,231 طلب',ok:true},{l:'Neon PostgreSQL',s:'مفعّل',i:'156 MB',ok:true},{l:'Sentry',s:'غير مفعّل',i:'إعداد مطلوب',ok:false}].map((i,idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}><div><div style={{ fontWeight: 600, fontSize: '14px' }}>{i.l}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{i.i}</div></div><span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: i.ok ? '#ecfdf5' : '#fef2f2', color: i.ok ? '#065f46' : '#dc2626' }}>{i.s}</span></div>
          ))}
        </div>}
        {section === 'danger' && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', marginBottom: '16px' }}>⚠️ منطقة الخطر</h2>
          {[{l:'تصدير كل البيانات',d:'تنزيل نسخة كاملة',b:'📥 تصدير',c:'#4f46e5'},{l:'حذف المستخدمين غير النشطين',d:'حسابات لم تدخل منذ 90 يومًا',b:'حذف (87)',c:'#ef4444'},{l:'حذف المكتبة نهائيًا',d:'⚠️ لا يمكن التراجع',b:'حذف نهائي',c:'#dc2626'}].map((i,idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #fecaca' }}><div><div style={{ fontWeight: 600, fontSize: '14px', color: i.c === '#dc2626' ? '#dc2626' : '#0f172a' }}>{i.l}</div><div style={{ fontSize: '12px', color: '#991b1b' }}>{i.d}</div></div><button style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', background: i.c, color: 'white', cursor: 'pointer' }}>{i.b}</button></div>
          ))}
        </div>}
      </div>
    </div>
  )
}
