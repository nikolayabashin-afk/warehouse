'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileMenu } from '@/app/components/MobileMenu'
import { LogoutButton } from '@/components/LogoutButton'

type NavSection = {
  title: string
  links: string[][]
}

export function AppShell({ children, navSections, isLoggedIn, userName, userEmail, userRole }: {
  children: React.ReactNode
  navSections: NavSection[]
  isLoggedIn: boolean
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
}) {
  const pathname = usePathname()
  const showChrome = isLoggedIn && pathname !== '/login'

  return <div className="min-h-screen flex bg-gray-50">
    {showChrome && <aside className="w-64 bg-gray-950 text-white p-5 hidden md:block overflow-y-auto">
      <div className="text-xl font-bold mb-8">Склад WMS</div>
      <nav className="space-y-6">
        {navSections.map(section => <div key={section.title}>
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
          <div className="space-y-1">{section.links.map(([label, href]) => <Link key={href} className="block rounded-xl px-3 py-2 hover:bg-white/10" href={href}>{label}</Link>)}</div>
        </div>)}
      </nav>
    </aside>}
    <div className="flex-1 min-w-0">
      {showChrome && <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3">
          <MobileMenu navSections={navSections} />
          <form action="/search" className="flex min-w-0 flex-1 gap-2 md:max-w-3xl md:gap-3">
            <input className="input min-w-0" name="q" placeholder="Поиск: товар, артикул, место" />
            <button className="btn whitespace-nowrap">Найти</button>
          </form>
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right text-sm">
              <div className="font-semibold">{userName || userEmail}</div>
              <div className="text-gray-500">{userRole}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>}
      <main className="p-4 md:p-8">{children}</main>
    </div>
  </div>
}
