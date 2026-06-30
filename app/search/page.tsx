export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const term = q.trim()
  const [products, locations, rows] = term ? await Promise.all([
    prisma.product.findMany({
      where: { archived: false, OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { manufacturer: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } }
      ] },
      include: { inventory: { include: { location: true } } },
      take: 20,
      orderBy: { name: 'asc' }
    }),
    prisma.location.findMany({
      where: { active: true, code: { contains: term, mode: 'insensitive' } },
      include: { inventory: { include: { product: true } } },
      take: 20,
      orderBy: { code: 'asc' }
    }),
    prisma.inventory.findMany({
      where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true }, OR: [
        { product: { name: { contains: term, mode: 'insensitive' } } },
        { product: { sku: { contains: term, mode: 'insensitive' } } },
        { product: { manufacturer: { contains: term, mode: 'insensitive' } } },
        { product: { model: { contains: term, mode: 'insensitive' } } },
        { location: { code: { contains: term, mode: 'insensitive' } } }
      ] },
      include: { product: true, location: true },
      take: 100,
      orderBy: [{ location: { code: 'asc' } }]
    })
  ]) : [[], [], []]

  return <div>
    <h1 className="text-3xl font-bold mb-6">Поиск</h1>
    <form className="card p-4 mb-5 flex gap-3"><input className="input" name="q" defaultValue={q} placeholder="Введите товар, артикул, производителя, модель или место хранения" /><button className="btn">Найти</button></form>

    {!term && <div className="card p-5 text-gray-500">Введите поисковый запрос.</div>}

    {term && <div className="grid gap-5">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Товары</div>
        <table className="w-full"><thead><tr><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Производитель</th><th className="th">Остаток</th></tr></thead><tbody>
          {products.map(p => <tr key={p.id}><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${p.id}`}>{p.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${p.id}`}>{p.name}</Link></td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.inventory.reduce((sum, i) => sum + i.qty, 0)}</td></tr>)}
          {!products.length && <tr><td className="td text-gray-500" colSpan={4}>Товары не найдены.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Места хранения</div>
        <table className="w-full"><thead><tr><th className="th">Код</th><th className="th">Тип</th><th className="th">Остаток</th><th className="th">Позиций</th></tr></thead><tbody>
          {locations.map(l => {
            const activeRows = l.inventory.filter(i => i.qty > 0)
            return <tr key={l.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${l.id}`}>{l.code}</Link></td><td className="td">{l.type}</td><td className="td">{activeRows.reduce((sum, i) => sum + i.qty, 0)}</td><td className="td">{activeRows.length}</td></tr>
          })}
          {!locations.length && <tr><td className="td text-gray-500" colSpan={4}>Места хранения не найдены.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Остатки</div>
        <table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Кол-во</th></tr></thead><tbody>
          {rows.map(r => <tr key={r.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${r.location.id}`}>{r.location.code}</Link></td><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${r.product.id}`}>{r.product.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${r.product.id}`}>{r.product.name}</Link></td><td className="td">{r.qty}</td></tr>)}
          {!rows.length && <tr><td className="td text-gray-500" colSpan={4}>Остатки не найдены.</td></tr>}
        </tbody></table>
      </section>
    </div>}
  </div>
}
