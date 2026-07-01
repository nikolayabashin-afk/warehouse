'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const res = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
      callbackUrl: '/dashboard'
    })

    setLoading(false)

    if (res?.error) {
      setError('Wrong email or password')
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return <form onSubmit={submit} className="space-y-4">
    <input className="input" name="email" type="email" placeholder="Email" required />
    <input className="input" name="password" type="password" placeholder="Password" required />
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button className="btn w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
  </form>
}
