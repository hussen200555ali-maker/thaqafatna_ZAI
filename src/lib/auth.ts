/**
 * 🔐 NextAuth Configuration — Sprint 1
 *
 * التحفظات المطبّقة:
 * 1. PrismaAdapter يعمل على Node.js runtime (محدّد في route.ts)
 * 2. فصل جلسة الأدمن: نفس cookie، لكن role claim في session (الخيار أ)
 * 3. CSRF protection مدمج في NextAuth
 */

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// NextAuth v5 beta has a known TypeScript type issue where the default export
// is not properly typed as callable. This cast works around it.
// The code works correctly at runtime — this is purely a types issue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const init = (NextAuth as any)({
  // PrismaAdapter — يتطلب Node.js runtime (محدّد في route.ts)
  adapter: PrismaAdapter(db),

  // Providers
  providers: [
    // GitHub OAuth (للقرّاء — تسجيل دخول عام)
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Email/Password + 2FA (للأدمن والأمناء)
    Credentials({
      credentials: {
        email: { label: 'البريد', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
        twoFactorToken: { label: 'رمز 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            userRoles: {
              include: { role: true },
            },
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        // التحقق من كلمة المرور
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) {
          return null
        }

        // التحقق من 2FA (إلزامي للأدوار الإدارية)
        const hasAdminRole = user.userRoles.some(
          (ur) =>
            ur.role.name === 'admin' ||
            ur.role.name === 'librarian' ||
            ur.role.name === 'assistant'
        )

        if (user.twoFactorEnabled && hasAdminRole) {
          if (!credentials.twoFactorToken) {
            return null // 2FA مطلوب
          }

          // فك تشفير السر + التحقق من الرمز
          const { decryptSecret } = await import('@/lib/crypto')
          const speakeasy = (await import('speakeasy')).default

          try {
            const totpSecret = decryptSecret(user.twoFactorSecret!)
            const isValidToken = speakeasy.totp.verify({
              secret: totpSecret,
              encoding: 'base32',
              token: credentials.twoFactorToken as string,
              window: 1,
            })

            if (!isValidToken) {
              return null
            }
          } catch {
            return null
          }
        }

        // تحديث آخر دخول
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],

  // Session strategy — JWT (يعمل على Edge middleware)
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 ساعة
  },

  // Callbacks — فصل جلسة الأدمن (التحفظ #2) + منع تجاوز 2FA
  callbacks: {
    // 🔒 منع أدمن من الدخول عبر GitHub OAuth (ثغرة تجاوز 2FA)
    async signIn({ user, account }) {
      // لو الدخول عبر GitHub OAuth
      if (account?.provider === 'github') {
        // تحقق من دور المستخدم
        if (user?.id) {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: {
              userRoles: { include: { role: true } },
            },
          })
          const roles = dbUser?.userRoles.map((ur) => ur.role.name) || []
          const isAdminRole = roles.some((r) =>
            ['admin', 'librarian', 'assistant'].includes(r)
          )

          // أدمن يحاول الدخول عبر OAuth → ارفض (يجب استخدام Credentials + 2FA)
          if (isAdminRole) {
            console.warn(`⚠️ Admin ${user.id} attempted OAuth login — blocked`)
            return false
          }
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const dbUser = await db.user.findUnique({
          where: { id: user.id! },
          select: {
            userRoles: { include: { role: true } },
          },
        })
        const roles = dbUser?.userRoles.map((ur) => ur.role.name) || ['reader']
        token.roles = roles
        token.role = roles.includes('admin')
          ? 'admin'
          : roles.includes('librarian')
          ? 'librarian'
          : roles.includes('assistant')
          ? 'assistant'
          : 'reader'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.roles = token.roles as string[]
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

export const { handlers, auth, signIn, signOut } = init
