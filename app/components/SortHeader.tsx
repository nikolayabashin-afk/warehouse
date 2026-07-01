import Link from 'next/link'

type SortOrder = 'asc' | 'desc'

type SortHeaderProps = {
  label: string
  sortKey: string
  currentSort?: string
  currentOrder?: string
  searchParams?: Record<string, string | undefined>
  className?: string
}

export function SortHeader({ label, sortKey, currentSort = '', currentOrder = '', searchParams = {}, className = 'th' }: SortHeaderProps) {
  const active = currentSort === sortKey
  const nextParams = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'sort' && key !== 'order') nextParams.set(key, value)
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
    nextParams.set('sort', sortKey)
    nextParams.set('order', nextOrder)
  }

  const href = nextParams.toString() ? `?${nextParams.toString()}` : '?'

  return <th className={className}>
    <Link href={href} className="inline-flex items-center gap-1 hover:text-blue-600">
      {label}{arrow}
    </Link>
  </th>
}
