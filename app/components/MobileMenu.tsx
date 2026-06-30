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
      ☰ Меню
    </button>

    {open && <div
      className="md:hidden"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '100vh',
        zIndex: 999999,
        backgroundColor: '#030712',
        color: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', height: '100%', flexDirection: 'column', paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,.12)', padding: '16px 20px' }}>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>Склад WMS</div>
          <button type="button" style={{ borderRadius: 14, background: 'rgba(255,255,255,.12)', padding: '10px 14px', fontSize: 16 }} onClick={() => setOpen(false)}>Закрыть</button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 20px calc(env(safe-area-inset-bottom) + 28px)' }}>
          <div style={{ display: 'grid', gap: 24 }}>
            {navSections.map(section => <div key={section.title}>
              <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af' }}>{section.title}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {section.links.map(([label, href]) => <Link key={href} onClick={() => setOpen(false)} style={{ display: 'block', borderRadius: 18, background: 'rgba(255,255,255,.08)', padding: '16px 18px', fontSize: 22, fontWeight: 600, color: '#ffffff', textDecoration: 'none' }} href={href}>{label}</Link>)}
              </div>
            </div>)}
          </div>
        </nav>
      </div>
    </div>}
  </>
}
