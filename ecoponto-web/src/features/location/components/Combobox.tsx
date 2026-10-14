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

  if (value !== confirmedValue) {
    setConfirmedValue(value)
    setQuery(value)
  }

  function matches(option: string, term: string) {
    return normalizarTexto(option).includes(normalizarTexto(term))
  }

  function findExact(term: string, list: string[]) {
    return list.find((option) => normalizarTexto(option) === normalizarTexto(term))
  }

  const filtered = (query.trim() ? options.filter((option) => matches(option, query)) : options).slice(0, MAX_SUGESTOES)
  const invalid = query.trim() !== '' && !findExact(query, options) && !open

  // Read via ref inside the document listener below so it always sees the latest
  // query/options/value, instead of a stale closure from whenever the listener was attached.
  const latestRef = useRef({ query, options, value, onSelect })
  useEffect(() => {
    latestRef.current = { query, options, value, onSelect }
  })

  function confirmSelection() {
    const current = latestRef.current
    const exact = findExact(current.query, current.options)
    if (exact) {
      setQuery(exact)
      current.onSelect(exact)
    } else {
      setQuery(current.value)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          setQuery(event.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (filtered.length === 1) {
              setQuery(filtered[0])
              onSelect(filtered[0])
              setOpen(false)
            } else {
              confirmSelection()
            }
          } else if (event.key === 'Escape') {
            setQuery(value)
            setOpen(false)
          }
        }}
        className={`rounded-lg border px-3 py-2 text-sm font-normal text-fg outline-none focus:border-accent ${
          invalid ? 'border-red-400' : 'border-border'
        } ${disabled ? 'bg-raised text-fg-3' : ''}`}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute top-full z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  setQuery(option)
                  onSelect(option)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm font-normal text-fg hover:bg-raised"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
      {invalid && <span className="text-[11px] font-normal text-red-600">Selecione uma opção da lista.</span>}
    </div>
  )
}
