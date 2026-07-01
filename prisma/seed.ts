import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { BCRYPT_COST } from '../lib/auth'

const prisma = new PrismaClient()

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

async function upsertUser(email: string, name: string, rawPassword: string, role: Role) {
  const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_COST)
  await prisma.user.upsert({
    where: { email: email.trim().toLowerCase() },
    update: { name, passwordHash, role, active: true },
    create: { email: email.trim().toLowerCase(), name, passwordHash, role, active: true }
  })
}

async function main() {
  await upsertUser(requiredEnv('ADMIN_EMAIL'), 'Admin', requiredEnv('ADMIN_PASSWORD'), Role.ADMIN)
  await upsertUser(requiredEnv('MANAGER_EMAIL'), 'Manager', requiredEnv('MANAGER_PASSWORD'), Role.MANAGER)
  await upsertUser(requiredEnv('WORKER_EMAIL'), 'Worker', requiredEnv('WORKER_PASSWORD'), Role.WORKER)

  for (const code of ['OV01', 'OV02', 'OV03', 'PASS01', 'FL01']) {
    await prisma.location.upsert({
      where: { code },
      update: {},
      create: { code, type: code.startsWith('OV') ? 'OVERFLOW' : code.startsWith('FL') ? 'FLOOR' : 'PATHWAY' }
    })
  }

  await prisma.product.upsert({
    where: { sku: 'TEST-001' },
    update: {},
    create: { sku: 'TEST-001', name: 'Test Syringe', manufacturer: 'Test Manufacturer' }
  })

  await prisma.product.upsert({
    where: { sku: 'TEST-002' },
    update: {},
    create: { sku: 'TEST-002', name: 'Test Catheter', manufacturer: 'Test Manufacturer' }
  })

  await prisma.product.upsert({
    where: { sku: 'TEST-003' },
    update: {},
    create: { sku: 'TEST-003', name: 'Test Gloves', manufacturer: 'Test Manufacturer' }
  })
}

main().finally(() => prisma.$disconnect())
