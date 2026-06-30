import { prisma } from '@/lib/prisma'
import { receiveStock } from '@/lib/actions'

export default async function Receive() {
  const products = await prisma.product.findMany({ take: 500, orderBy: { name: 'asc' } })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Receive stock</h1>
    <form action={receiveStock} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Product<select className="input mt-1" name="productId">{products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
      <label className="text-sm font-medium">Location<input className="input mt-1" name="location" placeholder="A16 / OV01 / FL01" required /></label>
      <label className="text-sm font-medium">Quantity<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <label className="text-sm font-medium">Note<input className="input mt-1" name="note" /></label>
      <button className="btn w-fit">Receive</button>
    </form>
  </div>
}
