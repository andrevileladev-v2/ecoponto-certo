'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, LayoutDashboard, Info } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Mapa', icon: Map },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

export default function Header() {
  const path = usePathname()

  return (
    <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2 font-semibold text-fg">
        <span className="text-accent text-xl">♻</span>
        <span>Ecoponto Certo</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              path == (href)
                ? 'bg-acc-bg text-accent'
                : 'text-fg-2 hover:bg-raised'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Link
        href="/perfil"
        className="w-8 h-8 rounded-full bg-acc-bg flex items-center justify-center text-accent font-semibold text-sm"
      >
        A
      </Link>
    </header>
  )
}
