export const dynamic = 'force-dynamic'

import { scannerOperation } from '@/lib/actions'

export default async function Scanner({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const { error = '', success = '' } = await searchParams

  return <div className="mx-auto max-w-xl">
    <div className="mb-5">
      <h1 className="text-3xl font-bold">Сканер</h1>
      <p className="mt-1 text-sm text-gray-500">Мобильная форма для сканера штрихкодов. Сканер должен вводить артикул/SKU как текст.</p>
    </div>

    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>}
    {success && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">{success}</div>}

    <form action={scannerOperation} className="card grid gap-4 p-4 md:p-5">
      <label className="text-sm font-medium">Действие
        <select className="input mt-1" name="mode" required>
          <option value="receive">Приход</option>
          <option value="move">Перемещение</option>
          <option value="ship">Отгрузка</option>
        </select>
      </label>

      <label className="text-sm font-medium">Скан товара / артикул
        <input className="input mt-1 text-lg" name="productScan" placeholder="Например: ABC-001" autoFocus autoComplete="off" required />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Из места
          <input className="input mt-1 text-lg" name="fromLocation" placeholder="A16" autoComplete="off" />
          <span className="mt-1 block text-xs text-gray-500">Нужно для перемещения и отгрузки.</span>
        </label>
        <label className="text-sm font-medium">В место
          <input className="input mt-1 text-lg" name="toLocation" placeholder="B01" autoComplete="off" />
          <span className="mt-1 block text-xs text-gray-500">Нужно для прихода и перемещения.</span>
        </label>
      </div>

      <label className="text-sm font-medium">Количество
        <input className="input mt-1 text-lg" name="qty" type="number" min="1" defaultValue="1" required />
      </label>

      <label className="text-sm font-medium">Примечание
        <input className="input mt-1" name="note" placeholder="Опционально" />
      </label>

      <button className="btn w-full py-3 text-base">Выполнить операцию</button>
    </form>

    <div className="mt-5 rounded-2xl border bg-white p-4 text-sm text-gray-600">
      <div className="font-semibold text-gray-900">Как пользоваться</div>
      <p className="mt-2">1. Выберите действие. 2. Отсканируйте товар. 3. Отсканируйте место хранения. 4. Введите количество и подтвердите.</p>
      <p className="mt-2">Пока поиск идёт по артикулу/SKU. Если позже добавим отдельное поле “штрихкод” в товар, сканер будет искать и по нему.</p>
    </div>
  </div>
}
