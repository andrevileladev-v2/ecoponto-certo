import type { FastifyReply, FastifyRequest } from 'fastify'
import { StatusMelhoria, ViabilidadeMelhoria } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { MelhoriasService } from '../application/melhorias.service.js'

export class MelhoriasController {
  constructor(
    private readonly service: MelhoriasService = new MelhoriasService(),
    private readonly prismaClient = prisma,
  ) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { status } = req.query as any
    const melhorias = await this.prismaClient.melhoria.findMany({
      where: status ? { status } : undefined,
      include: {
        autor: { select: { id: true, nome: true, avatar_url: true } },
        _count: { select: { votos: true } },
      },
      orderBy: { criado_em: 'desc' },
    })
    return reply.send(melhorias)
  }

  async myVotes(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const votes = await this.prismaClient.votoMelhoria.findMany({
      where: { usuario_id: sub },
      select: { melhoria_id: true },
    })
    return reply.send(votes.map((vote) => vote.melhoria_id))
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const { titulo, descricao } = req.body as any
    const validation = this.service.validateCreate({ titulo, descricao })
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const melhoria = await this.prismaClient.melhoria.create({
      data: {
        autor_id: sub,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
      },
      include: {
        autor: { select: { id: true, nome: true, avatar_url: true } },
        _count: { select: { votos: true } },
      },
    })

    return reply.status(201).send(melhoria)
  }

  async vote(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any
    const melhoria = await this.prismaClient.melhoria.findUnique({ where: { id }, select: { id: true } })
    if (!melhoria) return reply.status(404).send({ error: 'Sugestão não encontrada' })

    const existingVote = await this.prismaClient.votoMelhoria.findUnique({
      where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
    })
    if (existingVote) {
      await this.prismaClient.votoMelhoria.delete({
        where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
      })
    } else {
      await this.prismaClient.votoMelhoria.create({ data: { usuario_id: sub, melhoria_id: id } })
    }

    const votos = await this.prismaClient.votoMelhoria.count({ where: { melhoria_id: id } })
    return reply.send({ votado_por_mim: !existingVote, votos })
  }

  async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { status, viabilidade, previsao, resposta } = req.body as {
      status?: string
      viabilidade?: string
      previsao?: string | null
      resposta?: string | null
    }
    const validation = this.service.validateUpdate({ status, viabilidade, previsao, resposta })
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const melhoria = await this.prismaClient.melhoria.update({
      where: { id },
      data: {
        status: status as StatusMelhoria | undefined,
        viabilidade: viabilidade as ViabilidadeMelhoria | undefined,
        previsao: previsao?.trim() || (previsao === null ? null : undefined),
        resposta: resposta?.trim() || (resposta === null ? null : undefined),
      },
    })
    return reply.send(melhoria)
  }
}
