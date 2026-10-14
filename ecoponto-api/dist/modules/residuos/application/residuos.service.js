export class ResiduosService {
    buildWhere(status) {
        return { status: status ?? 'APROVADO' };
    }
    validateCreate(input) {
        if (!input.nome || !input.cor) {
            return { ok: false, error: 'nome e cor são obrigatórios' };
        }
        return { ok: true };
    }
}
