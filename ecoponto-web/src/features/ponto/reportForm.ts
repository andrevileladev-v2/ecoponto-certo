import type { ResultadoEntrega } from './types'

export type ResiduoOpcao = { id: string; nome: string; cor: string }

export type ItemRelato = {
  key: string
  residuoId: string
  resultado: ResultadoEntrega
  quantidade: string
  unidade: string
  motivo: string
  motivoTexto: string
  nomeCustom: string
}

export type ItemEntregaPayload = {
  residuo_id?: string
  nome?: string
  resultado: ResultadoEntrega
  quantidade?: number
  unidade?: string
  motivo?: string
}

function createItem(key: string, residuoId: string, resultado: ResultadoEntrega, nomeCustom = ''): ItemRelato {
  return {
    key,
    residuoId,
    resultado,
    quantidade: '',
    unidade: 'kg',
    motivo: '',
    motivoTexto: '',
    nomeCustom,
  }
}

export function toggleReportResiduo(
  items: ItemRelato[],
  residuo: ResiduoOpcao,
  resultadoInicial: ResultadoEntrega,
): ItemRelato[] {
  if (items.some((item) => item.residuoId === residuo.id)) {
    return items.filter((item) => item.residuoId !== residuo.id)
  }

  return [...items, createItem(residuo.id, residuo.id, resultadoInicial)]
}

export function addCustomReportResiduo(
  items: ItemRelato[],
  residuos: ResiduoOpcao[],
  input: string,
  resultadoInicial: ResultadoEntrega,
): { items: ItemRelato[]; error?: string } {
  const nome = input.trim()
  if (!nome) return { items }

  const normalizedName = nome.toLocaleLowerCase('pt-BR')
  if (residuos.some((residuo) => residuo.nome.toLocaleLowerCase('pt-BR') === normalizedName)) {
    return { items, error: 'Esse material já está na lista. Selecione-o acima.' }
  }

  const key = `custom:${normalizedName}`
  if (items.some((item) => item.key === key)) {
    return { items, error: 'Esse material já foi selecionado.' }
  }

  return {
    items: [...items, createItem(key, 'outro', resultadoInicial, nome)],
  }
}

export function validateReportItems(items: ItemRelato[]): string | null {
  if (items.length === 0) return 'Selecione pelo menos um material para continuar.'

  for (const item of items) {
    if (item.residuoId === 'outro' && !item.nomeCustom.trim()) {
      return 'Informe o nome de cada item novo.'
    }
    if (item.quantidade.trim()) {
      const quantidade = Number(item.quantidade)
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        return 'A quantidade deve ser maior que zero.'
      }
    }
    if (item.resultado === 'NAO_CONSEGUIU' && !item.motivo) {
      return 'Escolha o motivo de cada item que não conseguiu descartar.'
    }
    if (item.resultado === 'NAO_CONSEGUIU' && item.motivo === 'Outro' && !item.motivoTexto.trim()) {
      return 'Descreva o motivo selecionado como “Outro”.'
    }
  }

  return null
}

export function buildEntregaItemsPayload(items: ItemRelato[]): ItemEntregaPayload[] {
  return items.map((item) => ({
    ...(item.residuoId === 'outro'
      ? { nome: item.nomeCustom.trim() }
      : { residuo_id: item.residuoId }),
    resultado: item.resultado,
    ...(item.quantidade.trim()
      ? { quantidade: Number(item.quantidade), unidade: item.unidade }
      : {}),
    ...(item.resultado === 'NAO_CONSEGUIU'
      ? { motivo: item.motivo === 'Outro' ? item.motivoTexto.trim() : item.motivo }
      : {}),
  }))
}

export function canSubmitReport(
  hasUser: boolean,
  pontoId: string | undefined,
  isSubmitting: boolean,
  isSaved: boolean,
): boolean {
  return hasUser && Boolean(pontoId) && !isSubmitting && !isSaved
}
