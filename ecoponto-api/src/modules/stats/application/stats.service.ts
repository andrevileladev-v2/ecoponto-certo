export class StatsService {
  buildDateFilter(period: 'month' | 'year' | 'all', now = new Date()) {
    if (period === 'all') return undefined

    const start = period === 'year'
      ? new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { gte: start, lte: now }
  }

  buildResiduoStats(groupBy: Array<{ residuo_id: string; _sum: { quantidade: number | null } }>) {
    return groupBy
      .map((item) => ({
        residuo_id: item.residuo_id,
        total_kg: item._sum.quantidade ?? 0,
      }))
      .sort((a, b) => b.total_kg - a.total_kg)
  }
}
