export type AuthUser = {
  id: string
  email: string
  nome: string
  tipo?: string
  role?: string
  cidade?: string
}

export type AuthResponse = {
  token: string
  usuario: AuthUser
}
