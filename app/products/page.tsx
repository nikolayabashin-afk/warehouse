export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }, { model: { contains: q, mode: 'insensitive' } }] } : {},
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
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">SKU</th><th className="th">Name</th><th className="th">Manufacturer</th><th className="th">Model</th><th className="th">Category</th><th className="th">Total</th><th className="th">Locations</th></tr></thead><tbody>
      {products.map(p => <tr key={p.id}><td className="td">{p.sku}</td><td className="td font-medium">{p.name}</td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.model || ''}</td><td className="td">{p.category || ''}</td><td className="td">{p.inventory.reduce((s,i)=>s+i.qty,0)}</td><td className="td">{p.inventory.map(i => `${i.location.code}: ${i.qty}`).join(', ')}</td></tr>)}
      {!products.length && <tr><td className="td text-gray-500" colSpan={7}>No products found.</td></tr>}
    </tbody></table></div>
  </div>
}
