import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../lib/prisma.js'
import { PontosService, type ProposedPointData } from '../application/pontos.service.js'
import type { HorarioSemana } from '../domain/ponto.types.js'

const horarioService = new PontosService()

function getHorarios(value: unknown): HorarioSemana | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as HorarioSemana
}

function getResiduoIds(body: Record<string, unknown>): string[] {
  const raw = body.residuo_ids
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
}

function getProposalData(body: Record<string, unknown>): ProposedPointData {
  const coordinate = (value: unknown) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim()) return Number(value)
    return Number.NaN
  }

  const horarios = getHorarios(body.horarios)

  return {
    nome: String(body.nome ?? '').trim(),
    descricao: typeof body.descricao === 'string' ? body.descricao.trim() || null : null,
    endereco: String(body.endereco ?? '').trim(),
    cidade: String(body.cidade ?? '').trim(),
    estado: String(body.estado ?? 'ES').trim(),
    pais: String(body.pais ?? 'Brasil').trim(),
    lat: coordinate(body.lat),
    lng: coordinate(body.lng),
    telefone: typeof body.telefone === 'string' ? body.telefone.trim() || null : null,
    site: typeof body.site === 'string' ? body.site.trim() || null : null,
    horarios,
    horario: horarios ? horarioService.formatHorarioResumo(horarios) : typeof body.horario === 'string' ? body.horario.trim() || null : null,
  }
}

export class PontosController {
  constructor(
    private readonly service: PontosService = new PontosService(),
    private readonly prismaClient = prisma,
  ) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string | undefined>
    const lat = query.lat ? Number(query.lat) : undefined
    const lng = query.lng ? Number(query.lng) : undefined
    const raio = query.raio ? Number(query.raio) : undefined

    const where = this.service.buildWhereClause(query)

    let pontos = await this.prismaClient.ponto.findMany({
      where,
      include: {
        residuos: {
          where: { status: 'CONFIRMADO' },
          include: { residuo: true },
          orderBy: { confirmacoes: 'desc' },
        },
        _count: { select: { confirmacoes: true, mensagens: true } },
      },
      orderBy: { confiabilidade: 'desc' },
      take: 100,
    })

    if (lat && lng && raio) {
      pontos = this.service.applyDistanceFilter(pontos, lat, lng, raio) as typeof pontos
    }

    return reply.send(pontos)
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const dados = getProposalData(req.body as Record<string, unknown>)
    const validation = this.service.validateProposal(dados)
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const residuoIds = getResiduoIds(req.body as Record<string, unknown>)

    const ponto = await this.prismaClient.ponto.create({
      data: {
        ...dados,
        status: 'PENDENTE_VERIFICACAO',
        confiabilidade: 0.15,
        criado_por_id: sub,
      },
    })

    if (residuoIds.length > 0) {
      // Cada tipo de resíduo entra como sua própria proposta (status PENDENTE),
      // com confiança calculada a partir das confirmações/contestações da comunidade.
      await this.prismaClient.pontoResiduo.createMany({
        data: residuoIds.map((residuo_id) => ({ ponto_id: ponto.id, residuo_id })),
        skipDuplicates: true,
      })
    }

    const proposta = await this.prismaClient.propostaPonto.create({
      data: {
        tipo: 'CRIAR',
        dados,
        autor_id: sub,
        ponto_id: ponto.id,
        status: 'PENDENTE',
      },
    })

    return reply.status(201).send({ ponto, proposta })
  }

  async listMyProposals(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user as any
    const propostas = await this.prismaClient.propostaPonto.findMany({
      where: { autor_id: sub },
      include: { ponto: { select: { id: true, nome: true } } },
      orderBy: { criado_em: 'desc' },
    })
    return reply.send(propostas)
  }

  async cancelProposal(req: FastifyRequest, reply: FastifyReply) {
    const { propostaId } = req.params as any
    const { sub } = req.user as any

    const proposta = await this.prismaClient.propostaPonto.findUnique({ where: { id: propostaId } })
    if (!proposta) return reply.status(404).send({ error: 'Proposta não encontrada' })
    if (proposta.autor_id !== sub) {
      return reply.status(403).send({ error: 'Você só pode cancelar suas próprias sugestões' })
    }
    if (proposta.status !== 'PENDENTE') {
      return reply.status(409).send({ error: 'Esta proposta já foi decidida e não pode mais ser cancelada' })
    }
    if (proposta.confirmacoes + proposta.contestacoes > 0) {
      return reply.status(409).send({ error: 'Esta sugestão já recebeu votos da comunidade e não pode mais ser cancelada' })
    }

    if (proposta.tipo === 'CRIAR' && proposta.ponto_id) {
      const ponto = await this.prismaClient.ponto.findUnique({
        where: { id: proposta.ponto_id },
        select: {
          _count: { select: { mensagens: true, confirmacoes: true, entregas: true, salvos: true, denuncias: true } },
        },
      })
      const temAtividade = ponto ? Object.values(ponto._count).some((count) => count > 0) : false
      if (temAtividade) {
        return reply.status(409).send({ error: 'Este ponto já tem atividade da comunidade e não pode mais ser cancelado' })
      }
      // O ponto só existe por causa desta proposta: ao removê-lo, a proposta é apagada em cascata.
      await this.prismaClient.ponto.delete({ where: { id: proposta.ponto_id } })
    } else {
      await this.prismaClient.propostaPonto.delete({ where: { id: propostaId } })
    }

    return reply.status(204).send()
  }

  async listPendingCreationProposals(_req: FastifyRequest, reply: FastifyReply) {
    const propostas = await this.prismaClient.propostaPonto.findMany({
      where: { tipo: 'CRIAR', status: 'PENDENTE' },
      select: {
        id: true,
        tipo: true,
        dados: true,
        autor_id: true,
        confirmacoes: true,
        contestacoes: true,
        criado_em: true,
        autor: { select: { nome: true } },
      },
      orderBy: { criado_em: 'desc' },
      take: 100,
    })
    return reply.send(propostas)
  }

  async listPointProposals(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const propostas = await this.prismaClient.propostaPonto.findMany({
      where: { ponto_id: id, status: 'PENDENTE' },
      select: {
        id: true,
        tipo: true,
        dados: true,
        autor_id: true,
        confirmacoes: true,
        contestacoes: true,
        criado_em: true,
        autor: { select: { nome: true } },
      },
      orderBy: { criado_em: 'desc' },
    })
    return reply.send(propostas)
  }

  async voteProposal(req: FastifyRequest, reply: FastifyReply) {
    const { propostaId } = req.params as any
    const { sub } = req.user as any
    const { aprova } = req.body as { aprova?: boolean }
    if (typeof aprova !== 'boolean') {
      return reply.status(400).send({ error: 'Informe se aprova a proposta' })
    }

    const propostaAtual = await this.prismaClient.propostaPonto.findUnique({
      where: { id: propostaId },
    })
    if (!propostaAtual) return reply.status(404).send({ error: 'Proposta não encontrada' })
    if (propostaAtual.status !== 'PENDENTE') {
      return reply.status(409).send({ error: 'Esta proposta já foi decidida' })
    }
    if (propostaAtual.autor_id === sub) {
      return reply.status(403).send({ error: 'Você não pode votar na própria proposta' })
    }

    const result = await this.prismaClient.$transaction(async (tx) => {
      await tx.votoPropostaPonto.upsert({
        where: { proposta_id_usuario_id: { proposta_id: propostaId, usuario_id: sub } },
        update: { aprova },
        create: { proposta_id: propostaId, usuario_id: sub, aprova },
      })

      const votos = await tx.votoPropostaPonto.findMany({
        where: { proposta_id: propostaId },
        select: { aprova: true },
      })
      const confirmacoes = votos.filter((voto) => voto.aprova).length
      const contestacoes = votos.length - confirmacoes
      const status = this.service.resolveProposalVote(confirmacoes, contestacoes)
      let pontoId = propostaAtual.ponto_id

      if (status === 'APROVADA') {
        const dados = propostaAtual.dados as ProposedPointData
        if (propostaAtual.tipo === 'CRIAR') {
          const ponto = await tx.ponto.create({
            data: { ...dados, status: 'ATIVO', criado_por_id: propostaAtual.autor_id },
            select: { id: true },
          })
          pontoId = ponto.id
        } else if (propostaAtual.ponto_id) {
          await tx.ponto.update({
            where: { id: propostaAtual.ponto_id },
            data: dados,
          })
        }
      }

      return tx.propostaPonto.update({
        where: { id: propostaId },
        data: {
          status,
          confirmacoes,
          contestacoes,
          ...(pontoId && status === 'APROVADA' ? { ponto_id: pontoId } : {}),
        },
      })
    })

    return reply.send(result)
  }

  async detail(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any

    const ponto = await this.prismaClient.ponto.findUnique({
      where: { id },
      include: {
        criado_por: { select: { id: true, nome: true, avatar_url: true } },
        residuos: {
          include: { residuo: true },
          orderBy: { confirmacoes: 'desc' },
        },
        confirmacoes: {
          orderBy: { criado_em: 'desc' },
          take: 5,
          include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
        },
        mensagens: {
          orderBy: { criado_em: 'asc' },
          take: 50,
          include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
        },
        _count: { select: { salvos: true } },
      },
    })

    if (!ponto) return reply.status(404).send({ error: 'Ponto não encontrado' })
    return reply.send(ponto)
  }

  async listEntregas(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const entregas = await this.prismaClient.entrega.findMany({
      where: { ponto_id: id },
      include: {
        residuo: { select: { id: true, nome: true } },
      },
      orderBy: { criado_em: 'desc' },
      take: 30,
    })
    return reply.send(entregas)
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any

    const ponto = await this.prismaClient.ponto.findUnique({ where: { id } })
    if (!ponto) return reply.status(404).send({ error: 'Ponto não encontrado' })
    const dados = getProposalData(req.body as Record<string, unknown>)
    const validation = this.service.validateProposal(dados)
    if (!validation.ok) return reply.status(400).send({ error: validation.error })

    const proposta = await this.prismaClient.propostaPonto.create({
      data: { tipo: 'EDITAR', dados, autor_id: sub, ponto_id: id },
    })
    return reply.status(201).send(proposta)
  }

  async remove(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    await this.prismaClient.ponto.delete({ where: { id } })
    return reply.send({ ok: true })
  }

  async addResiduo(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { residuo_id } = req.body as any

    if (!residuo_id) return reply.status(400).send({ error: 'residuo_id obrigatório' })

    const pr = await this.prismaClient.pontoResiduo.upsert({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id } },
      update: {},
      create: { ponto_id: id, residuo_id, status: 'PENDENTE' },
      include: { residuo: true },
    })

    return reply.status(201).send(pr)
  }

  async removeResiduo(req: FastifyRequest, reply: FastifyReply) {
    const { id, residuoId } = req.params as any
    await this.prismaClient.pontoResiduo.delete({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
    })
    return reply.send({ ok: true })
  }

  async voteResiduo(req: FastifyRequest, reply: FastifyReply) {
    const { id, residuoId } = req.params as any
    const { sub } = req.user as any
    const { aceita } = req.body as any

    const pr = await this.prismaClient.pontoResiduo.findUnique({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
    })
    if (!pr) return reply.status(404).send({ error: 'Resíduo não encontrado neste ponto' })

    await this.prismaClient.votoResiduo.upsert({
      where: { ponto_residuo_id_usuario_id: { ponto_residuo_id: pr.id, usuario_id: sub } },
      update: { aceita },
      create: { ponto_residuo_id: pr.id, usuario_id: sub, aceita },
    })

    const votos = await this.prismaClient.votoResiduo.groupBy({
      by: ['aceita'],
      where: { ponto_residuo_id: pr.id },
      _count: true,
    })

    const confirmacoes = votos.find((v) => v.aceita)?._count ?? 0
    const contestacoes = votos.find((v) => !v.aceita)?._count ?? 0
    const total = confirmacoes + contestacoes

    let status: 'CONFIRMADO' | 'CONTESTADO' | 'PENDENTE' = 'PENDENTE'
    if (total >= 3) status = confirmacoes / total >= 0.7 ? 'CONFIRMADO' : 'CONTESTADO'

    const atualizado = await this.prismaClient.pontoResiduo.update({
      where: { id: pr.id },
      data: { confirmacoes, contestacoes, status },
      include: { residuo: true },
    })

    return reply.send(atualizado)
  }

  async confirmActivity(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any
    const { funcionando, observacao } = req.body as any

    const confirmacao = await this.prismaClient.confirmacaoAtividade.create({
      data: { ponto_id: id, usuario_id: sub, funcionando: Boolean(funcionando), observacao },
    })

    const recentes = await this.prismaClient.confirmacaoAtividade.findMany({
      where: { ponto_id: id },
      orderBy: { criado_em: 'desc' },
      take: 10,
      select: { funcionando: true },
    })

    const positivas = recentes.filter((c) => c.funcionando).length
    const confiabilidade = recentes.length ? positivas / recentes.length : 0
    const novoStatus = positivas >= 2 && confiabilidade >= 0.6 ? 'ATIVO' : undefined

    await this.prismaClient.ponto.update({
      where: { id },
      data: {
        confiabilidade,
        ...(novoStatus ? { status: novoStatus } : {}),
      },
    })

    if (novoStatus === 'ATIVO') {
      await this.prismaClient.propostaPonto.updateMany({
        where: { ponto_id: id, status: 'PENDENTE' },
        data: { status: 'APROVADA', confirmacoes: positivas },
      })
    }

    return reply.status(201).send(confirmacao)
  }

  async save(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any

    await this.prismaClient.pontoSalvo.upsert({
      where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
      update: {},
      create: { usuario_id: sub, ponto_id: id },
    })

    return reply.status(201).send({ ok: true })
  }

  async unsave(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any

    await this.prismaClient.pontoSalvo.delete({
      where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
    }).catch(() => {})

    return reply.send({ ok: true })
  }

  async listMensagens(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { cursor, limit } = req.query as any

    const mensagens = await this.prismaClient.mensagem.findMany({
      where: { ponto_id: id },
      include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
      orderBy: { criado_em: 'asc' },
      take: Number(limit) || 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    return reply.send(mensagens)
  }

  async createMensagem(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as any
    const { sub } = req.user as any
    const { tipo, conteudo } = req.body as any

    if (!conteudo?.trim()) return reply.status(400).send({ error: 'conteudo obrigatório' })

    const mensagem = await this.prismaClient.mensagem.create({
      data: { ponto_id: id, usuario_id: sub, tipo: tipo ?? 'TEXTO', conteudo: conteudo.trim() },
      include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
    })

    return reply.status(201).send(mensagem)
  }

  async deleteMensagem(req: FastifyRequest, reply: FastifyReply) {
    const { pontoId, msgId } = req.params as any
    const { sub, role } = req.user as any

    const msg = await this.prismaClient.mensagem.findUnique({ where: { id: msgId } })
    if (!msg || msg.ponto_id !== pontoId) return reply.status(404).send({ error: 'Mensagem não encontrada' })
    if (msg.usuario_id !== sub && role !== 'ADMIN') return reply.status(403).send({ error: 'Sem permissão' })

    await this.prismaClient.mensagem.delete({ where: { id: msgId } })
    return reply.send({ ok: true })
  }
}
