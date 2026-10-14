export type AbaPonto = 'info' | 'aceita' | 'entregas' | 'edicoes' | 'chat'

export type ResiduoPonto = {
  nome: string
  cor: string
  tipo?: string
}

export type PontoResiduo = {
  id?: string
  ponto_id?: string
  residuo_id?: string
  residuo?: ResiduoPonto & { id?: string }
  confirmacoes?: number
  contestacoes?: number
  status?: 'CONFIRMADO' | 'CONTESTADO' | 'PENDENTE'
}

export type PontoDetalhe = {
  id?: string
  nome: string
  bairro?: string
  cidade?: string
  confiabilidade: number
  horario?: string
  noturno?: boolean
  disponivel?: boolean
  residuos?: PontoResiduo[]
}

export type RelatoPonto = {
  id: string
  tipo: 'funcionando' | 'fechado' | 'item'
  motivo: string
  texto: string
  votos: number
  confirmacoes: number
  status: 'pendente' | 'aprovada' | 'rejeitada'
  createdAt: string
}

export type ItemAceito = {
  nome: string
  cor: string
  aceita: boolean
  votos: number
  conf: number
}

export type ResultadoEntrega = 'CONSEGUIU' | 'NAO_CONSEGUIU'

export type RegistroEntrega = {
  id: string
  material: string
  resultado: ResultadoEntrega
  quantidade?: number | null
  unidade?: string | null
  motivo?: string
  user: string
  createdAt: string
}

export type PropostaEdicao = {
  id: string
  titulo: string
  descricao: string
  votos: number
  aprovacao: number
  status: 'pendente' | 'aprovada' | 'rejeitada'
}

export type Mensagem = {
  texto: string
  hora: string
  proprio: boolean
}

export type InfoTabProps = {
  ponto: PontoDetalhe | null
  onStartReport: (resultado: ResultadoEntrega) => void
}

export type AceitaTabProps = {
  itens: ItemAceito[]
  votar: (index: number, approved: boolean) => void
}

export type EntregaTabProps = {
  entregas: RegistroEntrega[]
}

export type EdicoesTabProps = {
  propostas: PropostaEdicao[]
  relatos?: RelatoPonto[]
  isLoggedIn?: boolean
  onVotar: (index: number, approved: boolean) => void
  onVotarRelato?: (index: number, approved: boolean) => void
}

export type ChatTabProps = {
  msgs: Mensagem[]
  input: string
  quickChips: string[]
  setInput: (value: string) => void
  enviar: () => void
}
