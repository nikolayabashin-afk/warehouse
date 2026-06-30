import Link from 'next/link'
import { createProduct } from '@/lib/actions'
import { ClearFormButton } from '@/app/components/ClearFormButton'

export default function NewProduct() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Добавить товар</h1>
        <p className="text-sm text-gray-500 mt-1">Создайте новый товар, чтобы затем принять его на склад.</p>
      </div>
      <Link className="btn" href="/products">Назад к товарам</Link>
    </div>

    <form action={createProduct} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Артикул<input className="input mt-1" name="sku" placeholder="MED-001" required /></label>
      <label className="text-sm font-medium">Наименование товара<input className="input mt-1" name="name" placeholder="Шприц / Катетер / Перчатки" required /></label>
      <label className="text-sm font-medium">Производитель<input className="input mt-1" name="manufacturer" placeholder="Bayer / Siemens / GE" /></label>
      <label className="text-sm font-medium">Модель<input className="input mt-1" name="model" placeholder="Необязательно" /></label>
      <label className="text-sm font-medium">Категория<input className="input mt-1" name="category" placeholder="Расходник / Запчасть / Оборудование" /></label>
      <label className="text-sm font-medium">Предпочтительное место хранения<input className="input mt-1" name="preferredLocation" placeholder="A16 / OV01" /></label>
      <div className="flex gap-3"><button className="btn w-fit">Создать товар</button><ClearFormButton /></div>
    </form>
  </div>
}
