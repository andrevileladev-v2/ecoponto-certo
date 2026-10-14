import { prisma } from '../../../lib/prisma.js';
import { StatsService } from '../application/stats.service.js';
export class StatsController {
    service;
    prismaClient;
    constructor(service = new StatsService(), prismaClient = prisma) {
        this.service = service;
        this.prismaClient = prismaClient;
    }
    async summary(_req, reply) {
        const byResiduo = await this.prismaClient.entrega.groupBy({
            by: ['residuo_id'],
            where: { unidade: 'kg' },
            _sum: { quantidade: true },
        });
        const residuos = this.service.buildResiduoStats(byResiduo);
        const mapped = await Promise.all(residuos.map(async (item) => {
            const r = await this.prismaClient.residuo.findUnique({ where: { id: item.residuo_id } });
            return { nome: r?.nome, cor: r?.cor, icone: r?.icone, total_kg: item.total_kg };
        }));
        const byUsuario = await this.prismaClient.entrega.groupBy({
            by: ['usuario_id'],
            where: { unidade: 'kg' },
            _sum: { quantidade: true },
            orderBy: { _sum: { quantidade: 'desc' } },
            take: 5,
        });
        const top_usuarios = await Promise.all(byUsuario.map(async (g) => {
            const u = await this.prismaClient.usuario.findUnique({ where: { id: g.usuario_id } });
            return { inicial: u?.nome?.[0] ?? '?', nome: u?.nome ?? 'Anônimo', total_kg: g._sum.quantidade ?? 0 };
        }));
        return reply.send({ residuos: mapped, top_usuarios });
    }
}
