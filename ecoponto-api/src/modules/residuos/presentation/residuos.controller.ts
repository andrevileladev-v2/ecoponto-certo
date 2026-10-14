import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../lib/prisma.js'
import { ResiduosService } from '../application/residuos.service.js'

export class ResiduosController {
  constructor(
    private readonly service: ResiduosService = new ResiduosService(),
    private readonly prismaClient = prisma,
  ) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { status } = req.query as any
    const residuos = await this.prismaClient.residuo.findMany({
      where: this.service.buildWhere(status) as any,
      orderBy: { nome: 'asc' },
    })
    return reply.send(residuos)
  }

  async detail(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const residuo = await this.prismaClient.residuo.findUnique({ where: { id } })
    if (!residuo) return reply.status(404).send({ error: 'Resíduo não encontrado' })
    return reply.send(residuo)
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const { sub, role } = req.user as any
    const { nome, cor, icone } = req.body as any
    const validation = this.service.validateCreate({ nome, cor })
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const existe = await this.prismaClient.residuo.findUnique({ where: { nome } })
    if (existe) return reply.status(409).send({ error: 'Resíduo já existe' })

    const isAdmin = role === 'ADMIN'
    const residuo = await this.prismaClient.residuo.create({
      data: {
        nome,
        cor,
        icone,
        status: isAdmin ? 'APROVADO' : 'PENDENTE',
        solicitado_por_id: isAdmin ? null : sub,
      },
    })

    return reply.status(201).send(residuo)
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { nome, cor, icone, status } = req.body as any
    const residuo = await this.prismaClient.residuo.update({
      where: { id },
      data: { nome, cor, icone, status },
    })
    return reply.send(residuo)
  }

  async approve(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const residuo = await this.prismaClient.residuo.update({
      where: { id },
      data: { status: 'APROVADO' },
    })
    return reply.send(residuo)
  }

  async reject(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const residuo = await this.prismaClient.residuo.update({
      where: { id },
      data: { status: 'REJEITADO' },
    })
    return reply.send(residuo)
  }

  async remove(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    await this.prismaClient.residuo.delete({ where: { id } })
    return reply.send({ ok: true })
  }
}
