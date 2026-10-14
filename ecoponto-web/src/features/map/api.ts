export async function fetchPontos(params: URLSearchParams) {
  const response = await fetch(`/api/pontos?${params}`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export async function fetchResiduoOptions() {
  const response = await fetch('/api/residuos')
  const data = await response.json()
  return Array.isArray(data) ? data : []
}
