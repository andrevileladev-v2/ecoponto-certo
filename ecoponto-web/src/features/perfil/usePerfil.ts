import { useEffect, useState } from 'react'

import { api } from '@/lib/api'
import type { Usuario } from '@/lib/auth'

import type { EntregaPerfil, PerfilStats, PontoSalvoPerfil } from './types'

export function usePerfilData(user: Usuario | null) {
  const [entregas, setEntregas] = useState<EntregaPerfil[]>([])
  const [salvos, setSalvos] = useState<PontoSalvoPerfil[]>([])
  const [stats, setStats] = useState<PerfilStats>({ entregas: 0, confirmacoes: 0, salvos: 0 })

  useEffect(() => {
    if (!user) return

    api.get<EntregaPerfil[]>('/entregas')
      .then((result) => {
        setEntregas(result)
        setStats((current) => ({ ...current, entregas: result.length }))
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar entregas do perfil:', error)
      })

    api.get<{ confirmacoes: number }>('/entregas/stats')
      .then(({ confirmacoes }) => {
        setStats((current) => ({ ...current, confirmacoes }))
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar confirmações do perfil:', error)
      })

    api.get<PontoSalvoPerfil[]>('/usuarios/me/salvos')
      .then((data) => {
        setSalvos(data)
        setStats((current) => ({ ...current, salvos: data.length }))
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar pontos salvos do perfil:', error)
      })
  }, [user])

  return { entregas, salvos, stats }
}
