'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function asInt(value: FormDataEntryValue | null) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new Error('Quantity must be a positive integer')
  return n
}

async function getOrCreateLocation(codeRaw: string) {
  const code = codeRaw.trim().toUpperCase()
  if (!code) throw new Error('Location is required')
  return prisma.location.upsert({ where: { code }, update: {}, create: { code } })
}

export async function receiveStock(formData: FormData) {
  const productId = String(formData.get('productId'))
  const locationCode = String(formData.get('location'))
  const qty = asInt(formData.get('qty'))
  const note = String(formData.get('note') || '')
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
  revalidatePath('/')
}

export async function moveStock(formData: FormData) {
  const productId = String(formData.get('productId'))
  const fromCode = String(formData.get('fromLocation')).trim().toUpperCase()
  const toCode = String(formData.get('toLocation')).trim().toUpperCase()
  const qty = asInt(formData.get('qty'))
  if (fromCode === toCode) throw new Error('From and To locations must be different')
  const from = await prisma.location.findUnique({ where: { code: fromCode } })
  if (!from) throw new Error('Source location does not exist')
  const to = await getOrCreateLocation(toCode)

  await prisma.$transaction(async tx => {
    const source = await tx.inventory.findFirst({ where: { productId, locationId: from.id, batch: null } })
    if (!source || source.qty < qty) throw new Error('Not enough stock in source location')
    await tx.inventory.update({ where: { id: source.id }, data: { qty: source.qty - qty } })
    if (source.qty === qty) await tx.inventory.delete({ where: { id: source.id } })

    const target = await tx.inventory.findFirst({ where: { productId, locationId: to.id, batch: null } })
    if (target) await tx.inventory.update({ where: { id: target.id }, data: { qty: target.qty + qty } })
    else await tx.inventory.create({ data: { productId, locationId: to.id, qty } })

    await tx.movement.create({ data: { type: 'MOVE', productId, fromLocationId: from.id, toLocationId: to.id, qty } })
  })
  revalidatePath('/')
}
