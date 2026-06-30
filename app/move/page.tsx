export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { moveStock } from '@/lib/actions'
import { StockPickerButton } from '@/app/components/StockPickerButton'
import { ClearFormButton } from '@/app/components/ClearFormButton'

export default async function Move() {
  const products = await prisma.product.findMany({ where: { archived: false }, take: 500, orderBy: { name: 'asc' } })
  const locations = await prisma.location.findMany({ where: { active: true }, take: 500, orderBy: { code: 'asc' } })
  const inventory = await prisma.inventory.findMany({
    where: { qty: { gt: 0 }, product: { archived: false }, location: { active: true } },
    take: 300,
    include: { product: true, location: true }
  })

  return <div>
    <h1 className="text-3xl font-bold mb-2">Перемещение товара</h1>
    <p className="text-sm text-gray-500 mb-6">Выберите строку остатка снизу или заполните форму вручную.</p>

    <form action={moveStock} className="card p-5 grid gap-4 max-w-2xl mb-6">
      <label className="text-sm font-medium">Товар<select className="input mt-1" name="productId" required>{products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}</select></label>
      <label className="text-sm font-medium">Из места<input className="input mt-1" name="fromLocation" list="locations" placeholder="A16" required /></label>
      <label className="text-sm font-medium">В место<input className="input mt-1" name="toLocation" list="locations" placeholder="A17 / OV01" required /></label>
      <datalist id="locations">{locations.map(l => <option key={l.id} value={l.code} />)}</datalist>
      <label className="text-sm font-medium">Количество<input className="input mt-1" name="qty" type="number" min="1" required /></label>
      <label className="text-sm font-medium">Примечание<input className="input mt-1" name="note" /></label>
      <div className="flex gap-3"><button className="btn w-fit">Переместить</button><ClearFormButton /></div>
    </form>

    <div className="card overflow-hidden">
      <table className="w-full"><thead><tr><th className="th">Товар</th><th className="th">Место хранения</th><th className="th">Доступно</th><th className="th">Действие</th></tr></thead><tbody>
        {inventory.map(i => <tr key={i.id}><td className="td"><div className="font-medium">{i.product.name}</div><div className="text-xs text-gray-500">{i.product.sku}</div></td><td className="td font-bold">{i.location.code}</td><td className="td">{i.qty}</td><td className="td"><StockPickerButton mode="move" productId={i.productId} locationCode={i.location.code} qty={i.qty} /></td></tr>)}
        {!inventory.length && <tr><td className="td text-gray-500" colSpan={4}>Нет доступных остатков.</td></tr>}
      </tbody></table>
    </div>
  </div>
}
