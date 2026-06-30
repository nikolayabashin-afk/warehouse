'use client'

import { useState } from 'react'
import Link from 'next/link'

export type NavSection = {
  title: string
  links: string[][]
}

export function MobileMenu({ navSections }: { navSections: NavSection[] }) {
  const [open, setOpen] = useState(false)

  return <>
    <button
      type="button"
      className="md:hidden rounded-xl border px-3 py-2 text-sm font-semibold"
      onClick={() => setOpen(true)}
      aria-label="Открыть меню"
    >
      ☰ Меню
    </button>

    {open && <div className="fixed inset-0 z-50 md:hidden">
      <button className="absolute inset-0 bg-black/40" aria-label="Закрыть меню" onClick={() => setOpen(false)} />
      <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-gray-950 p-5 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="text-xl font-bold">Склад WMS</div>
          <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={() => setOpen(false)}>Закрыть</button>
        </div>
        <nav className="space-y-6">
          {navSections.map(section => <div key={section.title}>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
            <div className="space-y-1">
              {section.links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base hover:bg-white/10" href={href}>{label}</Link>)}
            </div>
          </div>)}
        </nav>
      </aside>
    </div>}
  </>
}
