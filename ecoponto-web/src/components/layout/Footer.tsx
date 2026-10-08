import Link from 'next/link'

const ANO = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#D4DAD4] px-4 py-6 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#0F1C12] font-semibold">
          <span className="text-[#0D9858]">♻</span>
          Ecoponto Certo
        </div>

        <nav className="flex items-center gap-4 text-sm text-[#7A9480]">
          <Link href="/sobre" className="hover:text-[#0D9858] transition-colors">Sobre</Link>
          <Link href="/sobre#contribuir" className="hover:text-[#0D9858] transition-colors">Contribuir</Link>
          <Link href="/sobre#b2b" className="hover:text-[#0D9858] transition-colors">Empresas</Link>
        </nav>

        <p className="text-xs text-[#7A9480]">
          Projeto CS50 · {ANO}
        </p>
      </div>
    </footer>
  )
}
