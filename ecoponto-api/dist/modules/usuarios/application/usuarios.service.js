export class UsuariosService {
    buildListWhere(input) {
        const where = {};
        if (input.status)
            where.status = input.status;
        if (input.tipo)
            where.tipo = input.tipo;
        if (input.q) {
            where.OR = [
                { nome: { contains: input.q, mode: 'insensitive' } },
                { email: { contains: input.q, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    validateStatus(status) {
        if (!status || !['ATIVO', 'BLOQUEADO'].includes(status)) {
            return { ok: false, error: 'status inválido' };
        }
        return { ok: true };
    }
    validateRole(role) {
        if (!role || !['USER', 'ADMIN'].includes(role)) {
            return { ok: false, error: 'role inválido' };
        }
        return { ok: true };
    }
}
