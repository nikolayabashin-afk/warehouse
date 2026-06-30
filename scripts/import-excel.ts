import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import path from 'path'

const prisma = new PrismaClient()
const file = process.argv[2]
if (!file) {
  console.error('Usage: npm run import:excel -- ./warehouse.xlsx')
  process.exit(1)
}

function clean(v: unknown): string {
  return String(v ?? '').trim()
}

function normalizeLocation(code: string): string {
  return code.trim().replace(/\s+/g, '').replace(/[А]/g, 'A').replace(/[В]/g, 'B').replace(/[С]/g, 'C').replace(/[Е]/g, 'E').toUpperCase()
}

function splitLocations(raw: string): string[] {
  if (!raw) return []
  const fixed = raw
    .replace(/[;,\/\\]+/g, ' ')
    .replace(/\s+и\s+/gi, ' ')
    .trim()
  const matches = fixed.match(/[A-ZА-ЯЁ]-?\d+/gi) || []
  return [...new Set(matches.map(normalizeLocation))]
}

function findHeader(headers: string[], candidates: string[]) {
  const lower = headers.map(h => h.toLowerCase())
  for (const c of candidates) {
    const idx = lower.findIndex(h => h.includes(c.toLowerCase()))
    if (idx >= 0) return headers[idx]
  }
  return undefined
}

async function main() {
  const wb = XLSX.readFile(path.resolve(file))
  const sheetName = wb.SheetNames.includes('Лист2') ? 'Лист2' : wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: '' })
  if (!rows.length) throw new Error('No rows found')

  const headers = Object.keys(rows[0])
  const nameCol = findHeader(headers, ['наименование', 'название', 'товар', 'общее название']) || headers[0]
  const skuCol = findHeader(headers, ['артикул', 'код', 'sku'])
  const manufacturerCol = findHeader(headers, ['производитель'])
  const modelCol = findHeader(headers, ['марка', 'модель'])
  const locationCol = findHeader(headers, ['место хранения', 'место', 'ячейка'])
  const qtyCol = findHeader(headers, ['остаток', 'кол-во', 'количество', 'qty'])

  let imported = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const name = clean(row[nameCol])
    if (!name || name.toLowerCase() === nameCol.toLowerCase()) continue
    const sku = clean(skuCol ? row[skuCol] : '') || `ROW-${i + 2}`
    const manufacturer = manufacturerCol ? clean(row[manufacturerCol]) || null : null
    const model = modelCol ? clean(row[modelCol]) || null : null
    const rawLoc = locationCol ? clean(row[locationCol]) : ''
    const qtyRaw = qtyCol ? Number(row[qtyCol]) : 0
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.trunc(qtyRaw) : 0

    const product = await prisma.product.upsert({
      where: { sku },
      update: { name, manufacturer, model, lastLocation: rawLoc || undefined },
      create: { sku, name, manufacturer, model, lastLocation: rawLoc || undefined }
    })

    const locations = splitLocations(rawLoc)
    for (const code of locations) {
      const location = await prisma.location.upsert({ where: { code }, update: {}, create: { code } })
      const existing = await prisma.inventory.findFirst({ where: { productId: product.id, locationId: location.id, batch: null } })
      const rowQty = locations.length === 1 ? qty : 0
      if (existing) await prisma.inventory.update({ where: { id: existing.id }, data: { qty: rowQty } })
      else await prisma.inventory.create({ data: { productId: product.id, locationId: location.id, qty: rowQty, note: locations.length > 1 ? 'Manual quantity distribution needed' : null } })
    }
    imported++
  }
  console.log(`Imported ${imported} products from ${sheetName}`)
}

main().finally(() => prisma.$disconnect())
