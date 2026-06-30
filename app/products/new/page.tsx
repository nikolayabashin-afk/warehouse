import Link from 'next/link'
import { createProduct } from '@/lib/actions'

export default function NewProduct() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Add product</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new product so it can be received into warehouse stock.</p>
      </div>
      <Link className="btn" href="/products">Back to products</Link>
    </div>

    <form action={createProduct} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">SKU / Article number<input className="input mt-1" name="sku" placeholder="MED-001" required /></label>
      <label className="text-sm font-medium">Product name<input className="input mt-1" name="name" placeholder="Syringe / Catheter / Gloves" required /></label>
      <label className="text-sm font-medium">Manufacturer<input className="input mt-1" name="manufacturer" placeholder="Bayer / Siemens / GE" /></label>
      <label className="text-sm font-medium">Model<input className="input mt-1" name="model" placeholder="Optional model" /></label>
      <label className="text-sm font-medium">Category<input className="input mt-1" name="category" placeholder="Consumable / Spare part / Equipment" /></label>
      <label className="text-sm font-medium">Preferred location<input className="input mt-1" name="preferredLocation" placeholder="A16 / OV01" /></label>
      <button className="btn w-fit">Create product</button>
    </form>
  </div>
}
