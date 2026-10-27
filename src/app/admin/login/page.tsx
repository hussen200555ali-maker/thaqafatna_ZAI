/**
 * 🔐 صفحة دخول الأدمن — Sprint 1
 *
 * تصميم فاتح ووظيفي (مختلف عن الواجهة العامة الداكنة)
 * لا رابط "أنشئ حسابًا" — الحسابات الإدارية تُنشأ من أدمن آخر
 * تنبيه أمني: "سيُقفل الحساب مؤقتًا بعد عدة محاولات فاشلة"
 */

'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      twoFactorToken: twoFactorToken || undefined,
      redirect: false,
    })

    if (result?.error) {
      setError('بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور ورمز 2FA.')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            fontSize: '28px',
          }}
        >
          🔐
        </div>

        <h1
          style={{
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '8px',
            fontFamily: 'Cairo, sans-serif',
            color: '#0f172a',
          }}
        >
          لوحة تحكم ثقافتنا
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '13px',
            marginBottom: '28px',
          }}
        >
          دخول الأدمن — منفصل عن المستخدمين
        </p>

        {/* تنبيه أمني (بلا رقم — التحفظ الأمني) */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>سيُقفل الحساب مؤقتًا بعد عدة محاولات فاشلة</span>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#dc2626',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@thaqafatna.com"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#475569',
              }}
            >
              رمز التحقق الثنائي (2FA)
            </label>
            <input
              type="text"
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                outline: 'none',
              }}
            />
            <p
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '4px',
              }}
            >
              افتح Google Authenticator واكتب الرمز
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#c7d2fe' : '#4f46e5',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? '⏳ جاري التحقق...' : '🔓 تسجيل الدخول'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            marginTop: '20px',
            lineHeight: 1.6,
          }}
        >
          لا يوجد رابط &quot;أنشئ حسابًا&quot;
          <br />
          الحسابات الإدارية تُنشأ من أدمن آخر
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f172a' }} />}>
      <LoginForm />
    </Suspense>
  )
}
