import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function residuosRoutes(app: FastifyInstance) {
  // GET /residuos — todos aprovados
  app.get('/', async (req, reply) => {
    const { status } = req.query as any

    const residuos = await prisma.residuo.findMany({
      where: { status: status ?? 'APROVADO' },
      orderBy: { nome: 'asc' },
    })
    return reply.send(residuos)
  })

  // GET /residuos/:id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as any
    const residuo = await prisma.residuo.findUnique({ where: { id } })
    if (!residuo) return reply.status(404).send({ error: 'Resíduo não encontrado' })
    return reply.send(residuo)
  })

  // POST /residuos — admin cria / usuário solicita
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub, role } = req.user as any
    const { nome, cor, icone } = req.body as any

    if (!nome || !cor) return reply.status(400).send({ error: 'nome e cor são obrigatórios' })

    const existe = await prisma.residuo.findUnique({ where: { nome } })
    if (existe) return reply.status(409).send({ error: 'Resíduo já existe' })

    const isAdmin = role === 'ADMIN'

    const residuo = await prisma.residuo.create({
      data: {
        nome,
        cor,
        icone,
        status: isAdmin ? 'APROVADO' : 'PENDENTE',
        solicitado_por_id: isAdmin ? null : sub,
      },
    })

    return reply.status(201).send(residuo)
  })

  // PUT /residuos/:id — admin edita
  app.put('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const { nome, cor, icone, status } = req.body as any

    const residuo = await prisma.residuo.update({
      where: { id },
      data: { nome, cor, icone, status },
    })
    return reply.send(residuo)
  })

  // PATCH /residuos/:id/aprovar — admin aprova solicitação
  app.patch('/:id/aprovar', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const residuo = await prisma.residuo.update({
      where: { id },
      data: { status: 'APROVADO' },
    })
    return reply.send(residuo)
  })

  // PATCH /residuos/:id/rejeitar — admin rejeita
  app.patch('/:id/rejeitar', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    const residuo = await prisma.residuo.update({
      where: { id },
      data: { status: 'REJEITADO' },
    })
    return reply.send(residuo)
  })

  // DELETE /residuos/:id — admin remove
  app.delete('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    await prisma.residuo.delete({ where: { id } })
    return reply.send({ ok: true })
  })
}
