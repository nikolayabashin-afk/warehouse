import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ token, req }) {
      if (!token) return false

      const role = token.role as string | undefined
      const path = req.nextUrl.pathname

      if (role === 'ADMIN' || role === 'MANAGER') return true

      if (role === 'WORKER') {
        return !path.startsWith('/import')
      }

      return false
    }
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'
  ]
}
