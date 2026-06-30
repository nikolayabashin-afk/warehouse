export function OperationBadge({ type }: { type: string }) {
  const config: Record<string, { label: string, className: string }> = {
    RECEIVE: { label: 'Приход', className: 'bg-green-100 text-green-800 border-green-200' },
    MOVE: { label: 'Перемещение', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    ISSUE: { label: 'Отгрузка', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    ADJUST: { label: 'Корректировка', className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
  const item = config[type] || { label: type, className: 'bg-gray-100 text-gray-800 border-gray-200' }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>
}
