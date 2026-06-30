export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const term = q.trim()
  const rows = term ? await prisma.inventory.findMany({
    where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true }, OR: [
      { product: { name: { contains: term, mode: 'insensitive' } } },
      { product: { sku: { contains: term, mode: 'insensitive' } } },
      { product: { manufacturer: { contains: term, mode: 'insensitive' } } },
      { location: { code: { contains: term, mode: 'insensitive' } } }
    ] },
    include: { product: true, location: true },
    take: 100,
    orderBy: [{ location: { code: 'asc' } }]
  }) : []
  return <div>
    <h1 className="text-3xl font-bold mb-6">Поиск</h1>
    <form className="card p-4 mb-5 flex gap-3"><input className="input" name="q" defaultValue={q} placeholder="Введите товар, артикул, производителя или место хранения, например A16" /><button className="btn">Найти</button></form>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Производитель</th><th className="th">Кол-во</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td className="td font-bold">{r.location.code}</td><td className="td">{r.product.sku}</td><td className="td font-medium">{r.product.name}</td><td className="td">{r.product.manufacturer || ''}</td><td className="td">{r.qty}</td></tr>)}
      {!term && <tr><td className="td" colSpan={5}>Введите поисковый запрос.</td></tr>}
      {term && rows.length === 0 && <tr><td className="td" colSpan={5}>Ничего не найдено.</td></tr>}
    </tbody></table></div>
  </div>
}
