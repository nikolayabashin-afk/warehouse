export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SortHeader } from '@/app/components/SortHeader'

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string, productSort?: string, productOrder?: string, locationSort?: string, locationOrder?: string, stockSort?: string, stockOrder?: string }> }) {
  const { q = '', productSort = '', productOrder = '', locationSort = '', locationOrder = '', stockSort = '', stockOrder = '' } = await searchParams
  const term = q.trim()
  const productDirection = productOrder === 'desc' ? 'desc' : productOrder === 'asc' ? 'asc' : undefined
  const locationDirection = locationOrder === 'desc' ? 'desc' : locationOrder === 'asc' ? 'asc' : undefined
  const stockDirection = stockOrder === 'desc' ? 'desc' : stockOrder === 'asc' ? 'asc' : undefined

  const productOrderByMap: Record<string, any> = {
    sku: { sku: productDirection },
    product: { name: productDirection },
    manufacturer: { manufacturer: productDirection },
    stock: { name: 'asc' }
  }
  const locationOrderByMap: Record<string, any> = {
    code: { code: locationDirection },
    type: { type: locationDirection },
    total: { code: 'asc' },
    positions: { code: 'asc' }
  }
  const stockOrderByMap: Record<string, any> = {
    location: [{ location: { code: stockDirection } }],
    sku: [{ product: { sku: stockDirection } }],
    product: [{ product: { name: stockDirection } }],
    qty: [{ qty: stockDirection }]
  }

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
      orderBy: productDirection && productOrderByMap[productSort] ? productOrderByMap[productSort] : { name: 'asc' }
    }),
    prisma.location.findMany({
      where: { active: true, code: { contains: term, mode: 'insensitive' } },
      include: { inventory: { include: { product: true } } },
      take: 20,
      orderBy: locationDirection && locationOrderByMap[locationSort] ? locationOrderByMap[locationSort] : { code: 'asc' }
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
      orderBy: stockDirection && stockOrderByMap[stockSort] ? stockOrderByMap[stockSort] : [{ location: { code: 'asc' } }]
    })
  ]) : [[], [], []]

  if (productDirection && productSort === 'stock') {
    products.sort((a, b) => {
      const aTotal = a.inventory.reduce((sum, item) => sum + item.qty, 0)
      const bTotal = b.inventory.reduce((sum, item) => sum + item.qty, 0)
      return productDirection === 'asc' ? aTotal - bTotal : bTotal - aTotal
    })
  }

  const sortedLocations = locations.map(l => {
    const activeRows = l.inventory.filter(i => i.qty > 0)
    return { location: l, activeRows, total: activeRows.reduce((sum, i) => sum + i.qty, 0) }
  })

  if (locationDirection && ['total', 'positions'].includes(locationSort)) {
    sortedLocations.sort((a, b) => {
      const result = locationSort === 'total' ? a.total - b.total : a.activeRows.length - b.activeRows.length
      return locationDirection === 'asc' ? result : -result
    })
  }

  const allParams = { q, productSort, productOrder, locationSort, locationOrder, stockSort, stockOrder }

  return <div>
    <h1 className="text-3xl font-bold mb-6">Поиск</h1>
    <form className="card p-4 mb-5 flex gap-3"><input className="input" name="q" defaultValue={q} placeholder="Введите товар, артикул, производителя, модель или место хранения" /><button className="btn">Найти</button></form>

    {!term && <div className="card p-5 text-gray-500">Введите поисковый запрос.</div>}

    {term && <div className="grid gap-5">
      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Товары</div>
        <table className="w-full"><thead><tr><SortHeader label="Артикул" sortKey="sku" currentSort={productSort} currentOrder={productOrder} searchParams={allParams} sortParam="productSort" orderParam="productOrder" /><SortHeader label="Товар" sortKey="product" currentSort={productSort} currentOrder={productOrder} searchParams={allParams} sortParam="productSort" orderParam="productOrder" /><SortHeader label="Производитель" sortKey="manufacturer" currentSort={productSort} currentOrder={productOrder} searchParams={allParams} sortParam="productSort" orderParam="productOrder" /><SortHeader label="Остаток" sortKey="stock" currentSort={productSort} currentOrder={productOrder} searchParams={allParams} sortParam="productSort" orderParam="productOrder" /></tr></thead><tbody>
          {products.map(p => <tr key={p.id}><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${p.id}`}>{p.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${p.id}`}>{p.name}</Link></td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.inventory.reduce((sum, i) => sum + i.qty, 0)}</td></tr>)}
          {!products.length && <tr><td className="td text-gray-500" colSpan={4}>Товары не найдены.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Места хранения</div>
        <table className="w-full"><thead><tr><SortHeader label="Код" sortKey="code" currentSort={locationSort} currentOrder={locationOrder} searchParams={allParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Тип" sortKey="type" currentSort={locationSort} currentOrder={locationOrder} searchParams={allParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Остаток" sortKey="total" currentSort={locationSort} currentOrder={locationOrder} searchParams={allParams} sortParam="locationSort" orderParam="locationOrder" /><SortHeader label="Позиций" sortKey="positions" currentSort={locationSort} currentOrder={locationOrder} searchParams={allParams} sortParam="locationSort" orderParam="locationOrder" /></tr></thead><tbody>
          {sortedLocations.map(({ location: l, activeRows, total }) => <tr key={l.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${l.id}`}>{l.code}</Link></td><td className="td">{l.type}</td><td className="td">{total}</td><td className="td">{activeRows.length}</td></tr>)}
          {!locations.length && <tr><td className="td text-gray-500" colSpan={4}>Места хранения не найдены.</td></tr>}
        </tbody></table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Остатки</div>
        <table className="w-full"><thead><tr><SortHeader label="Место" sortKey="location" currentSort={stockSort} currentOrder={stockOrder} searchParams={allParams} sortParam="stockSort" orderParam="stockOrder" /><SortHeader label="Артикул" sortKey="sku" currentSort={stockSort} currentOrder={stockOrder} searchParams={allParams} sortParam="stockSort" orderParam="stockOrder" /><SortHeader label="Товар" sortKey="product" currentSort={stockSort} currentOrder={stockOrder} searchParams={allParams} sortParam="stockSort" orderParam="stockOrder" /><SortHeader label="Кол-во" sortKey="qty" currentSort={stockSort} currentOrder={stockOrder} searchParams={allParams} sortParam="stockSort" orderParam="stockOrder" /></tr></thead><tbody>
          {rows.map(r => <tr key={r.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${r.location.id}`}>{r.location.code}</Link></td><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${r.product.id}`}>{r.product.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${r.product.id}`}>{r.product.name}</Link></td><td className="td">{r.qty}</td></tr>)}
          {!rows.length && <tr><td className="td text-gray-500" colSpan={4}>Остатки не найдены.</td></tr>}
        </tbody></table>
      </section>
    </div>}
  </div>
}
