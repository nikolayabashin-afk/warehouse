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

function formatDate(date: Date | null) {
  if (!date) return '-'
  return date.toLocaleDateString('ru-RU')
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
      include: {
        targetLocation: true,
        createdBy: true,
        completedBy: true,
        lines: { include: { product: true, targetLocation: true }, orderBy: { createdAt: 'asc' } }
      }
    })
  ])

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Задачи</h1>
        <p className="mt-1 text-sm text-gray-500">Одна задача = один УПД / поставка, внутри могут быть несколько товарных строк.</p>
      </div>
      <Link className="btn-secondary" href="/my-tasks">Панель работника</Link>
    </div>

    <section className="card mb-6 p-5">
      <h2 className="mb-4 text-xl font-semibold">Создать задачу прихода</h2>
      <form action={createIncomingTask} className="grid gap-4 max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Заказчик / Покупатель<input className="input mt-1" name="buyer" placeholder="Например: ГКБ №1" required /></label>
          <label className="text-sm font-medium">Номер УПД<input className="input mt-1" name="documentNumber" placeholder="Например: 619" /></label>
          <label className="text-sm font-medium">Дата УПД<input className="input mt-1" name="documentDate" type="date" /></label>
          <label className="text-sm font-medium">Примечание<input className="input mt-1" name="note" placeholder="Поставщик, комментарий" /></label>
        </div>

        <div className="rounded-xl border p-4">
          <div className="mb-3 font-semibold">Товарная строка</div>
          <div className="grid gap-4">
            <ProductPicker products={products} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Количество по документам<input className="input mt-1" name="qty" type="number" min="1" required /></label>
              <label className="text-sm font-medium">Артикул из УПД<input className="input mt-1" name="articleNumber" placeholder="Если отличается от артикула товара" /></label>
              <label className="text-sm font-medium sm:col-span-2">Название товара из УПД<input className="input mt-1" name="productNameSnapshot" placeholder="Если отличается от названия в базе" /></label>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">Сейчас вручную создаётся одна строка. После импорта УПД система сможет создавать несколько строк внутри этой же задачи.</p>
        <button className="btn w-fit">Создать задачу</button>
      </form>
    </section>

    <section className="card overflow-hidden">
      <div className="border-b p-4 font-semibold">Все задачи</div>
      <table className="w-full">
        <thead><tr><th className="th">Дата</th><th className="th">Статус</th><th className="th">Заказчик / УПД</th><th className="th">Строки</th><th className="th">Итого</th><th className="th">Создал</th><th className="th">Выполнил</th><th className="th">Действие</th></tr></thead>
        <tbody>
          {tasks.map(task => {
            const totalQty = task.lines.reduce((sum, line) => sum + line.expectedQty, 0)
            return <tr key={task.id}>
              <td className="td whitespace-nowrap">{task.createdAt.toLocaleString('ru-RU')}</td>
              <td className="td"><span className={statusClass(task.status)}>{statusLabel(task.status)}</span></td>
              <td className="td"><div className="font-medium">{task.buyer || '-'}</div><div className="text-xs text-gray-500">УПД: {task.documentNumber || '-'} от {formatDate(task.documentDate)}</div>{task.note && <div className="mt-1 text-xs text-gray-500">{task.note}</div>}</td>
              <td className="td min-w-[320px]">{task.lines.map(line => <div key={line.id} className="mb-2 last:mb-0"><Link className="font-medium hover:underline" href={`/products/${line.product.id}`}>{line.productNameSnapshot || line.product.name}</Link><div className="text-xs text-gray-500">Артикул: {line.articleNumber || line.product.sku} · Кол-во: {line.expectedQty} · Место: {line.targetLocation?.code || '-'}</div></div>)}</td>
              <td className="td font-semibold">{totalQty}</td>
              <td className="td">{task.createdBy?.name || task.createdBy?.email || '-'}</td>
              <td className="td">{task.completedBy?.name || task.completedBy?.email || '-'}</td>
              <td className="td">{task.status === 'OPEN' ? <form action={cancelTask}><input type="hidden" name="taskId" value={task.id} /><button className="text-sm text-red-600 hover:underline">Отменить</button></form> : <span className="text-xs text-gray-400">Закрыта</span>}</td>
            </tr>
          })}
          {!tasks.length && <tr><td className="td text-gray-500" colSpan={8}>Задач пока нет.</td></tr>}
        </tbody>
      </table>
    </section>
  </div>
}
