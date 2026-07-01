export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { removeProduct } from '@/lib/actions'
import { ConfirmSubmitButton } from '@/app/components/ConfirmSubmitButton'
import { SortHeader } from '@/app/components/SortHeader'

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string, sort?: string, order?: string }> }) {
  const { q = '', sort = '', order = '' } = await searchParams
  const direction = order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined
  const orderByMap: Record<string, any> = {
    sku: { sku: direction },
    name: { name: direction },
    manufacturer: { manufacturer: direction },
    model: { model: direction },
    category: { category: direction }
  }

  const products = await prisma.product.findMany({
    where: { archived: false, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }, { model: { contains: q, mode: 'insensitive' } }] } : {}) },
    take: 100,
    orderBy: direction && orderByMap[sort] ? orderByMap[sort] : { name: 'asc' },
    include: { inventory: { include: { location: true } } }
  })

  if (direction && sort === 'stock') {
    products.sort((a, b) => {
      const aTotal = a.inventory.reduce((s, i) => s + i.qty, 0)
      const bTotal = b.inventory.reduce((s, i) => s + i.qty, 0)
      return direction === 'asc' ? aTotal - bTotal : bTotal - aTotal
    })
  }

  const sortParams = { q, sort, order }

  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Товары</h1>
      <Link className="btn" href="/products/new">Добавить товар</Link>
    </div>
    <form className="card p-4 mb-5"><input className="input" name="q" defaultValue={q} placeholder="Поиск по товару, артикулу, производителю или модели" /></form>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><SortHeader label="Артикул" sortKey="sku" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Наименование" sortKey="name" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Производитель" sortKey="manufacturer" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Модель" sortKey="model" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Категория" sortKey="category" currentSort={sort} currentOrder={order} searchParams={sortParams} /><SortHeader label="Остаток" sortKey="stock" currentSort={sort} currentOrder={order} searchParams={sortParams} /><th className="th">Места хранения</th><th className="th">Действие</th></tr></thead><tbody>
      {products.map(p => {
        const total = p.inventory.reduce((s,i)=>s+i.qty,0)
        return <tr key={p.id}><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${p.id}`}>{p.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${p.id}`}>{p.name}</Link></td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.model || ''}</td><td className="td">{p.category || ''}</td><td className="td">{total}</td><td className="td">{p.inventory.map(i => `${i.location.code}: ${i.qty}`).join(', ')}</td><td className="td">{total === 0 ? <form action={removeProduct}><input type="hidden" name="productId" value={p.id} /><ConfirmSubmitButton className="text-sm text-red-600 hover:underline" message="Удалить этот товар из активного каталога? История движений сохранится.">Удалить</ConfirmSubmitButton></form> : <span className="text-xs text-gray-400">Есть остаток</span>}</td></tr>
      })}
      {!products.length && <tr><td className="td text-gray-500" colSpan={8}>Товары не найдены.</td></tr>}
    </tbody></table></div>
  </div>
}
