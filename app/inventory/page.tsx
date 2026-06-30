export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Inventory({ searchParams }: { searchParams: Promise<{ q?: string, location?: string, manufacturer?: string, category?: string, status?: string }> }) {
  const { q = '', location = '', manufacturer = '', category = '', status = 'in_stock' } = await searchParams
  const term = q.trim()

  const where = {
    ...(status === 'all' ? {} : { qty: { gt: 0 } }),
    product: {
      archived: false,
      ...(manufacturer ? { manufacturer } : {}),
      ...(category ? { category } : {}),
      ...(term ? { OR: [
        { name: { contains: term, mode: 'insensitive' as const } },
        { sku: { contains: term, mode: 'insensitive' as const } },
        { manufacturer: { contains: term, mode: 'insensitive' as const } },
        { model: { contains: term, mode: 'insensitive' as const } }
      ] } : {})
    },
    location: {
      active: true,
      ...(location ? { code: { contains: location, mode: 'insensitive' as const } } : {})
    }
  }

  const [rows, locations, manufacturersRaw, categoriesRaw] = await Promise.all([
    prisma.inventory.findMany({
      where,
      take: 500,
      orderBy: [{ location: { code: 'asc' } }, { product: { name: 'asc' } }],
      include: { product: true, location: true }
    }),
    prisma.location.findMany({ where: { active: true }, select: { code: true }, orderBy: { code: 'asc' } }),
    prisma.product.findMany({ where: { archived: false, manufacturer: { not: null } }, select: { manufacturer: true }, distinct: ['manufacturer'], orderBy: { manufacturer: 'asc' } }),
    prisma.product.findMany({ where: { archived: false, category: { not: null } }, select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } })
  ])

  const manufacturers = manufacturersRaw.map(item => item.manufacturer).filter(Boolean) as string[]
  const categories = categoriesRaw.map(item => item.category).filter(Boolean) as string[]
  const total = rows.reduce((sum, row) => sum + row.qty, 0)

  return <div>
    <div className="sticky top-[73px] z-10 mb-6 rounded-2xl border bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Остатки по местам хранения</h1>
          <p className="mt-1 text-sm text-gray-500">Найдено строк: {rows.length}. Общий остаток по фильтру: {total}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/receive">Приход</Link>
          <Link className="btn" href="/move">Перемещение</Link>
          <Link className="btn" href="/ship">Отгрузка</Link>
        </div>
      </div>
    </div>

    <form className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
      <input className="input" name="q" defaultValue={q} placeholder="Товар, артикул, производитель, модель" />
      <input className="input" name="location" defaultValue={location} list="location-options" placeholder="Место хранения" />
      <datalist id="location-options">{locations.map(item => <option key={item.code} value={item.code} />)}</datalist>
      <select className="input" name="manufacturer" defaultValue={manufacturer}>
        <option value="">Все производители</option>
        {manufacturers.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="input" name="category" defaultValue={category}>
        <option value="">Все категории</option>
        {categories.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select className="input" name="status" defaultValue={status}>
        <option value="in_stock">Только с остатком</option>
        <option value="all">Все строки</option>
      </select>
      <div className="flex gap-2 md:col-span-5">
        <button className="btn">Применить фильтры</button>
        <Link className="btn-secondary" href="/inventory">Сбросить</Link>
      </div>
    </form>

    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Производитель</th><th className="th">Категория</th><th className="th">Количество</th><th className="th">Партия</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${r.location.id}`}>{r.location.code}</Link></td><td className="td"><Link className="text-blue-600 hover:underline" href={`/products/${r.product.id}`}>{r.product.sku}</Link></td><td className="td font-medium"><Link className="hover:underline" href={`/products/${r.product.id}`}>{r.product.name}</Link></td><td className="td">{r.product.manufacturer || ''}</td><td className="td">{r.product.category || ''}</td><td className="td font-semibold">{r.qty}</td><td className="td">{r.batch || ''}</td></tr>)}
      {!rows.length && <tr><td className="td text-gray-500" colSpan={7}>Активных остатков по фильтрам нет.</td></tr>}
    </tbody></table></div>
  </div>
}
