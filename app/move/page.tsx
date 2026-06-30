export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { moveStock } from '@/lib/actions'

export default async function Move() {
  const products = await prisma.product.findMany({ take: 500, orderBy: { name: 'asc' } })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Move stock</h1>
    <form action={moveStock} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Product<select className="input mt-1" name="productId">{products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
      <label className="text-sm font-medium">From location<input className="input mt-1" name="fromLocation" placeholder="A16" required /></label>
      <label className="text-sm font-medium">To location<input className="input mt-1" name="toLocation" placeholder="A17 / OV01" required /></label>
      <label className="text-sm font-medium">Quantity<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <button className="btn w-fit">Move</button>
    </form>
  </div>
}
