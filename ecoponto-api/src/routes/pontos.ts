import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function pontosRoutes(app: FastifyInstance) {
  // GET /pontos — lista com filtros
  app.get('/', async (req, reply) => {
    const { lat, lng, raio, residuos, cidade, status, q } = req.query as any

    const where: any = {}

    if (cidade) where.cidade = { contains: cidade, mode: 'insensitive' }
    if (status) where.status = status
    else where.status = 'ATIVO'
    if (q) where.nome = { contains: q, mode: 'insensitive' }

    if (residuos) {
      const ids = String(residuos).split(',')
      where.residuos = { some: { residuo_id: { in: ids }, status: 'CONFIRMADO' } }
    }

    // Bounding box se tiver lat/lng
    if (lat && lng && raio) {
      const r = Number(raio) / 111 // graus aprox
      where.lat = { gte: Number(lat) - r, lte: Number(lat) + r }
      where.lng = { gte: Number(lng) - r, lte: Number(lng) + r }
    }

    let pontos = await prisma.ponto.findMany({
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

    // Filtro de distância precisa + ordenação
    if (lat && lng && raio) {
      pontos = pontos
        .map((p) => ({ ...p, distancia: haversine(Number(lat), Number(lng), p.lat, p.lng) }))
        .filter((p) => p.distancia <= Number(raio) / 1000)
        .sort((a, b) => a.distancia - b.distancia) as any
    }

    return reply.send(pontos)
  })

  // POST /pontos — criar ponto
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any
    const { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, residuos } =
      req.body as any

    if (!nome || !endereco || !cidade || lat == null || lng == null) {
      return reply.status(400).send({ error: 'nome, endereco, cidade, lat e lng são obrigatórios' })
    }

    const ponto = await prisma.ponto.create({
      data: {
        nome,
        descricao,
        endereco,
        cidade,
        estado: estado ?? 'ES',
        lat: Number(lat),
        lng: Number(lng),
        telefone,
        site,
        horario,
        status: 'ATIVO',
        criado_por_id: sub,
        residuos: residuos?.length
          ? {
              create: residuos.map((id: string) => ({
                residuo_id: id,
                status: 'CONFIRMADO',
                confirmacoes: 1,
              })),
            }
          : undefined,
      },
      include: { residuos: { include: { residuo: true } } },
    })

    return reply.status(201).send(ponto)
  })

  // GET /pontos/:id — detalhe completo
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as any

    const ponto = await prisma.ponto.findUnique({
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
  })

  // PUT /pontos/:id — editar
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub, role } = req.user as any

    const ponto = await prisma.ponto.findUnique({ where: { id } })
    if (!ponto) return reply.status(404).send({ error: 'Ponto não encontrado' })
    if (ponto.criado_por_id !== sub && role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    const { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, status } =
      req.body as any

    const atualizado = await prisma.ponto.update({
      where: { id },
      data: { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, status },
    })

    return reply.send(atualizado)
  })

  // DELETE /pontos/:id — remover
  app.delete('/:id', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id } = req.params as any
    await prisma.ponto.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // ── Resíduos do ponto ────────────────────────────────────────────────────

  // POST /pontos/:id/residuos — adicionar resíduo
  app.post('/:id/residuos', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { residuo_id } = req.body as any

    if (!residuo_id) return reply.status(400).send({ error: 'residuo_id obrigatório' })

    const pr = await prisma.pontoResiduo.upsert({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id } },
      update: {},
      create: { ponto_id: id, residuo_id, status: 'PENDENTE' },
      include: { residuo: true },
    })

    return reply.status(201).send(pr)
  })

  // DELETE /pontos/:id/residuos/:residuoId — remover resíduo (admin)
  app.delete('/:id/residuos/:residuoId', { preHandler: [app.authenticateAdmin] }, async (req, reply) => {
    const { id, residuoId } = req.params as any
    await prisma.pontoResiduo.delete({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
    })
    return reply.send({ ok: true })
  })

  // POST /pontos/:id/residuos/:residuoId/votar
  app.post('/:id/residuos/:residuoId/votar', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id, residuoId } = req.params as any
    const { sub } = req.user as any
    const { aceita } = req.body as any

    const pr = await prisma.pontoResiduo.findUnique({
      where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
    })
    if (!pr) return reply.status(404).send({ error: 'Resíduo não encontrado neste ponto' })

    await prisma.votoResiduo.upsert({
      where: { ponto_residuo_id_usuario_id: { ponto_residuo_id: pr.id, usuario_id: sub } },
      update: { aceita },
      create: { ponto_residuo_id: pr.id, usuario_id: sub, aceita },
    })

    // Recalcula contadores
    const votos = await prisma.votoResiduo.groupBy({
      by: ['aceita'],
      where: { ponto_residuo_id: pr.id },
      _count: true,
    })

    const confirmacoes = votos.find((v) => v.aceita)?._count ?? 0
    const contestacoes = votos.find((v) => !v.aceita)?._count ?? 0
    const total = confirmacoes + contestacoes

    let status: 'CONFIRMADO' | 'CONTESTADO' | 'PENDENTE' = 'PENDENTE'
    if (total >= 3) status = confirmacoes / total >= 0.7 ? 'CONFIRMADO' : 'CONTESTADO'

    const atualizado = await prisma.pontoResiduo.update({
      where: { id: pr.id },
      data: { confirmacoes, contestacoes, status },
      include: { residuo: true },
    })

    return reply.send(atualizado)
  })

  // ── Confirmar atividade ──────────────────────────────────────────────────

  // POST /pontos/:id/confirmar
  app.post('/:id/confirmar', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub } = req.user as any
    const { funcionando, observacao } = req.body as any

    const confirmacao = await prisma.confirmacaoAtividade.create({
      data: { ponto_id: id, usuario_id: sub, funcionando: Boolean(funcionando), observacao },
    })

    // Atualiza confiabilidade baseada nas últimas 10 confirmações
    const recentes = await prisma.confirmacaoAtividade.findMany({
      where: { ponto_id: id },
      orderBy: { criado_em: 'desc' },
      take: 10,
      select: { funcionando: true },
    })

    const positivas = recentes.filter((c) => c.funcionando).length
    const confiabilidade = positivas / recentes.length

    await prisma.ponto.update({ where: { id }, data: { confiabilidade } })

    return reply.status(201).send(confirmacao)
  })

  // ── Salvar ponto ─────────────────────────────────────────────────────────

  // POST /pontos/:id/salvar
  app.post('/:id/salvar', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub } = req.user as any

    await prisma.pontoSalvo.upsert({
      where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
      update: {},
      create: { usuario_id: sub, ponto_id: id },
    })

    return reply.status(201).send({ ok: true })
  })

  // DELETE /pontos/:id/salvar
  app.delete('/:id/salvar', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub } = req.user as any

    await prisma.pontoSalvo.delete({
      where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
    }).catch(() => {})

    return reply.send({ ok: true })
  })

  // ── Mensagens ────────────────────────────────────────────────────────────

  // GET /pontos/:id/mensagens
  app.get('/:id/mensagens', async (req, reply) => {
    const { id } = req.params as any
    const { cursor, limit } = req.query as any

    const mensagens = await prisma.mensagem.findMany({
      where: { ponto_id: id },
      include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
      orderBy: { criado_em: 'asc' },
      take: Number(limit) || 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    return reply.send(mensagens)
  })

  // POST /pontos/:id/mensagens
  app.post('/:id/mensagens', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as any
    const { sub } = req.user as any
    const { tipo, conteudo } = req.body as any

    if (!conteudo?.trim()) return reply.status(400).send({ error: 'conteudo obrigatório' })

    const mensagem = await prisma.mensagem.create({
      data: { ponto_id: id, usuario_id: sub, tipo: tipo ?? 'TEXTO', conteudo: conteudo.trim() },
      include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
    })

    return reply.status(201).send(mensagem)
  })

  // DELETE /pontos/:pontoId/mensagens/:msgId
  app.delete('/:pontoId/mensagens/:msgId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { pontoId, msgId } = req.params as any
    const { sub, role } = req.user as any

    const msg = await prisma.mensagem.findUnique({ where: { id: msgId } })
    if (!msg || msg.ponto_id !== pontoId) return reply.status(404).send({ error: 'Mensagem não encontrada' })
    if (msg.usuario_id !== sub && role !== 'ADMIN') return reply.status(403).send({ error: 'Sem permissão' })

    await prisma.mensagem.delete({ where: { id: msgId } })
    return reply.send({ ok: true })
  })
}
