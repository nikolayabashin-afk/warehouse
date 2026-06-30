'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => signOut({ callbackUrl: '/login' })}>Выйти</button>
}
