const repositoryUrl = 'https://github.com/andrevileladev-v2/ecoponto-certo'

const data = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-fg-3 sm:flex-row">
        <p>© 2026 Ecoponto Certo · CS50x · {data}</p>
        <nav aria-label="Links do projeto" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a
            href={`${repositoryUrl}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            Licença MIT
          </a>
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent"
          >
            Código aberto
          </a>
          <a
            href="/sugestoes"
            className="transition-colors hover:text-accent"
          >
            Contato e sugestões
          </a>
        </nav>
      </div>
    </footer>
  )
}
