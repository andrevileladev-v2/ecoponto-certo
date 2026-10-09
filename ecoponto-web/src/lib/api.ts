const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333').replace(/\/+$/, '')
const BASE = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('eco_token')
}

export function setToken(token: string) {
  localStorage.setItem('eco_token', token)
}

export function clearToken() {
  localStorage.removeItem('eco_token')
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()

  const cleanBase = BASE.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = `${cleanBase}${cleanPath}`

  // Log para ver no console do navegador/servidor a URL real sendo chamada
  console.log(`[API Request] ${init.method ?? 'GET'} -> ${url}`)

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    
    // Imprime detalhes do erro no console para fácil identificação
    console.error(`[API Error ${res.status}]`, {
      url,
      status: res.status,
      body,
    })

    // Captura tanto body.message quanto body.error (comuns em Fastify/Express)
    const errorMessage = body.message ?? body.error ?? `Erro HTTP ${res.status}`
    throw Object.assign(new Error(errorMessage), { status: res.status, data: body })
  }

  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string)                   => request<T>(path),
  post:   <T>(path: string, body: unknown)    => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)    => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                   => request<T>(path, { method: 'DELETE' }),
}
