export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Dashboard() {
  const [products, locations, invRows, movements, overflow] = await Promise.all([
    prisma.product.count({ where: { archived: false } }),
    prisma.location.count({ where: { active: true } }),
    prisma.inventory.count(),
    prisma.movement.count(),
    prisma.inventory.count({ where: { location: { type: { in: ['OVERFLOW', 'PATHWAY', 'FLOOR'] } } } })
  ])
  const cards = [
    ['Products', products], ['Locations', locations], ['Stock rows', invRows], ['Overflow rows', overflow], ['Movements', movements]
  ]
  return <div>
    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    <div className="grid md:grid-cols-5 gap-4">{cards.map(([k,v]) => <div className="card p-5" key={k}><div className="text-sm text-gray-500">{k}</div><div className="text-3xl font-bold mt-2">{v}</div></div>)}</div>
    <div className="card p-5 mt-6"><h2 className="font-semibold mb-2">MVP status</h2><p className="text-sm text-gray-600">Search, product/location inventory, receiving, moving, and movement history are included. Capacity checks and QR scan pages are next.</p></div>
  </div>
}
