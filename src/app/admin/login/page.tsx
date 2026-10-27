/**
 * 🔐 صفحة دخول الأدمن — Sprint 1 Day 2
 *
 * نموذج من خطوتين:
 * الخطوة 1: البريد + كلمة المرور
 * الخطوة 2: رمز 2FA (يظهر فقط لو الأدمن فعّل 2FA)
 *
 * حالات الحافة:
 * - كلمة مرور خاطئة → رسالة خطأ + احتساب محاولة فاشلة في Rate Limiting
 * - 2FA خاطئ → رسالة خطأ + احتساب محاولة فاشلة
 * - 3 محاولات فاشلة → قفل IP لـ 15 دقيقة
 * - أدمن لم يُفعّل 2FA → يُسمح بالدخول لكن يُوجّه لإعداد 2FA
 */

'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'

  const [step, setStep] = useState<1 | 2>(1) // 1 = credentials, 2 = OTP
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null)

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Rate Limiting check على العميل (التحقق الفعلي على الخادم)
    const result = await signIn('credentials', {
      email,
      password,
      twoFactorToken: undefined, // لا نرسل OTP في الخطوة 1
      redirect: false,
    })

    if (result?.error === 'CredentialsSignin') {
      // تحقق من نوع الخطأ: هل هو "2FA required" أم "invalid credentials"؟
      // NextAuth لا يُميّز — لكن يمكننا التحقق من حالة المستخدم
      const checkRes = await fetch('/api/admin/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const checkData = await checkRes.json()

      if (checkData.requiresTwoFactor) {
        // كلمة المرور صحيحة لكن 2FA مطلوب
        setNeedsTwoFactor(true)
        setStep(2)
        setLoading(false)
        return
      }

      if (checkData.locked) {
        // تم قفل IP
        setLockoutMinutes(checkData.lockoutMinutes || 15)
        setError(`تم قفل الحساب مؤقتًا. حاول مرة أخرى بعد ${checkData.lockoutMinutes} دقيقة.`)
        setLoading(false)
        return
      }

      // كلمة مرور خاطئة
      setError('بيانات الدخول غير صحيحة.')
      setLoading(false)
      return
    }

    if (result?.error) {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.')
      setLoading(false)
      return
    }

    // نجح الدخول (بدون 2FA — مستخدم عادي أو أدمن لم يُفعّل 2FA)
    router.push(callbackUrl)
    router.refresh()
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!/^\d{6}$/.test(twoFactorToken)) {
      setError('الرمز يجب أن يكون 6 أرقام.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      twoFactorToken,
      redirect: false,
    })

    if (result?.error) {
      setError('رمز 2FA غير صحيح. تحقق من Google Authenticator وحاول مرة أخرى.')
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  // شاشة القفل
  if (lockoutMinutes) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={titleStyle}>تم قفل الحساب مؤقتًا</h1>
          <p style={subtitleStyle}>
            بسبب تجاوز عدد المحاولات الفاشلة، تم قفل الوصول لهذا الجهاز.
          </p>
          <p style={{ ...subtitleStyle, fontWeight: 700, fontSize: '18px' }}>
            حاول مرة أخرى بعد {lockoutMinutes} دقيقة
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={logoStyle}>🔐</div>
        <h1 style={titleStyle}>لوحة تحكم ثقافتنا</h1>
        <p style={subtitleStyle}>دخول الأدمن — منفصل عن المستخدمين</p>

        {/* تنبيه أمني */}
        <div style={warningStyle}>
          <span>⚠️</span>
          <span>سيُقفل الحساب مؤقتًا بعد عدة محاولات فاشلة</span>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* الخطوة 1: البريد + كلمة المرور */}
        {step === 1 && (
          <form onSubmit={handleCredentialsSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>البريد الإلكتروني أو اسم المستخدم</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thaqafatna.com أو admin"
                required
                style={inputStyle}
                autoComplete="username"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} style={loading ? buttonDisabledStyle : buttonStyle}>
              {loading ? '⏳ جاري التحقق...' : 'التالي ←'}
            </button>
          </form>
        )}

        {/* الخطوة 2: رمز 2FA */}
        {step === 2 && (
          <form onSubmit={handleTwoFactorSubmit}>
            <div style={{ ...infoBoxStyle, marginBottom: '16px' }}>
              ✅ كلمة المرور صحيحة. أدخل رمز 2FA من Google Authenticator.
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>رمز التحقق الثنائي (2FA)</label>
              <input
                type="text"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                autoFocus
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'center' }}
                inputMode="numeric"
              />
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                افتح Google Authenticator واكتب الرمز الظاهر
              </p>
            </div>

            <button type="submit" disabled={loading || twoFactorToken.length !== 6} style={loading ? buttonDisabledStyle : buttonStyle}>
              {loading ? '⏳ جاري التحقق...' : '🔓 تسجيل الدخول'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setTwoFactorToken(''); setError('') }}
              style={{ ...linkButtonStyle, marginTop: '12px' }}
            >
              → رجوع
            </button>
          </form>
        )}

        <p style={footerStyle}>
          لا يوجد رابط &quot;أنشئ حسابًا&quot;
          <br />
          الحسابات الإدارية تُنشأ من أدمن آخر
        </p>
      </div>
    </div>
  )
}

// ===== Styles =====
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
  padding: '24px',
}
const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '40px',
  maxWidth: '420px',
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
}
const logoStyle: React.CSSProperties = {
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
}
const titleStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '22px',
  fontWeight: 700,
  marginBottom: '8px',
  fontFamily: 'Cairo, sans-serif',
  color: '#0f172a',
}
const subtitleStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#64748b',
  fontSize: '13px',
  marginBottom: '28px',
}
const warningStyle: React.CSSProperties = {
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
}
const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#dc2626',
  marginBottom: '16px',
}
const infoBoxStyle: React.CSSProperties = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#065f46',
}
const formGroupStyle: React.CSSProperties = { marginBottom: '16px' }
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
  color: '#475569',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
}
const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#4f46e5',
  color: 'white',
  fontWeight: 700,
  fontSize: '14px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}
const buttonDisabledStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#c7d2fe',
  cursor: 'not-allowed',
}
const linkButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: '13px',
  cursor: 'pointer',
  padding: '8px',
}
const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '12px',
  color: '#64748b',
  marginTop: '20px',
  lineHeight: 1.6,
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f172a' }} />}>
      <LoginForm />
    </Suspense>
  )
}
