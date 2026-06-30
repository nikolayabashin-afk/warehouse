export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OperationBadge } from '@/app/components/OperationBadge'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventory: { where: { qty: { gt: 0 }, location: { active: true } }, include: { location: true }, orderBy: { location: { code: 'asc' } } },
      movements: { take: 30, orderBy: { createdAt: 'desc' }, include: { fromLocation: true, toLocation: true } }
    }
  })

  if (!product || product.archived) notFound()

  const total = product.inventory.reduce((sum, item) => sum + item.qty, 0)

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Артикул: {product.sku}</p>
      </div>
      <Link className="btn" href="/products">Назад к товарам</Link>
    </div>

    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <div className="card p-5"><div className="text-sm text-gray-500">Общий остаток</div><div className="mt-2 text-3xl font-bold">{total}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Мест хранения</div><div className="mt-2 text-3xl font-bold">{product.inventory.length}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Производитель</div><div className="mt-2 font-semibold">{product.manufacturer || '-'}</div></div>
      <div className="card p-5"><div className="text-sm text-gray-500">Модель</div><div className="mt-2 font-semibold">{product.model || '-'}</div></div>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Места хранения</div>
        <table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Кол-во</th><th className="th">Тип</th><th className="th">Зона</th></tr></thead><tbody>
          {product.inventory.map(item => <tr key={item.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${item.location.id}`}>{item.location.code}</Link></td><td className="td font-semibold">{item.qty}</td><td className="td">{item.location.type}</td><td className="td">{item.location.zone || ''}</td></tr>)}
          {!product.inventory.length && <tr><td className="td text-gray-500" colSpan={4}>Остатков по товару нет.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Последние движения</div>
        <table className="w-full"><thead><tr><th className="th">Дата</th><th className="th">Тип</th><th className="th">Маршрут</th><th className="th">Кол-во</th></tr></thead><tbody>
          {product.movements.map(m => <tr key={m.id}><td className="td whitespace-nowrap">{m.createdAt.toLocaleString('ru-RU')}</td><td className="td"><OperationBadge type={m.type} /></td><td className="td">{m.fromLocation?.code || '-'} → {m.toLocation?.code || '-'}</td><td className="td font-semibold">{m.qty}</td></tr>)}
          {!product.movements.length && <tr><td className="td text-gray-500" colSpan={4}>Движений пока нет.</td></tr>}
        </tbody></table>
      </section>
    </div>
  </div>
}
