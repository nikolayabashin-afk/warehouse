import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Warehouse WMS', description: 'Small warehouse management system' }

const nav = [
  ['Dashboard', '/dashboard'], ['Search', '/search'], ['Products', '/products'], ['Locations', '/locations'],
  ['Inventory', '/inventory'], ['Receive', '/receive'], ['Move', '/move']
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-950 text-white p-5 hidden md:block">
        <div className="text-xl font-bold mb-8">Warehouse WMS</div>
        <nav className="space-y-1">{nav.map(([label, href]) => <Link key={href} className="block rounded-xl px-3 py-2 hover:bg-white/10" href={href}>{label}</Link>)}</nav>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  </body></html>
}
