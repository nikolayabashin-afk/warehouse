export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { moveStock } from '@/lib/actions'

export default async function Move() {
  const products = await prisma.product.findMany({ take: 500, orderBy: { name: 'asc' } })
  const locations = await prisma.location.findMany({ take: 500, orderBy: { code: 'asc' } })
  const inventory = await prisma.inventory.findMany({
    take: 300,
    orderBy: [{ product: { name: 'asc' } }, { location: { code: 'asc' } }],
    include: { product: true, location: true }
  })

  return <div>
    <h1 className="text-3xl font-bold mb-2">Move stock</h1>
    <p className="text-sm text-gray-500 mb-6">Move existing stock from one location to another. Source location must have enough quantity.</p>

    <form action={moveStock} className="card p-5 grid gap-4 max-w-2xl mb-6">
      <label className="text-sm font-medium">Product<select className="input mt-1" name="productId" required>{products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
      <label className="text-sm font-medium">From location<input className="input mt-1" name="fromLocation" list="locations" placeholder="A16" required /></label>
      <label className="text-sm font-medium">To location<input className="input mt-1" name="toLocation" list="locations" placeholder="A17 / OV01" required /></label>
      <datalist id="locations">{locations.map(l => <option key={l.id} value={l.code} />)}</datalist>
      <label className="text-sm font-medium">Quantity<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <label className="text-sm font-medium">Note<input className="input mt-1" name="note" /></label>
      <button className="btn w-fit">Move</button>
    </form>

    <div className="card overflow-hidden">
      <table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Location</th><th className="th">Available qty</th></tr></thead><tbody>
        {inventory.map(i => <tr key={i.id}><td className="td"><div className="font-medium">{i.product.name}</div><div className="text-xs text-gray-500">{i.product.sku}</div></td><td className="td font-bold">{i.location.code}</td><td className="td">{i.qty}</td></tr>)}
        {!inventory.length && <tr><td className="td text-gray-500" colSpan={3}>No stock available to move.</td></tr>}
      </tbody></table>
    </div>
  </div>
}
