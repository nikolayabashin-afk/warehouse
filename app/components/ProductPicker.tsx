'use client'

import { useMemo, useState } from 'react'

type ProductOption = {
  id: string
  sku: string
  name: string
  manufacturer: string | null
  model: string | null
}

export function ProductPicker({ products, name = 'productId' }: { products: ProductOption[], name?: string }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(products[0]?.id || '')

  const selected = products.find(product => product.id === selectedId)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalizedQuery) return products.slice(0, 20)
    return products.filter(product => [product.sku, product.name, product.manufacturer || '', product.model || ''].join(' ').toLowerCase().includes(normalizedQuery)).slice(0, 30)
  }, [products, normalizedQuery])

  return <div className="grid gap-2">
    <input type="hidden" name={name} value={selectedId} />
    <label className="text-sm font-medium">Товар</label>
    <input
      className="input"
      value={query}
      onChange={event => setQuery(event.target.value)}
      placeholder="Начните вводить артикул, название, производителя или модель"
    />
    {selected && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
      Выбрано: <b>{selected.sku}</b> — {selected.name}{selected.manufacturer ? `, ${selected.manufacturer}` : ''}{selected.model ? `, ${selected.model}` : ''}
    </div>}
    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white">
      {filtered.map(product => <button
        key={product.id}
        type="button"
        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${product.id === selectedId ? 'bg-blue-50' : ''}`}
        onClick={() => {
          setSelectedId(product.id)
          setQuery(`${product.sku} ${product.name}`)
        }}
      >
        <div className="font-medium">{product.sku} — {product.name}</div>
        <div className="text-xs text-gray-500">{[product.manufacturer, product.model].filter(Boolean).join(' / ') || 'Без производителя и модели'}</div>
      </button>)}
      {!filtered.length && <div className="px-3 py-3 text-sm text-gray-500">Товар не найден.</div>}
    </div>
  </div>
}
