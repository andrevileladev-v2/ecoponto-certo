'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from "maplibre-gl"
import 'maplibre-gl/dist/maplibre-gl.css'
import Link from 'next/link'
import { Search, MapPin, X } from 'lucide-react'

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs')
}

type ResiduoPonto = {
  id: string
  residuo_id: string
  status: string
  residuo: {
    id: string
    nome: string
    cor: string
    icone: string
  }
}

type Ponto = {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  lat: number
  lng: number
  status: string
  residuos: ResiduoPonto[]
}

type ResiduoOpt = {
  id: string
  nome: string
  cor: string
}

const DEFAULT_LAT = -20.6480
const DEFAULT_LNG = -40.5150

export default function MapClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [selected, setSelected] = useState<Ponto | null>(null)
  const [search, setSearch] = useState('')
  const [filtros, setFiltros] = useState<string[]>([])
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [residuoOpts, setResiduoOpts] = useState<ResiduoOpt[]>([])
  const [loading, setLoading] = useState(false)
  const [userLoc, setUserLoc] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
  const [userLocGranted, setUserLocGranted] = useState(false)

  // Get user location once
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  // Fetch residuo options for filter chips
  useEffect(() => {
    fetch('/api/residuos')
      .then(r => r.json())
      .then(data => setResiduoOpts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Fetch pontos with debounce when search/filters/location change
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (userLocGranted) {
        params.set('lat', String(userLoc.lat))
        params.set('lng', String(userLoc.lng))
        params.set('raio', '50')
      }
      if (search.trim()) params.set('q', search.trim())
      if (filtros.length) params.set('residuos', filtros.join(','))

      setLoading(true)
      fetch(`/api/pontos?${params}`)
        .then(r => r.json())
        .then(data => { setPontos(Array.isArray(data) ? data : []); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filtros, userLoc, userLocGranted])

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    mapInst.current = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [DEFAULT_LNG, DEFAULT_LAT],
      zoom: 12,
    })
    mapInst.current.addControl(new maplibregl.NavigationControl(), 'top-right')
  }, [])

  // Update markers when pontos change
  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    pontos.forEach(p => {
      const cor = p.residuos[0]?.residuo.cor ?? '#0D9858'
      const el = document.createElement('div')
      el.style.cssText = `width:26px;height:26px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer`
      el.addEventListener('click', () => setSelected(p))
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
      markersRef.current.push(marker)
    })
  }, [pontos])

  // Fly to selected ponto
  useEffect(() => {
    if (selected) mapInst.current?.flyTo({ center: [selected.lng, selected.lat], zoom: 15 })
  }, [selected])

  const toggleFiltro = (id: string) =>
    setFiltros(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const navigate = (p: Ponto) => {
    const dest = `${p.lat},${p.lng}`

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => window.open(`https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${dest}`, '_blank'),
        () => window.open(`https://www.google.com/maps?q=${dest}`, '_blank')
      )
      return
    }

    window.open(`https://www.google.com/maps?q=${dest}`, '_blank')
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 flex-col bg-white border-r border-[#D4DAD4] overflow-hidden hidden md:flex">
        <header className="p-4 border-b border-[#D4DAD4]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A9480]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar bairro ou ponto..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D4DAD4] text-sm bg-[#F7F8F7] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-[#7A9480]" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {residuoOpts.map(r => (
              <button
                key={r.id}
                onClick={() => toggleFiltro(r.id)}
                style={filtros.includes(r.id) ? { backgroundColor: r.cor, borderColor: r.cor, color: 'white' } : {}}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filtros.includes(r.id) ? '' : 'text-[#7A9480] border-[#D4DAD4] bg-white hover:bg-[#F7F8F7]'
                }`}
              >
                {r.nome}
              </button>
            ))}
          </div>
        </header>

        <p className="px-4 py-2 text-xs text-[#7A9480] border-b border-[#D4DAD4]">
          {loading ? 'Buscando...' : `${pontos.length} pontos`}
        </p>
        <div className="flex-1 overflow-y-auto">
          {pontos.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left flex items-stretch border-b border-[#D4DAD4] hover:bg-[#F7F8F7] transition-colors ${selected?.id === p.id ? 'bg-[#E8F5ED]' : ''}`}
            >
              <div className="w-1 shrink-0" style={{ backgroundColor: p.residuos[0]?.residuo.cor ?? '#0D9858' }} />
              <div className="px-3 py-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2E1A] truncate">{p.nome}</p>
                <p className="text-xs text-[#7A9480] truncate">{p.endereco}, {p.cidade}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.residuos.slice(0, 3).map(r => (
                    <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: r.residuo.cor }}>
                      {r.residuo.nome.split('/')[0].trim()}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
          {!loading && pontos.length === 0 && (
            <p className="text-sm text-[#7A9480] text-center py-8 px-4">Nenhum ponto encontrado.</p>
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg p-4 z-10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-semibold text-[#1A2E1A] truncate">{selected.nome}</p>
                <p className="text-xs text-[#7A9480]">{selected.endereco}, {selected.cidade}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#7A9480] hover:text-[#1A2E1A] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.residuos.map(r => (
                <span key={r.id} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: r.residuo.cor }}>
                  {r.residuo.nome.split('/')[0].trim()}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/ponto/${selected.id}`}
                className="flex-1 text-center text-sm bg-[#0D9858] text-white py-2 rounded-lg hover:bg-[#0B7A47] transition-colors"
              >
                Ver detalhes
              </Link>
              <button
                onClick={() => navigate(selected)}
                className="px-3 py-2 border border-[#D4DAD4] rounded-lg text-[#7A9480] hover:bg-[#F7F8F7] transition-colors"
                title="Como chegar"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
