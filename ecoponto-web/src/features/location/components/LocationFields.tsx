'use client'

import { useEffect, useState } from 'react'

import { Combobox } from './Combobox'
import { fetchEstados, fetchMunicipios, type Estado } from '@/features/location/ibge'

type LocationFieldsProps = {
  estado: string
  cidade: string
  onChange: (next: { estado: string; cidade: string }) => void
  disabled?: boolean
}

function formatEstadoLabel(estado: Estado) {
  return `${estado.nome} (${estado.sigla})`
}

export function LocationFields({ estado, cidade, onChange, disabled }: LocationFieldsProps) {
  const [estados, setEstados] = useState<Estado[]>([])
  const [municipios, setMunicipios] = useState<string[]>([])
  const [municipiosEstado, setMunicipiosEstado] = useState<string | null>(null)
  const [loadingEstados, setLoadingEstados] = useState(true)
  const [erro, setErro] = useState('')

  const loadingMunicipios = Boolean(estado) && estado !== municipiosEstado

  useEffect(() => {
    fetchEstados()
      .then(setEstados)
      .catch(() => setErro('Não foi possível carregar a lista de estados.'))
      .finally(() => setLoadingEstados(false))
  }, [])

  useEffect(() => {
    if (!estado) return

    let active = true
    fetchMunicipios(estado)
      .then((lista) => {
        if (!active) return
        setMunicipios(lista.map((municipio) => municipio.nome))
        setMunicipiosEstado(estado)
      })
      .catch(() => {
        if (active) setErro('Não foi possível carregar a lista de cidades.')
      })

    return () => {
      active = false
    }
  }, [estado])

  const estadoAtual = estados.find((item) => item.sigla === estado)
  const estadoLabel = estadoAtual ? formatEstadoLabel(estadoAtual) : ''
  const estadoOptions = estados.map(formatEstadoLabel)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-semibold text-fg-2">
        País
        <select
          disabled
          value="Brasil"
          className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm font-normal text-fg-3"
        >
          <option value="Brasil">Brasil</option>
        </select>
      </label>

      <Combobox
        label="Estado"
        value={estadoLabel}
        options={estadoOptions}
        placeholder="Digite o estado"
        disabled={disabled || loadingEstados}
        loading={loadingEstados}
        onSelect={(label) => {
          const selected = estados.find((item) => formatEstadoLabel(item) === label)
          if (!selected) return
          onChange({ estado: selected.sigla, cidade: '' })
        }}
      />

      <div className="sm:col-span-2">
        <Combobox
          label="Cidade"
          value={cidade}
          options={estado ? municipios : []}
          placeholder={estado ? 'Digite a cidade' : 'Selecione o estado primeiro'}
          disabled={disabled || !estado || loadingMunicipios}
          loading={loadingMunicipios}
          onSelect={(nome) => onChange({ estado, cidade: nome })}
        />
      </div>

      {erro && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{erro}</p>}
    </div>
  )
}
