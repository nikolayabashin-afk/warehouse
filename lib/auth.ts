import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { DUMMY_PASSWORD_HASH } from '@/lib/security'

const isProduction = process.env.NODE_ENV === 'production'
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

if (!secret || secret.length < 32) {
  throw new Error('Authentication secret is missing or too short. Set NEXTAUTH_SECRET or AUTH_SECRET to a random value of at least 32 characters.')
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8
const allowedRedirectHosts = new Set(
  [process.env.NEXTAUTH_URL, process.env.AUTH_URL]
    .filter(Boolean)
    .map(value => {
      try { return new URL(value as string).host } catch { return null }
    })
    .filter(Boolean) as string[]
)

type LoginAttempt = { count: number; resetAt: number }
const loginAttempts = new Map<string, LoginAttempt>()

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getClientIp(req: any) {
  const forwarded = req?.headers?.['x-forwarded-for'] || req?.headers?.get?.('x-forwarded-for')
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  const realIp = req?.headers?.['x-real-ip'] || req?.headers?.get?.('x-real-ip')
  if (typeof realIp === 'string') return realIp
  return 'unknown'
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = loginAttempts.get(key)

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return true
  }

  if (current.count >= MAX_LOGIN_ATTEMPTS) return false

  current.count += 1
  return true
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key)
}

export const authOptions: NextAuthOptions = {
  secret,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60
  },
  pages: { signIn: '/login' },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        const email = credentials?.email ? normalizeEmail(credentials.email) : ''
        const password = credentials?.password || ''
        const ip = getClientIp(req)
        const ipKey = `ip:${ip}`
        const emailKey = `email:${email || 'missing'}`

        if (!checkRateLimit(ipKey) || !checkRateLimit(emailKey)) return null

        const user = email ? await prisma.user.findUnique({ where: { email } }) : null
        const hashToCheck = user?.passwordHash || DUMMY_PASSWORD_HASH
        const passwordOk = await bcrypt.compare(password || 'invalid-password', hashToCheck)

        if (!user || !user.active || !passwordOk) return null

        clearRateLimit(ipKey)
        clearRateLimit(emailKey)

        return { id: user.id, email: user.email, name: user.name, role: user.role } as any
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const base = new URL(baseUrl)
      allowedRedirectHosts.add(base.host)

      if (url.startsWith('/')) return `${baseUrl}${url}`

      try {
        const target = new URL(url)
        if (allowedRedirectHosts.has(target.host)) return url
      } catch {}

      return baseUrl
    },
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
      }
      return session
    }
  }
}
