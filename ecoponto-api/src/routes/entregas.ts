import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function entregasRoutes(app: FastifyInstance) {
  // GET /entregas — histórico do usuário logado
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { limit, offset } = req.query as any

    const [total, entregas] = await prisma.$transaction([
      prisma.entrega.count({ where: { usuario_id: sub } }),
      prisma.entrega.findMany({
        where: { usuario_id: sub },
        include: {
          ponto: { select: { id: true, nome: true, cidade: true } },
          residuo: { select: { id: true, nome: true, cor: true, icone: true } },
        },
        orderBy: { criado_em: 'desc' },
        take: Number(limit) || 20,
        skip: Number(offset) || 0,
      }),
    ])

    return reply.send({ total, data: entregas })
  })

  // GET /entregas/stats — resumo por resíduo
  app.get('/stats', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any

    const stats = await prisma.entrega.groupBy({
      by: ['residuo_id'],
      where: { usuario_id: sub },
      _sum: { quantidade: true },
      _count: true,
    })

    const residuos = await prisma.residuo.findMany({
      where: { id: { in: stats.map((s) => s.residuo_id) } },
      select: { id: true, nome: true, cor: true, icone: true },
    })

    const resultado = stats.map((s) => ({
      residuo: residuos.find((r) => r.id === s.residuo_id),
      total_kg: s._sum.quantidade,
      entregas: s._count,
    }))

    return reply.send(resultado)
  })

  // POST /entregas — registrar entrega
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { ponto_id, residuo_id, quantidade, unidade } = req.body as any

    if (!ponto_id || !residuo_id) {
      return reply.status(400).send({ error: 'ponto_id e residuo_id são obrigatórios' })
    }

    const entrega = await prisma.entrega.create({
      data: {
        usuario_id: sub,
        ponto_id,
        residuo_id,
        quantidade: quantidade ? Number(quantidade) : null,
        unidade,
      },
      include: {
        ponto: { select: { id: true, nome: true, cidade: true } },
        residuo: { select: { id: true, nome: true, cor: true, icone: true } },
      },
    })

    return reply.status(201).send(entrega)
  })

  // DELETE /entregas/:id — remover entrega
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub, role } = req.user as any

    const entrega = await prisma.entrega.findUnique({ where: { id } })
    if (!entrega) return reply.status(404).send({ error: 'Entrega não encontrada' })
    if (entrega.usuario_id !== sub && role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    await prisma.entrega.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
