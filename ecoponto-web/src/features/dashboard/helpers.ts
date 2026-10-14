import type { StatsData } from '@/features/dashboard/types'

export function buildDashboardItems(stats: StatsData | null) {
  const residuos = stats?.residuos ?? []
  const topUsuarios = stats?.top_usuarios ?? []
  const maxKg = residuos.length > 0 ? Math.max(...residuos.map((item) => item.total_kg)) : 1

  return {
    residuos,
    topUsuarios,
    progressItems: residuos.map((residuo) => ({
      name: residuo.nome,
      value: residuo.total_kg,
      color: residuo.cor ?? '#2563EB',
      maxValue: maxKg,
      valueLabel: `${residuo.total_kg.toLocaleString('pt-BR')} kg`,
    })),
    contributorItems: topUsuarios.map((usuario, index) => ({
      position: index + 1,
      initial: usuario.inicial,
      name: usuario.nome,
      value: usuario.total_kg,
      valueLabel: `${usuario.total_kg.toLocaleString('pt-BR')} kg`,
    })),
  }
}
