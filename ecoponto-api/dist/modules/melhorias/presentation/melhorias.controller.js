import { prisma } from '../../../lib/prisma.js';
import { MelhoriasService } from '../application/melhorias.service.js';
export class MelhoriasController {
    service;
    prismaClient;
    constructor(service = new MelhoriasService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async list(req, reply) {
        const { status } = req.query;
        const melhorias = await this.prismaClient.melhoria.findMany({
            where: status ? { status } : undefined,
            include: {
                autor: { select: { id: true, nome: true, avatar_url: true } },
                _count: { select: { votos: true } },
            },
            orderBy: { criado_em: 'desc' },
        });
        return reply.send(melhorias);
    }
    async myVotes(req, reply) {
        const { sub } = req.user;
        const votes = await this.prismaClient.votoMelhoria.findMany({
            where: { usuario_id: sub },
            select: { melhoria_id: true },
        });
        return reply.send(votes.map((vote) => vote.melhoria_id));
    }
    async create(req, reply) {
        const { sub } = req.user;
        const { titulo, descricao } = req.body;
        const validation = this.service.validateCreate({ titulo, descricao });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
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
        });
        return reply.status(201).send(melhoria);
    }
    async vote(req, reply) {
        const { id } = req.params;
        const { sub } = req.user;
        const melhoria = await this.prismaClient.melhoria.findUnique({ where: { id }, select: { id: true } });
        if (!melhoria)
            return reply.status(404).send({ error: 'Sugestão não encontrada' });
        const existingVote = await this.prismaClient.votoMelhoria.findUnique({
            where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
        });
        if (existingVote) {
            await this.prismaClient.votoMelhoria.delete({
                where: { usuario_id_melhoria_id: { usuario_id: sub, melhoria_id: id } },
            });
        }
        else {
            await this.prismaClient.votoMelhoria.create({ data: { usuario_id: sub, melhoria_id: id } });
        }
        const votos = await this.prismaClient.votoMelhoria.count({ where: { melhoria_id: id } });
        return reply.send({ votado_por_mim: !existingVote, votos });
    }
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status, viabilidade, previsao, resposta } = req.body;
        const validation = this.service.validateUpdate({ status, viabilidade, previsao, resposta });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const melhoria = await this.prismaClient.melhoria.update({
            where: { id },
            data: {
                status: status,
                viabilidade: viabilidade,
                previsao: previsao?.trim() || (previsao === null ? null : undefined),
                resposta: resposta?.trim() || (resposta === null ? null : undefined),
            },
        });
        return reply.send(melhoria);
    }
}
