import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function denunciasRoutes(app: FastifyInstance) {
  // POST /denuncias — criar denúncia
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { tipo, descricao, alvo_usuario_id, alvo_mensagem_id, alvo_ponto_id } = req.body as any

    if (!tipo) return reply.status(400).send({ error: 'tipo é obrigatório' })
    if (!alvo_usuario_id && !alvo_mensagem_id && alvo_ponto_id === undefined) {
      return reply.status(400).send({ error: 'Informe ao menos um alvo (usuário, mensagem ou ponto)' })
    }

    const denuncia = await prisma.denuncia.create({
      data: {
        tipo,
        descricao,
        denunciante_id: sub,
        alvo_usuario_id,
        alvo_mensagem_id,
        alvo_ponto_id,
      },
    })

    return reply.status(201).send(denuncia)
  })

  // GET /denuncias — admin lista
  app.get('/', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { status, limit, offset } = req.query as any

    const [total, denuncias] = await prisma.$transaction([
      prisma.denuncia.count({ where: status ? { status } : undefined }),
      prisma.denuncia.findMany({
        where: status ? { status } : undefined,
        include: {
          denunciante: { select: { id: true, nome: true } },
          alvo_usuario: { select: { id: true, nome: true } },
          alvo_mensagem: { select: { id: true, conteudo: true } },
          alvo_ponto: { select: { id: true, nome: true } },
        },
        orderBy: { criado_em: 'desc' },
        take: Number(limit) || 20,
        skip: Number(offset) || 0,
      }),
    ])

    return reply.send({ total, data: denuncias })
  })

  // PATCH /denuncias/:id — admin resolve/ignora
  app.patch('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const { status } = req.body as any

    const denuncia = await prisma.denuncia.update({
      where: { id },
      data: {
        status,
        resolvido_em: status !== 'PENDENTE' ? new Date() : null,
      },
    })

    return reply.send(denuncia)
  })
}
