import type { Usuario } from '@/lib/auth'

export type AbaPerfil = 'entregas' | 'salvos' | 'config'

export type EntregaPerfil = {
  id: string
  criado_em: string
  quantidade?: number | null
  unidade?: string | null
  resultado: 'CONSEGUIU' | 'NAO_CONSEGUIU'
  motivo?: string | null
  ponto: { id: string; nome: string; cidade: string }
  residuo: { id: string; nome: string; cor: string; icone?: string }
}

export type PontoSalvoPerfil = {
  id: string
  nome: string
  cidade: string
  confiabilidade: number
}

export type PerfilStats = {
  entregas: number
  confirmacoes: number
  salvos: number
}

export type PerfilHeaderProps = {
  nome: string
  avatarUrl?: string
  cidade?: string
  criadoEm: string
}

export type PerfilStatsProps = {
  stats: PerfilStats
}

export type PerfilTabsProps = {
  aba: AbaPerfil
  onChange: (next: AbaPerfil) => void
}

export type PerfilEntregasProps = {
  entregas: EntregaPerfil[]
}

export type PerfilSalvosProps = {
  salvos: PontoSalvoPerfil[]
}

export type PerfilConfigProps = {
  user: Usuario
  onUpdated: (user: Usuario) => void
  onLogout: () => void
}
