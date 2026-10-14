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
    async create(req, reply) {
        const { sub } = req.user;
        const { titulo, descricao } = req.body;
        const validation = this.service.validateCreate({ titulo, descricao, categoria: 'GERAL' });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const melhoria = await this.prismaClient.melhoria.create({
            data: {
                autor_id: sub,
                titulo: titulo.trim(),
                descricao,
            },
            include: {
                autor: { select: { id: true, nome: true, avatar_url: true } },
                _count: { select: { votos: true } },
            },
        });
        return reply.status(201).send(melhoria);
    }
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = req.body;
        const melhoria = await this.prismaClient.melhoria.update({
            where: { id },
            data: { status },
        });
        return reply.send(melhoria);
    }
}
