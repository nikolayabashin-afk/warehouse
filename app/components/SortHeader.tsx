import Link from 'next/link'

type SortOrder = 'asc' | 'desc'

type SortHeaderProps = {
  label: string
  sortKey: string
  currentSort?: string
  currentOrder?: string
  searchParams?: Record<string, string | undefined>
  className?: string
  sortParam?: string
  orderParam?: string
}

export function SortHeader(props: SortHeaderProps) {
  const {
    label,
    sortKey,
    currentSort = '',
    currentOrder = '',
    searchParams = {},
    className = 'th',
    sortParam = 'sort',
    orderParam = 'order'
  } = props

  const active = currentSort === sortKey
  const nextParams = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== sortParam && key !== orderParam) nextParams.set(key, value)
  }

  let arrow = ''
  let nextOrder: SortOrder | '' = 'asc'

  if (active && currentOrder === 'asc') {
    arrow = ' ▲'
    nextOrder = 'desc'
  } else if (active && currentOrder === 'desc') {
    arrow = ' ▼'
    nextOrder = ''
  }

  if (nextOrder) {
    nextParams.set(sortParam, sortKey)
    nextParams.set(orderParam, nextOrder)
  }

  const href = nextParams.toString() ? `?${nextParams.toString()}` : '?'

  return <th className={className}>
    <Link href={href} className="inline-flex items-center gap-1 hover:text-blue-600">
      {label}{arrow}
    </Link>
  </th>
}
