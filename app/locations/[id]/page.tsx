export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OperationBadge } from '@/app/components/OperationBadge'

export default async function LocationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      inventory: { where: { qty: { gt: 0 }, product: { archived: false } }, include: { product: true }, orderBy: { product: { name: 'asc' } } },
      fromMoves: { take: 15, orderBy: { createdAt: 'desc' }, include: { product: true, fromLocation: true, toLocation: true } },
      toMoves: { take: 15, orderBy: { createdAt: 'desc' }, include: { product: true, fromLocation: true, toLocation: true } }
    }
  })

  if (!location || !location.active) notFound()

  const total = location.inventory.reduce((sum, item) => sum + item.qty, 0)
  const fillPercent = location.capacity ? Math.min(Math.round((total / location.capacity) * 100), 999) : null
  const movements = [...location.fromMoves, ...location.toMoves]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{location.code}</h1>
        <p className="mt-1 text-sm text-gray-500">{location.type}{location.zone ? ` · Зона ${location.zone}` : ''}</p>
      </div>
      <Link className="btn" href="/locations">Назад к местам</Link>
    </div>

    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <div className="card p-5"><div className="text-sm text-gray-500">Остаток</div><div className="mt-2 text-3xl font-bold">{total}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Позиций</div><div className="mt-2 text-3xl font-bold">{location.inventory.length}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Вместимость</div><div className="mt-2 text-3xl font-bold">{location.capacity || '-'}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Заполненность</div><div className="mt-2 text-3xl font-bold">{fillPercent === null ? '-' : `${fillPercent}%`}</div></div>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Содержимое</div>
        <table className="w-full"><thead><tr><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Кол-во</th></tr></thead><tbody>
          {location.inventory.map(item => <tr key={item.id}><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${item.product.id}`}>{item.product.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${item.product.id}`}>{item.product.name}</Link></td><td className="td font-semibold">{item.qty}</td></tr>)}
          {!location.inventory.length && <tr><td className="td text-gray-500" colSpan={3}>Это место сейчас пустое.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Последние движения</div>
        <table className="w-full"><thead><tr><th className="th">Дата</th><th className="th">Тип</th><th className="th">Товар</th><th className="th">Кол-во</th></tr></thead><tbody>
          {movements.map(m => <tr key={m.id}><td className="td whitespace-nowrap">{m.createdAt.toLocaleString('ru-RU')}</td><td className="td"><OperationBadge type={m.type} /></td><td className="td"><Link className="hover:underline" href={`/products/${m.product.id}`}>{m.product.name}</Link></td><td className="td font-semibold">{m.qty}</td></tr>)}
          {!movements.length && <tr><td className="td text-gray-500" colSpan={4}>Движений пока нет.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </div>
}
