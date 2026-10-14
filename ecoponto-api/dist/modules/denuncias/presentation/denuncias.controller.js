import { prisma } from '../../../lib/prisma.js';
import { DenunciasService } from '../application/denuncias.service.js';
export class DenunciasController {
    service;
    prismaClient;
    constructor(service = new DenunciasService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async create(req, reply) {
        const { sub } = req.user;
        const { tipo, descricao, alvo_usuario_id, alvo_mensagem_id, alvo_ponto_id } = req.body;
        const validation = this.service.validateCreate({ tipo, alvo_usuario_id, alvo_mensagem_id, alvo_ponto_id });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const denuncia = await this.prismaClient.denuncia.create({
            data: {
                tipo,
                descricao,
                denunciante_id: sub,
                alvo_usuario_id,
                alvo_mensagem_id,
                alvo_ponto_id,
            },
        });
        return reply.status(201).send(denuncia);
    }
    async list(req, reply) {
        const { status, limit, offset } = req.query;
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
        ]);
        return reply.send({ total, data: denuncias });
    }
    async resolve(req, reply) {
        const { id } = req.params;
        const { status } = req.body;
        const denuncia = await this.prismaClient.denuncia.update({
            where: { id },
            data: {
                status,
                resolvido_em: status !== 'PENDENTE' ? new Date() : null,
            },
        });
        return reply.send(denuncia);
    }
}
