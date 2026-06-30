import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { MobileMenu } from '@/app/components/MobileMenu'
import { LogoutButton } from '@/components/LogoutButton'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = { title: 'Склад WMS', description: 'Система управления складом' }

const navSections = [
  { title: '📊 Панель', links: [['Панель управления', '/dashboard']] },
  { title: '📦 Каталог', links: [['Товары', '/products']] },
  { title: '🏭 Склад', links: [['Остатки', '/inventory'], ['Места хранения', '/locations']] },
  { title: '🔄 Операции', links: [['Приход', '/receive'], ['Перемещение', '/move'], ['Отгрузка', '/ship'], ['Сканер', '/scanner']] },
  { title: '📈 Отчёты', links: [['История движений', '/movements'], ['Импорт Excel', '/import']] }
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return <html lang="ru"><body>
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gray-950 text-white p-5 hidden md:block overflow-y-auto">
        <div className="text-xl font-bold mb-8">Склад WMS</div>
        <nav className="space-y-6">
          {navSections.map(section => <div key={section.title}>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
            <div className="space-y-1">{section.links.map(([label, href]) => <Link key={href} className="block rounded-xl px-3 py-2 hover:bg-white/10" href={href}>{label}</Link>)}</div>
          </div>)}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            <MobileMenu navSections={navSections} />
            <form action="/search" className="flex min-w-0 flex-1 gap-2 md:max-w-3xl md:gap-3">
              <input className="input min-w-0" name="q" placeholder="Поиск: товар, артикул, место" />
              <button className="btn whitespace-nowrap">Найти</button>
            </form>
            {session?.user && <div className="hidden items-center gap-3 md:flex">
              <div className="text-right text-sm">
                <div className="font-semibold">{session.user.name || session.user.email}</div>
                <div className="text-gray-500">{(session.user as any).role}</div>
              </div>
              <LogoutButton />
            </div>}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  </body></html>
}
