export type RegionSuggestion = {
  label: string
  city: string
  state: string
  lat: number
  lng: number
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function formatRegionLabel(city: string, state: string) {
  const nextCity = cleanText(city)
  const nextState = cleanText(state)

  if (!nextCity) return 'Cidade'
  if (!nextState || nextCity.toLowerCase() === nextState.toLowerCase()) return nextCity

  return `${nextCity}, ${nextState}`
}

function normalizeSuggestions(payload: Array<{ city: string; state: string; lat: number; lng: number }>): RegionSuggestion[] {
  const seen = new Set<string>()

  return payload
    .map(({ city, state, lat, lng }) => {
      const nextCity = cleanText(city) || 'Cidade'
      const nextState = cleanText(state)
      const key = `${nextCity.toLowerCase()}|${nextState.toLowerCase()}`

      if (seen.has(key)) return null
      seen.add(key)

      return {
        label: formatRegionLabel(nextCity, nextState),
        city: nextCity,
        state: nextState || 'SP',
        lat,
        lng,
      }
    })
    .filter(Boolean) as RegionSuggestion[]
}

export const REGION_PRESETS = [
  'Guarapari',
  'Vila Velha',
  'Serra',
  'Vitória',
  'Cariacica',
  'Linhares',
  'Rio de Janeiro',
  'Belo Horizonte',
  'São Paulo',
  'Salvador',
] as const

export async function searchRegion(query: string): Promise<RegionSuggestion[]> {
  const term = query.trim()
  if (!term) return []

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('countrycodes', 'br')
    url.searchParams.set('limit', '6')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('q', term)

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'pt-BR',
      },
    })

    if (!response.ok) return []

    const payload = (await response.json()) as Array<{
      address?: { city?: string; town?: string; municipality?: string; state?: string }
      lat?: string
      lon?: string
    }>

    return normalizeSuggestions(
      payload
        .map((item) => {
          const cityName = cleanText(item.address?.city ?? item.address?.town ?? item.address?.municipality)
          const stateName = cleanText(item.address?.state)
          const lat = Number(item.lat)
          const lng = Number(item.lon)

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

          return {
            city: cityName || 'Cidade',
            state: stateName || 'SP',
            lat,
            lng,
          }
        })
        .filter(Boolean) as Array<{ city: string; state: string; lat: number; lng: number }>
    )
  } catch {
    return []
  }
}

export async function reverseGeocodeLocation(lat: number, lng: number): Promise<RegionSuggestion | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('addressdetails', '1')

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'pt-BR',
      },
    })

    if (!response.ok) return null

    const payload = (await response.json()) as {
      address?: { city?: string; town?: string; municipality?: string; state?: string }
      lat?: string
      lon?: string
    }

    const cityName = cleanText(payload.address?.city ?? payload.address?.town ?? payload.address?.municipality)
    const stateName = cleanText(payload.address?.state)
    const nextLat = Number(payload.lat ?? lat)
    const nextLng = Number(payload.lon ?? lng)

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return null

    const suggestion = {
      city: cityName || 'Cidade',
      state: stateName || 'SP',
      lat: nextLat,
      lng: nextLng,
    }

    return {
      ...suggestion,
      label: formatRegionLabel(suggestion.city, suggestion.state),
    }
  } catch {
    return null
  }
}
