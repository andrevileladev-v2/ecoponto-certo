export class MelhoriasService {
    validateCreate(input) {
        if (!input.titulo || !input.descricao || !input.categoria) {
            return { ok: false, error: 'titulo, descricao e categoria são obrigatórios' };
        }
        return { ok: true };
    }
}
