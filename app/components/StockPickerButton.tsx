'use client'

export function StockPickerButton({ productId, locationCode, qty, mode }: { productId: string, locationCode: string, qty: number, mode: 'move' | 'ship' }) {
  return <button
    type="button"
    className="text-sm text-blue-600 hover:underline"
    onClick={() => {
      const product = document.querySelector<HTMLSelectElement>('select[name="productId"]')
      const fromLocation = document.querySelector<HTMLInputElement>('input[name="fromLocation"]')
      const quantity = document.querySelector<HTMLInputElement>('input[name="qty"]')
      const toLocation = document.querySelector<HTMLInputElement>('input[name="toLocation"]')

      if (product) product.value = productId
      if (fromLocation) fromLocation.value = locationCode
      if (quantity) quantity.value = String(qty)
      if (mode === 'move' && toLocation) toLocation.focus()
      else quantity?.focus()

      window.scrollTo({ top: 0, behavior: 'smooth' })
    }}
  >Выбрать</button>
}
