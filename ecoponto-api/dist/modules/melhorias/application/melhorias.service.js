export class MelhoriasService {
    validateCreate(input) {
        if (!input.titulo?.trim() || !input.descricao?.trim()) {
            return { ok: false, error: 'titulo e descricao são obrigatórios' };
        }
        if (input.titulo.trim().length > 120 || input.descricao.trim().length > 2000) {
            return { ok: false, error: 'titulo deve ter até 120 caracteres e descricao até 2000 caracteres' };
        }
        return { ok: true };
    }
    validateUpdate(input) {
        const validStatuses = ['PENDENTE', 'EM_ANALISE', 'PRIORIZADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'NAO_PLANEJADO', 'ARQUIVADO'];
        const validViabilities = ['NAO_AVALIADA', 'VIAVEL', 'NAO_VIAVEL'];
        if (input.status !== undefined && !validStatuses.includes(input.status)) {
            return { ok: false, error: 'status inválido' };
        }
        if (input.viabilidade !== undefined && !validViabilities.includes(input.viabilidade)) {
            return { ok: false, error: 'viabilidade inválida' };
        }
        if (input.previsao !== undefined && input.previsao !== null && input.previsao.trim().length > 80) {
            return { ok: false, error: 'previsão deve ter no máximo 80 caracteres' };
        }
        if (input.resposta !== undefined && input.resposta !== null && input.resposta.trim().length > 1000) {
            return { ok: false, error: 'resposta deve ter no máximo 1000 caracteres' };
        }
        if (input.status === undefined && input.viabilidade === undefined
            && input.previsao === undefined && input.resposta === undefined) {
            return { ok: false, error: 'informe pelo menos um campo para atualizar' };
        }
        return { ok: true };
    }
}
