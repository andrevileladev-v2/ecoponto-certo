export class UsuariosService {
  buildListWhere(input: { q?: string; status?: string; tipo?: string }) {
    const where: Record<string, unknown> = {}
    if (input.status) where.status = input.status
    if (input.tipo) where.tipo = input.tipo
    if (input.q) {
      where.OR = [
        { nome: { contains: input.q, mode: 'insensitive' } },
        { email: { contains: input.q, mode: 'insensitive' } },
      ]
    }
    return where
  }

  validateStatus(status?: string) {
    if (!status || !['ATIVO', 'BLOQUEADO'].includes(status)) {
      return { ok: false as const, error: 'status inválido' }
    }
    return { ok: true as const }
  }

  validateRole(role?: string) {
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return { ok: false as const, error: 'role inválido' }
    }
    return { ok: true as const }
  }
}
