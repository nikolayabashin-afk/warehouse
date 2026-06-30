# Warehouse WMS Starter

A lightweight warehouse management web app for a small overstocked warehouse.

## Included MVP

- PostgreSQL database schema
- Product list
- Location list
- Inventory by location
- Search by product / SKU / manufacturer / location
- Receive stock
- Move stock from one location to another
- Movement history database model
- Login foundation with roles
- Excel import script

## Database model

The app supports the real warehouse situation:

- one product can be stored in many locations
- one location can contain many products
- overflow/pathway/floor locations are supported

Core table:

```text
Inventory = Product + Location + Quantity
```

## Local setup

1. Install Node.js.
2. Create a PostgreSQL database.
3. Copy `.env.example` to `.env`.
4. Fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
5. Run:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000
```

## Import Excel

Put the Excel file in the project folder, then run:

```bash
npm run import:excel -- "./СКЛАД — 2026.xlsx"
```

The importer tries to detect columns such as:

- Наименование / Название / Товар
- Артикул / Код / SKU
- Производитель
- Марка / Модель
- Место хранения
- Остаток / Кол-во / Количество

If one row has `A16 A17`, the importer creates two inventory location rows, not only `A16`. If there are several locations for one product, quantity is set to 0 and marked for manual distribution, because Excel cannot know how many pieces are in each location.

## Railway hosting

Recommended setup:

1. Push this folder to GitHub.
2. Create a Railway project.
3. Add PostgreSQL.
4. Add a Next.js service from your GitHub repo.
5. Set environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
6. Set Railway pre-deploy command:

```bash
npx prisma migrate deploy
```

For first launch, you may use `npm run db:push` locally, then later switch to migrations.

## What still needs to be added next

- Better role checks per page/action
- Capacity and overstock control
- QR code pages for each location
- Product creation/edit forms

- deployment trigger
- Export back to Excel
- Receiving history UI
- Barcode/QR scanner UI
- Backups and restore workflow
