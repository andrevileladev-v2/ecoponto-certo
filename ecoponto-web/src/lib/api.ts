function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://ecoponto-certo.onrender.com'
  }
  return (envUrl ?? 'http://localhost:3001').replace(/\/+$/, '')
}

function getBaseUrl(): string {
  const apiBase = getApiBase()
  return apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`
}

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

  const cleanBase = getBaseUrl().replace(/\/$/, '')
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
