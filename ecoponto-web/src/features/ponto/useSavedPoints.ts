'use client'

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api'
import type { Usuario } from '@/lib/auth'

type SavedPoint = { id: string }
const EMPTY_IDS = new Set<string>()

export function useSavedPoints(user: Usuario | null) {
  const [savedPoints, setSavedPoints] = useState<{ userId: string; ids: Set<string> } | null>(null)
  const [pendingPointIds, setPendingPointIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<{ userId: string; message: string } | null>(null)
  const userId = user?.id

  useEffect(() => {
    let active = true

    if (!userId) return () => { active = false }

    api.get<SavedPoint[]>('/usuarios/me/salvos')
      .then((points) => {
        if (!active) return
        setSavedPoints({ userId, ids: new Set(points.map((point) => point.id)) })
        setError(null)
      })
      .catch((loadError: unknown) => {
        console.error('Erro ao carregar pontos salvos:', loadError)
        if (active) setError({ userId, message: 'Não foi possível carregar seus pontos salvos.' })
      })

    return () => {
      active = false
    }
  }, [userId])

  const toggleSavedPoint = useCallback(async (pointId: string) => {
    if (!userId || pendingPointIds.has(pointId)) return

    const currentSavedIds = savedPoints?.userId === userId ? savedPoints.ids : EMPTY_IDS
    const wasSaved = currentSavedIds.has(pointId)
    setError(null)
    setPendingPointIds((current) => new Set(current).add(pointId))

    try {
      if (wasSaved) {
        await api.delete(`/pontos/${pointId}/salvar`)
      } else {
        await api.post(`/pontos/${pointId}/salvar`, {})
      }

      setSavedPoints((current) => {
        const next = current?.userId === userId ? new Set(current.ids) : new Set<string>()
        if (wasSaved) next.delete(pointId)
        else next.add(pointId)
        return { userId, ids: next }
      })
    } catch (toggleError: unknown) {
      console.error('Erro ao atualizar ponto salvo:', toggleError)
      setError({
        userId,
        message: wasSaved
          ? 'Não foi possível remover o ponto dos salvos.'
          : 'Não foi possível salvar o ponto.',
      })
    } finally {
      setPendingPointIds((current) => {
        const next = new Set(current)
        next.delete(pointId)
        return next
      })
    }
  }, [pendingPointIds, savedPoints, userId])

  return {
    savedPointIds: userId && savedPoints?.userId === userId ? savedPoints.ids : EMPTY_IDS,
    pendingPointIds,
    error: userId && error?.userId === userId ? error.message : '',
    toggleSavedPoint,
  }
}
