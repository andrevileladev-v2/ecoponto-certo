export class DenunciasService {
    validateCreate(input) {
        if (!input.tipo)
            return { ok: false, error: 'tipo é obrigatório' };
        const hasTarget = !!input.alvo_usuario_id || !!input.alvo_mensagem_id || input.alvo_ponto_id !== undefined;
        if (!hasTarget) {
            return { ok: false, error: 'Informe ao menos um alvo (usuário, mensagem ou ponto)' };
        }
        return { ok: true };
    }
}
