import { DIA_SEMANA_LABEL, DIAS_SEMANA, type DiaSemana, type HorarioDia, type HorarioSemana } from './types'

export function criarHorarioSemanaVazio(): HorarioSemana {
  return DIAS_SEMANA.reduce((acc, dia) => {
    acc[dia] = { ativo: false, abertura: '08:00', fechamento: '18:00' }
    return acc
  }, {} as HorarioSemana)
}

export function validarHorarios(horarios: HorarioSemana): string | null {
  for (const dia of DIAS_SEMANA) {
    const horarioDia = horarios[dia]
    if (!horarioDia?.ativo) continue
    if (!horarioDia.abertura || !horarioDia.fechamento) {
      return `Informe abertura e fechamento para ${DIA_SEMANA_LABEL[dia]}.`
    }
    if (horarioDia.abertura >= horarioDia.fechamento) {
      return `O horário de abertura deve ser antes do fechamento (${DIA_SEMANA_LABEL[dia]}).`
    }
  }
  return null
}

export function formatHorarioResumo(horarios?: HorarioSemana | null): string {
  if (!horarios) return ''

  const grupos: Array<{ dias: DiaSemana[]; texto: string }> = []

  for (const dia of DIAS_SEMANA) {
    const horarioDia: HorarioDia | undefined = horarios[dia]
    const texto = horarioDia?.ativo ? `${horarioDia.abertura}–${horarioDia.fechamento}` : 'Fechado'
    const ultimo = grupos[grupos.length - 1]

    if (ultimo && ultimo.texto === texto) {
      ultimo.dias.push(dia)
    } else {
      grupos.push({ dias: [dia], texto })
    }
  }

  const resumo = grupos
    .filter((grupo) => grupo.texto !== 'Fechado')
    .map((grupo) => {
      const label = grupo.dias.length > 1
        ? `${DIA_SEMANA_LABEL[grupo.dias[0]]}–${DIA_SEMANA_LABEL[grupo.dias[grupo.dias.length - 1]]}`
        : DIA_SEMANA_LABEL[grupo.dias[0]]
      return `${label} ${grupo.texto}`
    })
    .join(', ')

  return resumo || 'Fechado todos os dias'
}
