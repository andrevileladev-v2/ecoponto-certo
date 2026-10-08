const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api'

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
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error ?? 'Erro inesperado'), { status: res.status })
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
