export class ResiduosService {
  buildWhere(status?: string) {
    return { status: status ?? 'APROVADO' }
  }

  validateCreate(input: { nome?: string; cor?: string }) {
    if (!input.nome || !input.cor) {
      return { ok: false as const, error: 'nome e cor são obrigatórios' }
    }
    return { ok: true as const }
  }
}
