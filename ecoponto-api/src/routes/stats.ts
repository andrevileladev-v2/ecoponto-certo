import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function statsRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    const byResiduo = await prisma.entrega.groupBy({
      by: ['residuo_id'],
      where: { unidade: 'kg' },
      _sum: { quantidade: true },
    })

    const residuos = await Promise.all(
      byResiduo.map(async (g) => {
        const r = await prisma.residuo.findUnique({ where: { id: g.residuo_id } })
        return { nome: r?.nome, cor: r?.cor, icone: r?.icone, total_kg: g._sum.quantidade ?? 0 }
      })
    )
    residuos.sort((a, b) => b.total_kg - a.total_kg)

    const byUsuario = await prisma.entrega.groupBy({
      by: ['usuario_id'],
      where: { unidade: 'kg' },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    })

    const top_usuarios = await Promise.all(
      byUsuario.map(async (g) => {
        const u = await prisma.usuario.findUnique({ where: { id: g.usuario_id } })
        return { inicial: u?.nome?.[0] ?? '?', nome: u?.nome ?? 'Anônimo', total_kg: g._sum.quantidade ?? 0 }
      })
    )

    return reply.send({ residuos, top_usuarios })
  })
}
