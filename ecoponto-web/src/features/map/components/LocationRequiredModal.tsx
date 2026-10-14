import { MapPin } from 'lucide-react'

import { REGION_PRESETS } from '@/features/map/regions'

type LocationRequiredModalProps = {
  cityQuery: string
  citySuggestions: Array<{ label: string; city: string; state: string; lat: number; lng: number }>
  locationError?: string | null
  isLocationLoading?: boolean
  onCityQueryChange: (value: string) => void
  onUseMyLocation: () => void
  onSelectCity: (city: { label: string; city: string; state: string; lat: number; lng: number }) => void
}

export function LocationRequiredModal({
  cityQuery,
  citySuggestions,
  locationError,
  isLocationLoading = false,
  onCityQueryChange,
  onUseMyLocation,
  onSelectCity,
}: LocationRequiredModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px] pointer-events-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-fg">Informe sua localização</p>
        </div>

        <p className="text-sm text-fg-3 mb-3">
          Para visualizar os pontos do mapa, escolha sua localização ou a cidade antes de continuar.
        </p>

        {locationError && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {locationError}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={isLocationLoading}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-[#0b8048] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLocationLoading ? 'Localizando sua cidade...' : 'Usar minha localização'}
          </button>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-fg-2">Ou selecionar cidade</label>
            <input
              value={cityQuery}
              onChange={(event) => onCityQueryChange(event.target.value)}
              placeholder="Digite a cidade, ex.: Guarapari"
              className="w-full rounded-lg border border-border bg-raised px-3 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="flex flex-wrap gap-2">
              {REGION_PRESETS.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => onCityQueryChange(city)}
                  className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-fg-2 hover:border-accent hover:text-accent transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>

            {citySuggestions.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-raised p-2">
                {citySuggestions.map((option) => (
                  <button
                    key={`${option.label}-${option.lat}-${option.lng}`}
                    type="button"
                    onClick={() => onSelectCity(option)}
                    className="block w-full text-left rounded-md px-2 py-2 text-sm text-fg-2 hover:bg-white transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
