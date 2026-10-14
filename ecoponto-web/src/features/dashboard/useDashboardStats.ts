'use client'

import { useEffect, useState } from 'react'

import { api } from '@/lib/api'
import type { StatsData } from '@/features/dashboard/types'

export type DashboardFilters = {
  period: 'month' | 'year' | 'all'
  pais?: string
  estado?: string
  cidade?: string
  pontoId?: string
}

export function useDashboardStats(filters: DashboardFilters) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ period: filters.period })
        if (filters.pais) params.set('pais', filters.pais)
        if (filters.estado) params.set('estado', filters.estado)
        if (filters.cidade) params.set('cidade', filters.cidade)
        if (filters.pontoId) params.set('pontoId', filters.pontoId)
        const data = await api.get<StatsData>(`/stats?${params.toString()}`)
        if (active) setStats(data)
      } catch (error) {
        console.error('Erro ao carregar dashboard', error)
        if (active) setStats(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [filters.period, filters.pais, filters.estado, filters.cidade, filters.pontoId])

  return { stats, loading }
}
