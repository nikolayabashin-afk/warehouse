export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OperationBadge } from '@/app/components/OperationBadge'
import { SortHeader } from '@/app/components/SortHeader'

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ recentSort?: string, recentOrder?: string, locationSort?: string, locationOrder?: string }> }) {
  const { recentSort = '', recentOrder = '', locationSort = '', locationOrder = '' } = await searchParams
  const recentDirection = recentOrder === 'desc' ? 'desc' : recentOrder === 'asc' ? 'asc' : undefined
  const locationDirection = locationOrder === 'desc' ? 'desc' : locationOrder === 'asc' ? 'asc' : undefined
  const recentOrderByMap: Record<string, any> = {
    date: { createdAt: recentDirection },
    type: { type: recentDirection },
    product: { product: { name: recentDirection } },
    route: { createdAt: recentDirection },
    qty: { qty: recentDirection }
  }
  const today = startOfToday()
  const [products, locations, occupiedLocations, totalStockAgg, movementsToday, openTasks, recentMovements, topLocations] = await Promise.all([
    prisma.product.count({ where: { archived: false } }),
    prisma.location.count({ where: { active: true } }),
    prisma.location.count({ where: { active: true, inventory: { some: { qty: { gt: 0 } } } } }),
    prisma.inventory.aggregate({ where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } }, _sum: { qty: true } }),
    prisma.movement.count({ where: { createdAt: { gte: today } } }),
    prisma.warehouseTask.count({ where: { status: 'OPEN' } }),
    prisma.movement.findMany({ take: 8, orderBy: recentDirection && recentOrderByMap[recentSort] ? recentOrderByMap[recentSort] : { createdAt: 'desc' }, include: { product: true, fromLocation: true, toLocation: true } }),
    prisma.location.findMany({ where: { active: true, inventory: { some: { qty: { gt: 0 } } } }, take: 10, orderBy: { code: 'asc' }, include: { inventory: { where: { qty: { gt: 0 } }, include: { product: true } } } })
  ])

  const totalStock = totalStockAgg._sum.qty || 0
  const emptyLocations = Math.max(locations - occupiedLocations, 0)
  const cards = [
    ['Товаров', products, '/products'],
    ['Общий остаток', totalStock, '/inventory'],
    ['Мест хранения', locations, '/locations'],
    ['Занято мест', occupiedLocations, '/locations'],
    ['Свободно мест', emptyLocations, '/locations'],
    ['Открытых задач', openTasks, '/my-tasks'],
    ['Движений сегодня', movementsToday, '/movements']
  ]

  const sortedTopLocations = topLocations
    .map(location => ({ ...location, total: location.inventory.reduce((sum, item) => sum + item.qty, 0), rows: location.inventory.length }))
    .sort((a, b) => {
      if (!locationDirection) return b.total - a.total
      let result = 0
      if (locationSort === 'location') result = a.code.localeCompare(b.code, 'ru')
      if (locationSort === 'total') result = a.total - b.total
      if (locationSort === 'rows') result = a.rows - b.rows
      if (locationSort === 'capacity') result = (a.capacity || 0) - (b.capacity || 0)
      return locationDirection === 'asc' ? result : -result
    })

  const sortParams = { recentSort, recentOrder, locationSort, locationOrder }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <p className="mt-1 text-sm text-gray-500">Быстрый обзор склада, остатков, задач и последних операций.</p>
      </div>
      <div className="flex gap-2">
        <Link className="btn" href="/my-tasks">Мои задачи</Link>
        <Link className="btn" href="/receive">Приход</Link>
        <Link className="btn" href="/move">Перемещение</Link>
        <Link className="btn" href="/ship">Отгрузка</Link>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">{cards.map(([label, value, href]) => <Link className="card p-5 hover:shadow-md" key={label} href={href as string}><div className="text-sm text-gray-500">{label}</div><div className="mt-2 text-3xl font-bold">{value}</div></Link>)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Последние движения</div>
        <table className="w-full"><thead><tr><SortHeader label="Тип" sortKey="type" currentSort={recentSort} currentOrder={recentOrder} searchParams={sortParams} sortParam="recentSort" orderParam="recentOrder" /><SortHeader label="Товар" sortKey="product" currentSort={recentSort} currentOrder={recentOrder} searchParams={sortParams} sortParam="recentSort" orderParam="recentOrder" /><th className="th">Маршрут</th><SortHeader label="Кол-во" sortKey="qty" currentSort={recentSort} currentOrder={recentOrder} searchParams={sortParams} sortParam="recentSort" orderParam="recentOrder" /></tr></thead><tbody>
          {recentMovements.map(m => <tr key={m.id}><td className="td"><OperationBadge type={m.type} /></td><td className="td"><Link className="font-medium hover:underline" href={`/products/${m.product.id}`}>{m.product.name}</Link><div className="text-xs text-gray-500">{m.product.sku}</div></td><td className="td text-sm">{m.fromLocation?.code || '-'} → {m.toLocation?.code || '-'}</td><td className="td font-semibold">{m.qty}</td></tr>)}
          {!recentMovements.length && <tr><td className="td text-gray-500" colSpan={4}>Движений пока нет.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Топ заполненных мест</div>
        <table className="w-full"><thead><tr><SortHeader label="Место" sortKey="location" currentSort={locationSort} currentOrder={locationOrder} searchParams={sortParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Остаток" sortKey="total" currentSort={locationSort} currentOrder={locationOrder} searchParams={sortParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Позиций" sortKey="rows" currentSort={locationSort} currentOrder={locationOrder} searchParams={sortParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Вместимость" sortKey="capacity" currentSort={locationSort} currentOrder={locationOrder} searchParams={sortParams} sortParam="locationSort" orderParam="locationOrder" /></tr></thead><tbody>
          {sortedTopLocations.map(location => <tr key={location.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${location.id}`}>{location.code}</Link></td><td className="td">{location.total}</td><td className="td">{location.rows}</td><td className="td">{location.capacity || ''}</td></tr>)}
          {!sortedTopLocations.length && <tr><td className="td text-gray-500" colSpan={4}>Заполненных мест пока нет.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </div>
}
