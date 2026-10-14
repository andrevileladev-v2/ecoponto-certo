'use client'

import { Check, Lightbulb, Plus, ThumbsUp } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

type StatusMelhoria =
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'PRIORIZADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'NAO_PLANEJADO'
  | 'ARQUIVADO'

type Viabilidade = 'NAO_AVALIADA' | 'VIAVEL' | 'NAO_VIAVEL'

type Sugestao = {
  id: string
  titulo: string
  descricao: string | null
  status: StatusMelhoria
  viabilidade: Viabilidade
  previsao: string | null
  resposta: string | null
  criado_em: string
  autor: { id: string; nome: string; avatar_url: string | null }
  _count: { votos: number }
}


export default function SugestoesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [meusVotos, setMeusVotos] = useState<Set<string>>(new Set())
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [formMessage, setFormMessage] = useState('')

  useEffect(() => {
    if (authLoading) return
    let active = true
    Promise.all([
      api.get<Sugestao[]>('/melhorias'),
      user ? api.get<string[]>('/melhorias/me/votos') : Promise.resolve([]),
    ])
      .then(([list, votes]) => {
        if (!active) return
        setSugestoes(list)
        setMeusVotos(new Set(votes))
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as sugestões.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [authLoading, user])

  const sortedSuggestions = useMemo(
    () => [...sugestoes].sort((a, b) => b._count.votos - a._count.votos || b.criado_em.localeCompare(a.criado_em)),
    [sugestoes],
  )

  async function handleVote(id: string) {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent('/sugestoes')}`)
      return
    }
    setVotingId(id)
    setError('')
    try {
      const result = await api.post<{ votado_por_mim: boolean; votos: number }>(`/melhorias/${id}/votar`, {})
      setMeusVotos((current) => {
        const next = new Set(current)
        if (result.votado_por_mim) next.add(id)
        else next.delete(id)
        return next
      })
      setSugestoes((current) => current.map((suggestion) =>
        suggestion.id === id
          ? { ...suggestion, _count: { votos: result.votos } }
          : suggestion,
      ))
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Não foi possível registrar seu voto.')
    } finally {
      setVotingId(null)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')
    setError('')
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent('/sugestoes')}`)
      return
    }
    setSending(true)
    try {
      const suggestion = await api.post<Sugestao>('/melhorias', { titulo, descricao })
      setSugestoes((current) => [suggestion, ...current])
      setTitulo('')
      setDescricao('')
      setFormMessage('Sua sugestão foi publicada. Obrigado por contribuir!')
    } catch (submitError) {
      setFormMessage(submitError instanceof Error ? submitError.message : 'Não foi possível enviar a sugestão.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 py-2 sm:gap-8 sm:py-4">
        <header className="rounded-2xl bg-acc-bg px-5 py-7 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-accent">
            <Lightbulb size={25} />
          </div>
          <h1 className="text-2xl font-bold text-fg">Ideias e sugestões</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-fg-2">
            Ajude a construir o Ecoponto Certo. Vote nas ideias da comunidade
            ou compartilhe uma sugestão nova.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-accent">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Compartilhe sua ideia</h2>
              <p className="text-xs text-fg-3">Descreva uma melhoria que gostaria de ver.</p>
            </div>
          </div>
          {user ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
                Título
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Ex.: Filtro por distância no mapa"
                  className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
                Descrição
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={4}
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Conte como essa ideia ajudaria a comunidade."
                  className="resize-y rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} /> {sending ? 'Enviando...' : 'Publicar sugestão'}
              </button>
              {formMessage && <p role="status" className="text-sm text-accent">{formMessage}</p>}
            </form>
          ) : (
            <div className="rounded-xl bg-raised p-4">
              <p className="text-sm text-fg-2">Entre na sua conta para publicar uma sugestão.</p>
              <button
                type="button"
                onClick={() => router.push(`/login?returnTo=${encodeURIComponent('/sugestoes')}`)}
                className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Entrar ou criar conta
              </button>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-fg">Sugestões da comunidade</h2>
              <p className="mt-1 text-sm text-fg-3">As mais votadas aparecem primeiro.</p>
            </div>
            <span className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-fg-2">
              {sugestoes.length} ideias
            </span>
          </div>

          {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {loading ? (
            <div className="flex justify-center rounded-2xl border border-border bg-white py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : sortedSuggestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center">
              <p className="text-sm font-semibold text-fg">Ainda não há sugestões.</p>
              <p className="mt-1 text-sm text-fg-3">Seja a primeira pessoa a compartilhar uma ideia.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedSuggestions.map((suggestion) => {
                const status = statusInfo[suggestion.status]
                const voted = meusVotos.has(suggestion.id)
                return (
                  <article key={suggestion.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        aria-pressed={voted}
                        aria-label={`${voted ? 'Remover voto' : 'Votar'} em ${suggestion.titulo}`}
                        disabled={votingId === suggestion.id}
                        onClick={() => void handleVote(suggestion.id)}
                        className={`flex min-w-14 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          voted
                            ? 'border-accent bg-acc-bg text-accent'
                            : 'border-border text-fg-3 hover:bg-raised hover:text-accent'
                        }`}
                      >
                        {voted ? <Check size={17} /> : <ThumbsUp size={17} />}
                        {suggestion._count.votos}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-fg">{suggestion.titulo}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>
                        {suggestion.descricao && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fg-2">{suggestion.descricao}</p>
                        )}
                        <p className="mt-3 text-xs text-fg-3">
                          Por {suggestion.autor.nome} · {new Date(suggestion.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                        {(suggestion.viabilidade !== 'NAO_AVALIADA' || suggestion.previsao || suggestion.resposta) && (
                          <div className="mt-3 rounded-xl bg-raised p-3">
                            <p className="text-xs font-semibold text-fg">{viabilityLabel[suggestion.viabilidade]}</p>
                            {suggestion.previsao && (
                              <p className="mt-1 text-xs text-fg-2">Previsão: {suggestion.previsao}</p>
                            )}
                            {suggestion.resposta && (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-fg-2">{suggestion.resposta}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

const statusInfo: Record<StatusMelhoria, { label: string; classes: string }> = {
  PENDENTE: { label: 'Recebida', classes: 'bg-raised text-fg-3' },
  EM_ANALISE: { label: 'Em análise', classes: 'bg-blue-50 text-blue-700' },
  PRIORIZADO: { label: 'Planejada', classes: 'bg-acc-bg text-accent' },
  EM_ANDAMENTO: { label: 'Em andamento', classes: 'bg-amber-50 text-amber-800' },
  CONCLUIDO: { label: 'Concluída', classes: 'bg-acc-bg text-accent' },
  NAO_PLANEJADO: { label: 'Não planejada agora', classes: 'bg-raised text-fg-3' },
  ARQUIVADO: { label: 'Arquivada', classes: 'bg-raised text-fg-3' },
}

const viabilityLabel: Record<Viabilidade, string> = {
  NAO_AVALIADA: 'Viabilidade ainda não avaliada',
  VIAVEL: 'Considerada viável',
  NAO_VIAVEL: 'Considerada inviável no momento',
}
