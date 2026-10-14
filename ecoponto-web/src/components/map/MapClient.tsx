'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, X, Plus, Pencil } from 'lucide-react'

import { LocationRequiredModal } from '@/features/map/components/LocationRequiredModal'
import { MapPointProposalForm } from '@/features/map/components/MapPointProposalForm'
import { useMapPoints } from '@/features/map/hooks/useMapPoints'
import { reverseGeocodeLocation, searchRegion } from '@/features/map/regions'
import type { Ponto, PropostaPonto, PropostaPontoPendente } from '@/features/map/types'
import { SalvarPontoButton } from '@/features/ponto/components/SalvarPontoButton'
import { useSavedPoints } from '@/features/ponto/useSavedPoints'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs')
}

const DEFAULT_LAT = -20.648
const DEFAULT_LNG = -40.515

export default function MapClient() {
  const router = useRouter()
  const { user } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [selected, setSelected] = useState<Ponto | null>(null)
  const { savedPointIds, pendingPointIds, error: savedPointsError, toggleSavedPoint } = useSavedPoints(user)
  const { search, setSearch, filtros, toggleFiltro, pontos, residuoOpts, loading, refresh } = useMapPoints()
  const [addingPoint, setAddingPoint] = useState(false)
  const [proposalCoordinates, setProposalCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [editingPoint, setEditingPoint] = useState<Ponto | null>(null)
  const [myProposals, setMyProposals] = useState<PropostaPonto[]>([])
  const [communityProposals, setCommunityProposals] = useState<PropostaPontoPendente[]>([])
  const [pointProposals, setPointProposals] = useState<PropostaPontoPendente[]>([])
  const [proposalNotice, setProposalNotice] = useState('')
  const [userLoc, setUserLoc] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
  const [userLocGranted, setUserLocGranted] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<Array<{ label: string; city: string; state: string; lat: number; lng: number }>>([])
  const [selectedCity, setSelectedCity] = useState<{ city: string; state: string; lat: number; lng: number } | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const baseLocationApplied = useRef(false)

  useEffect(() => {
    if (baseLocationApplied.current) return
    if (!user?.cidade || !user?.estado || selectedCity) return

    baseLocationApplied.current = true
    let active = true
    searchRegion(`${user.cidade}, ${user.estado}`)
      .then((resultados) => {
        if (!active || resultados.length === 0) return
        const [primeiro] = resultados
        setSelectedCity({ city: primeiro.city, state: primeiro.state, lat: primeiro.lat, lng: primeiro.lng })
        setShowLocationPicker(false)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user, selectedCity])

  useEffect(() => {
    let active = true
    api.get<PropostaPontoPendente[]>('/pontos/propostas')
      .then((proposals) => {
        if (active) setCommunityProposals(proposals)
      })
      .catch((error: unknown) => console.error('Erro ao carregar novos pontos sugeridos:', error))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    api.get<PropostaPonto[]>('/pontos/propostas/minhas')
      .then((proposals) => {
        if (active) setMyProposals(proposals)
      })
      .catch((error: unknown) => console.error('Erro ao carregar suas propostas de ponto:', error))
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (!selected) return
    let active = true
    api.get<PropostaPontoPendente[]>(`/pontos/${selected.id}/propostas`)
      .then((proposals) => {
        if (active) setPointProposals(proposals)
      })
      .catch((error: unknown) => console.error('Erro ao carregar propostas do ponto:', error))
    return () => { active = false }
  }, [selected])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cityQuery.trim()) {
        setCitySuggestions([])
        return
      }

      searchRegion(cityQuery)
        .then(setCitySuggestions)
        .catch(() => setCitySuggestions([]))
    }, 300)

    return () => clearTimeout(timer)
  }, [cityQuery])

  const filteredPontos = useMemo(() => {
    if (!selectedCity) {
      return []
    }

    let list = pontos.filter((p) => p.cidade.toLowerCase().includes(selectedCity.city.toLowerCase()))

    if (userLocGranted) {
      list = list.filter((p) => {
        const distance = Math.hypot(p.lat - userLoc.lat, p.lng - userLoc.lng) * 111
        return distance <= 80
      })
    }

    return list
  }, [pontos, selectedCity, userLoc, userLocGranted])

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    mapInst.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [DEFAULT_LNG, DEFAULT_LAT],
      zoom: 12,
    })
    mapInst.current.addControl(new maplibregl.NavigationControl(), 'top-right')
  }, [])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      if (!addingPoint) return
      setProposalCoordinates({ lat: event.lngLat.lat, lng: event.lngLat.lng })
      setAddingPoint(false)
    }
    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [addingPoint])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    map.getCanvas().style.cursor = addingPoint ? 'crosshair' : ''
  }, [addingPoint])

  const requireLogin = () => {
    if (user) return true
    router.push(`/login?returnTo=${encodeURIComponent('/')}`)
    return false
  }

  const startAddingPoint = () => {
    if (!requireLogin()) return
    setSelected(null)
    setProposalNotice('')
    setAddingPoint(true)
  }

  const voteOnProposal = async (proposalId: string, aprova: boolean) => {
    try {
      await api.post(`/pontos/propostas/${proposalId}/votar`, { aprova })
      refresh()
      setCommunityProposals(await api.get<PropostaPontoPendente[]>('/pontos/propostas'))
      if (user) {
        const myUpdatedProposals = await api.get<PropostaPonto[]>('/pontos/propostas/minhas')
        setMyProposals(myUpdatedProposals)
      }
      if (selected) {
        setPointProposals(await api.get<PropostaPontoPendente[]>(`/pontos/${selected.id}/propostas`))
      }
    } catch (error) {
      console.error('Erro ao votar na proposta do ponto:', error)
      setProposalNotice(error instanceof Error ? error.message : 'Não foi possível registrar seu voto.')
    }
  }

  const handleProposalSubmitted = async () => {
    setProposalCoordinates(null)
    setEditingPoint(null)
    setProposalNotice('Sugestão enviada. Ela ficará visível para você e só será publicada após votação da comunidade.')
    refresh()
    try {
      setMyProposals(await api.get<PropostaPonto[]>('/pontos/propostas/minhas'))
      setCommunityProposals(await api.get<PropostaPontoPendente[]>('/pontos/propostas'))
    } catch (error) {
      console.error('Erro ao atualizar suas propostas de ponto:', error)
    }
  }

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    filteredPontos.forEach((p) => {
      const cor = p.residuos[0]?.residuo.cor ?? '#0D9858'
      const el = document.createElement('div')
      el.style.cssText = `width:26px;height:26px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer`
      el.addEventListener('click', (event) => {
        event.stopPropagation()
        setSelected(p)
      })
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
      markersRef.current.push(marker)
    })
  }, [filteredPontos])

  useEffect(() => {
    if (selected) mapInst.current?.flyTo({ center: [selected.lng, selected.lat], zoom: 15 })
  }, [selected])

  const navigate = (p: Ponto) => {
    const dest = `${p.lat},${p.lng}`

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => window.open(`https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${dest}`, '_blank'),
        () => window.open(`https://www.google.com/maps?q=${dest}`, '_blank')
      )
      return
    }

    window.open(`https://www.google.com/maps?q=${dest}`, '_blank')
  }

  const mainPoints = filteredPontos
  const mapLocked = !selectedCity && !userLocGranted
  const activeLocationLabel = selectedCity ? `Você está buscando em ${selectedCity.city}` : userLocGranted ? 'Você está usando sua localização atual' : 'Selecione uma cidade para buscar pontos'
  const shortLocationLabel = selectedCity ? selectedCity.city : userLocGranted ? 'Sua localização' : 'Selecionar cidade'
  const anyOverlayOpen = Boolean(proposalCoordinates || editingPoint || showLocationPicker || mapLocked)
  const hideFloatingControls = anyOverlayOpen || mobileMenuOpen

  const resetLocationState = () => {
    setSelectedCity(null)
    setUserLocGranted(false)
    setCityQuery('')
    setCitySuggestions([])
  }

  const handleUseMyLocation = () => {
    resetLocationState()
    setLocationError(null)
    setIsLocationLoading(true)

    if (!navigator.geolocation) {
      setLocationError('A geolocalização não está disponível neste navegador.')
      setShowLocationPicker(true)
      setIsLocationLoading(false)
      return
    }

    setShowLocationPicker(false)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nextLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLoc(nextLoc)
          setUserLocGranted(true)

          const cityInfo = await reverseGeocodeLocation(nextLoc.lat, nextLoc.lng)

          if (cityInfo) {
            setSelectedCity({ city: cityInfo.city, state: cityInfo.state, lat: cityInfo.lat, lng: cityInfo.lng })
            setLocationError(null)
          } else {
            setLocationError('Não foi possível identificar sua cidade automaticamente. Informe uma cidade manualmente.')
            setSelectedCity(null)
            setUserLocGranted(false)
          }
        } finally {
          setIsLocationLoading(false)
          setShowLocationPicker(false)
        }
      },
      (error) => {
        setUserLocGranted(false)
        setSelectedCity(null)
        setLocationError(
          error.code === 1
            ? 'A localização foi bloqueada. Você pode escolher uma cidade manualmente.'
            : 'A localização está desativada nas configurações do sistema.'
        )
        setShowLocationPicker(true)
        setIsLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = showLocationPicker || mapLocked || mobileMenuOpen ? 'hidden' : previousOverflow

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mapLocked, showLocationPicker, mobileMenuOpen])

  return (
    <div className="flex h-full w-full">
      <aside
        className={`${mobileMenuOpen ? 'fixed inset-0 z-40 flex' : 'hidden md:flex'} w-full md:static md:inset-auto md:z-auto md:w-80 shrink-0 flex-col bg-white border-r border-border overflow-hidden`}
      >
        <header className="p-4 border-b border-border">
          <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
            <span className="text-sm font-semibold text-fg">Buscar e filtrar</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar busca e filtros"
              className="text-fg-3 hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar bairro ou ponto..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-raised focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-fg-3" />
              </button>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase text-fg-3">Localização</span>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="text-[11px] text-accent hover:underline"
              >
                Ajustar
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                startAddingPoint()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B7A47]"
            >
              <Plus size={16} /> Sugerir novo ponto
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {residuoOpts.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleFiltro(r.id)}
                style={filtros.includes(r.id) ? { backgroundColor: r.cor, borderColor: r.cor, color: 'white' } : {}}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filtros.includes(r.id) ? '' : 'text-fg-3 border-border bg-white hover:bg-raised'
                }`}
              >
                {r.nome}
              </button>
            ))}
          </div>
        </header>

        <p className="px-4 py-2 text-xs text-fg-3 border-b border-border">
          {loading ? 'Buscando...' : `${mainPoints.length} pontos`}
        </p>
        <div className="flex-1 overflow-y-auto">
          {mainPoints.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelected(p)
                setMobileMenuOpen(false)
              }}
              className={`w-full text-left flex items-stretch border-b border-border hover:bg-raised transition-colors ${selected?.id === p.id ? 'bg-acc-bg' : ''}`}
            >
              <div className="w-1 shrink-0" style={{ backgroundColor: p.residuos[0]?.residuo.cor ?? '#0D9858' }} />
              <div className="px-3 py-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2E1A] truncate">{p.nome}</p>
                <p className="text-xs text-fg-3 truncate">{p.endereco}, {p.cidade}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.residuos.slice(0, 3).map((r) => (
                    <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: r.residuo.cor }}>
                      {r.residuo.nome.split('/')[0].trim()}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
          {!loading && mainPoints.length === 0 && (
            <div className="min-h-[200px] flex items-center justify-center px-4 py-8">
              <p className="text-sm text-fg-3 text-center">Nenhum ponto encontrado para a região atual.</p>
            </div>
          )}
          {user && myProposals.length > 0 && (
            <section className="border-t border-border bg-amber-50/60">
              <h2 className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-amber-800">Minhas sugestões</h2>
              {myProposals.map((proposal) => (
                <div key={proposal.id} className="border-t border-amber-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-fg">{proposal.dados.nome}</p>
                  <p className="mt-0.5 text-xs text-fg-3">
                    {proposal.tipo === 'CRIAR' ? 'Novo ponto' : `Edição de ${proposal.ponto?.nome ?? 'ponto'}`}
                    {' · '}
                    {proposal.status === 'PENDENTE' ? 'Aguardando votação' : proposal.status === 'APROVADA' ? 'Aprovada' : 'Não aprovada'}
                  </p>
                  <p className="mt-1 truncate text-xs text-fg-3">
                    {proposal.dados.endereco} · {proposal.dados.cidade}, {proposal.dados.estado}, {proposal.dados.pais}
                  </p>
                  {proposal.dados.descricao && <p className="mt-1 line-clamp-2 text-xs text-fg-3">{proposal.dados.descricao}</p>}
                  <p className="mt-1 text-[11px] text-fg-3">
                    {proposal.confirmacoes} aprovaram · {proposal.contestacoes} não aprovaram
                  </p>
                  {proposal.status === 'PENDENTE' && (
                    <p className="mt-1 text-[10px] text-amber-800">O mapa público só muda depois da aprovação.</p>
                  )}
                </div>
              ))}
            </section>
          )}
          {communityProposals.length > 0 && (
            <section className="border-t border-border bg-sky-50/60">
              <h2 className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-sky-800">Novos pontos sugeridos</h2>
              {communityProposals.map((proposal) => (
                <div key={proposal.id} className="border-t border-sky-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-fg">{proposal.dados.nome}</p>
                  <p className="mt-0.5 text-xs text-fg-3">
                    {proposal.dados.endereco} · {proposal.dados.cidade}, {proposal.dados.estado}, {proposal.dados.pais}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-3">Sugerido por {proposal.autor.nome}</p>
                  <p className="mt-1 text-[11px] text-fg-3">
                    {proposal.confirmacoes} aprovaram · {proposal.contestacoes} não aprovaram
                  </p>
                  {proposal.autor_id === user?.id ? (
                    <p className="mt-2 text-[11px] text-fg-3">Esta é sua sugestão; outras pessoas podem votar.</p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (requireLogin()) void voteOnProposal(proposal.id, true)
                        }}
                        className="flex-1 rounded bg-acc-bg px-2 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (requireLogin()) void voteOnProposal(proposal.id, false)
                        }}
                        className="flex-1 rounded bg-red-100 px-2 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-600 hover:text-white"
                      >
                        Não aprovar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </aside>

      <div className="flex-1 relative min-h-[500px]">
        {!hideFloatingControls && (
          <>
            <div className="absolute left-4 top-4 z-10 flex min-w-0 items-center gap-2">
              <div className="max-w-[140px] truncate rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs font-medium text-fg shadow-sm backdrop-blur-sm sm:max-w-none">
                <span className="sm:hidden">{shortLocationLabel}</span>
                <span className="hidden sm:inline">{activeLocationLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buscar e filtrar pontos"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/90 text-fg shadow-sm backdrop-blur-sm md:hidden"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={startAddingPoint}
              className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#0B7A47]"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Sugerir ponto</span><span className="sm:hidden">Adicionar</span>
            </button>
          </>
        )}

        <div ref={mapRef} className="w-full h-full min-h-[500px]" />
        {addingPoint && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-fg shadow-md">
            Clique no mapa para marcar a localização do novo ponto.
            <button type="button" onClick={() => setAddingPoint(false)} className="ml-2 text-accent underline">Cancelar</button>
          </div>
        )}

        {selected && !hideFloatingControls && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(24rem,calc(100%-2rem))] max-h-[70%] overflow-y-auto bg-white rounded-xl shadow-lg p-4 z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-semibold text-[#1A2E1A] truncate">{selected.nome}</p>
                <p className="text-xs text-fg-3">{selected.endereco}, {selected.cidade}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-fg-3 hover:text-[#1A2E1A] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!requireLogin()) return
                setProposalNotice('')
                setEditingPoint(selected)
              }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-fg-2 transition-colors hover:bg-raised"
            >
              <Pencil size={14} /> Sugerir edição deste ponto
            </button>
            {pointProposals.length > 0 && (
              <div className="mb-3 space-y-2 border-t border-border pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-fg-3">Edições aguardando votação</p>
                {pointProposals.map((proposal) => (
                  <div key={proposal.id} className="rounded-lg bg-amber-50 p-2.5">
                    <p className="text-xs font-semibold text-fg">{proposal.dados.nome} · {proposal.dados.endereco}</p>
                    <p className="mt-1 text-[10px] text-fg-3">Sugerido por {proposal.autor.nome}</p>
                    <p className="mt-1 text-[10px] text-fg-3">
                      {proposal.confirmacoes} aprovaram · {proposal.contestacoes} não aprovaram
                    </p>
                    {proposal.autor_id === user?.id ? (
                      <p className="mt-2 text-[10px] text-fg-3">Esta é sua sugestão; outras pessoas podem votar.</p>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (requireLogin()) void voteOnProposal(proposal.id, true)
                          }}
                          className="flex-1 rounded bg-acc-bg px-2 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (requireLogin()) void voteOnProposal(proposal.id, false)
                          }}
                          className="flex-1 rounded bg-red-100 px-2 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-600 hover:text-white"
                        >
                          Não aprovar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.residuos.map((r) => (
                <span key={r.id} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: r.residuo.cor }}>
                  {r.residuo.nome.split('/')[0].trim()}
                </span>
              ))}
            </div>
            {savedPointsError && <p role="alert" className="mb-2 text-xs text-red-700">{savedPointsError}</p>}
            <div className="flex gap-2">
              <Link
                href={`/ponto/${selected.id}`}
                className="flex-1 text-center text-sm bg-accent text-white py-2 rounded-lg hover:bg-[#0B7A47] transition-colors"
              >
                Ver detalhes
              </Link>
              <SalvarPontoButton
                compact
                saved={savedPointIds.has(selected.id)}
                loading={pendingPointIds.has(selected.id)}
                onClick={() => {
                  if (!user) {
                    router.push(`/login?returnTo=${encodeURIComponent(`/ponto/${selected.id}`)}`)
                    return
                  }
                  void toggleSavedPoint(selected.id)
                }}
              />
              <button
                onClick={() => navigate(selected)}
                className="px-3 py-2 border border-border rounded-lg text-fg-3 hover:bg-raised transition-colors"
                title="Como chegar"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {proposalNotice && (
          <div role="status" className="absolute bottom-4 left-1/2 z-20 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <span>{proposalNotice}</span>
              <button type="button" onClick={() => setProposalNotice('')} aria-label="Fechar aviso"><X size={16} /></button>
            </div>
          </div>
        )}

        {(proposalCoordinates || editingPoint) && (
          <MapPointProposalForm
            point={editingPoint ?? undefined}
            coordinates={proposalCoordinates ?? undefined}
            onCancel={() => {
              setProposalCoordinates(null)
              setEditingPoint(null)
            }}
            onSubmitted={() => void handleProposalSubmitted()}
          />
        )}

        {(showLocationPicker || mapLocked) && (
          <LocationRequiredModal
            cityQuery={cityQuery}
            citySuggestions={citySuggestions}
            locationError={locationError}
            isLocationLoading={isLocationLoading}
            onCityQueryChange={setCityQuery}
            onUseMyLocation={handleUseMyLocation}
            onSelectCity={(option) => {
              resetLocationState()
              setLocationError(null)
              setSelectedCity(option)
              setUserLocGranted(false)
              setShowLocationPicker(false)
            }}
          />
        )}

        {!hideFloatingControls && (
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="absolute left-4 bottom-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/90 text-fg shadow-lg backdrop-blur-sm transition hover:scale-[1.02]"
            aria-label="Ajustar localização"
          >
            <MapPin className="h-5 w-5 text-accent" />
          </button>
        )}

      </div>
    </div>
  )
}
