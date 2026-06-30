export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { removeProduct } from '@/lib/actions'

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const products = await prisma.product.findMany({
    where: { archived: false, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }, { model: { contains: q, mode: 'insensitive' } }] } : {}) },
    take: 100,
    orderBy: { name: 'asc' },
    include: { inventory: { include: { location: true } } }
  })
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Products</h1>
      <Link className="btn" href="/products/new">Add product</Link>
    </div>
    <form className="card p-4 mb-5"><input className="input" name="q" defaultValue={q} placeholder="Search product, SKU, manufacturer, model" /></form>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">SKU</th><th className="th">Name</th><th className="th">Manufacturer</th><th className="th">Model</th><th className="th">Category</th><th className="th">Total</th><th className="th">Locations</th><th className="th">Action</th></tr></thead><tbody>
      {products.map(p => {
        const total = p.inventory.reduce((s,i)=>s+i.qty,0)
        return <tr key={p.id}><td className="td">{p.sku}</td><td className="td font-medium">{p.name}</td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.model || ''}</td><td className="td">{p.category || ''}</td><td className="td">{total}</td><td className="td">{p.inventory.map(i => `${i.location.code}: ${i.qty}`).join(', ')}</td><td className="td">{total === 0 ? <form action={removeProduct}><input type="hidden" name="productId" value={p.id} /><button className="text-sm text-red-600 hover:underline">Remove</button></form> : <span className="text-xs text-gray-400">Has stock</span>}</td></tr>
      })}
      {!products.length && <tr><td className="td text-gray-500" colSpan={8}>No products found.</td></tr>}
    </tbody></table></div>
  </div>
}
