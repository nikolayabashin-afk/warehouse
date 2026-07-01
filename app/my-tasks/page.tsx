export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { confirmIncomingTask } from '@/lib/task-actions'

function formatDate(date: Date | null) {
  if (!date) return '-'
  return date.toLocaleDateString('ru-RU')
}

export default async function MyTasksPage() {
  const tasks = await prisma.warehouseTask.findMany({
    where: { status: 'OPEN' },
    take: 100,
    orderBy: { createdAt: 'asc' },
    include: { product: true, createdBy: true }
  })

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Мои задачи</h1>
        <p className="mt-1 text-sm text-gray-500">Открытые задачи прихода. Проверьте количество, укажите место хранения и подтвердите.</p>
      </div>
      <Link className="btn-secondary" href="/inventory">Остатки</Link>
    </div>

    <div className="grid gap-4">
      {tasks.map(task => <section key={task.id} className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Приход</div>
            <h2 className="text-xl font-semibold">{task.productNameSnapshot || task.product.name}</h2>
            <div className="mt-1 text-sm text-gray-500">Артикул: {task.articleNumber || task.product.sku}</div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-gray-500">Заказчик:</span> <span className="font-medium">{task.buyer || '-'}</span></div>
              <div><span className="text-gray-500">Количество:</span> <span className="font-bold">{task.expectedQty}</span></div>
              <div><span className="text-gray-500">УПД:</span> {task.documentNumber || '-'} от {formatDate(task.documentDate)}</div>
              <div><span className="text-gray-500">Создал:</span> {task.createdBy?.name || task.createdBy?.email || '-'}</div>
              <div><span className="text-gray-500">Дата:</span> {task.createdAt.toLocaleString('ru-RU')}</div>
              {task.note && <div><span className="text-gray-500">Примечание:</span> {task.note}</div>}
            </div>
          </div>
          <form action={confirmIncomingTask} className="grid min-w-[260px] gap-3">
            <input type="hidden" name="taskId" value={task.id} />
            <label className="text-sm font-medium">Место хранения<input className="input mt-1" name="location" placeholder="Например: A16" required /></label>
            <button className="btn">Подтвердить приход</button>
          </form>
        </div>
      </section>)}
      {!tasks.length && <div className="card p-6 text-gray-500">Открытых задач нет.</div>}
    </div>
  </div>
}
