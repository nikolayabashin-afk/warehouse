export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Inventory() {
  const rows = await prisma.inventory.findMany({ take: 250, orderBy: [{ location: { code: 'asc' } }], include: { product: true, location: true } })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Inventory by location</h1>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Location</th><th className="th">SKU</th><th className="th">Product</th><th className="th">Qty</th><th className="th">Batch</th></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}><td className="td font-bold">{r.location.code}</td><td className="td">{r.product.sku}</td><td className="td">{r.product.name}</td><td className="td">{r.qty}</td><td className="td">{r.batch || ''}</td></tr>)}
    </tbody></table></div>
  </div>
}
