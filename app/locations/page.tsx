export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { removeLocation } from '@/lib/actions'
import { ConfirmSubmitButton } from '@/app/components/ConfirmSubmitButton'

export default async function Locations() {
  const locations = await prisma.location.findMany({ where: { active: true }, orderBy: { code: 'asc' }, include: { inventory: { include: { product: true } } } })
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Места хранения</h1>
      <Link className="btn" href="/locations/new">Добавить место</Link>
    </div>
    <div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="th">Код</th><th className="th">Тип</th><th className="th">Зона</th><th className="th">Позиций</th><th className="th">Остаток</th><th className="th">Вместимость</th><th className="th">Статус</th><th className="th">Содержимое</th><th className="th">Действие</th></tr></thead><tbody>
      {locations.map(l => {
        const activeRows = l.inventory.filter(i => i.qty > 0)
        const total = activeRows.reduce((s,i)=>s+i.qty,0)
        const status = l.capacity ? total > l.capacity ? 'Перегружено' : total === l.capacity ? 'Заполнено' : total > 0 ? 'Частично' : 'Свободно' : total > 0 ? 'Используется' : 'Свободно'
        return <tr key={l.id}><td className="td font-bold"><Link className="text-blue-600 hover:underline" href={`/locations/${l.id}`}>{l.code}</Link></td><td className="td">{l.type}</td><td className="td">{l.zone || ''}</td><td className="td">{activeRows.length}</td><td className="td">{total}</td><td className="td">{l.capacity || ''}</td><td className="td">{status}</td><td className="td">{activeRows.map(i => `${i.product.name}: ${i.qty}`).join(', ')}</td><td className="td">{total === 0 ? <form action={removeLocation}><input type="hidden" name="locationId" value={l.id} /><ConfirmSubmitButton className="text-sm text-red-600 hover:underline" message="Удалить это место хранения из активного списка? История движений сохранится.">Удалить</ConfirmSubmitButton></form> : <span className="text-xs text-gray-400">Есть остаток</span>}</td></tr>
      })}
      {!locations.length && <tr><td className="td text-gray-500" colSpan={9}>Места хранения не найдены.</td></tr>}
    </tbody></table></div>
    <p className="text-sm text-gray-500 mt-3">“Позиций” — это количество разных товаров/строк остатков в конкретном месте хранения.</p>
  </div>
}
