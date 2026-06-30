import Link from 'next/link'
import { importWarehouseExcel } from '@/lib/actions'

export default function ImportPage() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Excel import</h1>
        <p className="text-sm text-gray-500 mt-1">Upload the latest warehouse Excel file and import products, locations, and stock rows.</p>
      </div>
      <Link className="btn" href="/inventory">Back to inventory</Link>
    </div>

    <form action={importWarehouseExcel} encType="multipart/form-data" className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Excel file<input className="input mt-1" name="file" type="file" accept=".xlsx,.xls" required /></label>
      <label className="text-sm font-medium">Sheet name<input className="input mt-1" name="sheetName" placeholder="Optional. Example: Лист2" /></label>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        If one row contains several locations like “A16 A17”, the importer creates separate location rows and sets quantity to 0 with a note, so you can manually distribute the stock safely.
      </div>
      <button className="btn w-fit">Import Excel</button>
    </form>
  </div>
}
