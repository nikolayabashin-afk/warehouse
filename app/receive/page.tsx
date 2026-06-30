export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { receiveStock } from '@/lib/actions'
import { ClearFormButton } from '@/app/components/ClearFormButton'
import { ProductPicker } from '@/app/components/ProductPicker'

export default async function Receive() {
  const products = await prisma.product.findMany({ where: { archived: false }, take: 500, orderBy: { name: 'asc' } })
  const locations = await prisma.location.findMany({ where: { active: true }, take: 500, orderBy: { code: 'asc' } })

  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Приход товара</h1>
        <p className="text-sm text-gray-500 mt-1">Добавление входящего товара на существующее или новое место хранения.</p>
      </div>
      <Link className="btn" href="/products/new">Добавить товар</Link>
    </div>

    <form action={receiveStock} className="card p-5 grid gap-4 max-w-2xl">
      <ProductPicker products={products} />
      <label className="text-sm font-medium">Место хранения<input className="input mt-1" name="location" list="locations" placeholder="A16 / OV01 / FL01" required /></label>
      <datalist id="locations">{locations.map(l => <option key={l.id} value={l.code} />)}</datalist>
      <label className="text-sm font-medium">Количество<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <label className="text-sm font-medium">Примечание<input className="input mt-1" name="note" /></label>
      <div className="flex gap-3"><button className="btn w-fit">Принять на склад</button><ClearFormButton /></div>
    </form>
  </div>
}
