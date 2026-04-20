import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const users = await prisma.$queryRawUnsafe(`
            SELECT id, name, email, password, role
            FROM "User"
            WHERE email = '${credentials.email.replace(/'/g, "''")}'
            LIMIT 1
          `) as any[]

          if (!users || users.length === 0) return null

          const user = users[0]
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          // Kembalikan object dengan field extra di 'any'
          return {
            id:    String(user.id),
            name:  String(user.name),
            email: String(user.email),
            role:  String(user.role),
          } as any
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Cast token ke any agar tidak ada konflik tipe bawaan NextAuth
      const t = token as any
      if (user) {
        const u = user as any
        t.uid  = String(u.id)
        t.role = String(u.role)
      }
      return t
    },
    async session({ session, token }) {
      const t = token as any
      const s = session as any
      if (t && s.user) {
        s.user.id   = t.uid  ?? ''
        s.user.role = t.role ?? ''
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 hari
  },

  secret: process.env.NEXTAUTH_SECRET,

  useSecureCookies: process.env.NODE_ENV === 'production',

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path:     '/',
        secure:   process.env.NODE_ENV === 'production',
      },
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }