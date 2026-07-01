import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ token, req }) {
      if (!token) return false

      const role = token.role as string | undefined
      const path = req.nextUrl.pathname

      if (role === 'ADMIN') return true

      if (role === 'MANAGER') {
        return !path.startsWith('/admin')
      }

      if (role === 'WORKER') {
        return !path.startsWith('/import') && !path.startsWith('/admin')
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
