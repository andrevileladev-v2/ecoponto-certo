export const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const
export type DiaSemana = (typeof DIAS_SEMANA)[number]

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
}

export type HorarioDia = {
  ativo: boolean
  abertura: string
  fechamento: string
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>

export type ResiduoPonto = {
  id: string
  residuo_id: string
  status: string
  residuo: {
    id: string
    nome: string
    cor: string
    icone: string
  }
}

export type Ponto = {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  pais?: string
  descricao?: string | null
  telefone?: string | null
  site?: string | null
  horario?: string | null
  horarios?: HorarioSemana | null
  lat: number
  lng: number
  status: string
  confiabilidade?: number
  residuos: ResiduoPonto[]
}

export type PropostaPonto = {
  id: string
  tipo: 'CRIAR' | 'EDITAR'
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA'
  dados: Pick<Ponto, 'nome' | 'endereco' | 'cidade' | 'estado' | 'lat' | 'lng'> & {
    pais?: string
    descricao?: string | null
    telefone?: string | null
    site?: string | null
    horario?: string | null
    horarios?: HorarioSemana | null
  }
  autor_id: string
  ponto_id?: string | null
  confirmacoes: number
  contestacoes: number
  criado_em: string
  ponto?: { id: string; nome: string } | null
}

export type PropostaPontoPendente = Pick<PropostaPonto, 'id' | 'tipo' | 'dados' | 'autor_id' | 'confirmacoes' | 'contestacoes' | 'criado_em'> & {
  autor: { nome: string }
}

export type ResiduoOpt = {
  id: string
  nome: string
  cor: string
}
