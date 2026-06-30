export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Locations() {
  const locations = await prisma.location.findMany({ orderBy: { code: 'asc' }, include: { inventory: { include: { product: true } } } })
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Locations</h1>
      <Link className="btn" href="/locations/new">Add location</Link>
    </div>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Code</th><th className="th">Type</th><th className="th">Zone</th><th className="th">Rows</th><th className="th">Qty total</th><th className="th">Capacity</th><th className="th">Status</th><th className="th">Contents</th></tr></thead><tbody>
      {locations.map(l => {
        const total = l.inventory.reduce((s,i)=>s+i.qty,0)
        const status = l.capacity ? total > l.capacity ? 'Overloaded' : total === l.capacity ? 'Full' : total > 0 ? 'Partial' : 'Free' : ''
        return <tr key={l.id}><td className="td font-bold">{l.code}</td><td className="td">{l.type}</td><td className="td">{l.zone || ''}</td><td className="td">{l.inventory.length}</td><td className="td">{total}</td><td className="td">{l.capacity || ''}</td><td className="td">{status}</td><td className="td">{l.inventory.map(i => `${i.product.name}: ${i.qty}`).join(', ')}</td></tr>
      })}
      {!locations.length && <tr><td className="td text-gray-500" colSpan={8}>No locations found.</td></tr>}
    </tbody></table></div>
  </div>
}
