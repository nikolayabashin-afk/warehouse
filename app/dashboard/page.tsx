export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Dashboard() {
  const [products, locations, invRows, movements, overflow] = await Promise.all([
    prisma.product.count({ where: { archived: false } }),
    prisma.location.count({ where: { active: true } }),
    prisma.inventory.count({ where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } } }),
    prisma.movement.count(),
    prisma.inventory.count({ where: { qty: { gt: 0 }, location: { type: { in: ['OVERFLOW', 'PATHWAY', 'FLOOR'] } } } })
  ])
  const cards = [
    ['Товары', products], ['Места хранения', locations], ['Строки остатков', invRows], ['Переполнение', overflow], ['Движения', movements]
  ]
  return <div>
    <h1 className="text-3xl font-bold mb-6">Панель управления</h1>
    <div className="grid md:grid-cols-5 gap-4">{cards.map(([k,v]) => <div className="card p-5" key={k}><div className="text-sm text-gray-500">{k}</div><div className="text-3xl font-bold mt-2">{v}</div></div>)}</div>
    <div className="card p-5 mt-6"><h2 className="font-semibold mb-2">Статус системы</h2><p className="text-sm text-gray-600">Доступны поиск, справочники товаров и мест хранения, остатки, приход, отгрузка, перемещение и история движений.</p></div>
  </div>
}
