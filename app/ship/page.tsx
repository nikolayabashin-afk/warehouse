export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { shipStock } from '@/lib/actions'

export default async function Ship() {
  const products = await prisma.product.findMany({ where: { archived: false }, take: 500, orderBy: { name: 'asc' } })
  const locations = await prisma.location.findMany({ where: { active: true }, take: 500, orderBy: { code: 'asc' } })
  const inventory = await prisma.inventory.findMany({
    where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } },
    take: 300,
    include: { product: true, location: true }
  })

  return <div>
    <h1 className="text-3xl font-bold mb-2">Ship stock</h1>
    <p className="text-sm text-gray-500 mb-6">Use this when items leave the warehouse.</p>

    <form action={shipStock} className="card p-5 grid gap-4 max-w-2xl mb-6">
      <label className="text-sm font-medium">Product<select className="input mt-1" name="productId" required>{products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
      <label className="text-sm font-medium">From location<input className="input mt-1" name="fromLocation" list="locations" placeholder="A16" required /></label>
      <datalist id="locations">{locations.map(l => <option key={l.id} value={l.code} />)}</datalist>
      <label className="text-sm font-medium">Quantity<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <label className="text-sm font-medium">Note<input className="input mt-1" name="note" placeholder="Order, destination, project, etc." /></label>
      <button className="btn w-fit">Ship out</button>
    </form>

    <div className="card overflow-hidden">
      <table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Location</th><th className="th">Available qty</th></tr></thead><tbody>
        {inventory.map(i => <tr key={i.id}><td className="td"><div className="font-medium">{i.product.name}</div><div className="text-xs text-gray-500">{i.product.sku}</div></td><td className="td font-bold">{i.location.code}</td><td className="td">{i.qty}</td></tr>)}
        {!inventory.length && <tr><td className="td text-gray-500" colSpan={3}>No stock available.</td></tr>}
      </tbody></table>
    </div>
  </div>
}
