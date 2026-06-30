import NextAuth from 'next-auth'
import { authOptions as options } from './auth'

const routeHandler = NextAuth(options)

export const GET = routeHandler
export const POST = routeHandler
