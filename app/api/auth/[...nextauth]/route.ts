import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const safeEmail = credentials.email.replace(/'/g, "''")

          // WAJIB pakai $queryRawUnsafe — jangan pernah pakai prisma.user.findUnique()
          const users = await prisma.$queryRawUnsafe(`
            SELECT id, email, name, password, role
            FROM "User"
            WHERE email = '${safeEmail}'
            LIMIT 1
          `) as any[]

          if (!users || users.length === 0) return null

          const user = users[0]
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)
          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('[AUTH] Error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    }
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }