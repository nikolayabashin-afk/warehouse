import Link from 'next/link'
import { importWarehouseExcel } from '@/lib/actions'
import { ClearFormButton } from '@/app/components/ClearFormButton'

export default function ImportPage() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Импорт Excel</h1>
        <p className="text-sm text-gray-500 mt-1">Загрузите складской Excel-файл, чтобы импортировать товары, места хранения и остатки.</p>
      </div>
      <Link className="btn" href="/inventory">Назад к остаткам</Link>
    </div>

    <form action={importWarehouseExcel} encType="multipart/form-data" className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Excel-файл<input className="input mt-1" name="file" type="file" accept=".xlsx,.xls" required /></label>
      <label className="text-sm font-medium">Название листа<input className="input mt-1" name="sheetName" placeholder="Необязательно. Например: Лист2" /></label>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        Если в одной строке указано несколько мест хранения, например “A16 A17”, импорт создаст отдельные места и поставит количество 0. После этого количество нужно распределить вручную.
      </div>
      <div className="flex gap-3"><button className="btn w-fit">Импортировать Excel</button><ClearFormButton /></div>
    </form>
  </div>
}
