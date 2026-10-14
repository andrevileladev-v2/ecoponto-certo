'use client'

import { useMemo, useState } from 'react'
import { BarChart3, CalendarDays, MapPin, Recycle, Users } from 'lucide-react'

import AppShell from '@/components/layout/AppShell'
import { useDashboardStats } from '@/features/dashboard/useDashboardStats'

type Nivel = 'pais' | 'estado' | 'cidade' | 'ponto'
type Periodo = 'month' | 'year' | 'all'

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value)

const periodNames: Record<Periodo, string> = {
  month: 'este mês',
  year: 'este ano',
  all: 'desde o início',
}

export default function DashboardPage() {
  const [nivel, setNivel] = useState<Nivel>('pais')
  const [pais, setPais] = useState('')
  const [estado, setEstado] = useState('')
  const [cidade, setCidade] = useState('')
  const [pontoId, setPontoId] = useState('')
  const [period, setPeriod] = useState<Periodo>('month')
  const filters = {
    period,
    ...(pais ? { pais } : {}),
    ...(nivel !== 'pais' && estado ? { estado } : {}),
    ...((nivel === 'cidade' || nivel === 'ponto') && cidade ? { cidade } : {}),
    ...(nivel === 'ponto' && pontoId ? { pontoId } : {}),
  }
  const { stats, loading } = useDashboardStats(filters)

  const paises = useMemo(
    () => [...new Set((stats?.locais ?? []).map((local) => local.pais))].sort(),
    [stats?.locais],
  )
  const estados = useMemo(
    () => [...new Set((stats?.locais ?? [])
      .filter((local) => !pais || local.pais === pais)
      .map((local) => local.estado))].sort(),
    [stats?.locais, pais],
  )
  const cidades = useMemo(
    () => [...new Set((stats?.locais ?? [])
      .filter((local) => !pais || local.pais === pais)
      .filter((local) => !estado || local.estado === estado)
      .map((local) => local.cidade))].sort(),
    [stats?.locais, pais, estado],
  )
  const pontos = useMemo(
    () => (stats?.locais ?? []).filter((local) =>
      (!pais || local.pais === pais)
      &&
      (!estado || local.estado === estado)
      && (!cidade || local.cidade === cidade)),
    [stats?.locais, pais, estado, cidade],
  )
  const maxKg = Math.max(1, ...(stats?.residuos ?? []).map((item) => item.total_kg))
  const selectedPoint = stats?.locais.find((local) => local.id === pontoId)
  const scopeLabel = nivel === 'pais'
    ? pais || 'Todos os países'
    : nivel === 'estado'
      ? estado ? `${estado}${pais ? `, ${pais}` : ''}` : 'Selecione um estado'
      : nivel === 'cidade'
        ? cidade ? [cidade, estado, pais].filter(Boolean).join(', ') : 'Selecione uma cidade'
        : selectedPoint?.nome ?? (cidade ? `Todos os pontos · ${cidade}` : estado ? `Todos os pontos · ${estado}` : pais ? `Todos os pontos · ${pais}` : 'Todos os pontos')
  const periodLabel = period === 'month' ? 'mês atual' : period === 'year' ? 'ano atual' : 'todo o período'

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2 sm:gap-7 sm:py-4">
        <section className="overflow-hidden rounded-2xl bg-[#10251A] p-5 text-white shadow-sm sm:p-7">
          <p className="text-[10px] font-bold tracking-[0.12em] text-white/65">IMPACTO DA COMUNIDADE</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Ecoponto Certo</h1>
              <p className="mt-1 text-sm text-white/70">{scopeLabel} · {periodLabel}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
              <MapPin size={14} />
              Dados registrados pela comunidade
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <MetricTile
              label={`peso registrado ${periodNames[period]}`}
              value={`${formatNumber(stats?.resumo.total_kg ?? 0)} kg`}
              icon={<Recycle size={16} />}
              loading={loading}
            />
            <MetricTile
              label={`itens descartados ${periodNames[period]}`}
              value={formatNumber(stats?.resumo.entregas ?? 0, 0)}
              icon={<BarChart3 size={16} />}
              loading={loading}
            />
            <MetricTile
              label={`participantes ativos ${periodNames[period]}`}
              value={formatNumber(stats?.resumo.usuarios_ativos ?? 0, 0)}
              icon={<Users size={16} />}
              loading={loading}
            />
          </div>
          <p className="mt-3 text-[11px] leading-5 text-white/55">
            Peso calculado somente com quantidades em kg informadas em descartes bem-sucedidos.
          </p>
        </section>

        <section aria-label="Filtros do dashboard" className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
            <MapPin size={16} className="text-accent" /> Explorar por local
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              País
              <select
                value={pais}
                onChange={(event) => {
                  setPais(event.target.value)
                  setEstado('')
                  setCidade('')
                  setPontoId('')
                }}
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
              >
                <option value="">Todos os países</option>
                {paises.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              Escopo
              <select
                value={nivel}
                onChange={(event) => {
                  setNivel(event.target.value as Nivel)
                  setPontoId('')
                }}
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
              >
                <option value="pais">País</option>
                <option value="estado">Estado</option>
                <option value="cidade">Cidade</option>
                <option value="ponto">Ponto de coleta</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              Período
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as Periodo)}
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
              >
                <option value="month">Este mês</option>
                <option value="year">Este ano</option>
                <option value="all">Todo o período</option>
              </select>
            </label>
            {nivel !== 'pais' && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                Estado
                <select
                  value={estado}
                  onChange={(event) => {
                    setEstado(event.target.value)
                    setCidade('')
                    setPontoId('')
                  }}
                  className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
                >
                  <option value="">Todos os estados</option>
                  {estados.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
            {(nivel === 'cidade' || nivel === 'ponto') && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
                Cidade
                <select
                  value={cidade}
                  onChange={(event) => {
                    setCidade(event.target.value)
                    setPontoId('')
                  }}
                  className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
                >
                  <option value="">Todas as cidades</option>
                  {cidades.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
            {nivel === 'ponto' && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2 sm:col-span-2 lg:col-span-1">
                Ponto
                <select
                  value={pontoId}
                  onChange={(event) => setPontoId(event.target.value)}
                  className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-normal text-fg"
                >
                  <option value="">Todos os pontos da região</option>
                  {pontos.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome} · {item.cidade}, {item.pais}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-fg">Resíduos por tipo</h2>
              <p className="mt-1 text-xs text-fg-3">Quilos registrados · {periodLabel}</p>
            </div>
            {loading ? <LoadingRows /> : (stats?.residuos.length ?? 0) === 0 ? (
              <EmptyState>Não há pesos em kg registrados para este escopo e período.</EmptyState>
            ) : (
              <div className="flex flex-col gap-4">
                {stats?.residuos.map((item) => (
                  <div key={item.nome} className="grid grid-cols-[minmax(84px,110px)_minmax(0,1fr)_70px] items-center gap-2">
                    <span className="truncate text-xs font-medium text-fg-2">{item.nome}</span>
                    <div className="h-6 overflow-hidden rounded-md bg-raised">
                      <div
                        className="flex h-full min-w-1 items-center rounded-md px-2 text-[10px] font-bold text-white"
                        style={{ width: `${Math.max(4, (item.total_kg / maxKg) * 100)}%`, backgroundColor: item.cor }}
                      >
                        {item.total_kg / maxKg >= 0.13 ? formatNumber(item.total_kg, 0) : ''}
                      </div>
                    </div>
                    <span className="text-right text-xs font-semibold text-fg-2">{formatNumber(item.total_kg)} kg</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-fg">Status dos pontos</h2>
              <p className="mt-1 text-xs text-fg-3">{stats?.pontos.total ?? 0} pontos no escopo selecionado</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <PointTile value={stats?.pontos.confiaveis ?? 0} label="Confiáveis" className="bg-acc-bg text-accent" />
              <PointTile value={stats?.pontos.verificar ?? 0} label="A verificar" className="bg-amber-50 text-amber-700" />
              <PointTile value={stats?.pontos.inativos ?? 0} label="Inativos ou baixa confiança" className="bg-red-50 text-red-700" />
              <PointTile value={stats?.pontos.total ?? 0} label="Total" className="bg-raised text-fg" />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-fg-3">
              Classificação baseada no status e na confiabilidade atual cadastrados para cada ponto.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-fg">Top participantes</h2>
              <p className="mt-1 text-xs text-fg-3">Por kg informado · {periodLabel}</p>
            </div>
            {loading ? <LoadingRows /> : (stats?.top_usuarios.length ?? 0) === 0 ? (
              <EmptyState>Ainda não há descartes em kg neste escopo e período.</EmptyState>
            ) : (
              <div className="divide-y divide-border">
                {stats?.top_usuarios.map((person, index) => (
                  <div key={`${person.nome}-${index}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 text-xs font-bold text-fg-3">{index + 1}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-acc-bg text-sm font-bold text-accent">
                      {person.inicial}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-fg">{person.nome}</span>
                    <span className="text-sm font-bold text-accent">{formatNumber(person.total_kg)} kg</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-fg">Sobre os números</h2>
              <p className="mt-1 text-xs text-fg-3">Transparência dos dados exibidos</p>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-6 text-fg-2">
              <li>• Os dados são relatos enviados pela comunidade, não pesagens auditadas.</li>
              <li>• O peso considera apenas descartes bem-sucedidos com unidade informada em kg.</li>
              <li>• Litros e unidades não são convertidos para kg.</li>
              <li>• O painel não estima CO₂, água ou árvores sem fatores verificáveis para cada material.</li>
            </ul>
          </section>
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-fg-3">
          <CalendarDays size={14} /> Os totais são recalculados conforme o escopo e período selecionados.
        </p>
      </div>
    </AppShell>
  )
}

function MetricTile({
  label,
  value,
  icon,
  loading,
}: {
  label: string
  value: string
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <div className="flex items-center gap-2 text-white/65">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 text-2xl font-bold">{loading ? '—' : value}</p>
    </div>
  )
}

function PointTile({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={`rounded-xl p-4 text-center ${className}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-fg-3">{label}</p>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-raised px-4 py-6 text-center text-sm text-fg-3">{children}</p>
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3" aria-label="Carregando dados">
      <div className="h-8 animate-pulse rounded-lg bg-raised" />
      <div className="h-8 animate-pulse rounded-lg bg-raised" />
      <div className="h-8 animate-pulse rounded-lg bg-raised" />
    </div>
  )
}
