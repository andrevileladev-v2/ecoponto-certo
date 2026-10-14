import type { ItemAceito, Mensagem, PontoDetalhe, PontoResiduo } from './types'

export const PONTO_CONFIG = {
  confiabilidade: {
    alta: 0.8,
    media: 0.65,
  },
  voto: {
    minimo: 5,
    aprovacao: 0.6,
  },
  chat: {
    maxLength: 120,
    placeholder: 'Algo sobre este local...',
    quickChips: ['✓ Funcionando', '🚫 Estava fechado', '♻ Aceitou sem problema', '⚠ Fila grande', '🕐 Horário diferente'],
  },
  entrega: {
    tipos: ['📦 Papelão', '🧴 Plástico', '🥫 Metal', '📱 Eletrônicos', '🍳 Óleo', '🧃 Vidro'],
  },
  status: [
    { id: 'funcionando', label: 'Funcionando' },
    { id: 'fechado', label: 'Local fechado' },
    { id: 'lixeira_cheia', label: 'Lixeira cheia' },
    { id: 'sem_ponto_coleta', label: 'Sem ponto de coleta' },
    { id: 'nao_aceita', label: 'Não aceita o item' },
    { id: 'horario_diferente', label: 'Horário diferente' },
    { id: 'outro', label: 'Outro' },
  ],
} as const

export const RES_COR: Record<string, string> = {
  vidro: '#2563EB',
  papel: '#0891B2',
  plástico: '#DC2626',
  metal: '#D97706',
  eletrônico: '#7C3AED',
  óleo: '#EA580C',
  bateria: '#DB2777',
  tetra: '#059669',
}

export function relCor(s: number) {
  if (s >= PONTO_CONFIG.confiabilidade.alta) return '#0D9858'
  if (s >= PONTO_CONFIG.confiabilidade.media) return '#D97706'
  return '#DC2626'
}

export function mapPontoItens(residuos?: PontoResiduo[]): ItemAceito[] {
  return (
    residuos?.map((item) => {
      const residuoData = item.residuo
      const nome = residuoData?.nome ?? 'Resíduo'
      const tipo = residuoData?.tipo ?? nome.toLowerCase()

      return {
        nome,
        cor: residuoData?.cor ?? RES_COR[tipo] ?? '#0D9858',
        aceita: (item.confirmacoes ?? 0) >= (item.contestacoes ?? 0),
        votos: (item.confirmacoes ?? 0) + (item.contestacoes ?? 0),
        conf: item.confirmacoes ?? 0,
      }
    }) ?? []
  )
}

export function getCorResiduo(residuo?: { nome?: string; cor?: string; tipo?: string }) {
  const nome = residuo?.nome ?? 'Resíduo'
  const tipo = residuo?.tipo ?? nome.toLowerCase()
  return residuo?.cor ?? RES_COR[tipo] ?? '#0D9858'
}

export function getPontoConfiabilidadeLabel(confiabilidade: number) {
  return `${Math.round(confiabilidade * 100)}% confiável`
}

export function getPontoTabs(msgsLength: number, entregasLength = 0, propostasLength = 0) {
  return [
    { id: 'info', label: 'Informações' },
    { id: 'aceita', label: 'Aceita' },
    { id: 'entregas', label: 'Entregas', count: entregasLength },
    { id: 'edicoes', label: 'Edições', count: propostasLength },
    { id: 'chat', label: 'Chat', count: msgsLength },
  ] as const
}

export function getPontoStatusOptions() {
  return [...PONTO_CONFIG.status]
}

export function getStatusBadges() {
  return [...PONTO_CONFIG.chat.quickChips]
}

export function getMensagemPadrao() {
  return PONTO_CONFIG.chat.placeholder
}

export function getPontoHeaderText(ponto?: PontoDetalhe | null) {
  return `${ponto?.bairro ?? ''} · ${ponto?.cidade ?? ''}`.replace(/ · $/, '')
}

export function getItemAvaliacaoStatus(item: ItemAceito) {
  const pct = item.votos > 0 ? Math.round((item.conf / item.votos) * 100) : 0
  const cor = item.votos === 0 || pct === 50 ? '#64748B' : pct > 50 ? '#0D9858' : '#DC2626'
  const label = item.votos === 0 ? 'Sem relatos' : `${pct}% de relatos positivos`

  return { pct, cor, label }
}

export function voteItem(items: ItemAceito[], index: number, approved: boolean) {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item

    const votos = item.votos + 1
    const conf = approved ? item.conf + 1 : item.conf
    const aceita = votos >= PONTO_CONFIG.voto.minimo ? conf / votos >= PONTO_CONFIG.voto.aprovacao : item.aceita

    return { ...item, votos, conf, aceita }
  })
}

export function voteEdicao<T extends { votos: number; aprovacao: number; status: string }>(
  propostas: T[],
  index: number,
  approved: boolean,
): T[] {
  return propostas.map((proposta, itemIndex) => {
    if (itemIndex !== index) return proposta

    const votos = proposta.votos + 1
    const aprovacao = proposta.aprovacao + (approved ? 1 : 0)

    return {
      ...proposta,
      votos,
      aprovacao,
      status: votos >= 3 ? (aprovacao / votos >= 0.6 ? 'aprovada' : 'rejeitada') : 'pendente',
    } as T
  })
}

export function sendMessage(messages: Mensagem[], text: string): Mensagem[] {
  const trimmed = text.trim()
  if (!trimmed) return messages

  return [...messages, { texto: trimmed, hora: 'agora', proprio: true }]
}
