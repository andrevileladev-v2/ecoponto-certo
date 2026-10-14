import type { EntregaTabProps } from '@/features/ponto/types'

export function EntregaTab({ entregas }: EntregaTabProps) {
  return (
    <div className="overflow-hidden rounded-b-xl border border-border bg-white">
      <div className="border-b border-border bg-raised px-4 py-3">
        <p className="text-xs font-semibold text-fg-3">Relatos recentes da comunidade</p>
      </div>
      {entregas.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fg-3">Ainda não há relatos neste ponto.</p>
      ) : (
        <div className="divide-y divide-border">
          {entregas.map((entrega) => (
            <div key={entrega.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-fg">{entrega.material}</p>
                  <p className="text-[11px] text-fg-3">{entrega.user} · {entrega.createdAt}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    entrega.resultado === 'CONSEGUIU'
                      ? 'bg-acc-bg text-accent'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {entrega.resultado === 'CONSEGUIU' ? 'Conseguiu reciclar' : 'Não conseguiu'}
                </span>
              </div>
              {(entrega.quantidade != null || entrega.motivo) && (
                <p className="mt-2 text-xs text-fg-2">
                  {entrega.quantidade != null && `${entrega.quantidade} ${entrega.unidade ?? ''}`}
                  {entrega.quantidade != null && entrega.motivo && ' · '}
                  {entrega.motivo && `Motivo: ${entrega.motivo}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
