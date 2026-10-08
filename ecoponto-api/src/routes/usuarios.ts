import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function usuariosRoutes(app: FastifyInstance) {
  // GET /usuarios/me — perfil do usuário logado
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any

    const usuario = await prisma.usuario.findUnique({
      where: { id: sub },
      include: {
        empresa: true,
        _count: {
          select: {
            pontos_criados: true,
            entregas: true,
            salvos: true,
          },
        },
      },
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return reply.send(usuario)
  })

  // PUT /usuarios/me — editar perfil
  app.put('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { nome, cidade, avatar_url } = req.body as any

    const usuario = await prisma.usuario.update({
      where: { id: sub },
      data: { nome, cidade, avatar_url },
      select: { id: true, email: true, nome: true, tipo: true, role: true, cidade: true, avatar_url: true },
    })

    return reply.send(usuario)
  })

  // GET /usuarios/me/salvos — pontos salvos
  app.get('/me/salvos', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any

    const salvos = await prisma.pontoSalvo.findMany({
      where: { usuario_id: sub },
      include: {
        ponto: {
          include: {
            residuos: {
              where: { status: 'CONFIRMADO' },
              include: { residuo: true },
            },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    })

    return reply.send(salvos.map((s) => s.ponto))
  })

  // ── Admin ────────────────────────────────────────────────────────────────

  // GET /usuarios — admin lista todos
  app.get('/', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { q, status, tipo, limit, offset } = req.query as any

    const where: any = {}
    if (status) where.status = status
    if (tipo) where.tipo = tipo
    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, usuarios] = await prisma.$transaction([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        include: {
          empresa: true,
          _count: { select: { pontos_criados: true, entregas: true } },
        },
        orderBy: { criado_em: 'desc' },
        take: Number(limit) || 20,
        skip: Number(offset) || 0,
      }),
    ])

    return reply.send({ total, data: usuarios })
  })

  // GET /usuarios/:id — admin vê usuário
  app.get('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        empresa: true,
        _count: { select: { pontos_criados: true, entregas: true } },
      },
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return reply.send(usuario)
  })

  // PATCH /usuarios/:id/status — admin bloqueia/ativa
  app.patch('/:id/status', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const { status } = req.body as any

    if (!['ATIVO', 'BLOQUEADO'].includes(status)) {
      return reply.status(400).send({ error: 'status inválido' })
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { status },
      select: { id: true, nome: true, email: true, status: true },
    })

    return reply.send(usuario)
  })

  // PATCH /usuarios/:id/role — admin muda role
  app.patch('/:id/role', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const { role } = req.body as any

    if (!['USER', 'ADMIN'].includes(role)) {
      return reply.status(400).send({ error: 'role inválido' })
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { role },
      select: { id: true, nome: true, email: true, role: true },
    })

    return reply.send(usuario)
  })
}
