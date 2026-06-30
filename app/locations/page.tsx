export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Locations() {
  const locations = await prisma.location.findMany({ orderBy: { code: 'asc' }, include: { inventory: { include: { product: true } } } })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Locations</h1>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Code</th><th className="th">Type</th><th className="th">Rows</th><th className="th">Qty total</th><th className="th">Contents</th></tr></thead><tbody>
      {locations.map(l => <tr key={l.id}><td className="td font-bold">{l.code}</td><td className="td">{l.type}</td><td className="td">{l.inventory.length}</td><td className="td">{l.inventory.reduce((s,i)=>s+i.qty,0)}</td><td className="td">{l.inventory.map(i => `${i.product.name}: ${i.qty}`).join(', ')}</td></tr>)}
    </tbody></table></div>
  </div>
}
