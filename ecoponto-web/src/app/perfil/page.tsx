'use client'
import AppShell from "@/components/layout/AppShell"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, Trash2, Newspaper, Package, Wine, Cpu, Battery, Shirt, Recycle, Leaf, Zap, Droplet, AlertTriangle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"

const RESIDUO_ICONS: Record<string, LucideIcon> = {
  Newspaper, Package, Wine, Cpu, Battery, Shirt,
  Recycle, Leaf, Zap, Droplet, AlertTriangle,
}

interface Entrega {
  id: string
  criado_em: string
  quantidade?: number
  unidade?: string
  ponto: { id: string; nome: string; cidade: string }
  residuo: { id: string; nome: string; cor: string; icone?: string }
}

interface PontoSalvo {
  id: string
  nome: string
  cidade: string
  confiabilidade: number
}

type Aba = 'entregas' | 'salvos' | 'config'

export default function PerfilPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('entregas')
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [salvos, setSalvos] = useState<PontoSalvo[]>([])
  const [stats, setStats] = useState({ entregas: 0, confirmacoes: 0, salvos: 0 })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.get<{ total: number; data: Entrega[] }>('/entregas?limit=10')
      .then(r => { setEntregas(r.data); setStats(s => ({ ...s, entregas: r.total })) })
      .catch(() => {})
    api.get<PontoSalvo[]>('/usuarios/me/salvos')
      .then(d => { setSalvos(d); setStats(s => ({ ...s, salvos: d.length })) })
      .catch(() => {})
  }, [user])

  function handleLogout() {
    logout()
    router.push('/')
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#EFF2EF] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#0D9858] border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const inicial = user.nome.charAt(0).toUpperCase()
  const membroDesde = new Date(user.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <AppShell>
      <div className="max-w-lg mx-auto flex flex-col gap-0">

        {/* Header */}
        <div className="bg-gradient-to-b from-[#E8F5ED] to-transparent rounded-t-2xl px-5 pt-7 pb-5 text-center border border-[#D4DAD4]">
          <div className="w-16 h-16 rounded-full bg-[#0D9858] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.nome} className="w-full h-full rounded-full object-cover" />
              : inicial}
          </div>
          <p className="text-lg font-bold text-[#0F1C12]">{user.nome}</p>
          <p className="text-xs text-[#7A9480] mt-0.5">
            Membro desde {membroDesde}{user.cidade ? ` · ${user.cidade}` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-x border-b border-[#D4DAD4] bg-white divide-x divide-[#D4DAD4]">
          {[
            { n: stats.entregas, l: 'Entregas' },
            { n: stats.confirmacoes, l: 'Confirmações' },
            { n: stats.salvos, l: 'Salvos' },
          ].map(({ n, l }) => (
            <div key={l} className="py-3 text-center">
              <div className="text-lg font-bold text-[#0D9858]">{n}</div>
              <div className="text-xs text-[#7A9480] mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-x border-b border-[#D4DAD4] bg-white">
          {(['entregas', 'salvos', 'config'] as Aba[]).map(id => (
            <button key={id} onClick={() => setAba(id)}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors capitalize ${
                aba === id ? 'border-[#0D9858] text-[#0D9858]' : 'border-transparent text-[#7A9480] hover:text-[#3D5444]'
              }`}>
              {id === 'config' ? 'Config.' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>

        {/* Entregas */}
        {aba === 'entregas' && (
          <div className="bg-white border-x border-b border-[#D4DAD4] rounded-b-2xl divide-y divide-[#D4DAD4]">
            {entregas.length === 0
              ? <p className="text-center text-sm text-[#7A9480] py-8">Nenhuma entrega registrada ainda.</p>
              : entregas.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: e.residuo.cor + '22' }}>
                    {(() => { const Icon = RESIDUO_ICONS[e.residuo.icone ?? ''] ?? Recycle; return <Icon size={16} /> })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1C12]">{e.residuo.nome}</p>
                    <p className="text-xs text-[#7A9480]">{e.ponto.nome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {e.quantidade && (
                      <p className="text-sm font-bold text-[#0D9858]">{e.quantidade} {e.unidade ?? 'kg'}</p>
                    )}
                    <p className="text-xs text-[#7A9480]">
                      {new Date(e.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Salvos */}
        {aba === 'salvos' && (
          <div className="bg-white border-x border-b border-[#D4DAD4] rounded-b-2xl divide-y divide-[#D4DAD4]">
            {salvos.length === 0
              ? <p className="text-center text-sm text-[#7A9480] py-8">Nenhum ponto salvo ainda.</p>
              : salvos.map(p => {
                const conf = p.confiabilidade ?? 0
                const cor = conf >= 0.7 ? '#0D9858' : conf >= 0.4 ? '#D97706' : '#DC2626'
                const label = conf >= 0.7 ? 'Confiável' : conf >= 0.4 ? '⚠ Verificar' : '✗ Inativo'
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F5ED] flex items-center justify-center text-lg shrink-0">♻</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1C12]">{p.nome}</p>
                      <p className="text-xs text-[#7A9480]">{p.cidade} · <span style={{ color: cor }}>{label}</span></p>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Config */}
        {aba === 'config' && (
          <div className="bg-white border-x border-b border-[#D4DAD4] rounded-b-2xl px-4 py-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FEE2E2] text-[#DC2626] text-sm font-semibold rounded-lg hover:bg-[#DC2626] hover:text-white transition-colors">
                <LogOut size={15} /> Sair da conta
              </button>
              <button
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#D4DAD4] text-[#7A9480] text-sm font-semibold rounded-lg hover:bg-[#F7F8F7] transition-colors">
                <Trash2 size={15} /> Excluir conta
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
