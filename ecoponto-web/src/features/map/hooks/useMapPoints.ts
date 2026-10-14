import { useCallback, useEffect, useState } from 'react'
import { fetchPontos, fetchResiduoOptions } from '../api'
import type { Ponto, ResiduoOpt } from '../types'

export function useMapPoints() {
  const [search, setSearchValue] = useState('')
  const [filtros, setFiltros] = useState<string[]>([])
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [residuoOpts, setResiduoOpts] = useState<ResiduoOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    fetchResiduoOptions()
      .then(setResiduoOpts)
      .catch(() => setResiduoOpts([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (filtros.length) params.set('residuos', filtros.join(','))

    fetchPontos(params)
      .then(setPontos)
      .catch(() => setPontos([]))
      .finally(() => setLoading(false))
  }, [search, filtros, refreshVersion])

  const toggleFiltro = (id: string) => {
    setLoading(true)
    setFiltros((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const setSearch = useCallback((value: string) => {
    setLoading(true)
    setSearchValue(value)
  }, [])
  const refresh = useCallback(() => {
    setLoading(true)
    setRefreshVersion((version) => version + 1)
  }, [])

  return { search, setSearch, filtros, toggleFiltro, pontos, residuoOpts, loading, refresh }
}
