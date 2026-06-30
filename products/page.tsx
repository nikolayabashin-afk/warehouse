import { prisma } from '@/lib/prisma'

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }] } : {},
    take: 100,
    orderBy: { name: 'asc' },
    include: { inventory: { include: { location: true } } }
  })
  return <div>
    <h1 className="text-3xl font-bold mb-6">Products</h1>
    <form className="card p-4 mb-5"><input className="input" name="q" defaultValue={q} placeholder="Search product, SKU, manufacturer" /></form>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">SKU</th><th className="th">Name</th><th className="th">Manufacturer</th><th className="th">Total</th><th className="th">Locations</th></tr></thead><tbody>
      {products.map(p => <tr key={p.id}><td className="td">{p.sku}</td><td className="td font-medium">{p.name}</td><td className="td">{p.manufacturer || ''}</td><td className="td">{p.inventory.reduce((s,i)=>s+i.qty,0)}</td><td className="td">{p.inventory.map(i => `${i.location.code}: ${i.qty}`).join(', ')}</td></tr>)}
    </tbody></table></div>
  </div>
}
