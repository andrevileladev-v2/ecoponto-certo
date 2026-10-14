export type PontoQueryInput = {
  lat?: string | number
  lng?: string | number
  raio?: string | number
  residuos?: string
  cidade?: string
  status?: string
  q?: string
}

export type PontoDistanceItem = {
  lat: number
  lng: number
  distancia?: number
}

export type PontoFilterWhere = Record<string, unknown>

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
  abertura: string // "HH:mm"
  fechamento: string // "HH:mm"
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>
