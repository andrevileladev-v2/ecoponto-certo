'use client'

import { useEffect, useRef, useState } from 'react'
import { normalizarTexto } from '@/features/location/ibge'

type ComboboxProps = {
  label: string
  value: string
  options: string[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  onSelect: (value: string) => void
}

const MAX_SUGESTOES = 50

export function Combobox({ label, value, options, placeholder, disabled, loading, onSelect }: ComboboxProps) {
  const [query, setQuery] = useState(value)
  const [confirmedValue, setConfirmedValue] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sincroniza se o valor do pai mudar externamente
  useEffect(() => {
    setConfirmedValue(value)
    setQuery(value)
  }, [value])

  function matches(option: string, term: string) {
    return normalizarTexto(option).includes(normalizarTexto(term))
  }

  function findExact(term: string, list: string[]) {
    return list.find((option) => normalizarTexto(option) === normalizarTexto(term))
  }

  const filtered = (query.trim() ? options.filter((option) => matches(option, query)) : options).slice(0, MAX_SUGESTOES)

  const latestRef = useRef({ query, options, value, onSelect })
  useEffect(() => {
    latestRef.current = { query, options, value, onSelect }
  })

  function confirmSelection() {
    const current = latestRef.current
    if (!current.query.trim()) {
      current.onSelect('')
      setOpen(false)
      return
    }

    const exact = findExact(current.query, current.options)
    if (exact) {
      setQuery(exact)
      setConfirmedValue(exact)
      current.onSelect(exact)
    } else {
      // Mantém o que o usuário digitou em vez de apagar
      const trimmed = current.query.trim()
      setQuery(trimmed)
      setConfirmedValue(trimmed)
      current.onSelect(trimmed)
    }
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        confirmSelection()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-xs font-semibold text-fg-2">
      {label}
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={loading ? 'Carregando...' : placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const val = event.target.value
          setQuery(val)
          setOpen(true)
          onSelect(val)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (filtered.length === 1) {
              setQuery(filtered[0])
              setConfirmedValue(filtered[0])
              onSelect(filtered[0])
              setOpen(false)
            } else {
              confirmSelection()
            }
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        className={`rounded-lg border px-3 py-2 text-sm font-normal text-fg outline-none focus:border-accent border-border ${
          disabled ? 'bg-raised text-fg-3' : 'bg-white'
        }`}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-xl">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  setQuery(option)
                  setConfirmedValue(option)
                  onSelect(option)
                  setOpen(false)
                }}
                onClick={() => {
                  setQuery(option)
                  setConfirmedValue(option)
                  onSelect(option)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm font-normal text-fg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
