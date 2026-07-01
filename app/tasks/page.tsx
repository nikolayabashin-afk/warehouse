export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ProductPicker } from '@/app/components/ProductPicker'
import { createIncomingTask, cancelTask } from '@/lib/task-actions'

function statusLabel(status: string) {
  if (status === 'OPEN') return 'Открыта'
  if (status === 'COMPLETED') return 'Выполнена'
  if (status === 'CANCELLED') return 'Отменена'
  return status
}

function statusClass(status: string) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-semibold'
  if (status === 'OPEN') return `${base} bg-amber-100 text-amber-800`
  if (status === 'COMPLETED') return `${base} bg-emerald-100 text-emerald-800`
  return `${base} bg-gray-100 text-gray-600`
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user || !['ADMIN', 'MANAGER'].includes(role)) redirect('/my-tasks')

  const [products, tasks] = await Promise.all([
    prisma.product.findMany({ where: { archived: false }, take: 500, orderBy: { name: 'asc' } }),
    prisma.warehouseTask.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: { product: true, targetLocation: true, createdBy: true, completedBy: true }
    })
  ])

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Задачи</h1>
        <p className="mt-1 text-sm text-gray-500">Менеджер создаёт задачу прихода, работник подтверждает место хранения.</p>
      </div>
      <Link className="btn-secondary" href="/my-tasks">Панель работника</Link>
    </div>

    <section className="card mb-6 p-5">
      <h2 className="mb-4 text-xl font-semibold">Создать задачу прихода</h2>
      <form action={createIncomingTask} className="grid gap-4 max-w-2xl">
        <ProductPicker products={products} />
        <label className="text-sm font-medium">Количество по документам<input className="input mt-1" name="qty" type="number" min="1" required /></label>
        <label className="text-sm font-medium">Примечание / поставщик / УПД<input className="input mt-1" name="note" placeholder="Например: УПД №123, поставщик, комментарий" /></label>
        <button className="btn w-fit">Создать задачу</button>
      </form>
    </section>

    <section className="card overflow-hidden">
      <div className="border-b p-4 font-semibold">Все задачи</div>
      <table className="w-full">
        <thead><tr><th className="th">Дата</th><th className="th">Статус</th><th className="th">Товар</th><th className="th">Кол-во</th><th className="th">Место</th><th className="th">Создал</th><th className="th">Выполнил</th><th className="th">Действие</th></tr></thead>
        <tbody>
          {tasks.map(task => <tr key={task.id}>
            <td className="td whitespace-nowrap">{task.createdAt.toLocaleString('ru-RU')}</td>
            <td className="td"><span className={statusClass(task.status)}>{statusLabel(task.status)}</span></td>
            <td className="td"><Link className="font-medium hover:underline" href={`/products/${task.product.id}`}>{task.product.name}</Link><div className="text-xs text-gray-500">{task.product.sku}</div>{task.note && <div className="mt-1 text-xs text-gray-500">{task.note}</div>}</td>
            <td className="td font-semibold">{task.expectedQty}</td>
            <td className="td font-bold">{task.targetLocation ? <Link className="text-blue-600 hover:underline" href={`/locations/${task.targetLocation.id}`}>{task.targetLocation.code}</Link> : '-'}</td>
            <td className="td">{task.createdBy?.name || task.createdBy?.email || '-'}</td>
            <td className="td">{task.completedBy?.name || task.completedBy?.email || '-'}</td>
            <td className="td">{task.status === 'OPEN' ? <form action={cancelTask}><input type="hidden" name="taskId" value={task.id} /><button className="text-sm text-red-600 hover:underline">Отменить</button></form> : <span className="text-xs text-gray-400">Закрыта</span>}</td>
          </tr>)}
          {!tasks.length && <tr><td className="td text-gray-500" colSpan={8}>Задач пока нет.</td></tr>}
        </tbody>
      </table>
    </section>
  </div>
}
