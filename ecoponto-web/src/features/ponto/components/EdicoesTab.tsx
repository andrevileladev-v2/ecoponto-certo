import type { EdicoesTabProps } from '@/features/ponto/types'

export function EdicoesTab({ propostas, relatos = [], isLoggedIn = false, onVotar, onVotarRelato }: EdicoesTabProps) {
  const relatosPendentes = relatos.filter((relato) => relato.status === 'pendente')
  const actionsDisabled = !isLoggedIn

  return (
    <div className="bg-white border border-border -mt-4 rounded-b-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-raised">
        <p className="text-xs font-semibold text-fg-3">Edições e novas informações sugeridas</p>
      </div>

      {!isLoggedIn && (
        <div className="px-4 py-3 border-b border-border bg-slate-50">
          <p className="text-[11px] text-fg-3">Faça login para avaliar relatórios e sugestões da comunidade.</p>
        </div>
      )}

      <div className="divide-y divide-border">
        {relatosPendentes.length > 0 && (
          <div className="px-4 py-4 bg-amber-50/40">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Relatos da comunidade
            </p>

            {relatosPendentes.map((relato, index) => (
              <div key={relato.id} className="mb-3 rounded-xl border border-amber-200 bg-white p-3 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">{relato.motivo}</p>
                    <p className="mt-1 text-xs text-fg-2">{relato.texto}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                    pendente
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-fg-3">{relato.confirmacoes}/{relato.votos} confirmaram</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => !actionsDisabled && onVotarRelato?.(index, true)}
                      disabled={actionsDisabled}
                      className={`rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        actionsDisabled
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-acc-bg text-accent hover:bg-accent hover:text-white'
                      }`}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => !actionsDisabled && onVotarRelato?.(index, false)}
                      disabled={actionsDisabled}
                      className={`rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        actionsDisabled
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {propostas.map((proposta, index) => (
          <div key={proposta.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-fg">{proposta.titulo}</p>
                <p className="mt-1 text-xs text-fg-2">{proposta.descricao}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {proposta.status}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-fg-3">{proposta.votos} pessoas avaliaram</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !actionsDisabled && onVotar(index, true)}
                  disabled={actionsDisabled}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                    actionsDisabled
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-acc-bg text-accent hover:bg-accent hover:text-white'
                  }`}
                >
                  Faz sentido
                </button>
                <button
                  type="button"
                  onClick={() => !actionsDisabled && onVotar(index, false)}
                  disabled={actionsDisabled}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                    actionsDisabled
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  Não faz
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
