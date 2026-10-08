'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setToken, clearToken } from './api'

export interface Usuario {
  id: string
  email: string
  nome: string
  tipo: 'PF' | 'PJ'
  role: 'USER' | 'ADMIN'
  cidade?: string
  avatar_url?: string
  status: 'ATIVO' | 'BLOQUEADO'
  criado_em: string
}

interface AuthCtx {
  user: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  nome: string
  senha: string
  tipo?: 'PF' | 'PJ'
  cidade?: string
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('eco_token')
    if (!token) { setLoading(false); return }
    api.get<Usuario>('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, senha: string) {
    const { token, usuario } = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha })
    setToken(token)
    setUser(usuario)
  }

  async function register(data: RegisterData) {
    const { token, usuario } = await api.post<{ token: string; usuario: Usuario }>('/auth/register', data)
    setToken(token)
    setUser(usuario)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
