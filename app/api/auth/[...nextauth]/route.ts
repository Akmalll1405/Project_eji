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

          return {
            id:    String(user.id),
            name:  user.name,
            email: user.email,
            role:  user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).uid = String(user.id)
        ;(token as any).role = String((user as any).role)
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id   = (token as any).uid
        (session.user as any).role = (token as any).role
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
    maxAge:   30 * 24 * 60 * 60,
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
        sameSite: 'lax',
        path:     '/',
        secure:   process.env.NODE_ENV === 'production',
      },
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }