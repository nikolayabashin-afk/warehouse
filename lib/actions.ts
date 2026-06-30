'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as XLSX from 'xlsx'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function optional(value: unknown) {
  const text = clean(value)
  return text ? text : null
}

function asInt(value: FormDataEntryValue | null, fieldName = 'Количество') {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${fieldName} должно быть положительным целым числом`)
  return n
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

function splitLocations(raw: string): string[] {
  if (!raw) return []
  const fixed = raw.replace(/[;,/\\]+/g, ' ').replace(/\s+и\s+/gi, ' ').trim()
  const matches = fixed.match(/[A-ZА-ЯЁ]-?\d+/gi) || []
  return [...new Set(matches.map(normalizeLocation).filter(Boolean))]
}

function findHeader(headers: string[], candidates: string[]) {
  const lower = headers.map(h => h.toLowerCase())
  for (const candidate of candidates) {
    const idx = lower.findIndex(h => h.includes(candidate.toLowerCase()))
    if (idx >= 0) return headers[idx]
  }
  return undefined
}

function formError(path: '/move' | '/ship', message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

async function getOrCreateLocation(codeRaw: string) {
  const code = normalizeLocation(codeRaw)
  if (!code) throw new Error('Укажите место хранения')
  return prisma.location.upsert({ where: { code }, update: { active: true }, create: { code } })
}

function revalidateWarehousePages() {
  for (const path of ['/', '/dashboard', '/products', '/locations', '/inventory', '/search', '/receive', '/ship', '/move', '/movements', '/import']) {
    revalidatePath(path)
  }
}

export async function createProduct(formData: FormData) {
  const sku = clean(formData.get('sku')).toUpperCase()
  const name = clean(formData.get('name'))
  if (!sku) throw new Error('Укажите артикул')
  if (!name) throw new Error('Укажите наименование товара')

  await prisma.product.create({
    data: {
      sku,
      name,
      manufacturer: optional(formData.get('manufacturer')),
      model: optional(formData.get('model')),
      category: optional(formData.get('category')),
      preferredLocation: optional(formData.get('preferredLocation'))
    }
  })

  revalidateWarehousePages()
  redirect('/products')
}

export async function removeProduct(formData: FormData) {
  const productId = clean(formData.get('productId'))
  if (!productId) throw new Error('Укажите товар')

  const inventory = await prisma.inventory.findMany({ where: { productId } })
  const total = inventory.reduce((sum, row) => sum + row.qty, 0)
  if (total > 0) throw new Error('Нельзя удалить товар, пока по нему есть остаток. Сначала отгрузите или переместите товар.')

  await prisma.$transaction([
    prisma.inventory.deleteMany({ where: { productId, qty: 0 } }),
    prisma.product.update({ where: { id: productId }, data: { archived: true } })
  ])

  revalidateWarehousePages()
  redirect('/products')
}

export async function createLocation(formData: FormData) {
  const code = normalizeLocation(clean(formData.get('code')))
  if (!code) throw new Error('Укажите код места хранения')

  const capacityRaw = clean(formData.get('capacity'))
  const capacity = capacityRaw ? asInt(formData.get('capacity'), 'Вместимость') : null

  await prisma.location.create({
    data: {
      code,
      zone: optional(formData.get('zone')),
      type: clean(formData.get('type')) || 'RACK',
      capacity,
      note: optional(formData.get('note'))
    }
  })

  revalidateWarehousePages()
  redirect('/locations')
}

export async function removeLocation(formData: FormData) {
  const locationId = clean(formData.get('locationId'))
  if (!locationId) throw new Error('Укажите место хранения')

  const inventory = await prisma.inventory.findMany({ where: { locationId } })
  const total = inventory.reduce((sum, row) => sum + row.qty, 0)
  if (total > 0) throw new Error('Нельзя удалить место хранения, пока в нём есть остаток. Сначала переместите или отгрузите товар.')

  await prisma.$transaction([
    prisma.inventory.deleteMany({ where: { locationId, qty: 0 } }),
    prisma.location.update({ where: { id: locationId }, data: { active: false } })
  ])

  revalidateWarehousePages()
  redirect('/locations')
}

export async function receiveStock(formData: FormData) {
  const productId = clean(formData.get('productId'))
  const locationCode = clean(formData.get('location'))
  const qty = asInt(formData.get('qty'))
  const note = clean(formData.get('note'))
  const location = await getOrCreateLocation(locationCode)

  await prisma.$transaction(async tx => {
    const existing = await tx.inventory.findFirst({ where: { productId, locationId: location.id, batch: null } })
    if (existing) {
      await tx.inventory.update({ where: { id: existing.id }, data: { qty: existing.qty + qty } })
    } else {
      await tx.inventory.create({ data: { productId, locationId: location.id, qty } })
    }
    await tx.product.update({ where: { id: productId }, data: { lastLocation: location.code } })
    await tx.movement.create({ data: { type: 'RECEIVE', productId, toLocationId: location.id, qty, note } })
  })

  revalidateWarehousePages()
  redirect('/inventory')
}

export async function shipStock(formData: FormData) {
  const productId = clean(formData.get('productId'))
  const fromCode = normalizeLocation(clean(formData.get('fromLocation')))
  const qty = asInt(formData.get('qty'))
  const note = clean(formData.get('note'))

  const from = await prisma.location.findUnique({ where: { code: fromCode } })
  if (!from) formError('/ship', 'Исходное место хранения не найдено')

  const source = await prisma.inventory.findFirst({ where: { productId, locationId: from.id, batch: null } })
  if (!source || source.qty < qty) {
    formError('/ship', `Недостаточно товара для отгрузки. Доступно: ${source?.qty ?? 0}, вы указали: ${qty}.`)
  }

  await prisma.$transaction(async tx => {
    const current = await tx.inventory.findFirst({ where: { productId, locationId: from.id, batch: null } })
    if (!current || current.qty < qty) throw new Error('Недостаточно товара на исходном месте хранения')

    if (current.qty === qty) await tx.inventory.delete({ where: { id: current.id } })
    else await tx.inventory.update({ where: { id: current.id }, data: { qty: current.qty - qty } })

    await tx.product.update({ where: { id: productId }, data: { lastLocation: from.code } })
    await tx.movement.create({ data: { type: 'ISSUE', productId, fromLocationId: from.id, qty, note } })
  })

  revalidateWarehousePages()
  redirect('/inventory')
}

export async function moveStock(formData: FormData) {
  const productId = clean(formData.get('productId'))
  const fromCode = normalizeLocation(clean(formData.get('fromLocation')))
  const toCode = normalizeLocation(clean(formData.get('toLocation')))
  const qty = asInt(formData.get('qty'))
  const note = clean(formData.get('note'))

  if (fromCode === toCode) formError('/move', 'Исходное и новое место хранения должны отличаться')

  const from = await prisma.location.findUnique({ where: { code: fromCode } })
  if (!from) formError('/move', 'Исходное место хранения не найдено')
  const to = await getOrCreateLocation(toCode)

  const source = await prisma.inventory.findFirst({ where: { productId, locationId: from.id, batch: null } })
  if (!source || source.qty < qty) {
    formError('/move', `Недостаточно товара для перемещения. Доступно: ${source?.qty ?? 0}, вы указали: ${qty}.`)
  }

  await prisma.$transaction(async tx => {
    const current = await tx.inventory.findFirst({ where: { productId, locationId: from.id, batch: null } })
    if (!current || current.qty < qty) throw new Error('Недостаточно товара на исходном месте хранения')

    if (current.qty === qty) await tx.inventory.delete({ where: { id: current.id } })
    else await tx.inventory.update({ where: { id: current.id }, data: { qty: current.qty - qty } })

    const target = await tx.inventory.findFirst({ where: { productId, locationId: to.id, batch: null } })
    if (target) await tx.inventory.update({ where: { id: target.id }, data: { qty: target.qty + qty } })
    else await tx.inventory.create({ data: { productId, locationId: to.id, qty } })

    await tx.product.update({ where: { id: productId }, data: { lastLocation: to.code } })
    await tx.movement.create({ data: { type: 'MOVE', productId, fromLocationId: from.id, toLocationId: to.id, qty, note } })
  })

  revalidateWarehousePages()
  redirect('/inventory')
}

export async function importWarehouseExcel(formData: FormData) {
  const upload = formData.get('file')
  if (!(upload instanceof File) || upload.size === 0) throw new Error('Загрузите Excel-файл')

  const bytes = await upload.arrayBuffer()
  const wb = XLSX.read(Buffer.from(bytes), { type: 'buffer' })
  const preferredSheet = clean(formData.get('sheetName'))
  const sheetName = preferredSheet && wb.SheetNames.includes(preferredSheet)
    ? preferredSheet
    : wb.SheetNames.includes('Лист2')
      ? 'Лист2'
      : wb.SheetNames[0]

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: '' })
  if (!rows.length) throw new Error('В Excel-файле нет строк для импорта')

  const headers = Object.keys(rows[0])
  const nameCol = findHeader(headers, ['наименование', 'название', 'товар', 'общее название']) || headers[0]
  const skuCol = findHeader(headers, ['артикул', 'код', 'sku'])
  const manufacturerCol = findHeader(headers, ['производитель'])
  const modelCol = findHeader(headers, ['марка', 'модель'])
  const categoryCol = findHeader(headers, ['категория', 'группа'])
  const locationCol = findHeader(headers, ['место хранения', 'место', 'ячейка', 'location'])
  const qtyCol = findHeader(headers, ['остаток', 'кол-во', 'количество', 'qty'])

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = clean(row[nameCol])
    if (!name || name.toLowerCase() === nameCol.toLowerCase()) continue

    const sku = clean(skuCol ? row[skuCol] : '') || `ROW-${i + 2}`
    const manufacturer = manufacturerCol ? optional(row[manufacturerCol]) : null
    const model = modelCol ? optional(row[modelCol]) : null
    const category = categoryCol ? optional(row[categoryCol]) : null
    const rawLoc = locationCol ? clean(row[locationCol]) : ''
    const qtyRaw = qtyCol ? Number(row[qtyCol]) : 0
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.trunc(qtyRaw) : 0

    const product = await prisma.product.upsert({
      where: { sku },
      update: { name, manufacturer, model, category, archived: false, lastLocation: rawLoc || undefined },
      create: { sku, name, manufacturer, model, category, lastLocation: rawLoc || undefined }
    })

    const locations = splitLocations(rawLoc)
    for (const code of locations) {
      const location = await prisma.location.upsert({ where: { code }, update: { active: true }, create: { code } })
      const existing = await prisma.inventory.findFirst({ where: { productId: product.id, locationId: location.id, batch: null } })
      const rowQty = locations.length === 1 ? qty : 0
      const note = locations.length > 1 ? 'После импорта нужно вручную распределить количество по местам хранения' : null

      if (existing) await prisma.inventory.update({ where: { id: existing.id }, data: { qty: rowQty, note } })
      else await prisma.inventory.create({ data: { productId: product.id, locationId: location.id, qty: rowQty, note } })
    }
  }

  revalidateWarehousePages()
  redirect('/inventory')
}
