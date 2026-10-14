import type { PerfilSalvosProps } from '@/features/perfil/types'
import Link from 'next/link'

export function PerfilSalvos({ salvos }: PerfilSalvosProps) {
  if (salvos.length === 0) {
    return (
      <div className="bg-white border-x border-b border-border rounded-b-2xl">
        <p className="text-center text-sm text-fg-3 py-8">Nenhum ponto salvo ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-x border-b border-border rounded-b-2xl divide-y divide-border">
      {salvos.map((p) => {
        const conf = p.confiabilidade ?? 0
        const cor = conf >= 0.7 ? '#0D9858' : conf >= 0.4 ? '#D97706' : '#DC2626'
        const label = conf >= 0.7 ? 'Confiável' : conf >= 0.4 ? '⚠ Verificar' : '✗ Inativo'

        return (
          <Link
            key={p.id}
            href={`/ponto/${p.id}`}
            aria-label={`Ver detalhes do ponto ${p.nome}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            <div className="w-9 h-9 rounded-lg bg-acc-bg flex items-center justify-center text-lg shrink-0">♻</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg">{p.nome}</p>
              <p className="text-xs text-fg-3">{p.cidade} · <span style={{ color: cor }}>{label}</span></p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
