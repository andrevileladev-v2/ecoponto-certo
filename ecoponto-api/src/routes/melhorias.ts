import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function melhorasRoutes(app: FastifyInstance) {
  // GET /melhorias
  app.get('/', async (req, reply) => {
    const { status, order } = req.query as any

    const melhorias = await prisma.melhoria.findMany({
      where: status ? { status } : undefined,
      include: {
        autor: { select: { id: true, nome: true, avatar_url: true } },
        _count: { select: { votos: true } },
      },
      orderBy: order === 'votos' ? { votos: { _count: 'desc' } } : { criado_em: 'desc' },
    })

    return reply.send(melhorias)
  })

  // POST /melhorias — sugerir melhoria
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { titulo, descricao } = req.body as any

    if (!titulo?.trim()) return reply.status(400).send({ error: 'titulo é obrigatório' })

    const melhoria = await prisma.melhoria.create({
      data: { titulo: titulo.trim(), descricao, autor_id: sub },
      include: {
        autor: { select: { id: true, nome: true, avatar_url: true } },
        _count: { select: { votos: true } },
      },
    })

    return reply.status(201).send(melhoria)
  })

  // POST /melhorias/:id/votar — upvote
  app.post('/:id/votar', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub } = req.user as any

    const existe = await prisma.votoMelhoria.findUnique({
      where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
    })

    if (existe) {
      // Toggle: remove voto
      await prisma.votoMelhoria.delete({
        where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
      })
      return reply.send({ votou: false })
    }

    await prisma.votoMelhoria.create({ data: { usuario_id: sub, melhoria_id: id } })
    return reply.status(201).send({ votou: true })
  })

  // PATCH /melhorias/:id — admin muda status
  app.patch('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const { status } = req.body as any

    const melhoria = await prisma.melhoria.update({
      where: { id },
      data: { status },
    })
    return reply.send(melhoria)
  })

  // DELETE /melhorias/:id
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub, role } = req.user as any

    const melhoria = await prisma.melhoria.findUnique({ where: { id } })
    if (!melhoria) return reply.status(404).send({ error: 'Melhoria não encontrada' })
    if (melhoria.autor_id !== sub && role !== 'ADMIN') return reply.status(403).send({ error: 'Sem permissão' })

    await prisma.melhoria.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
