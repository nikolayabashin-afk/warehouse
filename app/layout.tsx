import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Склад WMS', description: 'Система управления складом' }

const navSections = [
  { title: 'Обзор', links: [['Панель', '/dashboard'], ['Поиск', '/search'], ['Остатки', '/inventory'], ['История движений', '/movements']] },
  { title: 'Справочники', links: [['Товары', '/products'], ['Места хранения', '/locations']] },
  { title: 'Операции', links: [['Приход', '/receive'], ['Отгрузка', '/ship'], ['Перемещение', '/move']] },
  { title: 'Инструменты', links: [['Импорт Excel', '/import']] }
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-950 text-white p-5 hidden md:block overflow-y-auto">
        <div className="text-xl font-bold mb-8">Склад WMS</div>
        <nav className="space-y-6">
          {navSections.map(section => <div key={section.title}>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
            <div className="space-y-1">{section.links.map(([label, href]) => <Link key={href} className="block rounded-xl px-3 py-2 hover:bg-white/10" href={href}>{label}</Link>)}</div>
          </div>)}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  </body></html>
}
