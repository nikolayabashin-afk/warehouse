import './globals.css'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { AppShell } from '@/components/AppShell'
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
    <AppShell
      navSections={navSections}
      isLoggedIn={Boolean(session?.user)}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
      userRole={(session?.user as any)?.role}
    >
      {children}
    </AppShell>
  </body></html>
}
