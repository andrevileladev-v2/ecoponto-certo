'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, LayoutDashboard, Info, User } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Mapa', icon: Map },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

const MOBILE_NAV = [...NAV, { href: '/perfil', label: 'Perfil', icon: User }]

export default function Header() {
  const path = usePathname()

  return (
    <>
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

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-border bg-white/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              path === href ? 'text-accent' : 'text-fg-3'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
