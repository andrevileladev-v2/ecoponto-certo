'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import type { TipoRegistro } from '@/features/registro/types'
import { useAuth } from '@/lib/auth'

export function useRegistroForm() {
  const router = useRouter()
  const { register } = useAuth()

  const [tipo, setTipoState] = useState<TipoRegistro>('fp')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [estado, setEstado] = useState('')
  const [cidade, setCidade] = useState('')
  const [tipoAtuacao, setTipoAtuacao] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function setTipo(next: TipoRegistro) {
    setTipoState(next)
    setErro('')
  }

  function setCampo(key: string, value: string) {
    setCampos((current) => ({ ...current, [key]: value }))
  }

  function setLocalizacao(next: { estado: string; cidade: string }) {
    setEstado(next.estado)
    setCidade(next.cidade)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')

    if (!estado || !cidade) {
      setErro('Selecione o estado e a cidade a partir da lista.')
      return
    }
    if (tipo === 'emp' && !tipoAtuacao) {
      setErro('Selecione o tipo de atuação da empresa.')
      return
    }

    setLoading(true)
    try {
      await register({
        email: campos.email ?? '',
        nome: tipo === 'emp' ? campos.razaoSocial ?? '' : campos.nome ?? '',
        senha: campos.senha ?? '',
        tipo: tipo === 'emp' ? 'EMPRESA' : 'PF',
        cidade,
        estado,
        ...(tipo === 'emp'
          ? {
              razaoSocial: campos.razaoSocial,
              cnpj: campos.cnpj,
              whatsapp: campos.telefone,
              tipoAtuacao,
            }
          : {}),
      })
      router.push('/')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  return {
    tipo,
    setTipo,
    campos,
    setCampo,
    estado,
    cidade,
    setLocalizacao,
    tipoAtuacao,
    setTipoAtuacao,
    erro,
    loading,
    onSubmit,
  }
}
