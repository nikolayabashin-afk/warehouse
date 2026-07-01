'use server'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as XLSX from 'xlsx'

function clean(value: unknown) {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim()
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

function parseRussianDate(raw: string) {
  const normalized = clean(raw).toLowerCase()
  const months: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11
  }
  const ru = normalized.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i)
  if (ru && months[ru[2]] !== undefined) return new Date(Number(ru[3]), months[ru[2]], Number(ru[1]))
  const dotted = normalized.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dotted) return new Date(Number(dotted[3]), Number(dotted[2]) - 1, Number(dotted[1]))
  return null
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

type ParsedUpdLine = {
  articleNumber: string
  productName: string
  qty: number
}

type ParsedUpd = {
  buyer: string | null
  documentNumber: string | null
  documentDate: Date | null
  lines: ParsedUpdLine[]
}

function cellText(row: unknown[], index: number) {
  return clean(row[index])
}

function parseUpdWorkbook(buffer: ArrayBuffer): ParsedUpd {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: null, blankrows: false })

  let buyer: string | null = null
  let documentNumber: string | null = null
  let documentDate: Date | null = null
  const lines: ParsedUpdLine[] = []

  for (const row of rows) {
    const values = row.map(value => cellText(row, row.indexOf(value)))
    const joined = row.map(value => clean(value)).filter(Boolean).join(' ')

    if (!buyer) {
      const buyerIndex = row.findIndex(value => clean(value).toLowerCase().includes('покупатель:'))
      if (buyerIndex >= 0) {
        const nextValue = row.slice(buyerIndex + 1).map(clean).find(value => value && !/^\(\d+[а-я]?\)$/i.test(value))
        if (nextValue) buyer = nextValue
      }
    }

    if (!documentNumber) {
      const match = joined.match(/(?:счет-фактура|документ|упд)[^№]*№\s*([\w\-/]+)/i) || joined.match(/№\s*([\w\-/]+)\s+от/i)
      if (match && match[1] !== '--') documentNumber = match[1]
    }

    if (!documentDate) {
      const dateMatch = joined.match(/от\s+(.+?)(?:\s*г\.?|$)/i)
      if (dateMatch) documentDate = parseRussianDate(dateMatch[1])
    }

    const articleNumber = cellText(row, 1)
    const rowNumber = Number(cellText(row, 5))
    const productName = cellText(row, 9)
    const qty = Number(cellText(row, 26))

    if (articleNumber && Number.isInteger(rowNumber) && productName && Number.isFinite(qty) && qty > 0) {
      lines.push({ articleNumber, productName, qty: Math.trunc(qty) })
    }
  }

  return { buyer, documentNumber, documentDate, lines }
}

export async function importUpdIncomingTask(formData: FormData) {
  const user = await currentUser()
  const role = user?.role
  if (!user || !['ADMIN', 'MANAGER'].includes(role)) throw new Error('Импортировать УПД может только менеджер или администратор')

  const file = formData.get('updFile')
  if (!(file instanceof File) || !file.size) throw new Error('Загрузите Excel-файл УПД')
  if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) throw new Error('Пока поддерживается только Excel УПД: .xlsx или .xls')

  const parsed = parseUpdWorkbook(await file.arrayBuffer())
  if (!parsed.buyer) throw new Error('Не удалось найти покупателя в УПД')
  if (!parsed.lines.length) throw new Error('Не удалось найти товарные строки в УПД')

  await prisma.$transaction(async tx => {
    const createdLines = []
    for (const line of parsed.lines) {
      const product = await tx.product.upsert({
        where: { sku: line.articleNumber },
        update: { name: line.productName },
        create: { sku: line.articleNumber, name: line.productName }
      })
      createdLines.push({
        productId: product.id,
        expectedQty: line.qty,
        articleNumber: line.articleNumber,
        productNameSnapshot: line.productName
      })
    }

    await tx.warehouseTask.create({
      data: {
        type: 'INCOMING',
        status: 'OPEN',
        buyer: parsed.buyer,
        documentNumber: parsed.documentNumber,
        documentDate: parsed.documentDate,
        note: `Создано из Excel УПД: ${file.name}`,
        createdById: user.id,
        lines: { create: createdLines }
      }
    })
  })

  revalidateTaskPages()
  redirect('/tasks')
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
