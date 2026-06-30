export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/products/:path*', '/locations/:path*', '/inventory/:path*', '/receive/:path*', '/move/:path*', '/search/:path*']
}
