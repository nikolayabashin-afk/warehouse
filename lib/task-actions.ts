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
      productId,
      expectedQty,
      buyer,
      documentNumber,
      documentDate,
      articleNumber: articleNumberRaw || product.sku,
      productNameSnapshot: productNameSnapshotRaw || product.name,
      note,
      createdById: user.id
    }
  })

  revalidateTaskPages()
  redirect('/tasks')
}

export async function confirmIncomingTask(formData: FormData) {
  const user = await currentUser()
  if (!user) throw new Error('Нужно войти в систему')

  const taskId = clean(formData.get('taskId'))
  const locationCode = normalizeLocation(clean(formData.get('location')))
  if (!taskId) throw new Error('Задача не найдена')
  if (!locationCode) throw new Error('Укажите место хранения')

  const task = await prisma.warehouseTask.findUnique({ where: { id: taskId }, include: { product: true } })
  if (!task || task.status !== 'OPEN') throw new Error('Задача уже закрыта или не найдена')

  const location = await prisma.location.upsert({ where: { code: locationCode }, update: { active: true }, create: { code: locationCode } })

  await prisma.$transaction(async tx => {
    const existing = await tx.inventory.findFirst({ where: { productId: task.productId, locationId: location.id, batch: null } })
    if (existing) await tx.inventory.update({ where: { id: existing.id }, data: { qty: existing.qty + task.expectedQty } })
    else await tx.inventory.create({ data: { productId: task.productId, locationId: location.id, qty: task.expectedQty } })

    await tx.product.update({ where: { id: task.productId }, data: { lastLocation: location.code } })
    await tx.movement.create({
      data: {
        type: 'RECEIVE',
        productId: task.productId,
        toLocationId: location.id,
        qty: task.expectedQty,
        note: `Задача прихода: ${task.productNameSnapshot || task.product.name}; артикул: ${task.articleNumber || task.product.sku}; заказчик: ${task.buyer || '-'}; ${task.note || 'без примечания'}`,
        userId: user.id
      }
    })
    await tx.warehouseTask.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        targetLocationId: location.id,
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
