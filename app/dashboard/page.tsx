export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OperationBadge } from '@/app/components/OperationBadge'

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export default async function Dashboard() {
  const today = startOfToday()
  const [products, locations, occupiedLocations, totalStockAgg, movementsToday, recentMovements, topLocations] = await Promise.all([
    prisma.product.count({ where: { archived: false } }),
    prisma.location.count({ where: { active: true } }),
    prisma.location.count({ where: { active: true, inventory: { some: { qty: { gt: 0 } } } } }),
    prisma.inventory.aggregate({ where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } }, _sum: { qty: true } }),
    prisma.movement.count({ where: { createdAt: { gte: today } } }),
    prisma.movement.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { product: true, fromLocation: true, toLocation: true } }),
    prisma.location.findMany({ where: { active: true, inventory: { some: { qty: { gt: 0 } } } }, take: 10, orderBy: { code: 'asc' }, include: { inventory: { where: { qty: { gt: 0 } }, include: { product: true } } } })
  ])

  const totalStock = totalStockAgg._sum.qty || 0
  const emptyLocations = Math.max(locations - occupiedLocations, 0)
  const cards = [
    ['Товаров', products],
    ['Общий остаток', totalStock],
    ['Мест хранения', locations],
    ['Занято мест', occupiedLocations],
    ['Свободно мест', emptyLocations],
    ['Движений сегодня', movementsToday]
  ]

  const sortedTopLocations = topLocations
    .map(location => ({ ...location, total: location.inventory.reduce((sum, item) => sum + item.qty, 0), rows: location.inventory.length }))
    .sort((a, b) => b.total - a.total)

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <p className="mt-1 text-sm text-gray-500">Быстрый обзор склада, остатков и последних операций.</p>
      </div>
      <div className="flex gap-2">
        <Link className="btn" href="/receive">Приход</Link>
        <Link className="btn" href="/move">Перемещение</Link>
        <Link className="btn" href="/ship">Отгрузка</Link>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) => <div className="card p-5" key={label}><div className="text-sm text-gray-500">{label}</div><div className="mt-2 text-3xl font-bold">{value}</div></div>)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Последние движения</div>
        <table className="w-full"><thead><tr><th className="th">Тип</th><th className="th">Товар</th><th className="th">Маршрут</th><th className="th">Кол-во</th></tr></thead><tbody>
          {recentMovements.map(m => <tr key={m.id}><td className="td"><OperationBadge type={m.type} /></td><td className="td"><Link className="font-medium hover:underline" href={`/products/${m.product.id}`}>{m.product.name}</Link><div className="text-xs text-gray-500">{m.product.sku}</div></td><td className="td text-sm">{m.fromLocation?.code || '-'} → {m.toLocation?.code || '-'}</td><td className="td font-semibold">{m.qty}</td></tr>)}
          {!recentMovements.length && <tr><td className="td text-gray-500" colSpan={4}>Движений пока нет.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Топ заполненных мест</div>
        <table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Остаток</th><th className="th">Позиций</th><th className="th">Вместимость</th></tr></thead><tbody>
          {sortedTopLocations.map(location => <tr key={location.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${location.id}`}>{location.code}</Link></td><td className="td">{location.total}</td><td className="td">{location.rows}</td><td className="td">{location.capacity || ''}</td></tr>)}
          {!sortedTopLocations.length && <tr><td className="td text-gray-500" colSpan={4}>Заполненных мест пока нет.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </div>
}
