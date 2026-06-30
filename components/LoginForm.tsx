'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function LoginForm() {
  const [error, setError] = useState('')
  async function submit(formData: FormData) {
    setError('')
    const res = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: true,
      callbackUrl: '/dashboard'
    })
    if (res?.error) setError('Wrong email or password')
  }
  return <form action={submit} className="space-y-4">
    <input className="input" name="email" type="email" placeholder="Email" required />
    <input className="input" name="password" type="password" placeholder="Password" required />
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button className="btn w-full">Login</button>
  </form>
}
