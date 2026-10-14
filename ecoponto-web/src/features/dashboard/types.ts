export type ResiduoStat = {
  nome: string
  cor: string
  icone: string
  total_kg: number
}

export type UsuarioTop = {
  inicial: string
  nome: string
  total_kg: number
}

export type StatsData = {
  periodo: 'month' | 'year' | 'all'
  escopo: {
    pais: string | null
    estado: string | null
    cidade: string | null
    pontoId: string | null
  }
  locais: Array<{ id: string; nome: string; cidade: string; estado: string; pais: string }>
  resumo: {
    total_kg: number
    entregas: number
    usuarios_ativos: number
  }
  pontos: {
    total: number
    confiaveis: number
    verificar: number
    inativos: number
  }
  residuos: ResiduoStat[]
  top_usuarios: UsuarioTop[]
}

export type DashboardState = {
  stats: StatsData | null
  loading: boolean
}
