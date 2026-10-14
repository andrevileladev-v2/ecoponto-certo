export class EntregasService {
  buildWhere(_status?: string) {
    return {}
  }

  validateCreate(input: {
    ponto_id?: string
    items?: Array<{
      residuo_id?: string
      nome?: string
      resultado?: string
      quantidade?: number
      motivo?: string
    }>
  }) {
    if (!input.ponto_id || !Array.isArray(input.items) || input.items.length === 0) {
      return { ok: false as const, error: 'ponto_id e ao menos um item são obrigatórios' }
    }

    for (const item of input.items) {
      if ((!item.residuo_id && !item.nome?.trim()) || (item.residuo_id && item.nome?.trim())) {
        return { ok: false as const, error: 'Cada item deve informar residuo_id ou nome' }
      }
      if (item.resultado !== 'CONSEGUIU' && item.resultado !== 'NAO_CONSEGUIU') {
        return { ok: false as const, error: 'Resultado de descarte inválido' }
      }
      if (item.quantidade !== undefined && (!Number.isFinite(item.quantidade) || item.quantidade <= 0)) {
        return { ok: false as const, error: 'A quantidade deve ser maior que zero' }
      }
      if (item.resultado === 'NAO_CONSEGUIU' && !item.motivo?.trim()) {
        return { ok: false as const, error: 'Informe o motivo do item não descartado' }
      }
    }

    return { ok: true as const }
  }
}
