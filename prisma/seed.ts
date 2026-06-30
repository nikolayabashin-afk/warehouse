import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'change-this-password'
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, active: true },
    create: { email, name: 'Admin', passwordHash, role: Role.ADMIN, active: true }
  })

  for (const code of ['OV01', 'OV02', 'OV03', 'PASS01', 'FL01']) {
    await prisma.location.upsert({
      where: { code },
      update: {},
      create: { code, type: code.startsWith('OV') ? 'OVERFLOW' : code.startsWith('FL') ? 'FLOOR' : 'PATHWAY' }
    })
  }
}

await prisma.product.upsert({
  where: { sku: 'TEST-001' },
  update: {},
  create: {
    sku: 'TEST-001',
    name: 'Test Syringe',
    manufacturer: 'Test Manufacturer'
  }
})

await prisma.product.upsert({
  where: { sku: 'TEST-002' },
  update: {},
  create: {
    sku: 'TEST-002',
    name: 'Test Catheter',
    manufacturer: 'Test Manufacturer'
  }
})

await prisma.product.upsert({
  where: { sku: 'TEST-003' },
  update: {},
  create: {
    sku: 'TEST-003',
    name: 'Test Gloves',
    manufacturer: 'Test Manufacturer'
  }
})

main().finally(() => prisma.$disconnect())
