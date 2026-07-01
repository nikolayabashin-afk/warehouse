import './globals.css'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { AppShell } from '@/components/AppShell'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = { title: 'Склад WMS', description: 'Система управления складом' }

function getNavSections(role?: string) {
  const sections = [
    { title: '📊 Панель', links: [['Панель управления', '/dashboard']] },
    { title: '✅ Задачи', links: [['Мои задачи', '/my-tasks']] },
    { title: '📦 Каталог', links: [['Товары', '/products']] },
    { title: '🏭 Склад', links: [['Остатки', '/inventory'], ['Места хранения', '/locations']] },
    { title: '🔄 Операции', links: [['Приход', '/receive'], ['Перемещение', '/move'], ['Отгрузка', '/ship'], ['Сканер', '/scanner']] },
    { title: '📈 Отчёты', links: [['История движений', '/movements'], ['Импорт Excel', '/import']] }
  ]

  if (role === 'ADMIN' || role === 'MANAGER') {
    sections[1].links.push(['Все задачи', '/tasks'])
  }

  return sections
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  return <html lang="ru"><body>
    <AppShell
      navSections={getNavSections(role)}
      isLoggedIn={Boolean(session?.user)}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
      userRole={role}
    >
      {children}
    </AppShell>
  </body></html>
}
