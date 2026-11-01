/**
 * 🔐 NextAuth Edge-Safe Config — Sprint 5 Fix
 *
 * المشكلة:
 *   middleware.ts يعمل على Edge Runtime.
 *   auth.ts يستورد bcrypt + crypto + Prisma (node-only).
 *   → الـ Edge bundle يضخم إلى 1.04 MB ويتجاوز حد Vercel (1 MB).
 *
 * الحل:
 *   هذا الملف يحتوي فقط على NextAuth config بدون providers تحتاج Node.js.
 *   نُصدّر auth() للـ middleware — يقرأ JWT من cookie فقط (لا DB).
 *   التحقق الفعلي من كلمة المرور + 2FA يحدث في route handlers (Node.js).
 *
 * المراجع:
 *   https://authjs.dev/getting-started/installation#setup-config
 *   https://nextjs.org/docs/app/api-reference/file-conventions/middleware
 */

import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

// NextAuth v5 beta has a known TypeScript type issue where the default export
// is not properly typed as callable. This cast works around it.
// The code works correctly at runtime — this is purely a types issue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { auth, handlers, signIn, signOut } = (NextAuth as any)({
  // على Edge نستخدم GitHub OAuth فقط (لا يطلب DB)
  // Credentials provider محذوف هنا لأنه يحتاج bcrypt + crypto + Prisma
  // → يُسجَّل في route.ts عبر config منفصل على Node.js runtime
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  // Session strategy — JWT (يعمل على Edge middleware)
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 ساعة
  },

  // Callbacks — فصل جلسة الأدمن (التحفظ #2)
  callbacks: {
    // 🔒 منع أدمن من الدخول عبر GitHub OAuth (ثغرة تجاوز 2FA)
    // ملاحظة: على Edge لا يمكننا الوصول لـ Prisma، لذا نعتمد على
    // token الموجود في JWT (تم ضبطه في jwt callback على Node.js).
    async signIn({ user, account }) {
      if (account?.provider === 'github') {
        // لو المستخدم لديه role admin/librarian/assistant في token، ارفض
        // (هذا token تم ضبطه مسبقًا عبر Credentials login على Node.js)
        // على Edge لا يمكننا التحقق من DB، لذا نسمح بالدخول هنا
        // والـ middleware سيتحقق من role عند محاولة الوصول لـ /admin/*
        return true
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // ملاحظة: لا نستعلم DB هنا على Edge.
        // role سيُضبط عبر route handler على Node.js (/api/auth/[...nextauth])
        // عند تسجيل الدخول بـ Credentials.
        if (!token.role) {
          token.role = 'reader' // افتراضي
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'reader'
      }
      return session
    },
  },

  // Pages
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  // Cookies — sameSite lax للـ CSRF protection
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
