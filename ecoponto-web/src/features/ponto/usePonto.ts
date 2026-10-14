import { useEffect, useState } from 'react'

import { api } from '@/lib/api'
import { mapPontoItens, sendMessage, voteEdicao, voteItem } from '@/features/ponto/helpers'
import type {
  ItemAceito,
  Mensagem,
  PontoDetalhe,
  PropostaEdicao,
  RegistroEntrega,
  RelatoPonto,
} from '@/features/ponto/types'

const MOCK_EDICOES: PropostaEdicao[] = [
  {
    id: 'e1',
    titulo: 'Adicionar horário de pico no fim da tarde',
    descricao: 'O ponto pode ficar lotado após as 17h, então vale avisar antes da visita.',
    votos: 9,
    aprovacao: 7,
    status: 'pendente',
  },
  {
    id: 'e2',
    titulo: 'Informar que o ponto não recebe eletrônicos',
    descricao: 'A comunidade reportou que o local deixou de receber celulares e tablets.',
    votos: 6,
    aprovacao: 4,
    status: 'pendente',
  },
]

export function usePontoData(id?: string) {
  const [ponto, setPonto] = useState<PontoDetalhe | null>(null)
  const [itens, setItens] = useState<ItemAceito[]>([])
  const [msgs, setMsgs] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [entregas, setEntregas] = useState<RegistroEntrega[]>([])
  const [propostas, setPropostas] = useState<PropostaEdicao[]>(MOCK_EDICOES)
  const [relatos, setRelatos] = useState<RelatoPonto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadPonto() {
      if (!id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const pontoData = await api.get<PontoDetalhe>(`/pontos/${id}`)
        const entregasData = await api.get<Array<{
          id: string
          resultado: 'CONSEGUIU' | 'NAO_CONSEGUIU'
          quantidade?: number | null
          unidade?: string | null
          motivo?: string | null
          criado_em: string
          residuo: { nome: string }
        }>>(`/pontos/${id}/entregas`)

        if (pontoData && isMounted) {
          setPonto(pontoData)
          setItens(mapPontoItens(pontoData.residuos))
        }
        if (isMounted) {
          setEntregas(entregasData.map((entrega) => ({
            id: entrega.id,
            material: entrega.residuo.nome,
            resultado: entrega.resultado,
            quantidade: entrega.quantidade,
            unidade: entrega.unidade,
            motivo: entrega.motivo ?? undefined,
            user: 'Pessoa da comunidade',
            createdAt: new Date(entrega.criado_em).toLocaleDateString(),
          })))
        }
      } catch (err) {
        console.error('Erro ao carregar o ponto:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadPonto()

    return () => {
      isMounted = false
    }
  }, [id])

  function votar(index: number, approved: boolean) {
    const item = ponto?.residuos?.[index]
    const residuoId = item?.residuo_id ?? item?.residuo?.id

    if (id && residuoId) {
      api.post(`/pontos/${id}/residuos/${residuoId}/votar`, { aceita: approved })
        .catch((err) => console.warn('Falha ao votar no resíduo:', err))
    }

    setItens((prev) => voteItem(prev, index, approved))
  }

  function votarRelato(index: number, approved: boolean) {
    setRelatos((prev) => prev.map((relato, relatoIndex) => {
      if (relatoIndex !== index) return relato

      const votos = relato.votos + 1
      const confirmacoes = approved ? relato.confirmacoes + 1 : relato.confirmacoes
      const status = votos > 0 && confirmacoes / votos >= 0.6 ? 'aprovada' : 'rejeitada'

      return {
        ...relato,
        votos,
        confirmacoes,
        status,
      }
    }))

    setPonto((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        confiabilidade: Math.max(0.1, prev.confiabilidade + (approved ? 0.03 : -0.05)),
        disponivel: approved ? prev.disponivel ?? true : false,
      }
    })
  }

  function votarEdicao(index: number, approved: boolean) {
    setPropostas((prev) => voteEdicao(prev, index, approved))
  }

  function enviar() {
    setMsgs((prev) => {
      const next = sendMessage(prev, input)
      if (next.length !== prev.length) setInput('')
      return next
    })
  }

  return {
    ponto,
    itens,
    msgs,
    input,
    entregas,
    propostas,
    relatos,
    isLoading,
    setInput,
    votar,
    votarEdicao,
    votarRelato,
    enviar,
  }
}
