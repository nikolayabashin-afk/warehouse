export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export default async function Movements() {
  const movements = await prisma.movement.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' },
    include: { product: true, fromLocation: true, toLocation: true, user: true }
  })

  return <div>
    <h1 className="text-3xl font-bold mb-2">Movement history</h1>
    <p className="text-sm text-gray-500 mb-6">Last 200 stock changes: receiving, moving, issuing, and adjustments.</p>

    <div className="card overflow-hidden">
      <table className="w-full">
        <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Product</th><th className="th">From</th><th className="th">To</th><th className="th">Qty</th><th className="th">Note</th></tr></thead>
        <tbody>
          {movements.map(m => <tr key={m.id}>
            <td className="td whitespace-nowrap">{m.createdAt.toLocaleString()}</td>
            <td className="td font-medium">{m.type}</td>
            <td className="td"><div className="font-medium">{m.product.name}</div><div className="text-xs text-gray-500">{m.product.sku}</div></td>
            <td className="td">{m.fromLocation?.code || '-'}</td>
            <td className="td">{m.toLocation?.code || '-'}</td>
            <td className="td font-semibold">{m.qty}</td>
            <td className="td">{m.note || ''}</td>
          </tr>)}
          {!movements.length && <tr><td className="td text-gray-500" colSpan={7}>No movements yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
