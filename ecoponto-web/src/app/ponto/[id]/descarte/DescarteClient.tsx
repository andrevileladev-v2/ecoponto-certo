'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, ChevronLeft, Plus, Search, Trash2 } from 'lucide-react'

import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PontoDetalhe, ResultadoEntrega } from '@/features/ponto/types'
import {
  addCustomReportResiduo,
  buildEntregaItemsPayload,
  canSubmitReport,
  toggleReportResiduo,
  validateReportItems,
  type ItemRelato,
  type ResiduoOpcao,
} from '@/features/ponto/reportForm'

const MOTIVOS = [
  'O ponto não aceita este material',
  'O recipiente estava cheio',
  'O ponto estava fechado',
  'Não encontrei local para este item',
  'O horário estava diferente',
  'Outro',
]

function getResultado(value: string | null): ResultadoEntrega {
  return value === 'NAO_CONSEGUIU' ? 'NAO_CONSEGUIU' : 'CONSEGUIU'
}

export default function DescarteClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const initialResultado = getResultado(searchParams.get('resultado'))
  const [ponto, setPonto] = useState<PontoDetalhe | null>(null)
  const [residuos, setResiduos] = useState<ResiduoOpcao[]>([])
  const [items, setItems] = useState<ItemRelato[]>([])
  const [buscaResiduo, setBuscaResiduo] = useState('')
  const [novoResiduo, setNovoResiduo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const submittingRef = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      const returnTo = `/ponto/${id}/descarte?resultado=${initialResultado}`
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }
  }, [authLoading, id, initialResultado, router, user])

  useEffect(() => {
    if (!user || !id) return
    let active = true

    Promise.all([
      api.get<PontoDetalhe>(`/pontos/${id}`),
      api.get<ResiduoOpcao[]>('/residuos'),
    ])
      .then(([pontoData, residuosData]) => {
        if (!active) return
        setPonto(pontoData)
        setResiduos(residuosData)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados do formulário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id, user])

  function updateItem(key: string, patch: Partial<ItemRelato>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item))
  }

  function toggleResiduo(residuo: ResiduoOpcao) {
    setItems((current) => toggleReportResiduo(current, residuo, initialResultado))
  }

  function addCustomResiduo() {
    const result = addCustomReportResiduo(items, residuos, novoResiduo, initialResultado)
    setItems(result.items)
    setNovoResiduo('')
    setError(result.error ?? '')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !canSubmitReport(true, id, submittingRef.current, saved)) return

    const validationError = validateReportItems(items)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    submittingRef.current = true
    setSaving(true)

    try {
      await api.post('/entregas', {
        ponto_id: id,
        usuario_id: user.id,
        items: buildEntregaItemsPayload(items),
      })
      setSaved(true)
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar seu relato.')
      submittingRef.current = false
    } finally {
      setSaving(false)
    }
  }

  if (!user || authLoading) return null

  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <Link href={`/ponto/${id}`} className="flex w-fit items-center gap-1.5 text-sm text-fg-3 transition-colors hover:text-accent">
          <ChevronLeft size={16} /> Voltar ao ponto
        </Link>

        <section className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-bold tracking-widest text-fg-3">REGISTRAR DESCARTE</p>
          <h1 className="mt-1 text-lg font-bold text-fg">{ponto?.nome ?? 'Ponto de coleta'}</h1>
          <p className="mt-1 text-xs text-fg-3">Registre cada item separadamente. Você pode ter conseguido descartar alguns e outros não.</p>
        </section>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {saved && (
          <section role="status" className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="text-accent" size={36} />
            <div>
              <h2 className="font-semibold text-fg">Relato salvo!</h2>
              <p className="mt-1 text-sm text-fg-2">Registramos os itens e o resultado de cada um neste ponto.</p>
            </div>
            <Link href={`/ponto/${id}`} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8048]">
              Voltar ao ponto
            </Link>
          </section>
        )}
        {loading ? (
          <div className="animate-pulse rounded-xl bg-white p-6 text-sm text-fg-3">Carregando formulário…</div>
        ) : !saved && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="ponto_id" value={id ?? ''} />
            <input type="hidden" name="usuario_id" value={user.id} />

            <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
              <div>
                <h2 className="text-sm font-bold text-fg">Quais materiais você levou?</h2>
                <p className="mt-1 text-xs text-fg-3">Toque para selecionar todos os que se aplicam.</p>
              </div>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
                <input
                  type="search"
                  value={buscaResiduo}
                  onChange={(event) => setBuscaResiduo(event.target.value)}
                  placeholder="Buscar material..."
                  className="w-full rounded-lg border border-border bg-raised py-2.5 pl-9 pr-3 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-white p-1.5">
                {residuos.filter((residuo) => residuo.nome.toLocaleLowerCase('pt-BR').includes(buscaResiduo.trim().toLocaleLowerCase('pt-BR'))).length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {residuos
                      .filter((residuo) => residuo.nome.toLocaleLowerCase('pt-BR').includes(buscaResiduo.trim().toLocaleLowerCase('pt-BR')))
                      .slice(0, buscaResiduo.trim() ? 20 : 10)
                      .map((residuo) => {
                        const selecionado = items.some((item) => item.residuoId === residuo.id)
                        return (
                          <button
                            key={residuo.id}
                            type="button"
                            aria-pressed={selecionado}
                            onClick={() => toggleResiduo(residuo)}
                            className={`flex min-h-10 items-center justify-between gap-1 rounded-md border px-2 py-2 text-left text-xs font-medium transition-colors ${
                              selecionado
                                ? 'border-accent bg-acc-bg text-accent'
                                : 'border-transparent bg-raised text-fg-2 hover:border-accent/40 hover:bg-acc-bg'
                            }`}
                          >
                            <span>{residuo.nome}</span>
                            {selecionado && <Check size={14} className="shrink-0" />}
                          </button>
                        )
                      })}
                  </div>
                ) : (
                  <p className="px-2 py-3 text-center text-xs text-fg-3">Nenhum material encontrado.</p>
                )}
              </div>
              {!buscaResiduo.trim() && residuos.length > 10 && (
                <p className="text-[11px] text-fg-3">Digite para encontrar os demais materiais.</p>
              )}
              <div className="flex gap-2">
                <input
                  value={novoResiduo}
                  onChange={(event) => setNovoResiduo(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomResiduo()
                    }
                  }}
                  placeholder="Não achou? Digite outro material"
                  aria-label="Nome do material não cadastrado"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg placeholder:text-fg-3"
                />
                <button
                  type="button"
                  onClick={addCustomResiduo}
                  disabled={!novoResiduo.trim()}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} /> Incluir
                </button>
              </div>
            </section>

            {items.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="px-1 text-sm font-bold text-fg">Quantidade e resultado por material</h2>
                {items.map((item) => {
                  const nome = item.residuoId === 'outro'
                    ? item.nomeCustom
                    : residuos.find((residuo) => residuo.id === item.residuoId)?.nome ?? 'Material'

                  return (
                    <fieldset key={item.key} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <legend className="text-sm font-bold text-fg">{nome}</legend>
                        <button
                          type="button"
                          aria-label={`Remover ${nome}`}
                          onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}
                          className="rounded p-1 text-fg-3 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['CONSEGUIU', 'Consegui reciclar'],
                          ['NAO_CONSEGUIU', 'Não consegui'],
                        ] as const).map(([resultado, label]) => (
                          <button
                            key={resultado}
                            type="button"
                            onClick={() => updateItem(item.key, { resultado, motivo: '', motivoTexto: '' })}
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                              item.resultado === resultado
                                ? resultado === 'CONSEGUIU' ? 'border-accent bg-acc-bg text-accent' : 'border-red-300 bg-red-50 text-red-700'
                                : 'border-border bg-raised text-fg-2'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {item.resultado === 'NAO_CONSEGUIU' && (
                        <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                          Motivo
                          <select
                            required
                            value={item.motivo}
                            onChange={(event) => updateItem(item.key, { motivo: event.target.value, motivoTexto: '' })}
                            className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg"
                          >
                            <option value="" disabled>Selecione um motivo</option>
                            {MOTIVOS.map((motivo) => <option key={motivo} value={motivo}>{motivo}</option>)}
                          </select>
                          {item.motivo === 'Outro' && (
                            <input
                              required
                              value={item.motivoTexto}
                              onChange={(event) => updateItem(item.key, { motivoTexto: event.target.value })}
                              placeholder="Conte o que aconteceu"
                              className="mt-1 w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg placeholder:text-fg-3"
                            />
                          )}
                        </label>
                      )}

                      <div className="grid grid-cols-[1fr_120px] gap-2">
                        <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                          Quantidade (opcional)
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={item.quantidade}
                            onChange={(event) => updateItem(item.key, { quantidade: event.target.value })}
                            placeholder="Ex.: 1"
                            className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg placeholder:text-fg-3"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                          Unidade
                          <select
                            value={item.unidade}
                            onChange={(event) => updateItem(item.key, { unidade: event.target.value })}
                            className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg"
                          >
                            <option value="kg">kg</option>
                            <option value="L">litros</option>
                            <option value="saco">sacos</option>
                            <option value="unidade">unidades</option>
                          </select>
                        </label>
                      </div>
                    </fieldset>
                  )
                })}
              </section>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b8048] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando relato…' : 'Salvar relato'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  )
}
