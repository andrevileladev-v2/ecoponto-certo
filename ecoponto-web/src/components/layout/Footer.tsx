import Link from 'next/link'

const ANO = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border px-4 py-6 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-fg font-semibold">
          <span className="text-accent">♻</span>
          Ecoponto Certo
        </div>

        <nav className="flex items-center gap-4 text-sm text-fg-3">
          <Link href="/sobre" className="hover:text-accent transition-colors">Sobre</Link>
          <Link href="/sobre#contribuir" className="hover:text-accent transition-colors">Contribuir</Link>
          <Link href="/sobre#b2b" className="hover:text-accent transition-colors">Empresas</Link>
        </nav>

        <p className="text-xs text-fg-3">
          Projeto CS50 · {ANO}
        </p>
      </div>
    </footer>
  )
}
