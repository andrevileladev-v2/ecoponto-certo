'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, LayoutDashboard, User, Info } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Mapa', icon: Map },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

export default function Header() {
  const path = usePathname()

  return (
    <header className="bg-white border-b border-[#D4DAD4] px-4 py-3 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2 font-semibold text-[#0F1C12]">
        <span className="text-[#0D9858] text-xl">♻</span>
        <span>Ecoponto Certo</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              path == (href)
                ? 'bg-[#E8F5ED] text-[#0D9858]'
                : 'text-[#3D5444] hover:bg-[#F7F8F7]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Link
        href="/perfil"
        className="w-8 h-8 rounded-full bg-[#E8F5ED] flex items-center justify-center text-[#0D9858] font-semibold text-sm"
      >
        A
      </Link>
    </header>
  )
}
