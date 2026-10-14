'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/lib/auth'

export function useLoginForm() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setLoading(true)

    try {
      await login(email, senha)
      const returnTo = new URLSearchParams(window.location.search).get('returnTo')
      router.push(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    senha,
    erro,
    loading,
    setEmail,
    setSenha,
    setErro,
    setLoading,
    onSubmit,
  }
}
