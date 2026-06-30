export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Inventory() {
  const rows = await prisma.inventory.findMany({
    where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } },
    take: 250,
    orderBy: [{ location: { code: 'asc' } }],
    include: { product: true, location: true }
  })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Остатки по местам хранения</h1>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Место</th><th className="th">Артикул</th><th className="th">Товар</th><th className="th">Количество</th><th className="th">Партия</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td className="td font-bold">{r.location.code}</td><td className="td">{r.product.sku}</td><td className="td">{r.product.name}</td><td className="td">{r.qty}</td><td className="td">{r.batch || ''}</td></tr>)}
      {!rows.length && <tr><td className="td text-gray-500" colSpan={5}>Активных остатков нет.</td></tr>}
    </tbody></table></div>
  </div>
}
