export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { removeProduct } from '@/lib/actions'
import { ConfirmSubmitButton } from '@/app/components/ConfirmSubmitButton'

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const products = await prisma.product.findMany({
    where: { archived: false, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }, { model: { contains: q, mode: 'insensitive' } }] } : {}) },
    take: 100,
    orderBy: { name: 'asc' },
    include: { inventory: { include: { location: true } } }
  })
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Товары</h1>
      <Link className="btn" href="/products/new">Добавить товар</Link>
    </div>
    <form className="card p-4 mb-5"><input className="input" name="q" defaultValue={q} placeholder="Поиск по товару, артикулу, производителю или модели" /></form>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Артикул</th><th className="th">Наименование</th><th className="th">Производитель</th><th className="th">Модель</th><th className="th">Категория</th><th className="th">Остаток</th><th className="th">Места хранения</th><th className="th">Действие</th></tr></thead><tbody>
      {products.map(p => {
        const total = p.inventory.reduce((s,i)=>s+i.qty,0)
        return <tr key={p.id}><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${p.id}`}>{p.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${p.id}`}>{p.name}</Link></td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.model || ''}</td><td className="td">{p.category || ''}</td><td className="td">{total}</td><td className="td">{p.inventory.map(i => `${i.location.code}: ${i.qty}`).join(', ')}</td><td className="td">{total === 0 ? <form action={removeProduct}><input type="hidden" name="productId" value={p.id} /><ConfirmSubmitButton className="text-sm text-red-600 hover:underline" message="Удалить этот товар из активного каталога? История движений сохранится.">Удалить</ConfirmSubmitButton></form> : <span className="text-xs text-gray-400">Есть остаток</span>}</td></tr>
      })}
      {!products.length && <tr><td className="td text-gray-500" colSpan={8}>Товары не найдены.</td></tr>}
    </tbody></table></div>
  </div>
}
