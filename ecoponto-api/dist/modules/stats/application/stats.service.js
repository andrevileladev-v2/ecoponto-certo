export class StatsService {
    buildResiduoStats(groupBy) {
        return groupBy
            .map((item) => ({
            residuo_id: item.residuo_id,
            total_kg: item._sum.quantidade ?? 0,
        }))
            .sort((a, b) => b.total_kg - a.total_kg);
    }
}
