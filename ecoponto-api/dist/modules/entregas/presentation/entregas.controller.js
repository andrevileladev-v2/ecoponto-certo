import { prisma } from '../../../lib/prisma.js';
import { EntregasService } from '../application/entregas.service.js';
export class EntregasController {
    service;
    prismaClient;
    constructor(service = new EntregasService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async list(req, reply) {
        const { sub } = req.user;
        const entregas = await this.prismaClient.entrega.findMany({
            where: { usuario_id: sub },
            include: {
                usuario: { select: { id: true, nome: true } },
                ponto: { select: { id: true, nome: true } },
                residuo: { select: { id: true, nome: true } },
            },
            orderBy: { criado_em: 'desc' },
        });
        return reply.send(entregas);
    }
    async stats(req, reply) {
        const { sub } = req.user;
        const confirmacoes = await this.prismaClient.confirmacaoAtividade.count({
            where: { usuario_id: sub },
        });
        return reply.send({ confirmacoes });
    }
    async create(req, reply) {
        const { sub } = req.user;
        const body = req.body;
        const items = body.items ?? (body.residuo_id
            ? [{ residuo_id: body.residuo_id, resultado: 'CONSEGUIU', quantidade: body.quantidade, unidade: body.unidade }]
            : []);
        const validation = this.service.validateCreate({ ponto_id: body.ponto_id, items });
        if (!validation.ok)
            return reply.status(400).send({ error: validation.error });
        const ponto = await this.prismaClient.ponto.findUnique({ where: { id: body.ponto_id } });
        if (!ponto)
            return reply.status(404).send({ error: 'Ponto não encontrado' });
        const requestedIds = [...new Set(items.flatMap((item) => item.residuo_id ? [item.residuo_id] : []))];
        if (requestedIds.length) {
            const found = await this.prismaClient.residuo.findMany({
                where: { id: { in: requestedIds } },
                select: { id: true },
            });
            if (found.length !== requestedIds.length) {
                return reply.status(404).send({ error: 'Um ou mais resíduos não foram encontrados' });
            }
        }
        const entregas = await this.prismaClient.$transaction(async (tx) => {
            const created = [];
            for (const item of items) {
                const residuo = item.residuo_id
                    ? await tx.residuo.findUnique({ where: { id: item.residuo_id } })
                    : await tx.residuo.upsert({
                        where: { nome: item.nome.trim() },
                        update: {},
                        create: {
                            nome: item.nome.trim(),
                            cor: '#0D9858',
                            status: 'PENDENTE',
                            solicitado_por_id: sub,
                        },
                    });
                if (!residuo)
                    throw new Error('Um ou mais resíduos não foram encontrados');
                const pontoResiduo = await tx.pontoResiduo.upsert({
                    where: { ponto_id_residuo_id: { ponto_id: body.ponto_id, residuo_id: residuo.id } },
                    update: {},
                    create: { ponto_id: body.ponto_id, residuo_id: residuo.id, status: 'PENDENTE' },
                });
                const aceita = item.resultado === 'CONSEGUIU';
                await tx.votoResiduo.upsert({
                    where: { ponto_residuo_id_usuario_id: { ponto_residuo_id: pontoResiduo.id, usuario_id: sub } },
                    update: { aceita },
                    create: { ponto_residuo_id: pontoResiduo.id, usuario_id: sub, aceita },
                });
                const votos = await tx.votoResiduo.groupBy({
                    by: ['aceita'],
                    where: { ponto_residuo_id: pontoResiduo.id },
                    _count: true,
                });
                const confirmacoes = votos.find((voto) => voto.aceita)?._count ?? 0;
                const contestacoes = votos.find((voto) => !voto.aceita)?._count ?? 0;
                const total = confirmacoes + contestacoes;
                await tx.pontoResiduo.update({
                    where: { id: pontoResiduo.id },
                    data: {
                        confirmacoes,
                        contestacoes,
                        status: total >= 3 ? (confirmacoes / total >= 0.7 ? 'CONFIRMADO' : 'CONTESTADO') : 'PENDENTE',
                    },
                });
                created.push(await tx.entrega.create({
                    data: {
                        usuario_id: sub,
                        ponto_id: body.ponto_id,
                        residuo_id: residuo.id,
                        resultado: item.resultado,
                        quantidade: item.quantidade,
                        unidade: item.unidade,
                        motivo: item.resultado === 'NAO_CONSEGUIU' ? item.motivo.trim() : null,
                    },
                    include: { residuo: { select: { id: true, nome: true } } },
                }));
            }
            const pontoFuncionando = !items.every((item) => item.resultado === 'NAO_CONSEGUIU' && item.motivo === 'O ponto estava fechado');
            await tx.confirmacaoAtividade.create({
                data: {
                    ponto_id: body.ponto_id,
                    usuario_id: sub,
                    funcionando: pontoFuncionando,
                    observacao: 'Relato de descarte da comunidade',
                },
            });
            const confirmacoesRecentes = await tx.confirmacaoAtividade.findMany({
                where: { ponto_id: body.ponto_id },
                orderBy: { criado_em: 'desc' },
                take: 10,
                select: { funcionando: true },
            });
            const relatosPositivos = confirmacoesRecentes.filter((confirmacao) => confirmacao.funcionando).length;
            await tx.ponto.update({
                where: { id: body.ponto_id },
                data: { confiabilidade: confirmacoesRecentes.length ? relatosPositivos / confirmacoesRecentes.length : 0 },
            });
            return created;
        });
        return reply.status(201).send(entregas);
    }
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { quantidade, unidade } = req.body;
        const entrega = await this.prismaClient.entrega.update({
            where: { id },
            data: {
                quantidade: quantidade !== undefined ? Number(quantidade) : undefined,
                unidade,
            },
        });
        return reply.send(entrega);
    }
}
