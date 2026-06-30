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
      className="md:hidden rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
      onClick={() => setOpen(true)}
      aria-label="Открыть меню"
    >
      ☰
    </button>

    {open && <div className="fixed inset-0 z-50 bg-gray-950 text-white md:hidden">
      <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="text-2xl font-bold">Склад WMS</div>
          <button className="rounded-xl bg-white/10 px-4 py-2 text-base" onClick={() => setOpen(false)}>Закрыть</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div className="space-y-6">
            {navSections.map(section => <div key={section.title}>
              <div className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
              <div className="space-y-2">
                {section.links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} className="block rounded-2xl bg-white/5 px-4 py-4 text-xl font-medium active:bg-white/15" href={href}>{label}</Link>)}
              </div>
            </div>)}
          </div>
        </nav>
      </div>
    </div>}
  </>
}
