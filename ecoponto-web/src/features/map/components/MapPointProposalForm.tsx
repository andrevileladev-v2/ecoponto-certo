'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Search, X, AlertTriangle, Check, Loader2 } from 'lucide-react'

import { api } from '@/lib/api'
import { matchEstadoPorNome, matchMunicipio } from '@/features/location/ibge'
import { LocationFields } from '@/features/location/components/LocationFields'
import { fetchResiduoOptions } from '@/features/map/api'
import { HorarioEditor } from '@/features/map/components/HorarioEditor'
import { criarHorarioSemanaVazio, formatHorarioResumo, validarHorarios } from '@/features/map/horario'
import type { HorarioSemana, Ponto, ResiduoOpt } from '@/features/map/types'

const RESIDUO_STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: 'Confirmado pela comunidade',
  CONTESTADO: 'Contestado pela comunidade',
  PENDENTE: 'Em validação',
}

type MapPointProposalFormProps = {
  point?: Ponto
  coordinates?: { lat: number; lng: number }
  initialCity?: string
  initialState?: string
  onCancel: () => void
  onSubmitted: () => void
}

const DEFAULT_FALLBACK_LAT = -20.6708
const DEFAULT_FALLBACK_LNG = -40.4984

export function MapPointProposalForm({
  point,
  coordinates,
  initialCity = 'Guarapari',
  initialState = 'ES',
  onCancel,
  onSubmitted,
}: MapPointProposalFormProps) {
  const [form, setForm] = useState({
    nome: point?.nome ?? '',
    descricao: point?.descricao ?? '',
    endereco: point?.endereco ?? '',
    lat: String(point?.lat ?? coordinates?.lat ?? DEFAULT_FALLBACK_LAT),
    lng: String(point?.lng ?? coordinates?.lng ?? DEFAULT_FALLBACK_LNG),
    telefone: point?.telefone ?? '',
    site: point?.site ?? '',
  })

  const [estado, setEstado] = useState(point?.estado ?? initialState)
  const [cidade, setCidade] = useState(point?.cidade ?? initialCity)
  const [horarios, setHorarios] = useState<HorarioSemana>(point?.horarios ?? criarHorarioSemanaVazio())

  const [cepOuBusca, setCepOuBusca] = useState('')
  const [buscandoEndereco, setBuscandoEndereco] = useState(false)
  const [buscaMensagem, setBuscaMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const jaAceitos = point?.residuos ?? []
  const jaAceitosIds = new Set(jaAceitos.map((item) => item.residuo_id))
  const [residuoOpts, setResiduoOpts] = useState<ResiduoOpt[]>([])
  const [novosResiduoIds, setNovosResiduoIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchResiduoOptions().then(setResiduoOpts).catch(() => setResiduoOpts([]))
  }, [])

  function toggleResiduo(id: string) {
    setNovosResiduoIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Mini-mapa interativo
  const miniMapContainerRef = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  // Inicializa o mini-mapa com o marcador arrastável
  useEffect(() => {
    if (!miniMapContainerRef.current) return

    const initialLat = Number(form.lat) || DEFAULT_FALLBACK_LAT
    const initialLng = Number(form.lng) || DEFAULT_FALLBACK_LNG

    const map = new maplibregl.Map({
      container: miniMapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [initialLng, initialLat],
      zoom: 14,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    // Marcador com cor verde ecoponto e custom visual
    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0D9858;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    `
    el.innerHTML = '♻️'

    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLngLat()
      setForm((prev) => ({
        ...prev,
        lat: pos.lat.toFixed(6),
        lng: pos.lng.toFixed(6),
      }))
    })

    // Clique no mapa para posicionar o pino onde clicar
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      setForm((prev) => ({
        ...prev,
        lat: e.lngLat.lat.toFixed(6),
        lng: e.lngLat.lng.toFixed(6),
      }))
    })

    miniMapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      miniMapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Centraliza o mini-mapa quando as coordenadas mudam via busca de endereço
  const updateMapPosition = (lat: number, lng: number) => {
    if (miniMapRef.current && markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
      miniMapRef.current.flyTo({ center: [lng, lat], zoom: 16 })
    }
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }))
  }

  // Busca de endereço inteligente: CEP (ViaCEP) ou Rua/Bairro (Nominatim)
  async function buscarEnderecoAutomatico() {
    const query = cepOuBusca.trim()
    if (!query) return

    setBuscandoEndereco(true)
    setBuscaMensagem(null)
    setError('')

    try {
      const cleanCep = query.replace(/\D/g, '')

      // 1. Se for CEP (8 dígitos)
      if (cleanCep.length === 8) {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()

        if (data.erro) {
          setBuscaMensagem({ tipo: 'erro', texto: 'CEP não encontrado. Tente buscar pelo nome da rua.' })
          return
        }

        const enderecoCompleto = [data.logradouro, data.bairro].filter(Boolean).join(' - ')
        setForm((prev) => ({
          ...prev,
          endereco: prev.endereco ? prev.endereco : enderecoCompleto,
        }))

        // Casamento com cidades do IBGE
        const estadoObj = await matchEstadoPorNome(data.uf)
        if (estadoObj) {
          setEstado(estadoObj.sigla)
          const municipioObj = await matchMunicipio(estadoObj.sigla, data.localidade)
          if (municipioObj) setCidade(municipioObj.nome)
          else setCidade(data.localidade)
        }

        // Busca coordenadas exatas no Nominatim para o logradouro + cidade
        const searchQuery = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(searchQuery)}`
        const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'pt-BR' } })
        const nomData = await nomRes.json()

        if (nomData && nomData[0]) {
          const lat = Number(nomData[0].lat)
          const lng = Number(nomData[0].lon)
          updateMapPosition(lat, lng)
          setBuscaMensagem({ tipo: 'sucesso', texto: 'Endereço localizado no mapa! Ajuste o pino se necessário.' })
        } else {
          setBuscaMensagem({ tipo: 'sucesso', texto: 'CEP localizado. Ajuste o pino verde no mapa para o local exato.' })
        }
        return
      }

      // 2. Busca por texto livre (rua, avenida, bairro)
      const searchQuery = `${query}, ${cidade || ''}, ${estado || ''}, Brasil`
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=br&q=${encodeURIComponent(searchQuery)}`
      const nomRes = await fetch(nomUrl, { headers: { 'Accept-Language': 'pt-BR' } })
      const nomData = await nomRes.json()

      if (nomData && nomData[0]) {
        const item = nomData[0]
        const lat = Number(item.lat)
        const lng = Number(item.lon)
        updateMapPosition(lat, lng)

        if (!form.endereco) {
          setForm((prev) => ({ ...prev, endereco: query }))
        }

        const addr = item.address
        const detectedState = addr?.state
        const detectedCity = addr?.city || addr?.town || addr?.municipality

        if (detectedState) {
          const estadoObj = await matchEstadoPorNome(detectedState)
          if (estadoObj) {
            setEstado(estadoObj.sigla)
            if (detectedCity) {
              const municipioObj = await matchMunicipio(estadoObj.sigla, detectedCity)
              if (municipioObj) setCidade(municipioObj.nome)
            }
          }
        }

        setBuscaMensagem({ tipo: 'sucesso', texto: 'Endereço localizado! Você pode arrastar o ícone no mapa para afinar o local.' })
      } else {
        setBuscaMensagem({ tipo: 'erro', texto: 'Não encontramos esse endereço no mapa. Digite a cidade e posicione o pino no mapa.' })
      }
    } catch {
      setBuscaMensagem({ tipo: 'erro', texto: 'Erro ao buscar endereço. Você pode selecionar o local diretamente no mapa.' })
    } finally {
      setBuscandoEndereco(false)
    }
  }

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.nome.trim()) {
      setError('Informe o nome do ponto.')
      return
    }

    if (!form.endereco.trim()) {
      setError('Informe o endereço do ponto (rua, número ou referência).')
      return
    }

    if (!estado || !cidade) {
      setError('Selecione o estado e a cidade na lista.')
      return
    }

    const lat = Number(form.lat)
    const lng = Number(form.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Posicione o ícone no mapa para definir a localização do ponto.')
      return
    }

    const erroHorario = validarHorarios(horarios)
    if (erroHorario) {
      setError(erroHorario)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        estado,
        cidade,
        pais: 'Brasil',
        lat,
        lng,
        horarios,
        horario: formatHorarioResumo(horarios),
      }

      if (point?.id) {
        await api.put(`/pontos/${point.id}`, payload)
        await Promise.all(
          [...novosResiduoIds].map((residuo_id) => api.post(`/pontos/${point.id}/residuos`, { residuo_id })),
        )
      } else {
        await api.post('/pontos', { ...payload, residuo_ids: [...novosResiduoIds] })
      }

      onSubmitted()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível cadastrar o ponto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-border/80 max-h-[92vh] flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-fg">
              {point ? 'Editar ponto de coleta' : 'Adicionar novo ponto de coleta'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-fg-3">
              {point
                ? 'Sua proposta de edição passará por validação comunitária.'
                : 'O ponto aparecerá imediatamente no mapa público com recomendação em validação comunitária.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-fg-3 hover:text-fg hover:bg-raised transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Nome do Ponto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-fg-2 mb-1">
              Nome do ponto <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              placeholder="Ex: Ecoponto Central, Cooperativa Renascer, PEV Praça..."
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm font-normal text-fg outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Seção de Endereço com Busca Rápida / CEP */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-fg">1. Endereço e Cidade</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1">
                Busca rápida por CEP ou Rua (preenche e localiza no mapa)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cepOuBusca}
                  onChange={(e) => setCepOuBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void buscarEnderecoAutomatico()
                    }
                  }}
                  placeholder="Digite o CEP (ex: 29200-340) ou Rua e Bairro..."
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => void buscarEnderecoAutomatico()}
                  disabled={buscandoEndereco || !cepOuBusca.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0b8048] disabled:opacity-60 transition-colors"
                >
                  {buscandoEndereco ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Localizar
                </button>
              </div>

              {buscaMensagem && (
                <p className={`mt-2 text-xs flex items-center gap-1.5 ${buscaMensagem.tipo === 'sucesso' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {buscaMensagem.tipo === 'sucesso' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {buscaMensagem.texto}
                </p>
              )}
            </div>

            {/* Endereço detalhado */}
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1">
                Endereço completo (Rua, Número, Bairro) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.endereco}
                onChange={(e) => setField('endereco', e.target.value)}
                placeholder="Ex: Av. Dr. Roberto Calmon, 140 - Centro"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </div>

            {/* Seleção de Cidade e Estado (IBGE) */}
            <div>
              <LocationFields
                estado={estado}
                cidade={cidade}
                onChange={(next) => {
                  setEstado(next.estado)
                  setCidade(next.cidade)
                }}
              />
            </div>
          </div>

          {/* Seção 2: Posicionamento do Ícone no Mapa */}
          <div className="rounded-xl border border-border p-4 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-fg">2. Posicione o ícone no mapa</h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
              </span>
            </div>
            <p className="text-xs text-fg-3">
              Arraste o ícone ♻️ no mapa abaixo ou dê um clique para marcar com exatidão a entrada ou calçada do ecoponto.
            </p>

            <div
              ref={miniMapContainerRef}
              className="w-full h-52 sm:h-60 rounded-xl overflow-hidden border border-border shadow-inner relative"
            />
          </div>

          {/* Horários */}
          <div className="border-t border-border pt-4">
            <HorarioEditor value={horarios} onChange={setHorarios} />
          </div>

          {/* Tipos de resíduo aceitos */}
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-fg">Tipos de resíduo aceitos</h3>
            <p className="text-xs text-fg-3">
              Cada material entra em validação separada: quanto mais pessoas confirmarem que
              conseguiram entregar aquele item ali, maior a confiança. Itens que ninguém confirmou
              ou que foram marcados como &quot;não aceito&quot; ficam com confiança baixa.
            </p>

            {jaAceitos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {jaAceitos.map((item) => (
                  <span
                    key={item.id}
                    title={RESIDUO_STATUS_LABEL[item.status] ?? item.status}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-raised px-2.5 py-1 text-xs font-medium text-fg-2"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.residuo.cor }} />
                    {item.residuo.nome}
                    <span className="text-[10px] text-fg-3">
                      · {RESIDUO_STATUS_LABEL[item.status] ?? item.status}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {residuoOpts
                .filter((opt) => !jaAceitosIds.has(opt.id))
                .map((opt) => {
                  const selecionado = novosResiduoIds.has(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleResiduo(opt.id)}
                      aria-pressed={selecionado}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        selecionado
                          ? 'border-accent bg-acc-bg text-accent'
                          : 'border-border text-fg-2 hover:bg-raised'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.cor }} />
                      {opt.nome}
                    </button>
                  )
                })}
            </div>
            {jaAceitos.length === 0 && novosResiduoIds.size === 0 && (
              <p className="text-[11px] text-amber-700">
                Nenhum tipo selecionado ainda. Marque o que esse ponto aceita — a comunidade confirma depois.
              </p>
            )}
          </div>

          {/* Informações adicionais (Telefone, Site, Descrição) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-4">
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              Telefone (opcional)
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setField('telefone', e.target.value)}
                placeholder="(27) 99999-9999"
                className="rounded-lg border border-border px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              Site / Link (opcional)
              <input
                type="url"
                value={form.site}
                onChange={(e) => setField('site', e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-border px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2 sm:col-span-2">
              Descrição ou Dicas de acesso (opcional)
              <textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setField('descricao', e.target.value)}
                placeholder="Ex: Fica nos fundos do estacionamento, ao lado dos containers amarelos..."
                className="resize-y rounded-lg border border-border px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="py-2.5 px-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Rodapé e Ações */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
            <span>⚠️</span>
            <span>Entrará com recomendação em validação</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-initial rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg-2 hover:bg-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-initial rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b8048] disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? 'Publicando...' : 'Publicar ponto no mapa'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
