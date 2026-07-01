'use server'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function asInt(value: FormDataEntryValue | null, fieldName = 'Количество') {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${fieldName} должно быть положительным целым числом`)
  return n
}

function asDate(value: FormDataEntryValue | null) {
  const raw = clean(value)
  if (!raw) return null
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) throw new Error('Дата УПД указана неверно')
  return date
}

function normalizeLocation(codeRaw: string) {
  return clean(codeRaw)
    .replace(/\s+/g, '')
    .replace(/[А]/g, 'A')
    .replace(/[В]/g, 'B')
    .replace(/[С]/g, 'C')
    .replace(/[Е]/g, 'E')
    .toUpperCase()
}

async function currentUser() {
  const session = await getServerSession(authOptions)
  return session?.user as any
}

function revalidateTaskPages() {
  for (const path of ['/', '/dashboard', '/tasks', '/my-tasks', '/inventory', '/movements', '/products', '/locations']) {
    revalidatePath(path)
  }
}

export async function createIncomingTask(formData: FormData) {
  const user = await currentUser()
  const role = user?.role
  if (!user || !['ADMIN', 'MANAGER'].includes(role)) throw new Error('Создавать задачи может только менеджер или администратор')

  const productId = clean(formData.get('productId'))
  const expectedQty = asInt(formData.get('qty'))
  const buyer = clean(formData.get('buyer')) || null
  const documentNumber = clean(formData.get('documentNumber')) || null
  const documentDate = asDate(formData.get('documentDate'))
  const articleNumberRaw = clean(formData.get('articleNumber'))
  const productNameSnapshotRaw = clean(formData.get('productNameSnapshot'))
  const note = clean(formData.get('note')) || null
  if (!productId) throw new Error('Выберите товар')
  if (!buyer) throw new Error('Укажите заказчика / покупателя')

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true, name: true } })
  if (!product) throw new Error('Товар не найден')

  await prisma.warehouseTask.create({
    data: {
      type: 'INCOMING',
      status: 'OPEN',
      buyer,
      documentNumber,
      documentDate,
      note,
      createdById: user.id,
      lines: {
        create: [{
          productId,
          expectedQty,
          articleNumber: articleNumberRaw || product.sku,
          productNameSnapshot: productNameSnapshotRaw || product.name
        }]
      }
    }
  })

  revalidateTaskPages()
  redirect('/tasks')
}

export async function confirmIncomingTask(formData: FormData) {
  const user = await currentUser()
  if (!user) throw new Error('Нужно войти в систему')

  const taskId = clean(formData.get('taskId'))
  if (!taskId) throw new Error('Задача не найдена')

  const task = await prisma.warehouseTask.findUnique({
    where: { id: taskId },
    include: { lines: { include: { product: true } } }
  })
  if (!task || task.status !== 'OPEN') throw new Error('Задача уже закрыта или не найдена')
  if (!task.lines.length) throw new Error('В задаче нет товарных строк')

  const locationCodesByLine = task.lines.map(line => ({ line, code: normalizeLocation(clean(formData.get(`location_${line.id}`))) }))
  if (locationCodesByLine.some(item => !item.code)) throw new Error('Укажите место хранения для каждой строки')

  await prisma.$transaction(async tx => {
    const firstLocationId = await Promise.resolve().then(async () => {
      let firstId: string | null = null
      for (const { line, code } of locationCodesByLine) {
        const location = await tx.location.upsert({ where: { code }, update: { active: true }, create: { code } })
        if (!firstId) firstId = location.id

        const existing = await tx.inventory.findFirst({ where: { productId: line.productId, locationId: location.id, batch: null } })
        if (existing) await tx.inventory.update({ where: { id: existing.id }, data: { qty: existing.qty + line.expectedQty } })
        else await tx.inventory.create({ data: { productId: line.productId, locationId: location.id, qty: line.expectedQty } })

        await tx.product.update({ where: { id: line.productId }, data: { lastLocation: location.code } })
        await tx.movement.create({
          data: {
            type: 'RECEIVE',
            productId: line.productId,
            toLocationId: location.id,
            qty: line.expectedQty,
            note: `Задача прихода: УПД ${task.documentNumber || '-'}; ${line.productNameSnapshot || line.product.name}; артикул: ${line.articleNumber || line.product.sku}; заказчик: ${task.buyer || '-'}; ${task.note || 'без примечания'}`,
            userId: user.id
          }
        })
        await tx.warehouseTaskLine.update({ where: { id: line.id }, data: { targetLocationId: location.id } })
      }
      return firstId
    })

    await tx.warehouseTask.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        targetLocationId: firstLocationId,
        completedById: user.id,
        completedAt: new Date()
      }
    })
  })

  revalidateTaskPages()
  redirect('/my-tasks')
}

export async function cancelTask(formData: FormData) {
  const user = await currentUser()
  const role = user?.role
  if (!user || !['ADMIN', 'MANAGER'].includes(role)) throw new Error('Удалять задачи может только менеджер или администратор')

  const taskId = clean(formData.get('taskId'))
  if (!taskId) throw new Error('Задача не найдена')

  await prisma.warehouseTask.update({ where: { id: taskId }, data: { status: 'CANCELLED' } })
  revalidateTaskPages()
  redirect('/tasks')
}
