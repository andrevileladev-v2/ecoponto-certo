'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setToken, clearToken } from './api'

export interface Usuario {
  id: string
  email: string
  nome: string
  tipo: 'PF' | 'EMPRESA'
  role: 'USER' | 'ADMIN'
  cidade?: string
  estado?: string
  avatar_url?: string
  mostrar_no_dashboard: boolean
  status: 'ATIVO' | 'BLOQUEADO'
  criado_em: string
}

interface AuthCtx {
  user: Usuario | null
  loading: boolean
  updateUser: (user: Usuario) => void
  login: (email: string, senha: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  nome: string
  senha: string
  tipo?: 'PF' | 'EMPRESA'
  cidade?: string
  estado?: string
  razaoSocial?: string
  cnpj?: string
  whatsapp?: string
  tipoAtuacao?: string
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.resolve()
      .then(() => {
        const token = localStorage.getItem('eco_token')
        return token ? api.get<Usuario>('/auth/me') : null
      })
      .then(usuario => {
        if (isMounted && usuario) setUser(usuario)
      })
      .catch(() => clearToken())
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
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

  return <Ctx.Provider value={{ user, loading, updateUser: setUser, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
