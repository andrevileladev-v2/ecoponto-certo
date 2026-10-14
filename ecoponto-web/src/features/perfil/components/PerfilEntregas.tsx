import { ChevronDown, ChevronUp, Recycle } from 'lucide-react'
import { useState } from 'react'

import { RESIDUO_ICONS } from '@/features/perfil/config'
import type { PerfilEntregasProps } from '@/features/perfil/types'

export function PerfilEntregas({ entregas }: PerfilEntregasProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeEntregaId, setActiveEntregaId] = useState<string | null>(null)

  if (entregas.length === 0) {
    return (
      <div className="bg-white border-x border-b border-border rounded-b-2xl">
        <p className="text-center text-sm text-fg-3 py-8">Nenhuma entrega registrada ainda.</p>
      </div>
    )
  }

  const visibleEntregas = expanded ? entregas : entregas.slice(0, 5)
  const hiddenCount = entregas.length - visibleEntregas.length

  return (
    <div className="overflow-hidden rounded-b-2xl border-x border-b border-border bg-white">
      <div className="divide-y divide-border">
      {visibleEntregas.map((e) => {
        const Icon = RESIDUO_ICONS[e.residuo.icone ?? ''] ?? Recycle

        return (
          <div
            key={e.id}
            className="transition-colors hover:bg-raised"
          >
            <button
              type="button"
              aria-expanded={activeEntregaId === e.id}
              aria-label={`Ver o que foi registrado na entrega de ${e.residuo.nome} em ${e.ponto.nome}`}
              onClick={() => setActiveEntregaId((current) => current === e.id ? null : e.id)}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: `${e.residuo.cor}22` }}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{e.residuo.nome}</p>
                <p className="text-xs text-fg-3">{e.ponto.nome}</p>
              </div>
              <div className="shrink-0 text-right">
                {e.quantidade != null && (
                  <p className="text-sm font-bold text-accent">{e.quantidade} {e.unidade ?? 'kg'}</p>
                )}
                <p className={`text-xs font-semibold ${e.resultado === 'CONSEGUIU' ? 'text-accent' : 'text-red-700'}`}>
                  {e.resultado === 'CONSEGUIU' ? 'Conseguiu reciclar' : 'Não conseguiu'}
                </p>
                <p className="text-xs text-fg-3">
                  {new Date(e.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
              {activeEntregaId === e.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {activeEntregaId === e.id && (
              <div className="space-y-2 border-t border-border bg-raised px-4 py-3 text-sm">
                <p className="font-semibold text-fg">Detalhes do registro</p>
                <p className="text-fg-2">
                  {e.resultado === 'CONSEGUIU' ? 'Material reciclado' : 'Material não reciclado'}: {e.residuo.nome}
                </p>
                {e.resultado === 'CONSEGUIU' && (
                  <p className="text-fg-2">
                    Quantidade: {e.quantidade != null ? `${e.quantidade} ${e.unidade ?? 'kg'}` : 'não informada'}
                  </p>
                )}
                {e.motivo && <p className="text-fg-2">Motivo: {e.motivo}</p>}
                <p className="text-xs text-fg-3">
                  {e.ponto.nome} · {new Date(e.criado_em).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )
      })}
      </div>
      {entregas.length > 5 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-raised"
        >
          {expanded ? (
            <>
              Ver menos <ChevronUp size={16} />
            </>
          ) : (
            <>
              Ver mais ({hiddenCount}) <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  )
}
