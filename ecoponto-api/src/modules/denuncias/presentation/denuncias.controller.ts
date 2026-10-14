import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../lib/prisma.js'
import { DenunciasService } from '../application/denuncias.service.js'

export class DenunciasController {
  constructor(
    private readonly service: DenunciasService = new DenunciasService(),
    private readonly prismaClient = prisma,
  ) {}

  async create(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const { tipo, descricao, alvo_usuario_id, alvo_mensagem_id, alvo_ponto_id } = req.body as any
    const validation = this.service.validateCreate({ tipo, alvo_usuario_id, alvo_mensagem_id, alvo_ponto_id })
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const denuncia = await this.prismaClient.denuncia.create({
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
  }

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { status, limit, offset } = req.query as any

    const [total, denuncias] = await this.prismaClient.$transaction([
      this.prismaClient.denuncia.count({ where: status ? { status } : undefined }),
      this.prismaClient.denuncia.findMany({
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
  }

  async resolve(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { status } = req.body as any
    const denuncia = await this.prismaClient.denuncia.update({
      where: { id },
      data: {
        status,
        resolvido_em: status !== 'PENDENTE' ? new Date() : null,
      },
    })

    return reply.send(denuncia)
  }
}
