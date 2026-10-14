import { prisma } from '../../../lib/prisma.js';
import { PontosService } from '../application/pontos.service.js';
export class PontosController {
    service;
    prismaClient;
    constructor(service = new PontosService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async list(req, reply) {
        const query = req.query;
        const lat = query.lat ? Number(query.lat) : undefined;
        const lng = query.lng ? Number(query.lng) : undefined;
        const raio = query.raio ? Number(query.raio) : undefined;
        const where = this.service.buildWhereClause(query);
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
        });
        if (lat && lng && raio) {
            pontos = this.service.applyDistanceFilter(pontos, lat, lng, raio);
        }
        return reply.send(pontos);
    }
    async create(req, reply) {
        const { sub } = req.user;
        const { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, residuos } = req.body;
        const validation = this.service.validateCreate({ nome, endereco, cidade, lat, lng });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const ponto = await this.prismaClient.ponto.create({
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
                        create: residuos.map((id) => ({
                            residuo_id: id,
                            status: 'CONFIRMADO',
                            confirmacoes: 1,
                        })),
                    }
                    : undefined,
            },
            include: { residuos: { include: { residuo: true } } },
        });
        return reply.status(201).send(ponto);
    }
    async detail(req, reply) {
        const { id } = req.params;
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
        });
        if (!ponto)
            return reply.status(404).send({ error: 'Ponto não encontrado' });
        return reply.send(ponto);
    }
    async listEntregas(req, reply) {
        const { id } = req.params;
        const entregas = await this.prismaClient.entrega.findMany({
            where: { ponto_id: id },
            include: {
                residuo: { select: { id: true, nome: true } },
            },
            orderBy: { criado_em: 'desc' },
            take: 30,
        });
        return reply.send(entregas);
    }
    async update(req, reply) {
        const { id } = req.params;
        const { sub, role } = req.user;
        const ponto = await this.prismaClient.ponto.findUnique({ where: { id } });
        if (!ponto)
            return reply.status(404).send({ error: 'Ponto não encontrado' });
        if (ponto.criado_por_id !== sub && role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Sem permissão' });
        }
        const { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, status } = req.body;
        const atualizado = await this.prismaClient.ponto.update({
            where: { id },
            data: { nome, descricao, endereco, cidade, estado, lat, lng, telefone, site, horario, status },
        });
        return reply.send(atualizado);
    }
    async remove(req, reply) {
        const { id } = req.params;
        await this.prismaClient.ponto.delete({ where: { id } });
        return reply.send({ ok: true });
    }
    async addResiduo(req, reply) {
        const { id } = req.params;
        const { residuo_id } = req.body;
        if (!residuo_id)
            return reply.status(400).send({ error: 'residuo_id obrigatório' });
        const pr = await this.prismaClient.pontoResiduo.upsert({
            where: { ponto_id_residuo_id: { ponto_id: id, residuo_id } },
            update: {},
            create: { ponto_id: id, residuo_id, status: 'PENDENTE' },
            include: { residuo: true },
        });
        return reply.status(201).send(pr);
    }
    async removeResiduo(req, reply) {
        const { id, residuoId } = req.params;
        await this.prismaClient.pontoResiduo.delete({
            where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
        });
        return reply.send({ ok: true });
    }
    async voteResiduo(req, reply) {
        const { id, residuoId } = req.params;
        const { sub } = req.user;
        const { aceita } = req.body;
        const pr = await this.prismaClient.pontoResiduo.findUnique({
            where: { ponto_id_residuo_id: { ponto_id: id, residuo_id: residuoId } },
        });
        if (!pr)
            return reply.status(404).send({ error: 'Resíduo não encontrado neste ponto' });
        await this.prismaClient.votoResiduo.upsert({
            where: { ponto_residuo_id_usuario_id: { ponto_residuo_id: pr.id, usuario_id: sub } },
            update: { aceita },
            create: { ponto_residuo_id: pr.id, usuario_id: sub, aceita },
        });
        const votos = await this.prismaClient.votoResiduo.groupBy({
            by: ['aceita'],
            where: { ponto_residuo_id: pr.id },
            _count: true,
        });
        const confirmacoes = votos.find((v) => v.aceita)?._count ?? 0;
        const contestacoes = votos.find((v) => !v.aceita)?._count ?? 0;
        const total = confirmacoes + contestacoes;
        let status = 'PENDENTE';
        if (total >= 3)
            status = confirmacoes / total >= 0.7 ? 'CONFIRMADO' : 'CONTESTADO';
        const atualizado = await this.prismaClient.pontoResiduo.update({
            where: { id: pr.id },
            data: { confirmacoes, contestacoes, status },
            include: { residuo: true },
        });
        return reply.send(atualizado);
    }
    async confirmActivity(req, reply) {
        const { id } = req.params;
        const { sub } = req.user;
        const { funcionando, observacao } = req.body;
        const confirmacao = await this.prismaClient.confirmacaoAtividade.create({
            data: { ponto_id: id, usuario_id: sub, funcionando: Boolean(funcionando), observacao },
        });
        const recentes = await this.prismaClient.confirmacaoAtividade.findMany({
            where: { ponto_id: id },
            orderBy: { criado_em: 'desc' },
            take: 10,
            select: { funcionando: true },
        });
        const positivas = recentes.filter((c) => c.funcionando).length;
        const confiabilidade = recentes.length ? positivas / recentes.length : 0;
        await this.prismaClient.ponto.update({ where: { id }, data: { confiabilidade } });
        return reply.status(201).send(confirmacao);
    }
    async save(req, reply) {
        const { id } = req.params;
        const { sub } = req.user;
        await this.prismaClient.pontoSalvo.upsert({
            where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
            update: {},
            create: { usuario_id: sub, ponto_id: id },
        });
        return reply.status(201).send({ ok: true });
    }
    async unsave(req, reply) {
        const { id } = req.params;
        const { sub } = req.user;
        await this.prismaClient.pontoSalvo.delete({
            where: { usuario_id_ponto_id: { usuario_id: sub, ponto_id: id } },
        }).catch(() => { });
        return reply.send({ ok: true });
    }
    async listMensagens(req, reply) {
        const { id } = req.params;
        const { cursor, limit } = req.query;
        const mensagens = await this.prismaClient.mensagem.findMany({
            where: { ponto_id: id },
            include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
            orderBy: { criado_em: 'asc' },
            take: Number(limit) || 50,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        return reply.send(mensagens);
    }
    async createMensagem(req, reply) {
        const { id } = req.params;
        const { sub } = req.user;
        const { tipo, conteudo } = req.body;
        if (!conteudo?.trim())
            return reply.status(400).send({ error: 'conteudo obrigatório' });
        const mensagem = await this.prismaClient.mensagem.create({
            data: { ponto_id: id, usuario_id: sub, tipo: tipo ?? 'TEXTO', conteudo: conteudo.trim() },
            include: { usuario: { select: { id: true, nome: true, avatar_url: true } } },
        });
        return reply.status(201).send(mensagem);
    }
    async deleteMensagem(req, reply) {
        const { pontoId, msgId } = req.params;
        const { sub, role } = req.user;
        const msg = await this.prismaClient.mensagem.findUnique({ where: { id: msgId } });
        if (!msg || msg.ponto_id !== pontoId)
            return reply.status(404).send({ error: 'Mensagem não encontrada' });
        if (msg.usuario_id !== sub && role !== 'ADMIN')
            return reply.status(403).send({ error: 'Sem permissão' });
        await this.prismaClient.mensagem.delete({ where: { id: msgId } });
        return reply.send({ ok: true });
    }
}
