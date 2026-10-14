'use client'

import { FormEvent, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { matchEstadoPorNome, matchMunicipio } from '@/features/location/ibge'
import { LocationFields } from '@/features/location/components/LocationFields'
import { HorarioEditor } from '@/features/map/components/HorarioEditor'
import { criarHorarioSemanaVazio, formatHorarioResumo, validarHorarios } from '@/features/map/horario'
import { reverseGeocodeLocation } from '@/features/map/regions'
import type { HorarioSemana, Ponto } from '@/features/map/types'

type MapPointProposalFormProps = {
  point?: Ponto
  coordinates?: { lat: number; lng: number }
  onCancel: () => void
  onSubmitted: () => void
}

export function MapPointProposalForm({ point, coordinates, onCancel, onSubmitted }: MapPointProposalFormProps) {
  const [form, setForm] = useState({
    nome: point?.nome ?? '',
    descricao: point?.descricao ?? '',
    endereco: point?.endereco ?? '',
    lat: String(point?.lat ?? coordinates?.lat ?? ''),
    lng: String(point?.lng ?? coordinates?.lng ?? ''),
    telefone: point?.telefone ?? '',
    site: point?.site ?? '',
  })
  const [estado, setEstado] = useState(point?.estado ?? '')
  const [cidade, setCidade] = useState(point?.cidade ?? '')
  const [horarios, setHorarios] = useState<HorarioSemana>(point?.horarios ?? criarHorarioSemanaVazio())
  const [localizacaoAviso, setLocalizacaoAviso] = useState('')
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(() => Boolean(!point && coordinates))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (point || !coordinates) return

    let active = true

    reverseGeocodeLocation(coordinates.lat, coordinates.lng)
      .then(async (resultado) => {
        if (!active || !resultado) {
          if (active) setLocalizacaoAviso('Não foi possível identificar automaticamente; selecione manualmente.')
          return
        }

        const estadoEncontrado = await matchEstadoPorNome(resultado.state)
        if (!estadoEncontrado) {
          if (active) setLocalizacaoAviso('Não foi possível identificar automaticamente; selecione manualmente.')
          return
        }

        const municipioEncontrado = await matchMunicipio(estadoEncontrado.sigla, resultado.city)
        if (!active) return

        setEstado(estadoEncontrado.sigla)
        setCidade(municipioEncontrado?.nome ?? '')
        if (!municipioEncontrado) {
          setLocalizacaoAviso('Estado identificado automaticamente; selecione a cidade manualmente.')
        }
      })
      .catch(() => {
        if (active) setLocalizacaoAviso('Não foi possível identificar automaticamente; selecione manualmente.')
      })
      .finally(() => {
        if (active) setBuscandoLocalizacao(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates?.lat, coordinates?.lng])

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!estado || !cidade) {
      setError('Selecione o estado e a cidade a partir da lista.')
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
        lat: Number(form.lat),
        lng: Number(form.lng),
        horarios,
        horario: formatHorarioResumo(horarios),
      }
      if (point?.id) {
        await api.put(`/pontos/${point.id}`, payload)
      } else {
        await api.post('/pontos', payload)
      }
      onSubmitted()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar a sugestão.')
    } finally {
      setSaving(false)
    }
  }

  const fields: Array<{ name: keyof typeof form; label: string; required?: boolean; type?: string }> = [
    { name: 'nome', label: 'Nome do ponto', required: true },
    { name: 'endereco', label: 'Endereço', required: true },
    { name: 'lat', label: 'Latitude', required: true, type: 'number' },
    { name: 'lng', label: 'Longitude', required: true, type: 'number' },
    { name: 'telefone', label: 'Telefone' },
    { name: 'site', label: 'Site', type: 'url' },
  ]

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <form onSubmit={submit} className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-fg">{point ? 'Sugerir edição do ponto' : 'Sugerir novo ponto'}</h2>
        <p className="mt-1 text-sm text-fg-3">
          {point
            ? 'Sua proposta fica visível para você. Os dados públicos só mudam após a aprovação da comunidade.'
            : 'O ponto só será publicado no mapa depois de aprovado pela comunidade.'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(({ name, label, required, type }) => (
            <label key={name} className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
              {label}
              <input
                required={required}
                type={type ?? 'text'}
                step={type === 'number' ? 'any' : undefined}
                value={form[name]}
                onChange={(event) => setField(name, event.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm font-normal text-fg outline-none focus:border-accent"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2 sm:col-span-2">
            Descrição
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(event) => setField('descricao', event.target.value)}
              className="resize-y rounded-lg border border-border px-3 py-2 text-sm font-normal text-fg outline-none focus:border-accent"
            />
          </label>
        </div>

        <div className="mt-4">
          {buscandoLocalizacao && <p className="mb-2 text-xs text-fg-3">Identificando cidade e estado a partir do mapa...</p>}
          {localizacaoAviso && <p className="mb-2 text-xs text-amber-700">{localizacaoAviso}</p>}
          <LocationFields estado={estado} cidade={cidade} onChange={(next) => { setEstado(next.estado); setCidade(next.cidade) }} />
        </div>

        <div className="mt-4">
          <HorarioEditor value={horarios} onChange={setHorarios} />
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg-2">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Enviando...' : 'Enviar para votação'}
          </button>
        </div>
      </form>
    </div>
  )
}
