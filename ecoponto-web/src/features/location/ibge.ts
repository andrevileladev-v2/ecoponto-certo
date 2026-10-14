export type Estado = { sigla: string; nome: string }
export type Municipio = { nome: string }

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

let estadosCache: Promise<Estado[]> | null = null
const municipiosCache = new Map<string, Promise<Municipio[]>>()

export function normalizarTexto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

export async function fetchEstados(): Promise<Estado[]> {
  if (!estadosCache) {
    estadosCache = fetch(`${IBGE_BASE}/estados?orderBy=nome`)
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os estados.')
        return response.json()
      })
      .then((payload: Array<{ sigla: string; nome: string }>) => payload.map(({ sigla, nome }) => ({ sigla, nome })))
      .catch((error) => {
        estadosCache = null
        throw error
      })
  }
  return estadosCache
}

export async function fetchMunicipios(uf: string): Promise<Municipio[]> {
  let sigla = uf.trim().toUpperCase()
  if (!sigla) return []

  if (sigla.length > 2) {
    const estadoObj = await matchEstadoPorNome(sigla)
    if (estadoObj) sigla = estadoObj.sigla
  }

  if (!municipiosCache.has(sigla)) {
    municipiosCache.set(
      sigla,
      fetch(`${IBGE_BASE}/estados/${sigla}/municipios`)
        .then((response) => {
          if (!response.ok) throw new Error('Não foi possível carregar as cidades.')
          return response.json()
        })
        .then((payload: Array<{ nome: string }>) => payload.map(({ nome }) => ({ nome })))
        .catch((error) => {
          municipiosCache.delete(sigla)
          throw error
        })
    )
  }
  return municipiosCache.get(sigla)!
}

export async function matchEstadoPorNome(nomeOuSigla: string): Promise<Estado | null> {
  const estados = await fetchEstados()
  const alvo = normalizarTexto(nomeOuSigla)
  return (
    estados.find((estado) => normalizarTexto(estado.sigla) === alvo || normalizarTexto(estado.nome) === alvo) ?? null
  )
}

export async function matchMunicipio(uf: string, nomeAproximado: string): Promise<Municipio | null> {
  const municipios = await fetchMunicipios(uf)
  const alvo = normalizarTexto(nomeAproximado)
  return municipios.find((municipio) => normalizarTexto(municipio.nome) === alvo) ?? null
}
