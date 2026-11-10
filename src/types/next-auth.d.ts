/**
 * NextAuth Type Extensions
 * يضيف role و roles إلى session.user
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string // 'admin' | 'librarian' | 'assistant' | 'reader'
      roles: string[] // كل الأدوار
    }
  }

  interface User {
    id?: string
    role?: string
    roles?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    roles?: string[]
  }
}
