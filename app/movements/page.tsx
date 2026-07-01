export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OperationBadge } from '@/app/components/OperationBadge'
import { SortHeader } from '@/app/components/SortHeader'

export default async function Movements({ searchParams }: { searchParams: Promise<{ sort?: string, order?: string }> }) {
  const { sort = '', order = '' } = await searchParams
  const direction = order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined
  const orderByMap: Record<string, any> = {
    date: { createdAt: direction },
    type: { type: direction },
    product: { product: { name: direction } },
    from: { fromLocation: { code: direction } },
    to: { toLocation: { code: direction } },
    qty: { qty: direction },
    note: { note: direction }
  }

  const movements = await prisma.movement.findMany({
    take: 200,
    orderBy: direction && orderByMap[sort] ? orderByMap[sort] : { createdAt: 'desc' },
    include: { product: true, fromLocation: true, toLocation: true, user: true }
  })
  const sortParams = { sort, order }

  return <div>
    <h1 className="text-3xl font-bold mb-2">История движений</h1>
    <p className="text-sm text-gray-500 mb-6">Последние 200 операций: приход, отгрузка, перемещение и корректировки.</p>

    <div className="card overflow-hidden">
      <table className="w-full">
        <thead><tr><SortHeader label="Дата" sortKey="date" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Тип" sortKey="type" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Товар" sortKey="product" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Из места" sortKey="from" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="В место" sortKey="to" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Кол-во" sortKey="qty" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Примечание" sortKey="note" currentSort={sort} currentOrder={order} searchParams={sortParams} /></tr></thead>
        <tbody>
          {movements.map(m => <tr key={m.id}>
            <td className="td whitespace-nowrap">{m.createdAt.toLocaleString('ru-RU')}</td>
            <td className="td"><OperationBadge type={m.type} /></td>
            <td className="td"><Link className="font-medium hover:underline" href={`/products/${m.product.id}`}>{m.product.name}</Link><div className="text-xs text-gray-500">{m.product.sku}</div></td>
            <td className="td">{m.fromLocation ? <Link className="text-blue-600 hover:underline" href={`/locations/${m.fromLocation.id}`}>{m.fromLocation.code}</Link> : '-'}</td>
            <td className="td">{m.toLocation ? <Link className="text-blue-600 hover:underline" href={`/locations/${m.toLocation.id}`}>{m.toLocation.code}</Link> : '-'}</td>
            <td className="td font-semibold">{m.qty}</td>
            <td className="td">{m.note || ''}</td>
          </tr>)}
          {!movements.length && <tr><td className="td text-gray-500" colSpan={7}>Движений пока нет.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
