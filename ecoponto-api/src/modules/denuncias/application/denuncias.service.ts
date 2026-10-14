export class DenunciasService {
  validateCreate(input: { tipo?: string; alvo_usuario_id?: string; alvo_mensagem_id?: string; alvo_ponto_id?: string | number }) {
    if (!input.tipo) return { ok: false as const, error: 'tipo é obrigatório' }
    const hasTarget = !!input.alvo_usuario_id || !!input.alvo_mensagem_id || input.alvo_ponto_id !== undefined
    if (!hasTarget) {
      return { ok: false as const, error: 'Informe ao menos um alvo (usuário, mensagem ou ponto)' }
    }
    return { ok: true as const }
  }
}
