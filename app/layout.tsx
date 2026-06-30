import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Warehouse WMS', description: 'Small warehouse management system' }

const navSections = [
  { title: 'Overview', links: [['Dashboard', '/dashboard'], ['Search', '/search'], ['Inventory', '/inventory'], ['Movements', '/movements']] },
  { title: 'Catalog', links: [['Products', '/products'], ['Add product', '/products/new'], ['Locations', '/locations'], ['Add location', '/locations/new']] },
  { title: 'Operations', links: [['Receive stock', '/receive'], ['Ship stock', '/ship'], ['Move stock', '/move']] },
  { title: 'Tools', links: [['Excel import', '/import']] }
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-950 text-white p-5 hidden md:block overflow-y-auto">
        <div className="text-xl font-bold mb-8">Warehouse WMS</div>
        <nav className="space-y-6">
          {navSections.map(section => <div key={section.title}>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</div>
            <div className="space-y-1">{section.links.map(([label, href]) => <Link key={href} className="block rounded-xl px-3 py-2 hover:bg-white/10" href={href}>{label}</Link>)}</div>
          </div>)}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  </body></html>
}
