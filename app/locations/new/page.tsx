import Link from 'next/link'
import { createLocation } from '@/lib/actions'

export default function NewLocation() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Добавить место хранения</h1>
        <p className="text-sm text-gray-500 mt-1">Создайте стеллаж, зону переполнения, проход или напольное место хранения.</p>
      </div>
      <Link className="btn" href="/locations">Назад к местам хранения</Link>
    </div>

    <form action={createLocation} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Код места<input className="input mt-1" name="code" placeholder="A16 / OV01 / PASS01 / FL01" required /></label>
      <label className="text-sm font-medium">Тип<select className="input mt-1" name="type" defaultValue="RACK">
        <option value="RACK">Стеллаж</option>
        <option value="OVERFLOW">Переполнение</option>
        <option value="PATHWAY">Проход</option>
        <option value="FLOOR">Пол</option>
      </select></label>
      <label className="text-sm font-medium">Зона<input className="input mt-1" name="zone" placeholder="A / B / Приёмка / Переполнение" /></label>
      <label className="text-sm font-medium">Вместимость<input className="input mt-1" name="capacity" type="number" min="1" placeholder="Необязательная вместимость по количеству" /></label>
      <label className="text-sm font-medium">Примечание<input className="input mt-1" name="note" placeholder="Необязательно" /></label>
      <button className="btn w-fit">Создать место</button>
    </form>
  </div>
}
