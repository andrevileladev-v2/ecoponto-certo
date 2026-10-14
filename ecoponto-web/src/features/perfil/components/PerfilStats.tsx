import type { PerfilStatsProps } from '@/features/perfil/types'

export function PerfilStats({ stats }: PerfilStatsProps) {
  const items = [
    { n: stats.entregas, l: 'Entregas' },
    { n: stats.confirmacoes, l: 'Confirmações' },
    { n: stats.salvos, l: 'Salvos' },
  ]

  return (
    <div className="grid grid-cols-3 border-x border-b border-border bg-white divide-x divide-border">
      {items.map(({ n, l }) => (
        <div key={l} className="py-3 text-center">
          <div className="text-lg font-bold text-accent">{n}</div>
          <div className="text-xs text-fg-3 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  )
}
