'use client'

export function ClearFormButton({ children = 'Очистить' }: { children?: string }) {
  return <button
    type="button"
    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    onClick={(event) => {
      const form = event.currentTarget.closest('form')
      if (!form) return
      form.reset()
      form.querySelectorAll<HTMLInputElement>('input').forEach(input => {
        if (input.type !== 'hidden') input.value = ''
      })
      form.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(textarea => { textarea.value = '' })
      form.querySelectorAll<HTMLSelectElement>('select').forEach(select => { select.selectedIndex = 0 })
    }}
  >{children}</button>
}
