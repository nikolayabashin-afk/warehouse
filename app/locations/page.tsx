export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { removeLocation } from '@/lib/actions'
import { ConfirmSubmitButton } from '@/app/components/ConfirmSubmitButton'
import { SortHeader } from '@/app/components/SortHeader'

export default async function Locations({ searchParams }: { searchParams: Promise<{ sort?: string, order?: string }> }) {
  const { sort = '', order = '' } = await searchParams
  const direction = order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined
  const orderByMap: Record<string, any> = {
    code: { code: direction },
    type: { type: direction },
    zone: { zone: direction },
    capacity: { capacity: direction },
    status: { code: 'asc' },
    positions: { code: 'asc' },
    total: { code: 'asc' },
    content: { code: 'asc' }
  }
  const locations = await prisma.location.findMany({
    where: { active: true },
    orderBy: direction && orderByMap[sort] ? orderByMap[sort] : { code: 'asc' },
    include: { inventory: { include: { product: true } } }
  })

  const rows = locations.map(l => {
    const activeRows = l.inventory.filter(i => i.qty > 0)
    const total = activeRows.reduce((s,i)=>s+i.qty,0)
    const status = l.capacity ? total > l.capacity ? 'Перегружено' : total === l.capacity ? 'Заполнено' : total > 0 ? 'Частично' : 'Свободно' : total > 0 ? 'Используется' : 'Свободно'
    const content = activeRows.map(i => `${i.product.name}: ${i.qty}`).join(', ')
    return { location: l, activeRows, total, status, content }
  })

  if (direction && ['positions', 'total', 'status', 'content'].includes(sort)) {
    rows.sort((a, b) => {
      let result = 0
      if (sort === 'positions') result = a.activeRows.length - b.activeRows.length
      if (sort === 'total') result = a.total - b.total
      if (sort === 'status') result = a.status.localeCompare(b.status, 'ru')
      if (sort === 'content') result = a.content.localeCompare(b.content, 'ru')
      return direction === 'asc' ? result : -result
    })
  }

  const sortParams = { sort, order }

  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Места хранения</h1>
      <Link className="btn" href="/locations/new">Добавить место</Link>
    </div>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><SortHeader label="Код" sortKey="code" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Тип" sortKey="type" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Зона" sortKey="zone" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Позиций" sortKey="positions" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Остаток" sortKey="total" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Вместимость" sortKey="capacity" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Статус" sortKey="status" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Содержимое" sortKey="content" currentSort={sort} currentOrder={order} searchParams={sortParams} /><th className="th">Действие</th></tr></thead><tbody>
      {rows.map(({ location: l, activeRows, total, status, content }) => <tr key={l.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${l.id}`}>{l.code}</Link></td><td className="td">{l.type}</td><td className="td">{l.zone || ''}</td><td className="td">{activeRows.length}</td><td className="td">{total}</td><td className="td">{l.capacity || ''}</td><td className="td">{status}</td><td className="td">{content}</td><td className="td">{total === 0 ? <form action={removeLocation}><input type="hidden" name="locationId" value={l.id} /><ConfirmSubmitButton className="text-sm text-red-600 hover:underline" message="Удалить это место хранения из активного списка? История движений сохранится.">Удалить</ConfirmSubmitButton></form> : <span className="text-xs text-gray-400">Есть остаток</span>}</td></tr>)}
      {!locations.length && <tr><td className="td text-gray-500" colSpan={9}>Места хранения не найдены.</td></tr>}
    </tbody></table></div>
    <p className="text-sm text-gray-500 mt-3">“Позиций” — это количество разных товаров/строк остатков в конкретном месте хранения.</p>
  </div>
}
