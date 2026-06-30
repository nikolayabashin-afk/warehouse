export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

const typeLabel: Record<string, string> = {
  RECEIVE: 'Приход',
  ISSUE: 'Отгрузка',
  MOVE: 'Перемещение',
  ADJUST: 'Корректировка'
}

export default async function Movements() {
  const movements = await prisma.movement.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' },
    include: { product: true, fromLocation: true, toLocation: true, user: true }
  })

  return <div>
    <h1 className="text-3xl font-bold mb-2">История движений</h1>
    <p className="text-sm text-gray-500 mb-6">Последние 200 операций: приход, отгрузка, перемещение и корректировки.</p>

    <div className="card overflow-hidden">
      <table className="w-full">
        <thead><tr><th className="th">Дата</th><th className="th">Тип</th><th className="th">Товар</th><th className="th">Из места</th><th className="th">В место</th><th className="th">Кол-во</th><th className="th">Примечание</th></tr></thead>
        <tbody>
          {movements.map(m => <tr key={m.id}>
            <td className="td whitespace-nowrap">{m.createdAt.toLocaleString('ru-RU')}</td>
            <td className="td font-medium">{typeLabel[m.type] || m.type}</td>
            <td className="td"><div className="font-medium">{m.product.name}</div><div className="text-xs text-gray-500">{m.product.sku}</div></td>
            <td className="td">{m.fromLocation?.code || '-'}</td>
            <td className="td">{m.toLocation?.code || '-'}</td>
            <td className="td font-semibold">{m.qty}</td>
            <td className="td">{m.note || ''}</td>
          </tr>)}
          {!movements.length && <tr><td className="td text-gray-500" colSpan={7}>Движений пока нет.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
