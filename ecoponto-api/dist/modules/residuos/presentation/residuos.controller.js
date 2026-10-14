import { prisma } from '../../../lib/prisma.js';
import { ResiduosService } from '../application/residuos.service.js';
export class ResiduosController {
    service;
    prismaClient;
    constructor(service = new ResiduosService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async list(req, reply) {
        const { status } = req.query;
        const residuos = await this.prismaClient.residuo.findMany({
            where: this.service.buildWhere(status),
            orderBy: { nome: 'asc' },
        });
        return reply.send(residuos);
    }
    async detail(req, reply) {
        const { id } = req.params;
        const residuo = await this.prismaClient.residuo.findUnique({ where: { id } });
        if (!residuo)
            return reply.status(404).send({ error: 'Resíduo não encontrado' });
        return reply.send(residuo);
    }
    async create(req, reply) {
        const { sub, role } = req.user;
        const { nome, cor, icone } = req.body;
        const validation = this.service.validateCreate({ nome, cor });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const existe = await this.prismaClient.residuo.findUnique({ where: { nome } });
        if (existe)
            return reply.status(409).send({ error: 'Resíduo já existe' });
        const isAdmin = role === 'ADMIN';
        const residuo = await this.prismaClient.residuo.create({
            data: {
                nome,
                cor,
                icone,
                status: isAdmin ? 'APROVADO' : 'PENDENTE',
                solicitado_por_id: isAdmin ? null : sub,
            },
        });
        return reply.status(201).send(residuo);
    }
    async update(req, reply) {
        const { id } = req.params;
        const { nome, cor, icone, status } = req.body;
        const residuo = await this.prismaClient.residuo.update({
            where: { id },
            data: { nome, cor, icone, status },
        });
        return reply.send(residuo);
    }
    async approve(req, reply) {
        const { id } = req.params;
        const residuo = await this.prismaClient.residuo.update({
            where: { id },
            data: { status: 'APROVADO' },
        });
        return reply.send(residuo);
    }
    async reject(req, reply) {
        const { id } = req.params;
        const residuo = await this.prismaClient.residuo.update({
            where: { id },
            data: { status: 'REJEITADO' },
        });
        return reply.send(residuo);
    }
    async remove(req, reply) {
        const { id } = req.params;
        await this.prismaClient.residuo.delete({ where: { id } });
        return reply.send({ ok: true });
    }
}
