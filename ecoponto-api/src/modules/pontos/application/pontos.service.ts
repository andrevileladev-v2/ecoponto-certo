import { DIAS_SEMANA, DIA_SEMANA_LABEL, type DiaSemana, type HorarioSemana, type PontoDistanceItem, type PontoFilterWhere, type PontoQueryInput } from '../domain/ponto.types.js'

export type ProposedPointData = {
  nome: string
  descricao?: string | null
  endereco: string
  cidade: string
  estado: string
  pais: string
  lat: number
  lng: number
  telefone?: string | null
  site?: string | null
  horario?: string | null
  horarios?: HorarioSemana
}

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export class PontosService {
  buildWhereClause(input: PontoQueryInput): PontoFilterWhere {
    const { lat, lng, raio, residuos, cidade, status, q } = input
    const where: PontoFilterWhere = {}

    if (cidade) {
      where.cidade = { contains: cidade, mode: 'insensitive' }
    }

    if (status) {
      where.status = status
    } else {
      where.status = { in: ['ATIVO', 'PENDENTE_VERIFICACAO'] }
    }

    if (q) {
      where.nome = { contains: q, mode: 'insensitive' }
    }

    if (residuos) {
      const ids = String(residuos).split(',').map((id) => id.trim()).filter(Boolean)
      if (ids.length) {
        where.residuos = {
          some: {
            residuo_id: { in: ids },
            status: 'CONFIRMADO',
          },
        }
      }
    }

    if (lat && lng && raio) {
      const latitude = Number(lat)
      const longitude = Number(lng)
      const radiusInDegrees = Number(raio) / 111

      where.lat = { gte: latitude - radiusInDegrees, lte: latitude + radiusInDegrees }
      where.lng = { gte: longitude - radiusInDegrees, lte: longitude + radiusInDegrees }
    }

    return where
  }

  validateCreate(input: {
    nome?: string
    endereco?: string
    cidade?: string
    lat?: number | string | null
    lng?: number | string | null
  }) {
    if (!input.nome || !input.endereco || !input.cidade || input.lat == null || input.lng == null) {
      return { ok: false as const, error: 'nome, endereco, cidade, lat e lng são obrigatórios' }
    }
    return { ok: true as const }
  }

  validateProposal(input: Partial<ProposedPointData>) {
    if (!input.nome?.trim() || !input.endereco?.trim() || !input.cidade?.trim() || !input.estado?.trim() || !input.pais?.trim()) {
      return { ok: false as const, error: 'nome, endereço, cidade, estado e país são obrigatórios' }
    }
    if (
      typeof input.lat !== 'number'
      || typeof input.lng !== 'number'
      || !Number.isFinite(input.lat)
      || !Number.isFinite(input.lng)
      || input.lat < -90 || input.lat > 90
      || input.lng < -180 || input.lng > 180
    ) {
      return { ok: false as const, error: 'Latitude ou longitude inválida' }
    }
    if (input.horarios && !this.validateHorarios(input.horarios).ok) {
      return this.validateHorarios(input.horarios)
    }
    return { ok: true as const }
  }

  validateHorarios(horarios: HorarioSemana): { ok: true } | { ok: false; error: string } {
    for (const dia of DIAS_SEMANA) {
      const horarioDia = horarios[dia]
      if (!horarioDia || typeof horarioDia.ativo !== 'boolean') {
        return { ok: false, error: `Horário inválido para o dia "${dia}"` }
      }
      if (!horarioDia.ativo) continue
      if (!HORA_REGEX.test(horarioDia.abertura) || !HORA_REGEX.test(horarioDia.fechamento)) {
        return { ok: false, error: `Horário inválido para o dia "${dia}"` }
      }
      if (horarioDia.abertura >= horarioDia.fechamento) {
        return { ok: false, error: `O horário de abertura deve ser antes do fechamento (${DIA_SEMANA_LABEL[dia]})` }
      }
    }
    return { ok: true }
  }

  formatHorarioResumo(horarios?: HorarioSemana | null): string | null {
    if (!horarios) return null

    const grupos: Array<{ dias: DiaSemana[]; texto: string }> = []

    for (const dia of DIAS_SEMANA) {
      const horarioDia = horarios[dia]
      const texto = horarioDia?.ativo ? `${horarioDia.abertura}–${horarioDia.fechamento}` : 'Fechado'
      const ultimo = grupos[grupos.length - 1]

      if (ultimo && ultimo.texto === texto) {
        ultimo.dias.push(dia)
      } else {
        grupos.push({ dias: [dia], texto })
      }
    }

    return grupos
      .filter((grupo) => grupo.texto !== 'Fechado')
      .map((grupo) => {
        const label = grupo.dias.length > 1
          ? `${DIA_SEMANA_LABEL[grupo.dias[0]]}–${DIA_SEMANA_LABEL[grupo.dias[grupo.dias.length - 1]]}`
          : DIA_SEMANA_LABEL[grupo.dias[0]]
        return `${label} ${grupo.texto}`
      })
      .join(', ') || 'Fechado todos os dias'
  }

  resolveProposalVote(confirmacoes: number, contestacoes: number) {
    const total = confirmacoes + contestacoes
    if (total < 3) return 'PENDENTE' as const
    return confirmacoes / total >= 0.7 ? 'APROVADA' as const : 'REJEITADA' as const
  }

  haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  applyDistanceFilter<T extends PontoDistanceItem>(
    pontos: T[],
    lat?: number | string,
    lng?: number | string,
    raio?: number | string,
  ): T[] {
    if (lat == null || lng == null || raio == null) return pontos

    const latitude = Number(lat)
    const longitude = Number(lng)
    const radiusKm = Number(raio)

    return pontos
      .map((ponto) => ({
        ...ponto,
        distancia: this.haversine(latitude, longitude, ponto.lat, ponto.lng),
      }))
      .filter((ponto) => ponto.distancia <= radiusKm)
      .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0)) as T[]
  }
}
