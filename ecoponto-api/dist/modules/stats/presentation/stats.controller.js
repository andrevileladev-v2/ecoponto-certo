import { prisma } from '../../../lib/prisma.js';
import { StatsService } from '../application/stats.service.js';
export class StatsController {
    service;
    prismaClient;
    constructor(service = new StatsService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async summary(req, reply) {
        const query = req.query;
        const period = query.period ?? 'month';
        if (!['month', 'year', 'all'].includes(period)) {
            return reply.status(400).send({ error: 'Período inválido' });
        }
        const pontoWhere = {
            ...(query.pais ? { pais: query.pais } : {}),
            ...(query.estado ? { estado: query.estado } : {}),
            ...(query.cidade ? { cidade: query.cidade } : {}),
            ...(query.pontoId ? { id: query.pontoId } : {}),
        };
        if (query.pontoId) {
            const ponto = await this.prismaClient.ponto.findUnique({
                where: { id: query.pontoId },
                select: { id: true },
            });
            if (!ponto)
                return reply.status(404).send({ error: 'Ponto não encontrado' });
        }
        const createdAt = this.service.buildDateFilter(period);
        const deliveryWhere = {
            resultado: 'CONSEGUIU',
            criado_em: createdAt,
            ponto: pontoWhere,
        };
        const kgDeliveryWhere = {
            ...deliveryWhere,
            unidade: 'kg',
            quantidade: { not: null },
        };
        const byResiduo = await this.prismaClient.entrega.groupBy({
            by: ['residuo_id'],
            where: kgDeliveryWhere,
            _sum: { quantidade: true },
        });
        const residuos = this.service.buildResiduoStats(byResiduo);
        const residueDetails = residuos.length
            ? await this.prismaClient.residuo.findMany({
                where: { id: { in: residuos.map((item) => item.residuo_id) } },
                select: { id: true, nome: true, cor: true, icone: true },
            })
            : [];
        const residueById = new Map(residueDetails.map((residuo) => [residuo.id, residuo]));
        const mapped = residuos.flatMap((item) => {
            const residuo = residueById.get(item.residuo_id);
            return residuo ? [{ ...residuo, total_kg: item.total_kg }] : [];
        });
        const byUsuario = await this.prismaClient.entrega.groupBy({
            by: ['usuario_id'],
            where: {
                ...kgDeliveryWhere,
                usuario: { mostrar_no_dashboard: true },
            },
            _sum: { quantidade: true },
            orderBy: { _sum: { quantidade: 'desc' } },
            take: 5,
        });
        const contributors = byUsuario.length
            ? await this.prismaClient.usuario.findMany({
                where: { id: { in: byUsuario.map((item) => item.usuario_id) } },
                select: { id: true, nome: true },
            })
            : [];
        const contributorById = new Map(contributors.map((usuario) => [usuario.id, usuario]));
        const top_usuarios = byUsuario.flatMap((item) => {
            const usuario = contributorById.get(item.usuario_id);
            if (!usuario)
                return [];
            const [firstName = 'U', secondName = ''] = usuario.nome.trim().split(/\s+/);
            const displayName = secondName ? `${firstName} ${secondName[0]}.` : firstName;
            return [{
                    inicial: firstName[0]?.toUpperCase() ?? 'U',
                    nome: displayName,
                    total_kg: item._sum.quantidade ?? 0,
                }];
        });
        const [totalKg, deliveries, activeContributors, allPoints, scopedPoints] = await Promise.all([
            this.prismaClient.entrega.aggregate({
                where: kgDeliveryWhere,
                _sum: { quantidade: true },
            }),
            this.prismaClient.entrega.count({ where: deliveryWhere }),
            this.prismaClient.usuario.count({ where: { entregas: { some: deliveryWhere } } }),
            this.prismaClient.ponto.findMany({
                select: { id: true, nome: true, cidade: true, estado: true, pais: true },
                orderBy: [{ pais: 'asc' }, { estado: 'asc' }, { cidade: 'asc' }, { nome: 'asc' }],
            }),
            this.prismaClient.ponto.findMany({
                where: pontoWhere,
                select: { status: true, confiabilidade: true },
            }),
        ]);
        const locations = allPoints.map(({ id, nome, cidade, estado, pais }) => ({ id, nome, cidade, estado, pais }));
        return reply.send({
            periodo: period,
            escopo: {
                pais: query.pais ?? null,
                estado: query.estado ?? null,
                cidade: query.cidade ?? null,
                pontoId: query.pontoId ?? null,
            },
            locais: locations,
            resumo: {
                total_kg: totalKg._sum.quantidade ?? 0,
                entregas: deliveries,
                usuarios_ativos: activeContributors,
            },
            pontos: {
                total: scopedPoints.length,
                confiaveis: scopedPoints.filter((ponto) => ponto.status === 'ATIVO' && ponto.confiabilidade >= 0.7).length,
                verificar: scopedPoints.filter((ponto) => ponto.status === 'ATIVO' && ponto.confiabilidade >= 0.4 && ponto.confiabilidade < 0.7).length,
                inativos: scopedPoints.filter((ponto) => ponto.status !== 'ATIVO' || ponto.confiabilidade < 0.4).length,
            },
            residuos: mapped,
            top_usuarios,
        });
    }
}
